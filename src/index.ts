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
import { throttle, debounce } from 'throttle-debounce'
import './index.css'

const UserInlineSelectionChangeType = 'inline-selection-change'
const UserBlockSelectionChangeType = 'block-selection-change'
const UserBlockDeletionChangeType = 'block-deletion-change'
const UserDisconnectedType = 'user-disconnected'
const BlockLockedType = 'block-locked'
const BlockUnlockedType = 'block-unlocked'

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
    /**
     * Time to debounce block locking. Value is in ms
     * @default 1500
     */
    blockLockDebounceTime: number
    /**
     * For example the table tool triggers block changes even if the emitting user does not even interact with the block, which would also emit a locking event.
     * In such cases you can add the tool's name here to enable checking its data for changes before locking that block. Only `data` and `tunes` are checked to be changed.
     * @default ["table"]
    */
    toolsWithDataCheck: string[];
    cursor?: { color?: string; selectionColor?: string; };
    overrideStyles?: {
        cursorClass?: string;
        selectedClass?: string;
        inlineSelectionClass?: string;
        pendingDeletionClass?: string;
        lockedBlockClass?: string;
    };
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
            elementXPath: string
            blockId: string
            // rects: Rect[]
            containerWidth: number

            connectionId: string;
            color: string;
            selectionColor: string;

            //idk if i'll use these
            elementNodeIndex: number
            anchorOffset: number
            focusOffset: number
        },
        typeof UserInlineSelectionChangeType
    >
    | MakeConditionalType<{ connectionId: string }, typeof UserDisconnectedType>
    | MakeConditionalType<{ blockId: string; isDeletePending: boolean }, typeof UserBlockDeletionChangeType>
    | MakeConditionalType<{ blockId: string; isSelected: boolean }, typeof UserBlockSelectionChangeType>
    | MakeConditionalType<LockedBlock, typeof BlockLockedType>
    | MakeConditionalType<LockedBlock, typeof BlockUnlockedType>
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

type LockedBlock = { blockId: string; connectionId: string }
type EditorEvents = keyof BlockMutationEventMap
type Events = EditorEvents | typeof UserInlineSelectionChangeType | typeof UserBlockSelectionChangeType | typeof UserBlockDeletionChangeType | typeof BlockLockedType | typeof BlockUnlockedType
type ToolData = { data: Object, tunes: Object };

export type INeededSocketFields<SocketMethodName extends string> = {
    send(socketMethod: SocketMethodName, data: MessageData): void
    on(socketMethod: SocketMethodName, callback: (data: MessageData) => void): void
    off(socketMethod: SocketMethodName): void;
    connectionId: string;
}

export default class GroupCollab<SocketMethodName extends string> {
    // Config
    private editor: EditorJS
    private socket: INeededSocketFields<SocketMethodName>
    private socketMethodName: SocketMethodName
    private config: LocalConfig


    private _isListening = false
    private _currentEditorLockingBlockId: string | null = null;
    private _lockedBlocks: LockedBlock[] = [];
    private _customToolsInternalState: Record<string, ToolData> = {}

    // events to ignore until next render
    private ignoreEvents: Record<string, Set<Events>> = {}
    private redactorObserver: MutationObserver
    private toolboxObserver: MutationObserver;
    private editorStyleElement: HTMLStyleElement;
    private throttledBlockChange?: throttle<(target: BlockAPI, index: number) => Promise<void>> = undefined
    private throttledInlineSelectionChange?: throttle<(e: Event) => void> = undefined
    private _debouncedBlockUnlockingsMap: Record<string, debounce<(blockId: string, connectionId: string) => void>> = {};
    private localBlockStates: Record<string, Set<'selected' | 'focused' | "deleting">> = {}

    private editorBlockEvent = 'block changed'
    private editorDomChangedEvent = 'redactor dom changed' // this might need more investigation before any usage
    private blockIdAttributeName = 'data-id'
    private inlineFakeCursorAttributeName = 'data-realtime-fake-inline-cursor'
    private inlineFakeSelectionAttributeName = 'data-realtime-fake-inline-selection'
    private connectionIdAttributeName = 'data-realtime-connection-id'
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
            blockLockDebounceTime: 1500,
            toolsWithDataCheck: ["table"],
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

