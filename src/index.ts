import EditorJS, {
    type BlockAddedMutationType,
    type BlockRemovedMutationType,
    type BlockMovedMutationType,
    type BlockChangedMutationType,
    type BlockMutationEventMap,
    BlockAPI,
} from '@editorjs/editorjs'
import { type SavedData } from '@editorjs/editorjs/types/data-formats/block-data'
import { type PickFromConditionalType, type MakeConditionalType } from './UtilityTypes'
import { throttle } from 'throttle-debounce'
import './index.css'

const UserInlineSelectionChangeType = 'inline-selection-change'
const UserBlockSelectionChangeType = 'block-selection-change'
const UserBlockDeletionChangeType = 'block-deletion-change'
const UserDisconnectedType = 'user-disconnected'

export type GroupCollabConfigOptions<SocketMethodName extends string> = {
    editor: EditorJS
    socket: INeededSocketFields<SocketMethodName>
    /**
     * Name of the socket event.
     * @default 'editorjs-update'
     */
    socketMethodName?: SocketMethodName
} & Partial<LocalConfig>

type LocalConfig = {
    /**
     * Delay to throttle block changes. Value is in ms
     * @default 300
     */
    blockChangeThrottleDelay: number
    cursor?: { color?: string }
    overrideStyles?: { cursorClass?: string; selectedClass?: string, pendingDeletionClass?: string }
}

export type MessageData =
    | MakeConditionalType<{ index: number; block: SavedData }, typeof BlockAddedMutationType>
    | MakeConditionalType<
        {
            blockId: string
        },
        typeof BlockRemovedMutationType
    >
    | MakeConditionalType<
        {
            block: SavedData
            // in case block.id is not found
            index: number
        },
        typeof BlockChangedMutationType
    >
    | MakeConditionalType<
        {
            fromBlockId: string
            //used to guarantee sync between editors
            toBlockIndex: number
            toBlockId: string
        },
        typeof BlockMovedMutationType
    >
    | MakeConditionalType<
        {
            elementXPath: string | null
            blockId: string
            rects: Rect[]
            containerWidth: number

            connectionId: string;
            //idk if i'll use these
            //   elementNodeIndex: number
            //   anchorOffset: number
            //   focusOffset: number
        },
        typeof UserInlineSelectionChangeType
    >
    | MakeConditionalType<{ connectionId: string }, typeof UserDisconnectedType>
    | MakeConditionalType<{ blockId: string; isDeletePending: boolean }, typeof UserBlockDeletionChangeType>
    | MakeConditionalType<{ blockId: string; isSelected: boolean }, typeof UserBlockSelectionChangeType>
type Rect = Pick<DOMRect, 'top' | 'left' | 'width'>
type PossibleEventDetails = {
    target: BlockAPI
} & (
        | MakeConditionalType<
            { index: number },
            typeof BlockAddedMutationType | typeof BlockChangedMutationType | typeof BlockRemovedMutationType
        >
        | MakeConditionalType<{ fromIndex: number; toIndex: number }, typeof BlockMovedMutationType>
    )

type EditorEvents = keyof BlockMutationEventMap
type Events = EditorEvents | typeof UserInlineSelectionChangeType | typeof UserBlockSelectionChangeType | typeof UserBlockDeletionChangeType

export type INeededSocketFields<SocketMethodName extends string> = {
    send(socketMethod: SocketMethodName, data: MessageData): void
    on(socketMethod: SocketMethodName, callback: (data: MessageData) => void): void
    off(socketMethod: SocketMethodName): void;
    connectionId: string;
}

