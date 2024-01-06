import EditorJS, { type BlockMutationEventMap, BlockAPI } from '@editorjs/editorjs';
export type GroupCollabConfigOptions<SocketMethodName extends string> = {
    editor: EditorJS;
    socket: INeededSocketFields<SocketMethodName>;
    socketMethodName: SocketMethodName;
};
export type MessageData = {
    editorjsData: EventDetails;
};
type EventDetails = {
    index: number;
    target: Pick<BlockAPI, 'name' | 'id' | 'selected'>;
};
type Events = keyof BlockMutationEventMap;
export type INeededSocketFields<SocketMethodName extends string> = {
    send(socketMethod: SocketMethodName, data: readonly [eventName: Events, message: MessageData]): void;
    on(socketMethod: SocketMethodName, data: (data: readonly [eventName: Events, message: MessageData]) => void): void;
};
export default class GroupCollab<SocketMethodName extends string> {
    private editor;
    private socket;
    private socketMethodName;
    constructor({ editor, socket, socketMethodName }: GroupCollabConfigOptions<SocketMethodName>);
    destroy(): void;
    private receiveChange;
    private validateEventDetail;
}
export {};