        this.editorStyleElement = document.createElement('style')
        this.setupStyleElement()
        this.setupThrottledListeners()
        this.initializeCustomToolsState();
    }

    //#region Public API
    public get isListening() {
        return this._isListening
    }

    public get lockedBlocks(): LockedBlock[] {
        return this._lockedBlocks.map(b => ({ ...b }))
    }

    public set lockedBlocks(value: LockedBlock[]) {
        const oldLockedBlocks = this._lockedBlocks
        this._lockedBlocks = value.map(b => ({ ...b }))
        this.renderLockedBlocks(oldLockedBlocks, this._lockedBlocks)
    }

    public get currentLockedBlockId(): string | null {
        return this._currentEditorLockingBlockId;
    }
    /**
     * Remove event listeners on socket and editor
     */
    public unlisten() {
        this.socket.off(this.socketMethodName)
        this.editor.off(this.editorBlockEvent, this.onEditorBlockEvent)
        this.redactorObserver.disconnect()
        this.toolboxObserver.disconnect()
        document.removeEventListener('selectionchange', this.throttledInlineSelectionChange!)
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
        const redactor = this.getRedactor();
        if (!redactor) {
            console.error("Could not initialize redactor observer.")
            return
        }
        this.redactorObserver.observe(redactor, {
            childList: true,
            attributes: true,
            attributeFilter: ['class'],
            subtree: true,
        })
        const toolboxSettingsEl = this.getEditorHolder()?.querySelector(`.${this.EditorCSS.toolbarSettings}`) ?? document.querySelector(`.${this.EditorCSS.toolbarSettings}`)
        if (toolboxSettingsEl)
            this.toolboxObserver.observe(toolboxSettingsEl, {
                childList: true,
                attributes: true,
                attributeFilter: ["class"],
                subtree: true
            })
        else
            console.error("Could not initialize toolbox observer.")
        document.addEventListener('selectionchange', this.throttledInlineSelectionChange!)
        window.addEventListener("beforeunload", this.onDisconnect, { capture: true })

        this._isListening = true
    }

    //#endregion
    //#region Private APIs

    private get CSS() {
        return {
            selected: 'cdx-realtime-block--selected',
            inlineCursor: 'cdx-realtime-inline-cursor',
            inlineSelection: 'cdx-realtime-inline-selection',
            deletePending: "cdx-realtime-block--delete-pending",
            lockedBlock: "cdx-realtime-block--locked",
        }
    }
    private get EditorCSS() {
        return {
            baseBlock: 'ce-block',
            focused: 'ce-block--focused',
            selected: 'ce-block--selected',
            editorWrapper: "codex-editor",
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
            const toolboxDeleteSetting = this.getEditorHolder()?.querySelector(`.${this.EditorCSS.toolbar} ${this.EditorCSS.toolbarDeleteSetting}`)
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

    //#region Inline Selection Change Handling
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
            anchorOffset,
            focusOffset,
            elementNodeIndex,
            // rects: finalRects,

            color: this.config.cursor?.color ?? '',
            selectionColor: this.config.cursor?.selectionColor ?? '',
            connectionId: this.socket.connectionId
        }
        this.socket.send(this.socketMethodName, data)
    }

    private onDisconnect = (e: Event) => {
        this.socket.send(this.socketMethodName, { type: UserDisconnectedType, connectionId: this.socket.connectionId })
    }

    //#region Receive Changes Handling
    private onReceiveChange = (response: MessageData) => {
        switch (response.type) {
            case 'block-added': {
                const { index, block } = response
                this.addBlockToIgnoreListUntilNextRender(block.id, response.type)
                this.editor.blocks.insert(block.tool, block.data, null, index, false, false, block.id)
                const shouldHaveInternalState = this.config.toolsWithDataCheck.includes(block.tool)
                if (shouldHaveInternalState) {
                    this._customToolsInternalState[block.id] = { data: block.data, tunes: (block as any).tunes ?? {} };
                }
                break
            }
            case 'block-changed': {
                const { index, block } = response
                this.addBlockToIgnoreListUntilNextRender(block.id, response.type)
                const shouldHaveInternalState = this.config.toolsWithDataCheck.includes(block.tool)
                if (shouldHaveInternalState) {
                    this._customToolsInternalState[block.id] = { data: block.data, tunes: (block as any).tunes ?? {} };
                }
                const customClassList = this.getDOMBlockById(block.id)?.classList

                const blockApi = this.editor.blocks.getById(block.id)
                if (!blockApi) return;

                this.editor.blocks
                    .update(block.id, block.data)
                    .catch((e) => {
                        if (e.message === `Block with id "${block.id}" not found`) {
                            this.addBlockToIgnoreListUntilNextRender(block.id, 'block-added')
                            this.editor.blocks.insert(block.tool, block.data, null, index, false, false, block.id)
                        }
                    })
                    .then(() => {
                        const lockedBlock = this.lockedBlocks.find(b => b.blockId === block.id && b.connectionId !== this.socket.connectionId)
                        if (lockedBlock) {
                            this.renderLockedBlocks([], [lockedBlock])
                        }

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

                const fromSelections = this.getFakeSelections({ blockId: fromBlockId })
                fromSelections?.forEach(sel => sel.remove())

                const toSelections = this.getFakeSelections({ blockId: toBlockId })
                toSelections?.forEach(sel => sel.remove())

                const fromCursors = this.getFakeCursors({ blockId: fromBlockId })
                fromCursors?.forEach(cursor => cursor.remove())

                const toCursors = this.getFakeCursors({ blockId: toBlockId })
                toCursors?.forEach(cursor => cursor.remove())

                break
            }

            case 'block-removed': {
                const { blockId } = response
                this.addBlockToIgnoreListUntilNextRender(blockId, response.type)
                const blockIndex = this.editor.blocks.getBlockIndex(blockId)
                const blockName = this.editor.blocks.getBlockByIndex(blockIndex)?.name ?? ""
                this.editor.blocks.delete(blockIndex);
                const shouldHaveInternalState = this.config.toolsWithDataCheck.includes(blockName)
                if (shouldHaveInternalState) {
                    delete this._customToolsInternalState[blockId];
                }
                const selections = this.getFakeSelections({ blockId })
                selections?.forEach(sel => sel.remove())
                const cursors = this.getFakeCursors({ blockId })
                cursors?.forEach(cursor => cursor.remove())
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
                const { type, /* rects, */ elementXPath, blockId, connectionId, anchorOffset, elementNodeIndex, focusOffset, color, selectionColor } = response
                const blockContent = this.getDOMBlockById(blockId)?.querySelector(`.${this.EditorCSS.blockContent}`)
                if (!blockContent /* || !rects.length */) return

                const isSelection = anchorOffset !== focusOffset
                const isReset = elementXPath === null || isSelection
                if (isReset) {
                    const oldCursors = this.getFakeCursors({ connectionId })
                    oldCursors?.forEach(cursor => cursor.remove())
                }

                // remove existing selection for this user
                // console.log(response)
                const editorHolder = this.getEditorHolder()
                if (!editorHolder) return
                const parentElement = editorHolder.querySelector(elementXPath)
                if (!(parentElement instanceof HTMLElement)) return

                const nodeElement = parentElement.childNodes[elementNodeIndex];
                if (!nodeElement) return
                const calculatedSelectionRects = this.getBoundingClientRectForSelection(nodeElement, anchorOffset, focusOffset)
                const parentElementRect = editorHolder.getBoundingClientRect()

                this.getFakeSelections({ connectionId })?.forEach((sel) => sel.remove())
                if (isSelection) {

                    // Adjust rects to be relative to editorHolder

                    for (let i = 0; i < calculatedSelectionRects.length; i++) {
                        const rect = calculatedSelectionRects.item(i)
                        if (!rect) continue
                        const selectionElement = this.createSelectionElement({ blockId, connectionId })
                        // Adjust rect position relative to parentElement
                        selectionElement.style.top = `${rect.top - parentElementRect.top}px`
                        selectionElement.style.left = `${rect.left - parentElementRect.left}px`
                        selectionElement.style.width = `${rect.width}px`;
                        selectionElement.style.height = `${rect.height}px`;
                        if (selectionColor) selectionElement.style.setProperty('--realtime-inline-selection-color', selectionColor)
                        editorHolder.insertAdjacentElement("beforeend", selectionElement);
                        this.addBlockToIgnoreListUntilNextRender(blockId, 'block-changed');
                    }
                } else {
                    let cursor: HTMLDivElement;
                    if (isReset)
                        cursor = this.createFakeCursor({ connectionId, blockId })
                    else {
                        cursor = this.getFakeCursors({ connectionId })?.item(0) as HTMLDivElement;
                        if (!cursor) cursor = this.createFakeCursor({ connectionId, blockId })
                        // reset animation state
                        cursor.style.animation = 'none'
                        cursor.offsetHeight // trigger reflow
                        cursor.style.animation = ''
                    }
                    const rect = calculatedSelectionRects.item(0)
                    if (!rect) return;
                    //* Note if element is not found try without nth-child
                    const selectedElement = this.getEditorHolder()?.querySelector(elementXPath)
                    if (!(selectedElement instanceof HTMLElement)) return

                    //This is used to resize the height of the selection if users have different font sizes/screen zoom in/out s
                    const { fontSize } = window.getComputedStyle(selectedElement)

                    cursor.style.height = fontSize
                    cursor.style.top = `${rect.top - parentElementRect.top}px`
                    cursor.style.left = `${rect.left - parentElementRect.left}px`

                    const { cursorClass } = this.config.overrideStyles ?? {}
                    if (color) cursor.style.setProperty('--realtime-inline-cursor-color', color)
                    if (cursorClass) cursor.classList.add(...cursorClass.split(' '))

                    if (!editorHolder.contains(cursor)) editorHolder.insertAdjacentElement("beforeend", cursor)
                }
                break
            }

            case 'user-disconnected': {
                const { connectionId } = response
                const cursors = this.getFakeCursors({ connectionId })
                const selections = this.getFakeSelections({ connectionId })
                selections?.forEach(sel => sel.remove())
                cursors?.forEach(cursor => cursor.remove())
                this.lockedBlocks = this.lockedBlocks.filter(b => b.connectionId !== connectionId)
                break
            }

            case BlockLockedType: {
                const { blockId, connectionId } = response
                const alreadyLocked = this.lockedBlocks.some(b => b.blockId === blockId)
                if (alreadyLocked) break;
                this.lockedBlocks = [...this.lockedBlocks, { blockId, connectionId }]
                this.addBlockToIgnoreListUntilNextRender(blockId, 'block-changed')

                const blockApi = this.editor.blocks.getById(blockId)
                if (!blockApi) return;

                //? This fixes the visual flickering btw when updating block data from remote sources
                const Xpath = this.getElementXPath(blockApi.holder);
                this.addStyleToDOM(Xpath, {
                    animationName: 'none',
                }, blockId)

                const cursors = this.getFakeCursors({ blockId })
                cursors?.forEach(cursor => cursor.remove())
                const selections = this.getFakeSelections({ blockId })
                selections?.forEach(sel => sel.remove())
                break;
            }

            case BlockUnlockedType: {
                const { blockId, connectionId } = response
                this.lockedBlocks = this.lockedBlocks.filter(b => !(b.blockId === blockId && b.connectionId === connectionId))
                this.addBlockToIgnoreListUntilNextRender(blockId, 'block-changed')
                this.removeStyleFromDOM(blockId);
                break;
            }

            default: {
            }
        }
    }

    //#region Emit Editor Block Event Handling
    private onEditorBlockEvent = async (data: any) => {
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

        const isBlockLocked = this.lockedBlocks.some(b => b.blockId === targetId && b.connectionId !== this.socket.connectionId)
        if (isBlockLocked) return

        const shouldBlockHaveInternalState = this.config.toolsWithDataCheck.includes(target.name)


        // block changes are throttled, thus se have this separate from the other DOM events
        if (type === 'block-changed') {
            // some tools, such as table, emit block-changed events even if i click on another block in the redactor 🤦‍♂️
            if (shouldBlockHaveInternalState) {
                // TODO this might cause an async race.
                const savedData = await target.save()
                if (!savedData) return

                const dataToCompareWith = { data: savedData.data, tunes: (savedData as any).tunes };
                const hasSameData = this.compareToolsData(this._customToolsInternalState[targetId], dataToCompareWith);
                if (hasSameData && this._currentEditorLockingBlockId !== targetId) return; // skip this nonsense if false alarms are detected
                this._customToolsInternalState[targetId] = dataToCompareWith;
            }
            if (this._currentEditorLockingBlockId == targetId) {
                this.debouncedBlockUnlocking(targetId, this.socket.connectionId)
            }
            else {
                this._currentEditorLockingBlockId = targetId;
                this.socket.send(this.socketMethodName, { type: BlockLockedType, blockId: targetId, connectionId: this.socket.connectionId })

                // Remove any other user's cursor/selection in this block
                this.getFakeCursors({ blockId: targetId })?.forEach(cursor => cursor.remove())
                this.getFakeSelections({ blockId: targetId })?.forEach(sel => sel.remove())
                this.debouncedBlockUnlocking(targetId, this.socket.connectionId)
            }
        }

        //save after dom changes have been propagated to the necessary tools
        setTimeout(async () => {
            if (type === 'block-changed') {
                if (!('index' in otherData) || typeof otherData.index !== 'number') return
                this.throttledBlockChange?.(target, otherData.index ?? 0)
                setTimeout(() => {
                    this.throttledInlineSelectionChange?.(new CustomEvent('selectionchange'))
                }, 0)
                return
            }

            const savedData = await target.save()
            if (!savedData) return

            const socketData: Partial<MessageData> = {
                type,
                block: savedData,
            }
            if (socketData.type === 'block-added') {
                socketData.index = (otherData as PickFromConditionalType<PossibleEventDetails, 'block-added'>).index
                if (shouldBlockHaveInternalState)
                    this._customToolsInternalState[targetId] = { data: savedData.data, tunes: (savedData as any).tunes ?? {} };
            }
            if (socketData.type === 'block-removed') {
                socketData.blockId = targetId
                if (shouldBlockHaveInternalState)
                    delete this._customToolsInternalState[targetId];
            }
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

    //#region Throttled & Debounced Handlers
    private setupThrottledListeners() {
        this.throttledInlineSelectionChange = throttle(this.config.blockChangeThrottleDelay, (event: Event) => {
            if (!this.isListening) return

            this.onInlineSelectionChange(event);
        })

        this.throttledBlockChange = throttle(this.config.blockChangeThrottleDelay, async (target: BlockAPI, index: number) => {
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

    private debouncedBlockUnlocking(blockId: string, connectionId: string) {
        const debouncedFunc = this._debouncedBlockUnlockingsMap?.[blockId];
        if (debouncedFunc) {
            debouncedFunc(blockId, connectionId);
            return;
        }
        const newDebouncedFunc = debounce(this.config.blockLockDebounceTime, (bId: string, connId: string) => {
            this.socket.send(this.socketMethodName, { type: BlockUnlockedType, blockId: bId, connectionId: connId })
            if (this.currentLockedBlockId === bId)
                this._currentEditorLockingBlockId = null;
            delete this._debouncedBlockUnlockingsMap?.[bId];
        });
        this._debouncedBlockUnlockingsMap = {
            ...(this._debouncedBlockUnlockingsMap),
            [blockId]: newDebouncedFunc
        }
        newDebouncedFunc(blockId, connectionId);
    }


    //#region DOM & utils
    private getFakeCursors({ blockId, connectionId }: Partial<Record<"blockId" | "connectionId", string>>) {
        if (!blockId && !connectionId) return null
        const connectionQuery = connectionId ? `[${this.connectionIdAttributeName}='${connectionId}']` : ""
        const blockIdQuery = blockId ? `[${this.inlineFakeCursorAttributeName}='${blockId}']` : "";
        const domCursors = this.getEditorHolder()?.querySelectorAll(
            `${blockIdQuery}${connectionQuery}`,
        )
        return domCursors
    }

    private createFakeCursor({ blockId, connectionId }: Record<"blockId" | "connectionId", string>) {
        const cursor = document.createElement('div')
        cursor.setAttribute(this.inlineFakeCursorAttributeName, blockId)
        cursor.setAttribute(this.connectionIdAttributeName, connectionId)
        cursor.classList.add(this.CSS.inlineCursor)
        return cursor
    }

    private getFakeSelections({ blockId, connectionId }: Partial<Record<"blockId" | "connectionId", string>>) {
        const connectionQuery = connectionId ? `[${this.connectionIdAttributeName}='${connectionId}']` : ""
        return this.getEditorHolder()?.querySelectorAll(
            `[${this.inlineFakeSelectionAttributeName}${blockId ? `='${blockId}'` : ""}]${connectionQuery}`,
        )
    }

    private createSelectionElement({ blockId, connectionId }: Record<"blockId" | "connectionId", string>) {
        const selection = document.createElement('div')
        selection.setAttribute(this.inlineFakeSelectionAttributeName, blockId)
        selection.setAttribute(this.connectionIdAttributeName, connectionId)
        selection.classList.add(this.CSS.inlineSelection)
        if (this.config.overrideStyles?.inlineSelectionClass)
            selection.classList.add(this.config.overrideStyles.inlineSelectionClass)

        return selection
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

    private addStyleToDOM(selector: string, styles: Partial<CSSStyleDeclaration>, nonce: string) {
        const styleElement = this.editorStyleElement;
        if (!styleElement) return;
        const stringifiedStyles = this.stringifyStyles(styles);

        const comment = document.createComment(`nonce: ${nonce}`);
        styleElement.insertAdjacentText('beforeend', `${selector} {  ${stringifiedStyles} }`);
        styleElement.insertBefore(comment, styleElement.lastChild);
    }

    private removeStyleFromDOM(nonce: string) {
        const styleElement = this.editorStyleElement;
        if (!styleElement) return;
        const comments = Array.from(styleElement.childNodes).filter(n => n.nodeType === Node.COMMENT_NODE) as Comment[];
        const targetComment = comments.find(c => c.data.trim() === `nonce: ${nonce}`);
        if (!targetComment) return;

        targetComment.nextSibling?.remove();
        targetComment.remove();

    }

    private stringifyStyles(styleObject: Partial<CSSStyleDeclaration>) {
        const sheet = new CSSStyleSheet();
        sheet.insertRule(':root {}');

        const rule = sheet.cssRules[0];
        if (!rule || !(rule instanceof CSSStyleRule)) return;

        Object.assign(rule.style, styleObject);
        return rule.style.cssText;
    }

    private getDOMBlockById(blockId: string) {
        const block = this.getEditorHolder()?.querySelector(`[${this.blockIdAttributeName}='${blockId}']`)
        if (block instanceof HTMLElement) return block
        return null
    }

    private getRedactor(): HTMLElement | null {
        const redactor =
            (this.editor as any)?.ui.redactor ??
            this.getEditorHolder()?.querySelector(`.${this.EditorCSS.editorRedactor}`) ??
            document.querySelector(`.${this.EditorCSS.editorRedactor}`)
        if (!(redactor instanceof HTMLElement)) return null
        return redactor
    }

    private getEditorHolder(): HTMLElement | null {
        return (this.editor as any)?.ui.wrapper ??
            document.querySelector(`#${(this.editor as any)?.configuration.holder} .${this.EditorCSS.editorWrapper}`) ??
            document.querySelector(`.${this.EditorCSS.editorWrapper}`)
    }

    private renderLockedBlocks(oldLockedBlocks: LockedBlock[], newLockedBlocks: LockedBlock[]) {
        const blocksToUnlock = oldLockedBlocks.filter(ob => !newLockedBlocks.some(nb => nb.blockId === ob.blockId && nb.connectionId === ob.connectionId))
        const blocksToLock = newLockedBlocks.filter(nb => !oldLockedBlocks.some(ob => ob.blockId === nb.blockId && ob.connectionId === nb.connectionId))

        const collabAttribute = 'data-realtime-collab-locked'
        for (const block of blocksToUnlock) {
            const domBlock = this.getDOMBlockById(block.blockId)
            if (!domBlock) continue

            const contentEditableElements = domBlock.querySelectorAll(`[contenteditable="false"][${collabAttribute}]`)
            domBlock.classList.remove(this.CSS.lockedBlock)
            contentEditableElements.forEach(el => {
                el.setAttribute('contenteditable', 'true')
                el.removeAttribute(collabAttribute)
            })
            if (this.config.overrideStyles?.lockedBlockClass)
                domBlock.classList.remove(this.config.overrideStyles.lockedBlockClass)
        }

        for (const block of blocksToLock) {
            const domBlock = this.getDOMBlockById(block.blockId)
            if (!domBlock) continue

            const contentEditableElements = domBlock.querySelectorAll('[contenteditable="true"]')
            contentEditableElements.forEach(el => {
                el.setAttribute('contenteditable', 'false')
                el.setAttribute(collabAttribute, '')
            })
            domBlock.classList.add(this.CSS.lockedBlock)
            if (this.config.overrideStyles?.lockedBlockClass)
                domBlock.classList.add(this.config.overrideStyles.lockedBlockClass)
        }

    }

    // With stringify, the order of the keys might differ, so we need a deep comparison
    private compareToolsData(toolData1: ToolData, toolData2: ToolData): boolean {
        function recursiveCompare(obj1: any, obj2: any): boolean {
            if (typeof obj1 !== typeof obj2) return false;
            if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
                return obj1 === obj2;
            }
            const keys1 = Object.keys(obj1);
            const keys2 = Object.keys(obj2);
            if (keys1.length !== keys2.length) return false;
            for (const key of keys1) {
                if (!keys2.includes(key)) return false;
                if (!recursiveCompare(obj1[key], obj2[key])) return false;
            }
            return true;
        }
        const value = recursiveCompare(toolData1, toolData2);
        return value;
    }
    private initializeCustomToolsState() {
        const allBlocks = (this.editor as any).configuration.data?.blocks ?? [];
        for (const block of allBlocks) {
            if (this.config.toolsWithDataCheck.includes(block.type)) {
                this._customToolsInternalState[block.id] = { data: block.data, tunes: (block as any).tunes ?? {} };
            }
        }
    }

    private setupStyleElement() {
        this.editorStyleElement.setAttribute('data-realtime-collab-styles', '')
        this.getEditorHolder()?.insertAdjacentElement('afterbegin', this.editorStyleElement)
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

    private getBoundingClientRectForSelection(node: Node, anchorOffset: number, focusOffset: number): DOMRectList {
        const range = document.createRange()
        const start = Math.min(anchorOffset, focusOffset)
        const end = Math.max(anchorOffset, focusOffset)
        range.setStart(node, start)
        range.setEnd(node, end)
        const rect = range.getClientRects()
        return rect

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

    private getElementXPath(selectedNode: HTMLElement, omitCountForBlock = false) {
        let element = selectedNode
        // If the element does not have an ID, construct the XPath based on its ancestors
        const paths = []
        while (element.parentNode instanceof HTMLElement && !element.classList.contains(this.EditorCSS.editorRedactor)) {
            const dataId = element.getAttribute(this.blockIdAttributeName)
            let elementSelector = element.localName.toLowerCase()
            if (dataId)
                elementSelector += `[${this.blockIdAttributeName}='${dataId}']`

            const ignoreNthChild = omitCountForBlock && dataId;
            if (!ignoreNthChild && element.previousElementSibling) {
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


}
