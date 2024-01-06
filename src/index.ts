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

export type GroupCollabConfigOptions<SocketMethodName extends string> = {
    editor: EditorJS
    socket: INeededSocketFields<SocketMethodName>
    socketMethodName: SocketMethodName
}

export type MessageData = { block: SavedData } & (
    | MakeConditionalType<{ index: number }, typeof BlockAddedMutationType, 'type'>
    | MakeConditionalType<{ blockId: string }, typeof BlockChangedMutationType | typeof BlockRemovedMutationType, 'type'>
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
    on(socketMethod: SocketMethodName, data: (data: MessageData) => void): void
    off(socketMethod: SocketMethodName): void
}
export default class GroupCollab<SocketMethodName extends string> {
    private editor: EditorJS
    private socket: INeededSocketFields<SocketMethodName>
    private socketMethodName: SocketMethodName
    private editorBlockEvent = 'block changed' // this might need more investigation
    private _isListening = false
    private ignoreEvents: Record<string, Events[]> = {}
    public constructor({ editor, socket, socketMethodName }: GroupCollabConfigOptions<SocketMethodName>) {
        this.editor = editor
        this.socket = socket
        this.socketMethodName = socketMethodName

        this.listen()
    }

    public get isListening() {
        return this._isListening
    }

    public unlisten() {
        this.socket.off(this.socketMethodName)
        this.editor.off(this.editorBlockEvent, this.blockListener)
        this._isListening = false
    }

    public listen() {
        this.socket.on(this.socketMethodName, this.receiveChange)
        this.editor.on(this.editorBlockEvent, this.blockListener)
        this._isListening = true
    }

    private receiveChange = (response: MessageData) => {
        // console.log(response)
        const { block } = response

        this.ignoreEvents[block.id] = [...(this.ignoreEvents[block.id] ?? []), response.type]
        setTimeout(() => {
            delete this.ignoreEvents[block.id]
        }, 0)
        switch (response.type) {
            case BlockAddedMutationType: {
                const { index } = response
                this.editor.blocks.insert(block.tool, block.data, null, index, false, false, block.id)
                break
            }
            case 'block-changed': {
                this.editor.blocks.update(block.id, block.data)
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
                const blockIndex = this.editor.blocks.getBlockIndex(block.id)
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

        if (this.ignoreEvents[targetId]?.includes(type)) return
        //save after dom changes have been progapated to the necessary tools
        setTimeout(async () => {
            const savedData = await target.save()
            if (!savedData) return

            const socketData: Partial<MessageData> = {
                type,
                block: savedData,
            }
            if (socketData.type === 'block-added')
                socketData.index = (otherData as PickFromConditionalType<PossibleEventDetails, 'block-added'>).index
            if (socketData.type === 'block-changed' || socketData.type === 'block-removed') socketData.blockId = targetId
            if (socketData.type === 'block-moved') {
                const { fromIndex, toIndex } = otherData as PickFromConditionalType<PossibleEventDetails, 'block-moved'>
                socketData.fromBlockId = targetId
                //at this point the blocks already switched places
                socketData.toBlockId = this.editor.blocks.getBlockByIndex(fromIndex)?.id
            }
            this.socket.send(this.socketMethodName, socketData as MessageData)
        }, 0)
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
}
