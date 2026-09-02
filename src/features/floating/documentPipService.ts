import { createStore } from 'zustand/vanilla'

import type {
  FloatingState,
  FloatingWindowService,
  WindowMount,
} from './FloatingWindowService'

/** A sticky note's worth of window. Chrome may clamp these. */
const WIDTH = 320
const HEIGHT = 380

type RequestOptions = {
  width?: number
  height?: number
  disallowReturnToOpener?: boolean
  preferInitialWindowPlacement?: boolean
}

type DocumentPictureInPicture = {
  readonly window: Window | null
  requestWindow(options?: RequestOptions): Promise<Window>
}

/** Typed by hand rather than augmenting the global `Window`, so this compiles
 *  the same whether or not the installed DOM lib has caught up with the spec. */
function pip(): DocumentPictureInPicture | undefined {
  return (window as unknown as { documentPictureInPicture?: DocumentPictureInPicture })
    .documentPictureInPicture
}

export function createDocumentPipService(mount: WindowMount): FloatingWindowService {
  const store = createStore<FloatingState>(() => ({ noteId: null, error: null }))
  const supported = typeof window !== 'undefined' && 'documentPictureInPicture' in window

  let teardown: (() => void) | undefined
  let opening = false

  function forget() {
    teardown?.()
    teardown = undefined
    store.setState({ noteId: null })
  }

  async function open(noteId: string) {
    const api = pip()
    if (!api) {
      store.setState({ error: 'This browser has no floating windows.' })
      return
    }

    // A tab gets exactly one Picture-in-Picture window. Floating a second note
    // therefore swaps what the existing window shows — which is also the nicer
    // behaviour, since the window keeps the size and place the user put it.
    const existing = api.window
    if (existing && !existing.closed) {
      store.setState({ noteId, error: null })
      return
    }

    if (opening) return
    opening = true
    try {
      // Nothing may be awaited before requestWindow: the call has to run inside
      // the user gesture that triggered it or the promise rejects.
      const created = await api.requestWindow({ width: WIDTH, height: HEIGHT })
      store.setState({ noteId, error: null })
      teardown = mount.mount(created.document)
      // Fires whether the user closed the window or `close()` did.
      created.addEventListener('pagehide', forget, { once: true })
    } catch (error) {
      store.setState({
        noteId: null,
        error: error instanceof Error ? error.message : 'Could not open a floating window.',
      })
    } finally {
      opening = false
    }
  }

  function close() {
    const created = pip()?.window
    if (created && !created.closed) created.close()
    else forget()
  }

  return { supported, store, open, close }
}
