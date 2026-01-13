import EditorJS, { type BlockAddedMutationType, type BlockRemovedMutationType, type BlockMovedMutationType, type BlockChangedMutationType } from '@editorjs/editorjs';
import { type SavedData } from '@editorjs/editorjs/types/data-formats/block-data';
import { type MakeConditionalType } from './UtilityTypes';
import './index.css';
declare const UserInlineSelectionChangeType = "inline-selection-change";
declare const UserBlockSelectionChangeType = "block-selection-change";
declare const UserBlockDeletionChangeType = "block-deletion-change";
declare const UserDisconnectedType = "user-disconnected";
export type GroupCollabConfigOptions<SocketMethodName extends string> = {
    editor: EditorJS;
    socket: INeededSocketFields<SocketMethodName>;
    /**
     * Name of the socket event.
     * @default 'editorjs-update'
     */
    socketMethodName?: SocketMethodName;
} & Partial<LocalConfig>;
type LocalConfig = {
    /**
     * Delay to throttle block changes. Value is in ms
     * @default 300
     */
    blockChangeThrottleDelay: number;
    cursor?: {
        color?: string;
    };
    overrideStyles?: {
        cursorClass?: string;
        selectedClass?: string;
        pendingDeletionClass?: string;
    };
};
export type MessageData = MakeConditionalType<{
    index: number;
    block: SavedData;
}, typeof BlockAddedMutationType> | MakeConditionalType<{
    blockId: string;
}, typeof BlockRemovedMutationType> | MakeConditionalType<{
    block: SavedData;
    index: number;
}, typeof BlockChangedMutationType> | MakeConditionalType<{
    fromBlockId: string;
    toBlockIndex: number;
    toBlockId: string;
}, typeof BlockMovedMutationType> | MakeConditionalType<{
    elementXPath: string | null;
    blockId: string;
    rects: Rect[];
    containerWidth: number;
    connectionId: string;
}, typeof UserInlineSelectionChangeType> | MakeConditionalType<{
    connectionId: string;
}, typeof UserDisconnectedType> | MakeConditionalType<{
    blockId: string;
    isDeletePending: boolean;
}, typeof UserBlockDeletionChangeType> | MakeConditionalType<{
    blockId: string;
    isSelected: boolean;
}, typeof UserBlockSelectionChangeType>;
type Rect = Pick<DOMRect, 'top' | 'left' | 'width'>;
export type INeededSocketFields<SocketMethodName extends string> = {
    send(socketMethod: SocketMethodName, data: MessageData): void;
    on(socketMethod: SocketMethodName, callback: (data: MessageData) => void): void;
    off(socketMethod: SocketMethodName): void;
    connectionId: string;
};
export default class GroupCollab<SocketMethodName extends string> {
    private editor;
    private socket;
    private socketMethodName;
    private editorBlockEvent;
    private editorDomChangedEvent;
    private _isListening;
    private ignoreEvents;
    private redactorObserver;
    private toolboxObserver;
    private throttledBlockChange?;
    private throttledInlineSelectionChange?;
    private localBlockStates;
    private blockIdAttributeName;
    private inlineFakeCursorAttributeName;
    private inlineFakeSelectionAttributeName;
    private config;
    constructor({ editor, socket, socketMethodName, ...config }: GroupCollabConfigOptions<SocketMethodName>);
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
    private handleToolboxMutation;
    private onInlineSelectionChange;
    private onDisconnect;
    private onReceiveChange;
    private onEditorBlockEvent;
    private initBlockAndSelectionChangeListeners;
    private getFakeCursor;
    private createFakeCursor;
    private getFakeSelections;
    private validateEventDetail;
    private addBlockToIgnoreListUntilNextRender;
    private addBlockToIgnorelist;
    private removeBlockFromIgnorelist;
    private getDOMBlockById;
    private getRedactor;
    private getContentAndBlockIdFromNode;
    private isNodeInsideOfEditor;
    private getElementXPath;
    private getNodeRelativeChildIndex;
    private applyNeccessaryChanges;
    private calculateRelativeRects;
    private createSelectionElement;
}
export {};
