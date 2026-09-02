import { openDB, type IDBPDatabase } from 'idb'

import type { NoteRepository } from '../features/notes/repository'
import { DB_NAME, DB_VERSION, NOTES_STORE, type NotesDb } from './schema'

/**
 * Notes live in IndexedDB — on this device, in this browser, with no server
 * involved. Nothing above this file knows that; it satisfies `NoteRepository`
 * and can be replaced by a native store or a sync API later.
 */
export function createIndexedDbRepository(): NoteRepository {
  let connection: Promise<IDBPDatabase<NotesDb>> | undefined

  const db = () => {
    connection ??= openDB<NotesDb>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(NOTES_STORE)) {
          const store = database.createObjectStore(NOTES_STORE, { keyPath: 'id' })
          store.createIndex('byCreatedAt', 'createdAt')
        }
      },
    })
    return connection
  }

  return {
    async list() {
      return (await db()).getAllFromIndex(NOTES_STORE, 'byCreatedAt')
    },
    async put(note) {
      await (await db()).put(NOTES_STORE, note)
    },
    async remove(id) {
      await (await db()).delete(NOTES_STORE, id)
    },
  }
}
