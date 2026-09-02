import { createRoot } from 'react-dom/client'
import { useStore } from 'zustand'

import { FloatingNote } from '../components/FloatingNote/FloatingNote'
import { createDocumentPipService } from '../features/floating/documentPipService'
import { adoptStyles, FLOATING_STYLES } from '../lib/styles'
import { notes } from '../stores/notes'

/**
 * Where the floating window is wired up.
 *
 * The service knows nothing about React; this module gives it a way to render.
 * A second React root is created inside the Picture-in-Picture document rather
 * than portalling into it: the floating note is a different layout, teardown is
 * a single `unmount()`, and it is the same shape a native window would need.
 *
 * Both roots read the same vanilla stores by direct reference — the two windows
 * share one JavaScript realm, so no messages, no serialization, and no second
 * copy of the note logic.
 */
export const floating = createDocumentPipService({
  mount(doc) {
    adoptStyles(doc, FLOATING_STYLES)
    doc.title = 'Sticky note'

    const host = doc.createElement('div')
    host.className = 'floating-root'
    doc.body.append(host)

    const root = createRoot(host)
    root.render(<FloatingRoot />)

    return () => {
      root.unmount()
      host.remove()
      // The window is going away; anything typed in it is written now.
      void notes.flush()
    }
  },
})

export function useFloatingNoteId(): string | null {
  return useStore(floating.store, (state) => state.noteId)
}

export function useFloatingError(): string | null {
  return useStore(floating.store, (state) => state.error)
}

function FloatingRoot() {
  const noteId = useFloatingNoteId()
  const note = useStore(notes.store, (state) =>
    noteId === null
      ? undefined
      : state.notes.find((candidate) => candidate.id === noteId),
  )

  if (!note) {
    return <p className="floating__gone">This note is no longer on the desk.</p>
  }

  return (
    <FloatingNote
      note={note}
      onPatch={(patch) => notes.patch(note.id, patch)}
      onClose={() => floating.close()}
    />
  )
}