export default class GroupCollab<SocketMethodName extends string> {
    private editor: EditorJS
    private socket: INeededSocketFields<SocketMethodName>
    private socketMethodName: SocketMethodName
    private editorBlockEvent = 'block changed'
    private editorDomChangedEvent = 'redactor dom changed' // this might need more investigation
    private _isListening = false
    // events to ignore until next render
    private ignoreEvents: Record<string, Set<Events>> = {}
    private redactorObserver: MutationObserver
    private toolboxObserver: MutationObserver;
    private handleBlockChange?: throttle<(target: BlockAPI, index: number) => Promise<void>> = undefined
    private localBlockStates: Record<string, Set<'selected' | 'focused' | "deleting">> = {}
    private blockIdAttributeName = 'data-id'
    private inlineFakeCursorAttributeName = 'data-realtime-fake-inline-cursor'
    private inlineFakeSelectionAttributeName = 'data-realtime-fake-inline-selection'
    private config: LocalConfig
    public constructor({ editor, socket, socketMethodName, ...config }: GroupCollabConfigOptions<SocketMethodName>) {
        this.editor = editor
        this.socket = socket
        if (!this.socket.connectionId) {
            console.error("{connectionId} is not set for EditorJSGroupCollab plugin. Some features might not work")
            this.socket.connectionId = "random-" + crypto.randomUUID();
        }
        this.socketMethodName = socketMethodName ?? ('editorjs-update' as SocketMethodName)

        const defaultConfig: LocalConfig = {
            blockChangeThrottleDelay: 300,
        }
        this.config = {
            ...defaultConfig,
            ...(config ?? {}),
        }
        this.redactorObserver = new MutationObserver((mutations, observer) => {
            for (let mutation of mutations) {
                this.handleMutation(mutation)
            }
        })

        this.toolboxObserver = new MutationObserver((mutations, observer) => {
            const lastMutation = mutations.at(-1)
            if (!lastMutation) return
            this.handleToolboxMutation(lastMutation)
        })

        this.initBlockChangeListener()
    }

    public get isListening() {
        return this._isListening
    }
    /**
     * Remove event listeners on socket and editor
     */
    public unlisten() {
        this.socket.off(this.socketMethodName)
        this.editor.off(this.editorBlockEvent, this.onEditorBlockEvent)
        this.redactorObserver.disconnect()
        this.toolboxObserver.disconnect()
        document.removeEventListener('selectionchange', this.onInlineSelectionChange)
        window.removeEventListener("beforeunload", this.onDisconnect, { capture: true })
        this.socket.send(this.socketMethodName, { type: UserDisconnectedType, connectionId: this.socket.connectionId })

        this._isListening = false
    }
    /**
     * Start listening for events.
     */
    public listen() {
        this.socket.on(this.socketMethodName, this.onReceiveChange)
        this.editor.on(this.editorBlockEvent, this.onEditorBlockEvent)
        const redactor =
            (this.editor as any)?.ui.redactor ??
            document.querySelector(`#${(this.editor as any)?.configuration.holder} .${this.EditorCSS.editorRedactor}`) ??
            document.querySelector(`.${this.EditorCSS.editorRedactor}`)
        this.redactorObserver.observe(redactor, {
            childList: true,
            attributes: true,
            attributeFilter: ['class'],
            subtree: true,
        })
        const toolboxSettingsEl = document.querySelector(`#${(this.editor as any)?.configuration?.holder ?? ""} .${this.EditorCSS.toolbarSettings}`) ?? document.querySelector(`.${this.EditorCSS.toolbarSettings}`)
        if (toolboxSettingsEl)
            this.toolboxObserver.observe(toolboxSettingsEl, {
                childList: true,
                attributes: true,
                attributeFilter: ["class"],
                subtree: true
            })
        else
            console.error("Could not initialize toolbox observer.")
        document.addEventListener('selectionchange', this.onInlineSelectionChange)
        window.addEventListener("beforeunload", this.onDisconnect, { capture: true })

        this._isListening = true
    }

    private get CSS() {
        return {
            selected: 'cdx-realtime-block--selected',
            inlineCursor: 'cdx-realtime-inline-cursor',
            inlineSelection: 'cdx-realtime-inline-selection',
            deletePending: "cdx-realtime-block--delete-pending"
        }
    }
    private get EditorCSS() {
        return {
            baseBlock: 'ce-block',
            focused: 'ce-block--focused',
            selected: 'ce-block--selected',
            editorRedactor: 'codex-editor__redactor',
            blockContent: 'ce-block__content',
            toolbar: "ce-toolbar",
            toolbarSettings: "ce-settings",
            toolbarDeleteSetting: "[data-item-name='delete']",
            table: {
                row: "tc-row",
                cell: "tc-cell"
            }
        }
    }

