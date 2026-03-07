import { useEffect, useRef, useState, useCallback } from 'react'
import EditorJS, { OutputData } from '@editorjs/editorjs'
import Header from '@editorjs/header'
import Table from '@editorjs/table'
import RealtimeCollab from './realtimeCollab.ts'
import type { INeededSocketFields, MessageData } from 'editorjs-realtime-collab'
import "./realtime.css"

// Create an in-memory socket implementation for local cross-editor sync
class LocalSocketBridge {
  private static listeners: Map<string, (data: MessageData) => void> = new Map()
  public connectionId: string

  constructor(connectionId: string) {
    this.connectionId = connectionId
  }

  send(data: MessageData): void {
    // Broadcast to all other connections
    LocalSocketBridge.listeners.forEach((callback, id) => {
      if (id !== this.connectionId) {
        callback(data)
      }
    })
  }

  on(callback: (data: MessageData) => void): void {
    LocalSocketBridge.listeners.set(this.connectionId, callback)
  }

  off(): void {
    LocalSocketBridge.listeners.delete(this.connectionId)
  }
}

// Color palette for editor cursors
const CURSOR_COLORS = [
  { color: '#3b82f6', selectionColor: '#3b82f688', name: 'Blue' },
  { color: '#ef4444', selectionColor: '#ef444488', name: 'Red' },
  { color: '#10b981', selectionColor: '#10b98188', name: 'Green' },
  { color: '#f59e0b', selectionColor: '#f59e0b88', name: 'Amber' },
  { color: '#8b5cf6', selectionColor: '#8b5cf688', name: 'Purple' },
  { color: '#ec4899', selectionColor: '#ec489988', name: 'Pink' },
  { color: '#06b6d4', selectionColor: '#06b6d488', name: 'Cyan' },
  { color: '#f97316', selectionColor: '#f9731688', name: 'Orange' },
]

interface EditorInstance {
  id: string
  ref: React.RefObject<HTMLDivElement>
  editorInstance: EditorJS | null
  collabInstance: RealtimeCollab | null
  colorIndex: number
  isReady: boolean
}

// Initial data with explicit block IDs (shared between all editors)
const getInitialData = (): OutputData => ({
  time: Date.now(),
  blocks: [
    {
      id: 'block-1',
      type: 'paragraph',
      data: {
        text: 'Welcome to the collaborative editor! Start typing in any editor.'
      }
    },
    {
      id: 'block-2',
      type: 'paragraph',
      data: {
        text: 'Changes will sync in real-time between all editors.'
      }
    }
  ],
  version: '2.29.0'
})

