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

export type GroupCollabConfigOptions<SocketMethodName extends string> = {
    editor: EditorJS
    socket: INeededSocketFields<SocketMethodName>
    socketMethodName: SocketMethodName
}

export type MessageData = { editorjsData: { index: number; block: SavedData } }
type EventDetails = { index: number; target: BlockAPI }
// const conn = new SignalR.HubConnectionBuilder().withUrl('https://localhost:7244/myHubPath').build()

type Events = keyof BlockMutationEventMap
export type INeededSocketFields<SocketMethodName extends string> = {
    send(socketMethod: SocketMethodName, data: readonly [eventName: Events, message: MessageData]): void
    on(socketMethod: SocketMethodName, data: (...data: readonly [eventName: Events, message: MessageData]) => void): void
    off(socketMethod: SocketMethodName): void
}
export default class GroupCollab<SocketMethodName extends string> {
    private editor: EditorJS
    private socket: INeededSocketFields<SocketMethodName>
    private socketMethodName: SocketMethodName
    private editorBlockEvent = 'block changed' // this might need more investigation
    private _isListening = false
    public constructor({ editor, socket, socketMethodName }: GroupCollabConfigOptions<SocketMethodName>) {
        this.editor = editor
        this.socket = socket
        this.socketMethodName = socketMethodName

        this.listen()
    }

    public isListening() {
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

    private receiveChange(...response: readonly [eventName: Events, data: MessageData]) {
        console.log(...response)
    }

    private blockListener = (data: any) => {
        if (!(data?.event instanceof CustomEvent) || !data.event) {
            console.error('block changed but its not custom event')
            return
        }
        const { event } = data
        if (!this.validateEventDetail(event)) return
        const type = event.type as Events
        const { target, index } = event.detail as EventDetails

        //save after dom changes have been progapated to the necessary tools
        setTimeout(() => {
            target.save().then((savedData: any) => {
                if (!savedData) return

                this.socket.send(this.socketMethodName, [
                    type,
                    {
                        editorjsData: {
                            index,
                            block: savedData,
                        },
                    },
                ])
            })
        }, 0)
    }
    private validateEventDetail(ev: CustomEvent): ev is CustomEvent<EventDetails> {
        return (
            typeof ev.detail === 'object' &&
            ev.detail &&
            'index' in ev.detail &&
            typeof ev.detail.index === 'number' &&
            'target' in ev.detail &&
            typeof ev.detail.target === 'object' &&
            ev.detail.target
        )
    }
}
