# EditorJS Realtime Collaboration Plugin

A realtime collaboration plugin for [Editor.js](https://editorjs.io)
that synchronizes block changes, cursor selections, and deletion states across multiple clients using your socket implementation of choice.

[Live Demo](https://sebmeister2077.github.io/editorjs-realtime-collab/)

## Features

- ✅ Realtime block add / update / move / delete

- ✅ Inline cursor & text selection visualization

- ✅ Block-level selection + pending deletion state

- ✅ **Block locking** prevents concurrent edits to the same block

- ✅ Works with **any socket implementation**

- ✅ Type-safe TypeScript API

- ✅ Throttled updates for performance

## Installation

```shell
npm i editorjs-realtime-collab
```

## Basic Usage

```js
import EditorJS from '@editorjs/editorjs'
import RealtimeCollabPlugin from 'editorjs-realtime-collab'

const editor = new EditorJS({
    holder: 'editor',
    // other EditorJS config
})

const realtimeCollab = new RealtimeCollabPlugin({
    editor,
    socket: socketInstance,  // Should implement INeededSocketFields interface
})

// Start listening for events
realtimeCollab.listen()
```

After instantiation, the plugin is **idle** until you explicitly call `listen()`. This begins listening for:

- Editor.js block mutations
- DOM selection changes  
- Incoming socket messages

Use `realtimeCollab.unlisten()` to stop listening. Check `realtimeCollab.isListening` to inspect the current listening state.

## Socket Interface Contract

The plugin does **not** depend on Socket.IO, SignalR, or any specific library.

Your socket only needs to implement this interface:

```ts
interface NeededSocketFields {
    send(data: MessageData): void
    on(callback: (data: MessageData) => void): void
    off(): void
    connectionId: string
}
```

`connectionId`

- Must uniquely identify the current user/session

- Used to ignore self-sent updates

- Used to associate cursors & selections with users

## Configuration Options

```ts
new RealtimeCollabPlugin({
  editor,
  socket,
  blockChangeThrottleDelay?,
  blockLockDebounceTime?,
  cursor?,
  overrideStyles?,
})


```

## Config Params

| Field                               | Type                                            | Description                                              | Default              |
| ------------------------            | ----------------------------------------------- | -------------------------------------------------------- | -------------------- |
| editor                              | `EditorJS`                                      | The editorJs instance you want to listen to              | `required*`          |
| socket                              | `INeededSocketFields`                           | The socket instance (or custom method bingings)          | `required*`          |
| blockChangeThrottleDelay            | `number`                                        | Delay to throttle block changes (ms).                    | `300`                |
| blockLockDebounceTime               | `number`                                        | Delay to debounce block unlocking (ms).                  | `1500`               |
| toolsWithDataCheck                  | `string[]`                                      | Tools that need data comparison before locking           | `["table"]`          |
| cursor.color                        | `string`                                        | Color of remote cursors (set per connectionId)           | `#0d0c0f`            |
| cursor.selectionColor               | `string`                                        | Color of remote text selections (set per connectionId)   | `#0d0c0f33`          |
| overrideStyles.cursorClass          | `string`                                        | Override cursor CSS class                                | —                    |
| overrideStyles.inlineSelectionClass | `string`                                        | Override inline selection CSS class                      | —                    |
| overrideStyles.selectedClass        | `string`                                        | Override selected block class                            | —                    |
| overrideStyles.pendingDeletionClass | `string`                                        | Override delete-pending block class                      | —                    |
| overrideStyles.lockedBlockClass     | `string`                                        | Override locked block CSS class                          | —                    |

## Listening Control

You can manually control listeners as needed by calling `listen()` and `unlisten()`:

```js
// Stop listening to editor + socket + DOM
realtimeCollab.unlisten()

// Re-enable all listeners
realtimeCollab.listen()

// Check listening state
if (realtimeCollab.isListening) {
  // ...
}
```

This is useful when temporarily disabling collaboration, switching documents, or cleaning up in SPA route changes

## Block Locking

The plugin automatically locks blocks when a user starts editing them, preventing concurrent modifications by other users. This ensures data consistency and prevents editing conflicts.

### How It Works

- When a user begins editing a block, it gets **locked** and synced to all other clients
- Other users see a visual indicator on locked blocks (via CSS)
- Locked blocks are protected from remote changes until unlocked
- Blocks automatically **unlock** after a period of inactivity (debounced)
- Lock state is tied to `connectionId` — if a user disconnects, their locks are released

### Accessing Lock State

```js
// Get all currently locked blocks by external users
const locks = realtimeCollab.lockedBlocks
// [{blockId: 'abc123', connectionId: 'user-1'}, ...]

// Get the block currently being edited by this user
const myLockedBlock = realtimeCollab.currentLockedBlockId
// 'abc123' or null
```

### Configuration

Control lock timing with `blockLockDebounceTime` (default: 1500ms):

```js
new RealtimeCollabPlugin({
  editor,
  socket,
  blockLockDebounceTime: 2000, // unlock after 2s of inactivity
})
```

This prevents locks from being released too quickly during normal typing while ensuring they don't persist indefinitely.

### Handling Tools with False Lock Triggers

Some Editor.js tools (like the **table** tool) emit block change events even when the user isn't actively editing them. This can cause unnecessary block locking.

Use `toolsWithDataCheck` to specify which tools should have their actual data compared before triggering a lock:

```js
new RealtimeCollabPlugin({
  editor,
  socket,
  toolsWithDataCheck: ['table', 'customTool'], // Only lock if data actually changed
})
```

**How it works:**

- For tools in this list, the plugin compares the block's `data` and `tunes` before/after the event
- Lock is only triggered if the data actually changed
- Prevents spurious locks from tools that emit events on unrelated editor interactions
- Default includes `['table']` since it's a known culprit

**When to use:**

- You notice blocks getting locked when users aren't editing them
- A custom tool triggers change events during interactions with other blocks
- You want tighter control over lock behavior for specific tools

## Examples

### Socket.IO

```ts
import { io } from 'socket.io-client'
const socketInstance = io('wss://example.com/chat')
const connectionId = "user-id"
new RealtimeCollabPlugin({
    editor,
    socket: {
        send: (data) => socketInstance.emit('editorUpdate', data),
        on: (callback) => socketInstance.on('editorUpdate', callback),
        off: (callback) => socketInstance.off('editorUpdate', callback),
        connectionId 
    },
})
```

### Microsoft SignalR

```ts
const connection = new signalR.HubConnectionBuilder()
  .withUrl('/chat')
  .build()
const connectionId = "user-id"
connection.start().then(() => {
    new RealtimeCollabPlugin({
        editor,
        socket: {
            send: (data) => connection.send('editorUpdate', data),
            on: (callback) => connection.on('editorUpdate', callback),
            off: (callback) => connection.off('editorUpdate', callback),
            connectionId,
        },
    })
})
```

### Native WebSocket (Custom Binding)

```ts
const socket = new WebSocket('wss://example.com')

socket.addEventListener('open', async (e) => {
    const eventName = "editor-update"
    const on = (callback) => {
        socket.addEventListener('message', (e) => {
            const isSameClient = e.currentTarget === socket
            if (isSameClient) return

            const splits = e.data.split(',')
            const receivedEventName = splits[0]
            // Ignore messages that are not for this plugin
            if (eventName !== receivedEventName) return
            const data = JSON.parse(splits[1])
            callback(data)
        })
    }
    const send = ( data) => {
        socket.send([eventName, JSON.stringify(data)])
    }
    const off = () => {
        /* handle unsubscribing logic */
    }
    const connectionId = "user-id"
    new RealtimeCollabPlugin({
        editor,
        socket: {
            send,
            on,
            off,
            connectionId
        },
    })
})
```

### PieSocket Example

```ts
const pieSocket = new PieSocket.default({
    clusterId: 'free.blr2',
    apiKey: 'your-api-key',
})
const channel = await pieSocket.subscribe('channel-name')

const socket = {
    on: (cb: Function) => channel.listen('editorjs-update', (data, meta) => cb(data)),
    send: (data: Object) => channel.publish('editorjs-update', data),
    off: () => {
        /* unsubscribing logic */
    },
    connectionId: "user-id"
}

new RealtimeCollabPlugin({
    editor,
    socket,
})
```

---

### Message Types (Advanced)

Internally, data is synced using strongly typed messages that map directly to Editor.js mutations:

- Block added / removed / moved / changed

- Inline selection changes

- Block selection changes

- Pending deletion state

- **Block locked / unlocked events**

- User disconnect events

You generally **do not need to handle these manually** unless:

- You are proxying messages through a server

- You want to log or transform events

---

### Styling

The plugin injects default styles for:

- Remote cursors

- Inline selections

- Selected blocks

- Pending deletions

- **Locked blocks**

You can override any of them via `overrideStyles` or your own CSS.

**Note:** Cursor and selection colors are set individually per connection. When configuring colors dynamically, use a mapping like `colorMap[connectionId]` to assign unique colors to each user.

---

### Gotchas & Notes

- ⚠️ `connectionId` must be stable for a user session and unique across users to prevent update conflicts

- ✅ Editor content stays consistent even with rapid concurrent edits

- ✅ Self-emitted events are automatically ignored

- ✅ Use `toolsWithDataCheck` to prevent false locks from tools that emit frequent change events (like tables)
`

## Architecture Overview

### High-Level Architecture

```mermaid
graph TD
  UserA[User A<br/>Editor.js] -->|Block & Selection Events| PluginA[RealtimeCollabPlugin]
  PluginA -->|"send(MessageData)"| SocketA[Socket Adapter]
  SocketA -->|broadcast| Server[Relay Server]

  Server -->|MessageData| SocketB[Socket Adapter]
  Server -->|MessageData| SocketC[Socket Adapter]

  SocketB -->|"on(MessageData)"| PluginB[RealtimeCollabPlugin]
  SocketC -->|"on(MessageData)"| PluginC[RealtimeCollabPlugin]

  PluginB -->|Apply Mutations| UserB[User B<br/>Editor.js]
  PluginC -->|Apply Mutations| UserC[User C<br/>Editor.js]
```

### Selection & Cursor Sync

```mermaid
sequenceDiagram
  participant User
  participant EditorJS
  participant Plugin
  participant DOM
  participant Socket

  User->>DOM: Select text / move cursor
  DOM->>Plugin: SelectionChange
  Plugin->>Plugin: Calculate DOM rects
  Plugin->>Socket: send(inline-selection-change)

  Socket->>Plugin: receive(selection-change)
  Plugin->>DOM: Render fake cursor & selection
```
