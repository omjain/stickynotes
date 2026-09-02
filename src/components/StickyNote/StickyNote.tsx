import { useEffect, useRef, type CSSProperties } from 'react'

import type { NotePatch } from '../../features/notes/domain'
import { tiltFor } from '../../lib/tilt'
import type { Note } from '../../types/note'
import { PaperEditor, type PaperEditorHandle } from '../NoteEditor/PaperEditor'
import { ColorDots } from '../UI/ColorDots'
import { PinIcon } from '../UI/PinIcon'

type Props = {
  note: Note
  onPatch: (patch: NotePatch) => void
  onRemove: () => void
  onFloat: () => void
  onTouch: () => void
  /** True while this note is the one out in the floating window. */
  isFloating?: boolean
  canFloat?: boolean
  /** True for a just-created note, so typing can begin immediately. */
  claimFocus?: boolean
}

export function StickyNote({
  note,
  onPatch,
  onRemove,
  onFloat,
  onTouch,
  isFloating = false,
  canFloat = true,
  claimFocus = false,
}: Props) {
  const titleRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<PaperEditorHandle>(null)

  useEffect(() => {
    if (claimFocus) titleRef.current?.focus()
  }, [claimFocus])

  return (
    <article
      className={`paper paper--${note.color} card${isFloating ? ' card--floating' : ''}`}
      style={{ '--tilt': `${tiltFor(note.id)}deg` } as CSSProperties}
      onFocusCapture={onTouch}
    >
      <div className="paper__head">
        <input
          ref={titleRef}
          className="paper__title"
          value={note.title}
          placeholder="Title"
          aria-label="Note title"
          onChange={(event) => onPatch({ title: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              editorRef.current?.focus(0)
            }
            if (event.key === 'Escape') event.currentTarget.blur()
          }}
        />
      </div>

      <PaperEditor
        ref={editorRef}
        className="card__body"
        value={note.content}
        placeholder="Write it down…"
        onChange={(content) => onPatch({ content })}
      />

      <footer className="paper__tray">
        <ColorDots value={note.color} onChange={(color) => onPatch({ color })} />
        <span className="paper__tray-spacer" />
        <button
          type="button"
          className={isFloating ? 'tray-button tray-button--on' : 'tray-button'}
          onClick={onFloat}
          disabled={!canFloat}
          title={
            canFloat
              ? isFloating
                ? 'Stop floating'
                : 'Float this note above other windows'
              : 'Floating needs Chrome, Edge, or Firefox 151+'
          }
        >
          <PinIcon pressed={isFloating} />
          {isFloating ? 'Floating' : 'Float'}
        </button>
        <button
          type="button"
          className="tray-button"
          onClick={onRemove}
          aria-label="Discard note"
          title="Discard note"
        >
          ✕
        </button>
      </footer>
    </article>
  )
}
