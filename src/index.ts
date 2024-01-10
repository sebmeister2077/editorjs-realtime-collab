import EditorJS, {
    BlockAddedMutationType,
    BlockRemovedMutationType,
    BlockMovedMutationType,
    BlockChangedMutationType,
    type BlockMutationEventMap,
    BlockAPI,
} from '@editorjs/editorjs'
import { type SavedData } from '@editorjs/editorjs/types/data-formats/block-data'
import { PickFromConditionalType, type MakeConditionalType } from './UtilityTypes'
import { throttle } from 'throttle-debounce'
import './index.css'

const UserInlineSelectionChangeType = 'inline-selection-change'
const UserBlockSelectionChangeType = 'block-selection-change'

export type GroupCollabConfigOptions<SocketMethodName extends string> = {
    editor: EditorJS
    socket: INeededSocketFields<SocketMethodName>
    /**
     * Name of the socket event.
     * @default 'editorjs-update'
     */
    socketMethodName: SocketMethodName
    config?: Partial<LocalConfig>
}

type LocalConfig = {
    /**
     * Delay to throttle block changes. Value is in ms
     * @default 300
     */
    blockChangeThrottleDelay: number
    overrideStyles?: { cursorColor?: string; cursorClass?: string }
}

export type MessageData =
    | MakeConditionalType<{ index: number; block: SavedData }, typeof BlockAddedMutationType>
    | MakeConditionalType<
          {
              blockId: string
          },
          typeof BlockRemovedMutationType,
          'type'
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
          { elementXPath: string | null; elementNodeIndex: number; anchorOffset: number; focusOffset: number; blockId: string } & Pick<
              DOMRect,
              'top' | 'left'
          >,
          typeof UserInlineSelectionChangeType
      >
    | MakeConditionalType<{ blockId: string; isSelected: boolean }, typeof UserBlockSelectionChangeType>

type PossibleEventDetails = {
    target: BlockAPI
} & (
    | MakeConditionalType<
          { index: number },
          typeof BlockAddedMutationType | typeof BlockChangedMutationType | typeof BlockRemovedMutationType,
          'type'
      >
    | MakeConditionalType<{ fromIndex: number; toIndex: number }, typeof BlockMovedMutationType, 'type'>
)

type EditorEvents = keyof BlockMutationEventMap
type Events = EditorEvents | typeof UserInlineSelectionChangeType | typeof UserBlockSelectionChangeType

export type INeededSocketFields<SocketMethodName extends string> = {
    send(socketMethod: SocketMethodName, data: MessageData): void
    on(socketMethod: SocketMethodName, callback: (data: MessageData) => void): void
    off(socketMethod: SocketMethodName): void
}

