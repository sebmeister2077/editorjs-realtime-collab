import EditorJS, { type BlockAddedMutationType, type BlockRemovedMutationType, type BlockMovedMutationType, type BlockChangedMutationType } from '@editorjs/editorjs';
import { type SavedData } from '@editorjs/editorjs/types/data-formats/block-data';
import { type PickFromConditionalType, type MakeConditionalType } from './UtilityTypes';
import './index.css';
declare const UserInlineSelectionAsk = "inline-selection-request";
declare const UserInlineSelectionChangeType = "inline-selection-change";
declare const UserBlockSelectionChangeType = "block-selection-change";
declare const UserBlockDeletionChangeType = "block-deletion-change";
declare const UserDisconnectedType = "user-disconnected";
declare const UserPresencePingType = "user-presence-ping";
declare const BlockLockedType = "block-locked";
declare const BlockUnlockedType = "block-unlocked";
export type GroupCollabConfigOptions = {
    editor: EditorJS;
    socket: INeededSocketFields;
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
     * Time in ms to consider a user idle and remove their cursors and selections. This is used to prevent stale cursors/selections from users that have disconnected without triggering the disconnect event (e.g. by closing the laptop or losing internet connection).
     * @default 60_000
     */
    externalUserIdleTimeout: number;
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
export type BlockOpVersion = {
    /**
     * Monotonic per-block Lamport-clock version, used for last-write-wins conflict resolution.
     * A higher version always supersedes a lower one for the same block id.
     */
    version: number;
    /**
     * connectionId of the client that produced this op. Used as a deterministic tie-breaker when
     * two ops share the same version, so every client converges on the same winner.
     */
    origin: string;
};
export type MessageData = MakeConditionalType<{
    index: number;
    block: SavedData;
} & BlockOpVersion, typeof BlockAddedMutationType> | MakeConditionalType<{
    blockId: string;
} & BlockOpVersion, typeof BlockRemovedMutationType> | MakeConditionalType<{
    block: SavedData;
    index: number;
} & BlockOpVersion, typeof BlockChangedMutationType> | MakeConditionalType<{
    fromBlockId: string;
    toBlockIndex: number;
    toBlockId: string;
} & BlockOpVersion, typeof BlockMovedMutationType> | MakeConditionalType<UserInlineSelectionData, typeof UserInlineSelectionChangeType> | MakeConditionalType<{}, typeof UserInlineSelectionAsk> | MakeConditionalType<{
    connectionId: string;
}, typeof UserDisconnectedType> | MakeConditionalType<{
    connectionId: string;
}, typeof UserPresencePingType> | MakeConditionalType<{
    blockId: string;
    isDeletePending: boolean;
}, typeof UserBlockDeletionChangeType> | MakeConditionalType<{
    blockId: string;
    isSelected: boolean;
}, typeof UserBlockSelectionChangeType> | MakeConditionalType<LockedBlock, typeof BlockLockedType> | MakeConditionalType<LockedBlock, typeof BlockUnlockedType>;
type UserInlineSelectionData = {
    elementXPath: string;
    blockId: string;
    containerWidth: number;
    connectionId: string;
    color: string;
    selectionColor: string;
    elementNodeIndex: number;
    anchorOffset: number;
    focusOffset: number;
};
type LockedBlock = {
    blockId: string;
    connectionId: string;
};
export type INeededSocketFields = {
    send(data: MessageData): void;
    on(callback: (data: MessageData) => void): void;
    off(): void;
    connectionId: string;
};
export default class GroupCollab {
    private editor;
    private socket;
    private config;
    private _isListening;
    private _currentEditorLockingBlockId;
    private _lockedBlocks;
    private _externalUserSelections;
    private _customToolsInternalState;
    private _blockVersionClock;
    private _appliedBlockVersions;
    private ignoreEvents;
    private redactorObserver;
    private toolboxObserver;
    private editorStyleElement;
    private throttledBlockChange?;
    private throttledInlineSelectionChange?;
    private _debouncedBlockUnlockingsMap;
    private localBlockStates;
    private externalUserLastSeenMap;
    private externalUsersCleanupInterval?;
    private presencePingInterval?;
    private editorBlockEvent;
    private editorDomChangedEvent;
    private blockIdAttributeName;
    private inlineFakeCursorAttributeName;
    private inlineFakeSelectionAttributeName;
    private connectionIdAttributeName;
    constructor({ editor, socket, ...config }: GroupCollabConfigOptions);
    get isListening(): boolean;
    get lockedBlocks(): LockedBlock[];
    set lockedBlocks(value: LockedBlock[]);
    get currentLockedBlockId(): string | null;
    get externalUserSelections(): UserInlineSelectionData[];
    set externalUserSelections(value: UserInlineSelectionData[]);
    /**
     * Remove event listeners on socket and editor
     */
    unlisten(): void;
    /**
     * Start listening for events.
     */
    listen(): void;
    /**
     * Manually trigger cursor syncronization for other users. This is already called when a new user joins and wants to see other users' cursors, but can be useful in other edge cases as well.
     */
    syncExternalCursors(): void;
    getSelectionAsData(): PickFromConditionalType<MessageData, typeof UserInlineSelectionChangeType> | null;
    private get CSS();
    private get EditorCSS();
    private handleMutation;
    private handleToolboxMutation;
    private onInlineSelectionChange;
    private onDisconnect;
    private onVisibilityChange;
    private onWindowFocus;
    private onWindowBlur;
    private onReceiveChange;
    private onEditorBlockEvent;
    private setupThrottledEmiters;
    private emptyThrottledEmiters;
    private debouncedBlockUnlocking;
    private getFakeCursors;
    private createFakeCursor;
    private getFakeSelections;
    private createSelectionElement;
    private static readonly SAFE_ID_PATTERN;
    private isSafeId;
    /**
     * Remote block ids and connection ids are interpolated into attribute/CSS selectors (e.g. querySelector).
     * Validating them against a conservative character set on receipt prevents selector breakage/injection
     * from a malformed or malicious peer.
     */
    private hasValidRemoteIds;
    /**
     * Allocate the next monotonic version for a locally-produced op on `blockId` and record it as
     * applied (our own edit is already reflected in our editor). The version is derived from the
     * Lamport clock, so it always outranks anything we have previously observed for that block.
     */
    private nextBlockVersion;
    /** Advance the Lamport clock so our next local edit outranks an observed remote version. */
    private observeBlockVersion;
    /**
     * Decide whether an incoming remote op for `blockId` should be applied, using (version, origin)
     * as a total order so concurrent edits converge on the same winner across all clients. When the
     * op wins, its version is recorded as applied. Ops lacking a numeric version (e.g. from an older
     * peer) are always applied to preserve backwards compatibility.
     */
    private acceptRemoteBlockVersion;
    private markExternalUserSeen;
    private startExternalUserInactivityTracking;
    private stopPreviousExternalUserInactivityTracking;
    private cleanupStaleExternalUsers;
    private startPresencePing;
    private stopPreviousPresencePing;
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
    private renderExternalUserSelections;
    private selectionsAreEqual;
    private renderSingleExternalSelection;
    private compareToolsData;
    private initializeCustomToolsState;
    private setupStyleElement;
    private getContentAndBlockIdFromNode;
    private getBoundingClientRectForSelection;
    private isNodeInsideOfEditor;
    private getElementXPath;
    private getNodeRelativeChildIndex;
    private applyNeccessaryChanges;
}
export {};
