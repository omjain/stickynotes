import type { DBSchema } from 'idb'

import type { Note } from '../types/note'

export const DB_NAME = 'sticky-notes'
export const DB_VERSION = 1
export const NOTES_STORE = 'notes'

export interface NotesDb extends DBSchema {
  notes: {
    key: string
    value: Note
    indexes: { byCreatedAt: number }
  }
}