    private handleMutation(mutation: MutationRecord) {
        if (mutation.type !== 'attributes') return
        const { target } = mutation
        if (!(target instanceof HTMLElement)) return

        const isSelected = target.classList.contains(this.EditorCSS.selected)
        const isFocused = target.classList.contains(this.EditorCSS.focused)
        const blockId = target.getAttribute(this.blockIdAttributeName)
        if (!blockId) return
        // we need to save the current selected & focus state for each block or else we are sending too much data through socket
        if (this.localBlockStates[blockId]?.has('selected') != isSelected) {
            if (this.ignoreEvents[blockId]?.has(UserBlockSelectionChangeType)) return
            this.localBlockStates[blockId] ??= new Set()

            if (isSelected) this.localBlockStates[blockId].add('selected')
            else this.localBlockStates[blockId].delete('selected')

            this.socket.send(this.socketMethodName, {
                type: UserBlockSelectionChangeType,
                blockId,
                isSelected,
            })
        }

        // Focused class doesnt have any important styles fo i wont implement this now
        // if (this.localBlockStates[blockId]?.has('focused') != isFocused) {
        //     this.localBlockStates[blockId] ??= new Set()

        //     if (isFocused) this.localBlockStates[blockId].add('focused')
        //     else this.localBlockStates[blockId].delete('focused')
        // }

        if (!this.localBlockStates[blockId].size) delete this.localBlockStates[blockId]
    }

    private handleToolboxMutation(mutation: MutationRecord): void {
        const { target } = mutation
        if (!(target instanceof HTMLElement)) return

        //? This might not work for all editor versions
        const isToolbarClosing = target.innerHTML === '';

        const currentIndex = this.editor.blocks.getCurrentBlockIndex()
        const blockApi = this.editor.blocks.getBlockByIndex(currentIndex)
        if (!blockApi) return;

        let isDeletePending = false;
        if (!isToolbarClosing) {
            const toolboxDeleteSetting = document.querySelector(`.${this.EditorCSS.toolbar} ${this.EditorCSS.toolbarDeleteSetting}`)
            if (!(toolboxDeleteSetting instanceof HTMLElement)) return;
            // console.log("🚀 toolboxDeleteSetting:", toolboxDeleteSetting)

            isDeletePending = toolboxDeleteSetting.classList.contains("ce-popover-item--confirmation")
        }

        const blockId = blockApi.id;

        if (this.localBlockStates[blockId]?.has('deleting') != isDeletePending) {
            if (this.ignoreEvents[blockId]?.has(UserBlockDeletionChangeType)) return
            this.localBlockStates[blockId] ??= new Set()

            if (isDeletePending) this.localBlockStates[blockId].add('deleting')
            else this.localBlockStates[blockId].delete('deleting')

            this.socket.send(this.socketMethodName, {
                type: UserBlockDeletionChangeType,
                blockId,
                isDeletePending
            })
        }
    }

    private onInlineSelectionChange = (e: Event) => {
        const selection = document.getSelection()
        if (!selection) return

        const { anchorNode, anchorOffset, focusOffset } = selection
        if (!anchorNode) return

        if (!this.isNodeInsideOfEditor(anchorNode)) return

        const { parentElement } = anchorNode
        if (!parentElement) return

        const range = selection.getRangeAt(0)
        const childRects: DOMRect[] = []
        //i need this if i want to use inline selection
        const clientRects = range.getClientRects()
        for (let i = 0; i < clientRects.length; i++) {
            const item = clientRects.item(i)
            if (item) childRects.push(item)
        }

        const contentAndBlockId = this.getContentAndBlockIdFromNode(anchorNode)
        if (!contentAndBlockId) return
        const { blockId, contentElement } = contentAndBlockId
        const parentRect = contentElement.getBoundingClientRect()

        const finalRects: Pick<DOMRect, 'top' | 'left' | 'width'>[] = childRects.map((childRect) => ({
            top: childRect.top - parentRect.top,
            left: childRect.left - parentRect.left,
            width: childRect.width,
        }))

        const elementNodeIndex = this.getNodeRelativeChildIndex(anchorNode)
        if (elementNodeIndex === null) return
        const path = this.getElementXPath(parentElement)
        const containerWidth = contentElement.clientWidth

        const data: PickFromConditionalType<MessageData, typeof UserInlineSelectionChangeType> = {
            type: UserInlineSelectionChangeType,
            blockId,
            elementXPath: path,
            containerWidth,
            // anchorOffset,
            // focusOffset,
            // elementNodeIndex,
            rects: finalRects,
            connectionId: this.socket.connectionId
        }
        this.socket.send(this.socketMethodName, data)
    }

