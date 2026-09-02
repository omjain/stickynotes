import type { NotePatch } from '../../features/notes/domain'
import type { Note } from '../../types/note'
import { PaperEditor } from '../NoteEditor/PaperEditor'
import { ColorDots } from '../UI/ColorDots'

type Props = {
  note: Note
  onPatch: (patch: NotePatch) => void
  onClose: () => void
}

/**
 * The note as it appears in the floating window: the same paper and the same
 * editor, with the desk removed. It fills the window edge to edge so what the
 * user sees on top of their other apps is a sheet of paper, not an app.
 */
export function FloatingNote({ note, onPatch, onClose }: Props) {
  return (
    <article className={`paper paper--${note.color} floating`}>
      <div className="paper__head">
        <input
          className="paper__title"
          value={note.title}
          placeholder="Title"
          aria-label="Note title"
          onChange={(event) => onPatch({ title: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Escape') event.currentTarget.blur()
          }}
        />
      </div>

      <PaperEditor
        className="floating__body"
        value={note.content}
        placeholder="Write it down…"
        onChange={(content) => onPatch({ content })}
      />

      <footer className="paper__tray">
        <ColorDots value={note.color} onChange={(color) => onPatch({ color })} />
        <span className="paper__tray-spacer" />
        <button
          type="button"
          className="tray-button"
          onClick={onClose}
          aria-label="Stop floating"
          title="Stop floating"
        >
          ✕
        </button>
      </footer>
    </article>
  )
}
