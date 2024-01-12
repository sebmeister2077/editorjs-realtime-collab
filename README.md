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
    socket: socketInstance,
    // name of the socket event, defaults to 'editorjs-update'
    socketMethodName: 'yourNameOfChoice',
})
```

## If your socket does not have the exact interface names & types you can always custom bind your socket

```ts
// Socket.io example

const socket = io('wss://example.com/chat')

new GroupCollab({
    editor,
    socket,
})

// Microsoft signalR
const connection = new signalR.HubConnectionBuilder().withUrl('/chat').build()

connection.start().then(() => {
    new GroupCollab({
        editor,
        socket: connection,
    })
})

// Pie Socket example (interface doesn't match your socket)
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
}

new RealtimeCollabPlugin({
    editor,
    socket,
})
```

## Config Params

| Field                    | Type             | Description                                              | Default           |
| ------------------------ | ---------------- | -------------------------------------------------------- | ----------------- |
| editor                   | `EditorJS`       | The editorJs instance you want to listen to              | `-`               |
| socket                   | `SocketInstance` | The socket instance (or custom implementation)           | `-`               |
| socketMethodName         | `string`         | The event name to use when communicating between sockets | `editorjs-update` |
| blockChangeThrottleDelay | `number`         | Delay to throttle block changes (ms).                    | `300`             |