    private onDisconnect = (e: Event) => {
        this.socket.send(this.socketMethodName, { type: UserDisconnectedType, connectionId: this.socket.connectionId })
    }

    private onReceiveChange = (response: MessageData) => {
        switch (response.type) {
            case 'block-added': {
                const { index, block } = response
                this.addBlockToIgnoreListUntilNextRender(block.id, response.type)
                this.editor.blocks.insert(block.tool, block.data, null, index, false, false, block.id)
                break
            }
            case 'block-changed': {
                const { index, block } = response
                this.addBlockToIgnoreListUntilNextRender(block.id, response.type)
                const customClassList = this.getDOMBlockById(block.id)?.classList
                this.editor.blocks
                    .update(block.id, block.data)
                    .catch((e) => {
                        if (e.message === `Block with id "${block.id}" not found`) {
                            this.addBlockToIgnoreListUntilNextRender(block.id, 'block-added')
                            this.editor.blocks.insert(block.tool, block.data, null, index, false, false, block.id)
                        }
                    })
                    .then(() => {
                        // some blocks when being selected emit a block-changed event
                        if (customClassList?.contains(this.CSS.selected)) {
                            const domBlock = this.getDOMBlockById(block.id);
                            if (!domBlock) return;
                            domBlock.classList.add(this.CSS.selected)
                            if (this.config.overrideStyles?.selectedClass)
                                domBlock.classList.add(this.config.overrideStyles.selectedClass)
                        }
                    })
                break
            }
            case 'block-moved': {
                const { toBlockId, fromBlockId, toBlockIndex } = response
                const toIndex = this.editor.blocks.getBlockIndex(toBlockId)
                const fromIndex = this.editor.blocks.getBlockIndex(fromBlockId)

                const blocksAreNowInSync = toBlockIndex === fromIndex
                if (blocksAreNowInSync) return

                this.addBlockToIgnoreListUntilNextRender(fromBlockId, response.type)
                this.editor.blocks.move(toIndex, fromIndex)
                break
            }

            case 'block-removed': {
                const { blockId } = response
                this.addBlockToIgnoreListUntilNextRender(blockId, response.type)
                const blockIndex = this.editor.blocks.getBlockIndex(blockId)
                this.editor.blocks.delete(blockIndex)
                break
            }
            case 'block-selection-change': {
                const { blockId, isSelected } = response
                this.addBlockToIgnoreListUntilNextRender(blockId, response.type)
                const block = this.getDOMBlockById(blockId)
                if (!block) return

                if (isSelected) {
                    block.classList.add(this.CSS.selected)
                    if (this.config.overrideStyles?.selectedClass)
                        block.classList.add(this.config.overrideStyles.selectedClass)
                }
                else {
                    block.classList.remove(this.CSS.selected)
                    if (this.config.overrideStyles?.selectedClass)
                        block.classList.remove(this.config.overrideStyles.selectedClass)
                }

                break
            }

            case 'block-deletion-change': {
                const { blockId, isDeletePending } = response
                this.addBlockToIgnoreListUntilNextRender(blockId, response.type)
                const block = this.getDOMBlockById(blockId)
                if (!block) return

                if (isDeletePending) {
                    block.classList.add(this.CSS.deletePending)
                    if (this.config.overrideStyles?.pendingDeletionClass)
                        block.classList.add(this.config.overrideStyles.pendingDeletionClass)
                } else {
                    block.classList.remove(this.CSS.deletePending)
                    if (this.config.overrideStyles?.pendingDeletionClass)
                        block.classList.remove(this.config.overrideStyles.pendingDeletionClass)
                }
                break;
            }

            case 'inline-selection-change': {
                const { type, rects, elementXPath, blockId, connectionId } = response
                const blockContent = this.getDOMBlockById(blockId)?.querySelector(`.${this.EditorCSS.blockContent}`)
                if (!blockContent || !rects.length) return

                const isSelection = rects.some((r) => r.width > 1)
                const isReset = elementXPath === null || isSelection
                let cursor = this.getFakeCursor({ connectionId })
                const cursorExists = Boolean(cursor)
                if (isReset) {
                    cursor?.remove()
                    return
                }
                // console.log(response)

                if (isSelection) {
                    const MARGIN_OF_ERROR_IN_PX = 6
                    /**
                     * Ok so for this to work properly i have to check that the
                     * current selection Rect width equals the distance between left and right (IN DOM content ofc)
                     * If it doesn't then that means that the next rect should be concatenated to the current rect
                     * (because text overflowed on the other device but not this one)
                     */
                    // this.getFakeSelections(blockId).forEach((sel) => sel.remove())
                    // let currentSelection = this.createSelectionElement()
                    // for (const rect of rects) {
                    //     if (Math.abs(currentSelection.clientWidth) < MARGIN_OF_ERROR) {
                    //         //create new selection, on the next line
                    //     }

                    // }
                } else {
                    if (!cursor) cursor = this.createFakeCursor(connectionId)
                    const rect = rects[0]
                    //* Note if element is not found try without nth-child
                    const selectedElement = document.querySelector(elementXPath)
                    if (!(selectedElement instanceof HTMLElement)) return

                    //This is used to resize the height of the selection if users have different font sizes/screen zoom in/out s
                    const { fontSize } = window.getComputedStyle(selectedElement)

                    cursor.style.height = fontSize
                    cursor.style.top = `${rect.top}px`
                    cursor.style.left = `${rect.left}px`




                    const { cursorClass } = this.config.overrideStyles ?? {}
                    const { color } = this.config.cursor ?? {}
                    if (color) cursor.style.setProperty('--realtime-inline-cursor-color', color)
                    if (cursorClass) cursor.classList.add(...cursorClass.split(' '))

                    if (!cursorExists || !blockContent.contains(cursor)) blockContent.append(cursor)
                }
                break
            }

            case 'user-disconnected': {
                const { connectionId } = response
                const cursor = this.getFakeCursor({ connectionId })
                const selection = this.getFakeSelections()
                cursor?.remove()
                break
            }

            default: {
            }
        }
    }

