# EditorJS Realtime Plugin

Realtime plugin for [Editor.js](https://editorjs.io).

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

## Config Params (optional)

| Field                    | Type             | Description                                              | Default           |
| ------------------------ | ---------------- | -------------------------------------------------------- | ----------------- |
| editor                   | `EditorJS`       | The editorJs instance you want to listen to              | `-`               |
| socket                   | `SocketInstance` | The socket instance (or custom implementation)           | `-`               |
| socketMethodName         | `string`         | The event name to use when communicating between sockets | `editorjs-update` |
| blockChangeThrottleDelay | `number`         | Delay to throttle block changes (ms).                    | `300`             |
