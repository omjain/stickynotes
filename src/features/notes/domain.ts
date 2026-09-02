/** Pure note logic. No side effects, no storage, no UI. */

import { NOTE_COLORS, type Note, type NoteColor } from '../../types/note'

export type NotePatch = Partial<Pick<Note, 'title' | 'content' | 'color'>>

export function createNote(color: NoteColor, now: number): Note {
  return {
    id: crypto.randomUUID(),
    title: '',
    content: '',
    color,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * New notes step through the palette instead of all arriving yellow, so a desk
 * of notes reads as a handful of different sheets without the user picking.
 */
export function nextColor(notes: readonly Note[]): NoteColor {
  const previous = notes[0]?.color
  const index = previous ? NOTE_COLORS.indexOf(previous) : -1
  return NOTE_COLORS[(index + 1) % NOTE_COLORS.length]
}

/** Returns the *same* note reference when the patch changes nothing, so an
 *  unchanged keystroke costs neither a re-render nor a write. */
export function applyPatch(note: Note, patch: NotePatch, now: number): Note {
  const changed = (Object.keys(patch) as (keyof NotePatch)[]).some(
    (key) => patch[key] !== undefined && patch[key] !== note[key],
  )
  if (!changed) return note
  return { ...note, ...patch, updatedAt: now }
}

export function isBlank(note: Note): boolean {
  return note.title.trim() === '' && note.content.trim() === ''
}

/** Newest sheet on top of the pile. */
export function sortByNewest(notes: readonly Note[]): Note[] {
  return [...notes].sort((a, b) => b.createdAt - a.createdAt)
}
