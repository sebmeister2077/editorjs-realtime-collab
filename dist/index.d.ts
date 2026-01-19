import EditorJS, { type BlockAddedMutationType, type BlockRemovedMutationType, type BlockMovedMutationType, type BlockChangedMutationType } from '@editorjs/editorjs';
import { type SavedData } from '@editorjs/editorjs/types/data-formats/block-data';
import { type MakeConditionalType } from './UtilityTypes';
import './index.css';
declare const UserInlineSelectionChangeType = "inline-selection-change";
declare const UserBlockSelectionChangeType = "block-selection-change";
declare const UserBlockDeletionChangeType = "block-deletion-change";
declare const UserDisconnectedType = "user-disconnected";
declare const BlockLockedType = "block-locked";
declare const BlockUnlockedType = "block-unlocked";
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
    /**
     * Time to debounce block locking. Value is in ms
     * @default 1500
     */
    blockLockDebounceTime: number;
    /**
     * For example the table tool triggers block changes even if the emitting user does not even interact with the block, which would also emit a locking event.
     * In such cases you can add the tool's name here to enable checking its data for changes before locking that block. Only `data` and `tunes` are checked to be changed.
     * @default ["table"]
    */
    toolsWithDataCheck: string[];
    cursor?: {
        color?: string;
        selectionColor?: string;
    };
    overrideStyles?: {
        cursorClass?: string;
        selectedClass?: string;
        inlineSelectionClass?: string;
        pendingDeletionClass?: string;
        lockedBlockClass?: string;
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
    elementXPath: string;
    blockId: string;
    rects: Rect[];
    containerWidth: number;
    connectionId: string;
    color: string;
    selectionColor: string;
    elementNodeIndex: number;
    anchorOffset: number;
    focusOffset: number;
}, typeof UserInlineSelectionChangeType> | MakeConditionalType<{
    connectionId: string;
}, typeof UserDisconnectedType> | MakeConditionalType<{
    blockId: string;
    isDeletePending: boolean;
}, typeof UserBlockDeletionChangeType> | MakeConditionalType<{
    blockId: string;
    isSelected: boolean;
}, typeof UserBlockSelectionChangeType> | MakeConditionalType<LockedBlock, typeof BlockLockedType> | MakeConditionalType<LockedBlock, typeof BlockUnlockedType>;
type Rect = Pick<DOMRect, 'top' | 'left' | 'width'>;
type LockedBlock = {
    blockId: string;
    connectionId: string;
};
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
    private config;
    private _isListening;
    private _currentEditorLockingBlockId;
    private _lockedBlocks;
    private _customToolsInternalState;
    private ignoreEvents;
    private redactorObserver;
    private toolboxObserver;
    private editorStyleElement;
    private throttledBlockChange?;
    private throttledInlineSelectionChange?;
    private _debouncedBlockUnlockingsMap;
    private localBlockStates;
    private editorBlockEvent;
    private editorDomChangedEvent;
    private blockIdAttributeName;
    private inlineFakeCursorAttributeName;
    private inlineFakeSelectionAttributeName;
    private connectionIdAttributeName;
    constructor({ editor, socket, socketMethodName, ...config }: GroupCollabConfigOptions<SocketMethodName>);
    get isListening(): boolean;
    get lockedBlocks(): LockedBlock[];
    set lockedBlocks(value: LockedBlock[]);
    get currentLockedBlockId(): string | null;
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
    private setupThrottledListeners;
    private debouncedBlockUnlocking;
    private getFakeCursor;
    private createFakeCursor;
    private getFakeSelections;
    private createSelectionElement;
    private validateEventDetail;
    private addBlockToIgnoreListUntilNextRender;
    private addBlockToIgnorelist;
    private removeBlockFromIgnorelist;
    private addStyleToDOM;
    private removeStyleFromDOM;
    private stringifyStyles;
    private getDOMBlockById;
    private getRedactor;
    private getEditorHolder;
    private renderLockedBlocks;
    private compareToolsData;
    private initializeCustomToolsState;
    private setupStyleElement;
    private getContentAndBlockIdFromNode;
    private getBoundingClientRectForSelection;
    private isNodeInsideOfEditor;
    private getElementXPath;
    private getNodeRelativeChildIndex;
    private applyNeccessaryChanges;
    private calculateRelativeRects;
}
export {};