    private onEditorBlockEvent = (data: any) => {
        if (!(data?.event instanceof CustomEvent) || !data.event) {
            console.error('block changed but its not custom event')
            return
        }
        const { event } = data
        if (!this.validateEventDetail(event)) return
        const type = event.type as EditorEvents
        const { target, ...otherData } = event.detail as PossibleEventDetails
        otherData.type = type
        const targetId = target.id

        if (this.ignoreEvents[targetId]?.has(type)) return

        //save after dom changes have been propagated to the necessary tools
        setTimeout(async () => {
            if (type === 'block-changed') {
                if (!('index' in otherData) || typeof otherData.index !== 'number') return
                this.handleBlockChange?.(target, otherData.index ?? 0)
                setTimeout(() => {
                    this.onInlineSelectionChange(new CustomEvent('selectionchange'))
                }, 0)
                return
            }

            const savedData = await target.save()
            if (!savedData) return

            const socketData: Partial<MessageData> = {
                type,
                block: savedData,
            }
            if (socketData.type === 'block-added')
                socketData.index = (otherData as PickFromConditionalType<PossibleEventDetails, 'block-added'>).index
            if (socketData.type === 'block-removed') socketData.blockId = targetId
            if (socketData.type === 'block-moved') {
                const { fromIndex, toIndex } = otherData as PickFromConditionalType<PossibleEventDetails, 'block-moved'>
                socketData.fromBlockId = targetId
                socketData.toBlockIndex = toIndex
                //at this point the blocks already switched places
                socketData.toBlockId = this.editor.blocks.getBlockByIndex(fromIndex)?.id
            }
            this.socket.send(this.socketMethodName, socketData as MessageData)
        }, 0)
    }

