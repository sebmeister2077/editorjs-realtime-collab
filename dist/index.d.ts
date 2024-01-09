import EditorJS, { BlockAddedMutationType, BlockRemovedMutationType, BlockMovedMutationType, BlockChangedMutationType } from '@editorjs/editorjs';
import { type SavedData } from '@editorjs/editorjs/types/data-formats/block-data';
import { type MakeConditionalType } from './UtilityTypes';
declare const UserInlineSelectionChangeType = "inline-selection-change";
declare const UserBlockSelectionChangeType = "block-selection-change";
export type GroupCollabConfigOptions<SocketMethodName extends string> = {
    editor: EditorJS;
    socket: INeededSocketFields<SocketMethodName>;
    /**
     * Name of the socket event.
     * @default 'editorjs-update'
     */
    socketMethodName: SocketMethodName;
    /**
     * Delay to throttle block changes. Value is in ms
     * @default 300
     */
    blockChangeThrottleDelay?: number;
};
export type MessageData = MakeConditionalType<{
    index: number;
    block: SavedData;
}, typeof BlockAddedMutationType> | MakeConditionalType<{
    blockId: string;
}, typeof BlockRemovedMutationType, 'type'> | MakeConditionalType<{
    block: SavedData;
    index: number;
}, typeof BlockChangedMutationType> | MakeConditionalType<{
    fromBlockId: string;
    toBlockId: string;
}, typeof BlockMovedMutationType> | MakeConditionalType<{
    elementXPath: string;
    elementNodeIndex: number;
    anchorOffset: number;
    focusOffset: number;
}, typeof UserInlineSelectionChangeType> | MakeConditionalType<{
    blockId: string;
    isSelected: boolean;
}, typeof UserBlockSelectionChangeType>;
export type INeededSocketFields<SocketMethodName extends string> = {
    send(socketMethod: SocketMethodName, data: MessageData): void;
    on(socketMethod: SocketMethodName, callback: (data: MessageData) => void): void;
    off(socketMethod: SocketMethodName): void;
};
export default class GroupCollab<SocketMethodName extends string> {
    private editor;
    private socket;
    private socketMethodName;
    private editorBlockEvent;
    private editorDomChangedEvent;
    private _isListening;
    private ignoreEvents;
    private blockChangeThrottleDelay;
    private observer;
    private localBlockStates;
    private blockIdAttributeName;
    constructor({ editor, socket, socketMethodName, blockChangeThrottleDelay }: GroupCollabConfigOptions<SocketMethodName>);
    get isListening(): boolean;
    /**
     * Remove event listeners on socket and editor
     */
    unlisten(): void;
    /**
     * Start listening for events.
     */
    listen(): void;
    private get CSS();
    private get EditorCSS();
    private handleMutation;
    private onInlineSelectionChange;
    private onReceiveChange;
    private onEditorBlockEvent;
    private initBlockChangeListener;
    private handleBlockChange?;
    private validateEventDetail;
    private addBlockToIgnoreListUntilNextRender;
    private addBlockToIgnorelist;
    private removeBlockFromIgnorelist;
    private getDOMBlockById;
    private isNodeInsideOfEditor;
    private getElementXPath;
    private getNodeRelativeChildIndex;
}
export {};
