import type { NoteRepository } from '../features/notes/repository'
import { createIndexedDbRepository } from './indexedDbRepository'
import { createMemoryRepository } from './memoryRepository'

/**
 * Picks the durable store when the browser has one. If IndexedDB is present but
 * refuses to open (a locked-down private window), the store keeps notes in
 * memory for the session and surfaces the failure — it never pretends to have
 * saved.
 */
export function createNoteRepository(): NoteRepository {
  if (typeof indexedDB === 'undefined') return createMemoryRepository()
  return createIndexedDbRepository()
}
