import SignalR from '@microsoft/signalr'
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

export type GroupCollabConfigOptions<SocketMethodName extends string> = {
    editor: EditorJS
    socket: INeededSocketFields<SocketMethodName>
    /**
     * Name of the socket event.
     * @default 'editorjs-update'
     */
    socketMethodName: SocketMethodName
    /**
     * Delay to throttle block changes. Value is in ms
     * @default 300
     */
    blockChangeThrottleDelay: number
}

export type MessageData = { block: SavedData } & (
    | MakeConditionalType<{ index: number }, typeof BlockAddedMutationType, 'type'>
    | MakeConditionalType<
          {
              blockId: string
          },
          typeof BlockRemovedMutationType,
          'type'
      >
    | MakeConditionalType<
          {
              blockId: string
              // in case blockId is not found
              index: number
          },
          typeof BlockChangedMutationType,
          'type'
      >
    | MakeConditionalType<{ fromBlockId: string; toBlockId: string }, typeof BlockMovedMutationType, 'type'>
)
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
// const conn = new SignalR.HubConnectionBuilder().withUrl('https://localhost:7244/myHubPath').build()

type Events = keyof BlockMutationEventMap
export type INeededSocketFields<SocketMethodName extends string> = {
    send(socketMethod: SocketMethodName, data: MessageData): void
    on(socketMethod: SocketMethodName, callback: (data: MessageData) => void): void
    off(socketMethod: SocketMethodName): void
}
export default class GroupCollab<SocketMethodName extends string> {
    private editor: EditorJS
    private socket: INeededSocketFields<SocketMethodName>
    private socketMethodName: SocketMethodName
    private editorBlockEvent = 'block changed' // this might need more investigation
    private _isListening = false
    private ignoreEvents: Record<string, Set<Events>> = {}
    private blockChangeThrottleDelay: number
    public constructor({ editor, socket, socketMethodName, blockChangeThrottleDelay = 500 }: GroupCollabConfigOptions<SocketMethodName>) {
        this.editor = editor
        this.socket = socket
        this.socketMethodName = socketMethodName ?? 'editorjs-update'
        this.blockChangeThrottleDelay = blockChangeThrottleDelay

        this.initBlockChangeListener()
        this.listen()
    }

    public get isListening() {
        return this._isListening
    }

    /**
     * Remove event listeners on socket and editor
     */
    public unlisten() {
        this.socket.off(this.socketMethodName)
        this.editor.off(this.editorBlockEvent, this.blockListener)
        this._isListening = false
    }
    /**
     * Manually listen for editor and socket events. This is called by default
     */
    public listen() {
        this.socket.on(this.socketMethodName, this.receiveChange)
        this.editor.on(this.editorBlockEvent, this.blockListener)
        this._isListening = true
    }

    private receiveChange = (response: MessageData) => {
        const { block, type } = response

        const blockId = block.id
        this.addBlockToIgnorelist(blockId, type)
        setTimeout(() => {
            this.removeBlockFromIgnorelist(blockId, type)
        }, 0)
        switch (response.type) {
            case 'block-added': {
                const { index } = response
                this.editor.blocks.insert(block.tool, block.data, null, index, false, false, blockId)
                break
            }
            case 'block-changed': {
                const { index } = response
                this.editor.blocks.update(blockId, block.data).catch((e) => {
                    if (e.message === `Block with id "${blockId}" not found`) {
                        this.editor.blocks.insert(block.tool, block.data, null, index, false, false, block.id)
                    }
                })
                break
            }
            case 'block-moved': {
                const { toBlockId, fromBlockId } = response
                const toIndex = this.editor.blocks.getBlockIndex(toBlockId)
                const fromIndex = this.editor.blocks.getBlockIndex(fromBlockId)

                this.editor.blocks.move(toIndex, fromIndex)
                break
            }

            case 'block-removed': {
                const blockIndex = this.editor.blocks.getBlockIndex(blockId)
                this.editor.blocks.delete(blockIndex)
                break
            }
            default: {
            }
        }
    }

    private blockListener = (data: any) => {
        if (!(data?.event instanceof CustomEvent) || !data.event) {
            console.error('block changed but its not custom event')
            return
        }
        const { event } = data
        if (!this.validateEventDetail(event)) return
        const type = event.type as Events
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
                //at this point the blocks already switched places
                socketData.toBlockId = this.editor.blocks.getBlockByIndex(fromIndex)?.id
            }
            this.socket.send(this.socketMethodName, socketData as MessageData)
        }, 0)
    }

    private initBlockChangeListener() {
        this.handleBlockChange = throttle(this.blockChangeThrottleDelay, async (target: BlockAPI, index: number) => {
            const targetId = target.id
            const savedData = await target.save()
            if (!savedData) return

            const socketData: Partial<MessageData> = {
                type: 'block-changed',
                block: savedData,
            }
            socketData.blockId = targetId
            socketData.index = index

            if (!this.isListening) return
            this.socket.send(this.socketMethodName, socketData as MessageData)
            this.addBlockToIgnorelist(targetId, 'block-changed')
            setTimeout(() => {
                this.removeBlockFromIgnorelist(targetId, 'block-changed')
            }, 0)
        })
    }
    private handleBlockChange?: throttle<(target: BlockAPI, index: number) => Promise<void>> = undefined
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

    private addBlockToIgnorelist(blockId: string, type: Events) {
        if (!this.ignoreEvents[blockId]) this.ignoreEvents[blockId] = new Set<Events>()
        this.ignoreEvents[blockId].add(type)
    }
    private removeBlockFromIgnorelist(blockId: string, type: Events) {
        this.ignoreEvents[blockId].delete(type)
        if (!this.ignoreEvents[blockId].size) delete this.ignoreEvents[blockId]
    }
}