    private initBlockChangeListener() {
        this.handleBlockChange = throttle(this.config.blockChangeThrottleDelay, async (target: BlockAPI, index: number) => {
            if (!this.isListening) return
            const targetId = target.id
            const savedData = await target.save()
            if (!savedData) return

            this.applyNeccessaryChanges(target, savedData);
            const socketData: MessageData = {
                type: 'block-changed',
                block: savedData,
                index,
            }

            if (!this.isListening) return
            this.socket.send(this.socketMethodName, socketData)
            this.addBlockToIgnoreListUntilNextRender(targetId, 'block-changed')
        })
    }

    private getFakeCursor({ blockId, connectionId }: Partial<Record<"blockId" | "connectionId", string>>): HTMLElement | null {
        if (!blockId && !connectionId) return null
        const blockIdQuery = blockId ? `='${blockId}'` : "";
        const connQuery = connectionId ? `='${connectionId}'` : ""
        const domCursor = document.querySelector(
            `[${this.blockIdAttributeName}${blockIdQuery}] .${this.EditorCSS.blockContent} [${this.inlineFakeCursorAttributeName}${connQuery}]`,
        )
        if (domCursor instanceof HTMLElement) return domCursor
        return null
    }

    private createFakeCursor(connectionId: string) {
        const cursor = document.createElement('div')
        cursor.setAttribute(this.inlineFakeCursorAttributeName, connectionId)
        cursor.classList.add(this.CSS.inlineCursor)
        return cursor
    }

    private getFakeSelections(blockId?: string) {
        return document.querySelectorAll(
            `[${this.blockIdAttributeName}${blockId ? `='${blockId}'` : ""}] .${this.EditorCSS.blockContent} [${this.inlineFakeSelectionAttributeName}]`,
        )
    }

    private validateEventDetail(ev: CustomEvent): ev is CustomEvent<PossibleEventDetails> {
        return (
            typeof ev.detail === 'object' &&
            ev.detail &&
            (('index' in ev.detail && typeof ev.detail.index === 'number') ||
                ('fromIndex' in ev.detail &&
                    typeof ev.detail.fromIndex === 'number' &&
                    'toIndex' in ev.detail &&
                    typeof ev.detail.toIndex === 'number')) &&
            'target' in ev.detail &&
            typeof ev.detail.target === 'object' &&
            ev.detail.target
        )
    }

    private addBlockToIgnoreListUntilNextRender(blockId: string, type: Events) {
        this.addBlockToIgnorelist(blockId, type)
        setTimeout(() => {
            this.removeBlockFromIgnorelist(blockId, type)
        }, 0)
    }
    private addBlockToIgnorelist(blockId: string, type: Events) {
        if (!this.ignoreEvents[blockId]) this.ignoreEvents[blockId] = new Set<Events>()
        this.ignoreEvents[blockId].add(type)
    }
    private removeBlockFromIgnorelist(blockId: string, type: Events) {
        if (!this.ignoreEvents[blockId]) return
        this.ignoreEvents[blockId].delete(type)
        if (!this.ignoreEvents[blockId].size) delete this.ignoreEvents[blockId]
    }

    private getDOMBlockById(blockId: string) {
        const block = document.querySelector(`[${this.blockIdAttributeName}='${blockId}']`)
        if (block instanceof HTMLElement) return block
        return null
    }

    private getRedactor(): HTMLElement | null {
        const redactor = document.querySelector(`.${this.EditorCSS.editorRedactor}`)
        if (!(redactor instanceof HTMLElement)) return null
        return redactor
    }

