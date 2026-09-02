import type { Note } from '../../types/note'

/**
 * The entire contract between the note domain and storage.
 *
 * IndexedDB implements it today. A Tauri/SQLite store or a sync API can
 * implement it later without any component or store changing.
 */
export type NoteRepository = {
  list(): Promise<Note[]>
  put(note: Note): Promise<void>
  remove(id: string): Promise<void>
}
