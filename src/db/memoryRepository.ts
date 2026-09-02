import type { NoteRepository } from '../features/notes/repository'
import type { Note } from '../types/note'

/**
 * In-memory fallback. Used when IndexedDB is unavailable (private windows,
 * blocked storage) so the app still works for the session instead of failing,
 * and used as the seam for testing the store without a browser database.
 */
export function createMemoryRepository(seed: readonly Note[] = []): NoteRepository {
  const rows = new Map<string, Note>(seed.map((note) => [note.id, note]))

  return {
    async list() {
      return [...rows.values()]
    },
    async put(note) {
      rows.set(note.id, note)
    },
    async remove(id) {
      rows.delete(id)
    },
  }
}