    private getContentAndBlockIdFromNode(node: Node): { contentElement: HTMLElement; blockId: string } | null {
        if (!this.isNodeInsideOfEditor(node)) return null
        let el: HTMLElement | null = node.parentElement

        const isContentElement = (el: HTMLElement | null) =>
            el?.classList.contains(this.EditorCSS.blockContent) &&
            el?.parentElement?.classList.contains(this.EditorCSS.baseBlock) &&
            el?.parentElement.hasAttribute(this.blockIdAttributeName)
        while (el && !isContentElement(el)) {
            el = el.parentElement
        }
        if (!el) return null

        const blockId = el.parentElement?.getAttribute(this.blockIdAttributeName)
        if (!blockId) return null
        return {
            contentElement: el,
            blockId,
        }
    }
    private isNodeInsideOfEditor(node: Node) {
        const redactor = (this.editor as any)?.ui?.nodes?.redactor
        if (redactor instanceof HTMLElement) return redactor.contains(node)
        const holder = (this.editor as any)?.configuration?.holder
        if (holder && typeof holder === 'string') return document.getElementById(holder)?.contains(node)

        let currentElement = node.parentElement
        while (currentElement && currentElement !== document.body) {
            const blockId = currentElement.getAttribute(this.blockIdAttributeName)
            const isEditorBlockElement = currentElement.classList.contains(this.EditorCSS.baseBlock)
            const isCurrentEditorElement = blockId && Boolean(this.editor.blocks.getById(blockId))
            if (isEditorBlockElement && isCurrentEditorElement) return true
            currentElement = currentElement.parentElement
        }
        return false
    }

    private getElementXPath(selectedNode: HTMLElement) {
        let element = selectedNode
        // If the element does not have an ID, construct the XPath based on its ancestors
        const paths = []
        while (element.parentNode instanceof HTMLElement && !element.classList.contains(this.EditorCSS.editorRedactor)) {
            const dataId = element.getAttribute(this.blockIdAttributeName)
            let elementSelector = element.localName.toLowerCase()
            if (dataId) elementSelector += `[${this.blockIdAttributeName}='${dataId}']`
            if (element.previousElementSibling) {
                let sibling: Element | null = element
                let count = 1
                while ((sibling = sibling.previousElementSibling)) {
                    count++
                }
                elementSelector += `:nth-child(${count})`
            }
            paths.unshift(elementSelector)
            element = element.parentNode
        }
        paths.unshift(`.${this.EditorCSS.editorRedactor}`)
        const directChildSelector = ' > '
        return paths.join(directChildSelector)
    }

    private getNodeRelativeChildIndex(node: Node): number | null {
        const { parentElement } = node
        if (!parentElement) return null
        for (let i = 0; i < parentElement.childNodes.length; i++) {
            if (node === parentElement.childNodes[i]) return i
        }

        return null
    }

    private applyNeccessaryChanges(target: BlockAPI, savedData: SavedData) {
        switch (target.name) {
            case "table": {
                const rows = target.holder.querySelectorAll(`.${this.EditorCSS.table.row}`);
                rows.forEach((row, idx) => {
                    const cells = Array.from(row.querySelectorAll(`.${this.EditorCSS.table.cell}`))
                    const areAllEmpty = cells.every(cell => !cell.textContent?.trim())
                    if (!areAllEmpty) return;

                    // i need to make this row not disappear on one screen but remain on the other.
                    const content = savedData.data?.content
                    if (content instanceof Array) {
                        content.splice(idx, 0,
                            cells.map(c => c.textContent)
                        )
                    }
                })
                break;
            }
        }
    }

    private calculateRelativeRects(inputRects: Rect[], inputContainerWidth: number, currentContainer: HTMLElement): Rect[] {
        const outputRects: Rect[] = []

        const currentWidth = currentContainer.clientWidth
        if (inputContainerWidth === currentWidth) return inputRects // Wow that was easy

        const isScaledDownNow = currentWidth < inputContainerWidth
        // ex if left+width > currentWidth => needs to be broken down

        //TODO i have to wrap the content inside a span so i have the correct width 😓 maybe?
        let currentRect = inputRects.at(0)
        let rectWidthsSum = 0

        // NOTE: when you have multiblock selection, the `Left` value indicates how much distance is between the TEXT and HtmlElement container
        if (isScaledDownNow) {
        } else {
            for (const r of inputRects) {
            }
        }

        return outputRects
    }

    private createSelectionElement() {
        const selection = document.createElement('div')
        selection.setAttribute(this.inlineFakeSelectionAttributeName, '')
        selection.classList.add(this.CSS.inlineSelection)

        return selection
    }
}
