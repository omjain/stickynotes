import { useCallback, useEffect, useState } from 'react'

import { floating, useFloatingError, useFloatingNoteId } from '../../app/floating'
import { useNoteList, useNotesStatus, useWriteError } from '../../hooks/useNotes'
import { useShortcut } from '../../hooks/useShortcut'
import { notes } from '../../stores/notes'
import type { Note } from '../../types/note'
import { StickyNote } from '../StickyNote/StickyNote'

/** How long a discarded note can be recovered before the offer disappears. */
const UNDO_WINDOW_MS = 8000

export function Workspace() {
  const list = useNoteList()
  const status = useNotesStatus()
  const writeError = useWriteError()
  const floatingId = useFloatingNoteId()
  const floatingError = useFloatingError()

  const [focusId, setFocusId] = useState<string | null>(null)
  const [touchedId, setTouchedId] = useState<string | null>(null)
  const [discarded, setDiscarded] = useState<Note | null>(null)

  const create = useCallback(() => {
    setFocusId(notes.create().id)
  }, [])

  const toggleFloat = useCallback(
    (id: string) => {
      if (floatingId === id) floating.close()
      else void floating.open(id)
    },
    [floatingId],
  )

  // F floats the note you last touched — or the newest one, if you've touched none.
  const floatCurrent = useCallback(() => {
    const target = touchedId ?? list[0]?.id
    if (target !== undefined) toggleFloat(target)
  }, [touchedId, list, toggleFloat])

  useShortcut('n', create)
  useShortcut('f', floatCurrent)

  // Discarding is instant — no dialog — so there has to be a way back.
  useEffect(() => {
    if (!discarded) return
    const timer = setTimeout(() => setDiscarded(null), UNDO_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [discarded])

  const discard = (note: Note) => {
    if (floatingId === note.id) floating.close()
    notes.remove(note.id)
    setDiscarded(note)
  }

  const undo = () => {
    if (!discarded) return
    notes.restore(discarded)
    setDiscarded(null)
  }

  return (
    <main className="desk">
      <div className="desk__bar">
        <h1 className="desk__title">Sticky notes</h1>
        <p className="desk__hint">
          <kbd>N</kbd> for a new note · <kbd>F</kbd> to float it
        </p>
        <span className="desk__spacer" />
        <button type="button" className="button" onClick={create}>
          + New note
        </button>
      </div>

      {!floating.supported && (
        <p className="notice" role="status">
          <span className="notice__title">
            Floating notes aren’t supported in this browser yet.
          </span>{' '}
          Try Chrome, Edge, or Firefox 151+. Everything else on this page works as
          normal.
        </p>
      )}

      {floatingError !== null && (
        <p className="notice" role="status">
          <span className="notice__title">Couldn’t float that note.</span>{' '}
          {floatingError}
        </p>
      )}

      {writeError !== null && (
        <p className="notice" role="status">
          <span className="notice__title">Storage problem.</span> {writeError} — your
          notes are safe in this tab, but they may not survive a reload.
        </p>
      )}

      {discarded !== null && (
        <p className="notice" role="status">
          Note discarded.{' '}
          <button type="button" className="tray-button" onClick={undo}>
            Undo
          </button>
        </p>
      )}

      <div className="desk__grid">
        {list.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            claimFocus={note.id === focusId}
            isFloating={note.id === floatingId}
            canFloat={floating.supported}
            onPatch={(patch) => notes.patch(note.id, patch)}
            onRemove={() => discard(note)}
            onFloat={() => toggleFloat(note.id)}
            onTouch={() => setTouchedId(note.id)}
          />
        ))}

        {status === 'ready' && list.length === 0 && (
          <div className="empty">
            <span className="empty__lead">Nothing on the desk yet.</span>
            <span>
              Press <kbd>N</kbd> and start typing. Begin a line with <kbd>[ ]</kbd> to
              make it a checkbox.
            </span>
          </div>
        )}
      </div>
    </main>
  )
}
