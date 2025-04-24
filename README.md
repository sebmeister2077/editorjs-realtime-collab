# EditorJS Realtime Plugin

Realtime plugin for [Editor.js](https://editorjs.io).

You can check out this
[Demo](https://sebmeister2077.github.io/editorjs-realtime-collab/)

## Instalation

```shell
npm i editorjs-realtime-collab
```

## Usage

```js
import EditorJS from '@editorjs/editorjs'
import RealtimeCollabPlugin from 'editorjs-realtime-collab'

const editor = new EditorJS({
    //...
})

const realtimeCollab = new RealtimeCollabPlugin({
    editor,
    socket: socketInstance, // & connectionId
    // name of the socket event, defaults to 'editorjs-update'
    socketMethodName: 'yourNameOfChoice',
})
```

And now the plugin automatically starts listening for any events

## Manually listen and unlisten to the editor events

```js
// remove all listeners (socket, editor, document)
realtimeCollab.unlisten()

// manually re-add all listeners
realtimeCollab.listen()

//check for internal listening state if needed
if (realtimeCollab.isListening) {
    /*...*/
}
```

## Examples

```ts
// Socket.io example

const socket = io('wss://example.com/chat')

new GroupCollab({
    editor,
    socket,
})

// Microsoft signalR
const connection = new signalR.HubConnectionBuilder().withUrl('/chat').build()
const connectionId="userId"
connection.start().then(() => {
    new GroupCollab({
        editor,
        socket: {...connection, connectionId},
    })
})
```

If your socket does not have the exact interface names & types you can always custom bind your socket

```ts
// Native Browser WebSocket
const socket = new WebSocket('socket url')

socket.addEventListener('open', async (e) => {
    const on = (eventName, callback) => {
        socket.addEventListener('message', (e) => {
            const isSameClient = e.currentTarget === socket
            if (isSameClient) return

            const splits = e.data.split(',')
            const receivedEventName = splits[0]
            if (eventName !== receivedEventName) return
            const data = JSON.parse(splits[1])
            callback(data)
        })
    }
    const send = (eventName, data) => {
        socket.send([eventName, JSON.stringify(data)])
    }
    const off = (eventName) => {
        /* handle unsubscribing logic */
    }
    const connectionId="..."
    const groupCollab = new RealtimeCollabPlugin({
        editor,
        socket: {
            send,
            on,
            off,
            connectionId
        },
    })
})

// Pie Socket example
const pieSocket = new PieSocket.default({
    clusterId: 'free.blr2',
    apiKey: 'api key',
})
const channel = await pieSocket.subscribe('channel-name')
const send = (name: string, data: Object) => {
    channel.publish(name, data)
}
const on = (name: string, cb: Function) => {
    channel.listen(name, (data, meta) => {
        cb(data)
    })
}
const socket = {
    on,
    send,
    off: () => {
        /* unsubscribing logic */
    },
    connectionId:"user id or whatever"
}

new RealtimeCollabPlugin({
    editor,
    socket,
})
```

## Config Params

| Field                    | Type                                            | Description                                              | Default              |
| ------------------------ | ----------------------------------------------- | -------------------------------------------------------- | -------------------- |
| editor                   | `EditorJS`                                      | The editorJs instance you want to listen to              | `required*`          |
| socket                   | `Object`                                        | The socket instance (or custom method bingings)          | `required*`          |
| socketMethodName         | `string`                                        | The event name to use when communicating between sockets | `editorjs-update`    |
| blockChangeThrottleDelay | `number`                                        | Delay to throttle block changes (ms).                    | `300`                |
| cursor                   | `{ color: string }`                             | Cursor configuration                                     | `{ color: #0d0c0f }` |
| overrideStyles           | `{ cursorClass: string; selectedClass:string; pendingDeletionClass: string }` | Class overrides                                          | `{}`                 |
