/**
 * The note domain type. Nothing in here knows about React, IndexedDB, or
 * Picture-in-Picture — it is the one shape every layer agrees on.
 */

export const NOTE_COLORS = [
  'butter',
  'blush',
  'mint',
  'sky',
  'lilac',
  'sand',
] as const

export type NoteColor = (typeof NOTE_COLORS)[number]

export const DEFAULT_NOTE_COLOR: NoteColor = 'butter'

export type Note = {
  id: string
  title: string
  /**
   * Plain text, and deliberately so. A line beginning `[ ] ` or `[x] ` is
   * rendered as a checkbox; everything else is rendered as written. The text
   * stays the source of truth so a note is never forced into being a task list.
   */
  content: string
  color: NoteColor
  /** Epoch milliseconds — sortable, and storable in IndexedDB as-is. */
  createdAt: number
  updatedAt: number
}