export default class GroupCollab<SocketMethodName extends string> {
    private editor: EditorJS
    private socket: INeededSocketFields<SocketMethodName>
    private socketMethodName: SocketMethodName
    private editorBlockEvent = 'block changed'
    private editorDomChangedEvent = 'redactor dom changed' // this might need more investigation
    private _isListening = false
    private ignoreEvents: Record<string, Set<Events>> = {}
    private observer: MutationObserver
    private handleBlockChange?: throttle<(target: BlockAPI, index: number) => Promise<void>> = undefined
    private localBlockStates: Record<string, Set<'selected' | 'focused'>> = {}
    private blockIdAttributeName = 'data-id'
    private inlineFakeCursorAttributeName = 'data-realtime-fake-inline-cursor'
    private config: LocalConfig
    public constructor({ editor, socket, socketMethodName, config }: GroupCollabConfigOptions<SocketMethodName>) {
        this.editor = editor
        this.socket = socket
        this.socketMethodName = socketMethodName ?? 'editorjs-update'

        const defaultConfig: LocalConfig = {
            blockChangeThrottleDelay: 300,
        }
        this.config = {
            ...defaultConfig,
            ...(config ?? {}),
        }
        this.observer = new MutationObserver((mutations, observer) => {
            for (let mutation of mutations) {
                this.handleMutation(mutation)
            }
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
        this.observer.disconnect()
        document.removeEventListener('selectionchange', this.onInlineSelectionChange)

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
        this.observer.observe(redactor, {
            childList: true,
            attributes: true,
            attributeFilter: ['class'],
            subtree: true,
        })
        document.addEventListener('selectionchange', this.onInlineSelectionChange)

        this._isListening = true
    }

    private get CSS() {
        return {
            selected: 'cdx-realtime-block--selected',
            inlineCursor: 'cdx-realtime-inline-cursor',
        }
    }
    private get EditorCSS() {
        return {
            baseBlock: 'ce-block',
            focused: 'ce-block--focused',
            selected: 'ce-block--selected',
            editorRedactor: 'codex-editor__redactor',
            blockContent: 'ce-block__content',
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

    private onInlineSelectionChange = (e: Event) => {
        const selection = document.getSelection()
        if (!selection) return

        const { anchorNode, anchorOffset, focusOffset } = selection
        if (!anchorNode) return

        if (!this.isNodeInsideOfEditor(anchorNode)) return

        const { parentElement } = anchorNode
        if (!parentElement) return

        const range = selection.getRangeAt(0)
        const childRect = range.getBoundingClientRect()

        const contentAndBlockId = this.getContentAndBlockIdFromNode(anchorNode)
        if (!contentAndBlockId) return
        const { blockId, contentElement } = contentAndBlockId
        const parentRect = contentElement.getBoundingClientRect()
        console.log('🚀 ~ file: index.ts:233 ~ GroupCollab<SocketMethodName ~ contentElement:', contentElement)

        const finalRect: Pick<DOMRect, 'top' | 'left'> = {
            top: childRect.top - parentRect.top,
            // right: childRect.right - parentRect.left,
            // bottom: childRect.bottom - parentRect.top,
            left: childRect.left - parentRect.left,
            // x: childRect.x - parentRect.x,
            // y: childRect.y - parentRect.y,
            // width: childRect.width,
            // height: childRect.height,
        }

        const elementNodeIndex = this.getNodeRelativeChildIndex(anchorNode)
        if (elementNodeIndex === null) return
        const path = this.getElementXPath(parentElement)

        const data = {
            type: UserInlineSelectionChangeType,
            blockId,
            elementXPath: path,
            anchorOffset,
            focusOffset,
            elementNodeIndex,
            ...finalRect,
        } as const
        this.socket.send(this.socketMethodName, data)
        this.onReceiveChange(data)
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
                        if (customClassList?.contains(this.CSS.selected)) this.getDOMBlockById(block.id)?.classList.add(this.CSS.selected)
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
                if (isSelected) block.classList.add(this.CSS.selected)
                else block.classList.remove(this.CSS.selected)
                break
            }

            case 'inline-selection-change': {
                const { type, anchorOffset, elementNodeIndex, elementXPath, focusOffset, blockId, ...rect } = response
                const blockContent = this.getDOMBlockById(blockId)?.querySelector(`.${this.EditorCSS.blockContent}`)
                if (!blockContent) return

                const isReset = elementXPath === null
                const { cursor, isInDocument } = this.getFakeCursor(blockId)
                if (isReset) {
                    if (isInDocument) cursor.remove()
                    return
                }

                // //* Note if element is not found try without nth-child
                const selectedElement = document.querySelector(elementXPath)
                if (!(selectedElement instanceof HTMLElement)) return

                const { fontSize } = window.getComputedStyle(selectedElement)

                cursor.style.height = fontSize
                cursor.style.top = `${rect.top}px`
                cursor.style.left = `${rect.left}px`
                const { cursorColor, cursorClass } = this.config.overrideStyles ?? {}
                if (cursorColor) cursor.style.setProperty('--realtime-inline-cursor-color', cursorColor)
                if (cursorClass) cursor.classList.add(...cursorClass.split(' '))

                if (!isInDocument) blockContent.append(cursor)
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

    private getFakeCursor(blockId: string): { cursor: HTMLElement; isInDocument: boolean } {
        const domCursor = document.querySelector(
            `[${this.blockIdAttributeName}='${blockId}'] .${this.EditorCSS.blockContent} [${this.inlineFakeCursorAttributeName}]`,
        )
        if (domCursor instanceof HTMLElement) return { cursor: domCursor, isInDocument: true }

        // remove if exists
        document.querySelector(`[${this.inlineFakeCursorAttributeName}]`)?.remove()
        const cursor = document.createElement('div')
        cursor.setAttribute(this.inlineFakeCursorAttributeName, '')
        cursor.classList.add(this.CSS.inlineCursor)
        return { cursor, isInDocument: false }
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
        const block = document.querySelector(`[${this.blockIdAttributeName}=${blockId}]`)
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
        return paths.join(' > ')
    }

    private getNodeRelativeChildIndex(node: Node): number | null {
        const { parentElement } = node
        if (!parentElement) return null
        for (let i = 0; i < parentElement.childNodes.length; i++) {
            if (node === parentElement.childNodes[i]) return i
        }

        return null
    }
}
