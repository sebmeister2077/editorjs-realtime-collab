import EditorJS, { BlockAddedMutationType, BlockRemovedMutationType, BlockMovedMutationType, BlockChangedMutationType } from '@editorjs/editorjs';
import { type SavedData } from '@editorjs/editorjs/types/data-formats/block-data';
import { type MakeConditionalType } from './UtilityTypes';
export type GroupCollabConfigOptions<SocketMethodName extends string> = {
    editor: EditorJS;
    socket: INeededSocketFields<SocketMethodName>;
    socketMethodName: SocketMethodName;
};
export type MessageData = {
    block: SavedData;
} & (MakeConditionalType<{
    index: number;
}, typeof BlockAddedMutationType, 'type'> | MakeConditionalType<{
    blockId: string;
}, typeof BlockChangedMutationType | typeof BlockRemovedMutationType, 'type'> | MakeConditionalType<{
    fromBlockId: string;
    toBlockId: string;
}, typeof BlockMovedMutationType, 'type'>);
export type INeededSocketFields<SocketMethodName extends string> = {
    send(socketMethod: SocketMethodName, data: MessageData): void;
    on(socketMethod: SocketMethodName, data: (data: MessageData) => void): void;
    off(socketMethod: SocketMethodName): void;
};
export default class GroupCollab<SocketMethodName extends string> {
    private editor;
    private socket;
    private socketMethodName;
    private editorBlockEvent;
    private _isListening;
    private ignoreEvents;
    constructor({ editor, socket, socketMethodName }: GroupCollabConfigOptions<SocketMethodName>);
    get isListening(): boolean;
    unlisten(): void;
    listen(): void;
    private receiveChange;
    private blockListener;
    private validateEventDetail;
}
