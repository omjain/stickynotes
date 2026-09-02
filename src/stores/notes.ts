import { createNoteRepository } from '../db/createRepository'
import { createNotesApi } from './notesStore'

/**
 * The single note store for this tab, shared by every window that renders a
 * note. Swapping the repository here is the only change needed to move from
 * IndexedDB to a native store or a sync API.
 */
export const notes = createNotesApi(createNoteRepository())
