export const TEMP_ENVIRONMENT_URL = 'http://127.0.0.1:5500/cypress-tests.html'

export const EDITOR_CLASSES = {
    ToolbarSettings: "ce-toolbar__settings-btn",
    BaseBlock: "ce-block",
    ToolbarIndentRoot: "ce-popover-indent-item",
} as const;

export const HOLDERS = {
    holder1: "holder1",
    holder2: "holder2",
    getAllHolders() {
        return [this.holder1, this.holder2]
    }
} as const