function App() {
  const [editors, setEditors] = useState<EditorInstance[]>([
    { id: 'editor-1', ref: { current: null }, editorInstance: null, collabInstance: null, colorIndex: 0, isReady: false },
    { id: 'editor-2', ref: { current: null }, editorInstance: null, collabInstance: null, colorIndex: 1, isReady: false },
  ])
  const [throttleDelay, setThrottleDelay] = useState(300)
  const editorsMapRef = useRef<Map<string, EditorInstance>>(new Map())
  const nextEditorIdRef = useRef(3)
  const initialDataRef = useRef<OutputData>(getInitialData())

  const addNewEditor = useCallback(() => {
    const newEditorId = `editor-${nextEditorIdRef.current}`
    nextEditorIdRef.current++
    
    const newEditor: EditorInstance = {
      id: newEditorId,
      ref: { current: null },
      editorInstance: null,
      collabInstance: null,
      colorIndex: (nextEditorIdRef.current - 1) % CURSOR_COLORS.length,
      isReady: false
    }
    
    setEditors(prev => [...prev, newEditor])
  }, [])

  const removeEditor = useCallback((editorId: string) => {
    const editorToRemove = editorsMapRef.current.get(editorId)
    if (editorToRemove) {
      // Cleanup
      if (editorToRemove.collabInstance) {
        editorToRemove.collabInstance.unlisten()
      }
      if (editorToRemove.editorInstance) {
        editorToRemove.editorInstance.destroy?.()
      }
      editorsMapRef.current.delete(editorId)
    }
    
    setEditors(prev => prev.filter(e => e.id !== editorId))
  }, [])

  const updateThrottleDelay = useCallback(async (newDelay: number) => {
    setThrottleDelay(newDelay)
    
    // Recreate collab instances for all editors with new delay
    const editorsToUpdate = Array.from(editorsMapRef.current.values())
    
    for (const editor of editorsToUpdate) {
      if (editor.collabInstance && editor.editorInstance) {
        // Unlisten and remove old collab instance
        editor.collabInstance.unlisten()
        
        // Create new socket and collab instance
        const colors = CURSOR_COLORS[editor.colorIndex]
        const socket: INeededSocketFields = new LocalSocketBridge(editor.id)
        
        const newCollabInstance = new RealtimeCollab({
          editor: editor.editorInstance,
          socket,
          blockChangeThrottleDelay: newDelay,
          toolsWithDataCheck: ['table'],
          cursor: {
            color: colors.color,
            selectionColor: colors.selectionColor
          }
        })
        
        // Update the editor instance
        editor.collabInstance = newCollabInstance
        editorsMapRef.current.set(editor.id, editor)
        
        // Start listening with new instance
        newCollabInstance.listen()
      }
    }
    
    console.log(`Updated throttle delay to ${newDelay}ms for all editors`)
  }, [])

  const initializeEditor = useCallback(async (editor: EditorInstance, element: HTMLDivElement, delay: number) => {
    if (editor.editorInstance || !element) return

    const colors = CURSOR_COLORS[editor.colorIndex]
    
    const editorInstance = new EditorJS({
      holder: element,
      placeholder: `Start typing in ${editor.id}...`,
      data: initialDataRef.current,
      tools: {
        header: {
          class: Header as any,
          config: {
            placeholder: 'Enter a header',
            levels: [1, 2, 3, 4, 5, 6],
            defaultLevel: 2
          }
        },
        table: {
          class: Table as any,
          inlineToolbar: true,
          config: {
            rows: 2,
            cols: 3,
          }
        }
      },
      onReady: async () => {
        // Create socket
        const socket: INeededSocketFields = new LocalSocketBridge(editor.id)

        // Initialize collaboration plugin
        const collabInstance = new RealtimeCollab({
            editor: editorInstance,
            socket,
            blockChangeThrottleDelay: delay,
            toolsWithDataCheck: ['table'],
            cursor: {
                color: colors.color,
                selectionColor: colors.selectionColor
            }
        })

        // Update the editor instance in the map
        editor.editorInstance = editorInstance
        editor.collabInstance = collabInstance
        editor.isReady = true
        editorsMapRef.current.set(editor.id, editor)

        // Start listening
        collabInstance.listen()
        console.log(`${editor.id} collaboration started`)

        // Trigger re-render to show ready status
        setEditors(prev => prev.map(e => 
          e.id === editor.id ? { ...e, isReady: true } : e
        ))
      }
    })

    editor.editorInstance = editorInstance
  }, [])

  useEffect(() => {
    // Initialize editors when refs become available
    editors.forEach(editor => {
      if (editor.ref.current && !editor.editorInstance) {
        initializeEditor(editor, editor.ref.current, throttleDelay)
      }
    })
  }, [editors, initializeEditor, throttleDelay])

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      editorsMapRef.current.forEach(editor => {
        if (editor.collabInstance) {
          editor.collabInstance.unlisten()
        }
        if (editor.editorInstance) {
          editor.editorInstance.destroy?.()
        }
      })
      editorsMapRef.current.clear()
    }
  }, [])

  const allReady = editors.every(e => e.isReady)

  return (
    <div>
          <h1 style={{
          textAlign: 'center',
          marginBottom: '30px'
      }}>EditorJS Realtime Collaboration Demo</h1>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' }}>
          <button
            onClick={addNewEditor}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            + Add New Editor
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="throttle-delay" style={{ fontSize: '14px', color: '#666' }}>
              Update Delay:
            </label>
            <select
              id="throttle-delay"
              value={throttleDelay}
              onChange={(e) => updateThrottleDelay(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #d0d0d0',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              <option value={0}>0ms (instant)</option>
              <option value={50}>50ms</option>
              <option value={150}>150ms</option>
              <option value={300}>300ms (default)</option>
              <option value={800}>800ms</option>
            </select>
          </div>
        </div>
        {allReady && editors.length > 0 && (
          <div style={{ marginTop: '10px', color: '#4ade80', fontSize: '14px' }}>
            ✓ {editors.length} editor(s) active
          </div>
        )}
      </div>
      <div className="editors-container">
        {editors.map((editor) => {
          const colors = CURSOR_COLORS[editor.colorIndex]
          return (
            <div key={editor.id} className="editor-wrapper">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ margin: 0 }}>
                  {editor.id} <span style={{ color: colors.color, fontSize: '14px' }}>({colors.name} cursor)</span>
                </h2>
                {editor.id !== 'editor-1' && editor.id !== 'editor-2' && (
                  <button
                    onClick={() => removeEditor(editor.id)}
                    style={{
                      padding: '5px 10px',
                      fontSize: '12px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div ref={editor.ref} className="editor"></div>
            </div>
          )
        })}
      </div>
      <div className="info">
        <p>All editors are synchronized using editorjs-realtime-collab. Try typing, selecting text, or adding/removing blocks!</p>
        <p style={{ fontSize: '12px', marginTop: '10px' }}>Features: Block locking, cursor visualization, text selection sync</p>
      </div>
    </div>
  )
}

export default App
