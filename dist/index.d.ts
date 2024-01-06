import EditorJS, { type BlockMutationEventMap } from '@editorjs/editorjs';
import { type SavedData } from '@editorjs/editorjs/types/data-formats/block-data';
export type GroupCollabConfigOptions<SocketMethodName extends string> = {
    editor: EditorJS;
    socket: INeededSocketFields<SocketMethodName>;
    socketMethodName: SocketMethodName;
};
export type MessageData = {
    editorjsData: {
        index: number;
        block: SavedData;
    };
};
type Events = keyof BlockMutationEventMap;
export type INeededSocketFields<SocketMethodName extends string> = {
    send(socketMethod: SocketMethodName, data: readonly [eventName: Events, message: MessageData]): void;
    on(socketMethod: SocketMethodName, data: (...data: readonly [eventName: Events, message: MessageData]) => void): void;
    off(socketMethod: SocketMethodName): void;
};
export default class GroupCollab<SocketMethodName extends string> {
    private editor;
    private socket;
    private socketMethodName;
    private editorBlockEvent;
    private _isListening;
    constructor({ editor, socket, socketMethodName }: GroupCollabConfigOptions<SocketMethodName>);
    isListening(): boolean;
    unlisten(): void;
    listen(): void;
    private receiveChange;
    private blockListener;
    private validateEventDetail;
}
export {};
