import type { StoreApi } from 'zustand'
import { createStore } from 'zustand/vanilla'

import {
  applyPatch,
  createNote,
  nextColor,
  sortByNewest,
  type NotePatch,
} from '../features/notes/domain'
import type { NoteRepository } from '../features/notes/repository'
import { createDebouncer } from '../lib/debounce'
import type { Note } from '../types/note'

/** How long typing may pause before it is written to storage. */
const WRITE_DELAY_MS = 300

export type NotesState = {
  /** Newest first. Editing a note never reorders the desk. */
  notes: Note[]
  status: 'idle' | 'loading' | 'ready'
  /** Set when a write failed, so the UI can say so instead of losing data quietly. */
  writeError: string | null
}

/**
 * The note store is a *vanilla* Zustand store: it holds no React, so the same
 * instance is shared by the workspace root and the Picture-in-Picture root.
 * Both windows live in the same JavaScript realm, so this is a direct object
 * reference — no message passing, no serialization, and exactly one copy of the
 * logic.
 */
export type NotesApi = {
  store: StoreApi<NotesState>
  hydrate(): Promise<void>
  create(): Note
  patch(id: string, patch: NotePatch): void
  remove(id: string): void
  restore(note: Note): void
  /** Write anything outstanding right now. Safe to call at any time. */
  flush(): Promise<void>
}

export function createNotesApi(repository: NoteRepository): NotesApi {
  const store = createStore<NotesState>(() => ({
    notes: [],
    status: 'idle',
    writeError: null,
  }))

  const dirty = new Set<string>()
  const removed = new Set<string>()
  const writeSoon = createDebouncer(WRITE_DELAY_MS)

  const byId = (id: string) => store.getState().notes.find((note) => note.id === id)

  async function flush(): Promise<void> {
    writeSoon.cancel()
    if (dirty.size === 0 && removed.size === 0) return

    const saving = [...dirty].map(byId).filter((note): note is Note => note !== undefined)
    const deleting = [...removed]
    dirty.clear()
    removed.clear()

    try {
      await Promise.all([
        ...saving.map((note) => repository.put(note)),
        ...deleting.map((id) => repository.remove(id)),
      ])
      if (store.getState().writeError) store.setState({ writeError: null })
    } catch (error) {
      // Keep the work queued so the next flush retries it, and surface it.
      saving.forEach((note) => dirty.add(note.id))
      deleting.forEach((id) => removed.add(id))
      store.setState({
        writeError: error instanceof Error ? error.message : 'Could not save',
      })
    }
  }

  function markDirty(id: string) {
    dirty.add(id)
    removed.delete(id)
    writeSoon(() => void flush())
  }

  return {
    store,

    async hydrate() {
      // Idempotent: StrictMode mounts effects twice in development.
      if (store.getState().status !== 'idle') return
      store.setState({ status: 'loading' })
      try {
        const stored = await repository.list()
        store.setState({ notes: sortByNewest(stored), status: 'ready' })
      } catch (error) {
        // An unreadable store must not take the app down — the desk still works
        // for this session, and the failure is shown rather than swallowed.
        store.setState({
          status: 'ready',
          writeError:
            error instanceof Error ? error.message : 'Could not open storage',
        })
      }
    },

    create() {
      const { notes } = store.getState()
      const note = createNote(nextColor(notes), Date.now())
      store.setState({ notes: [note, ...notes] })
      markDirty(note.id)
      return note
    },

    patch(id, patch) {
      const { notes } = store.getState()
      let touched = false
      const next = notes.map((note) => {
        if (note.id !== id) return note
        const updated = applyPatch(note, patch, Date.now())
        touched = updated !== note
        return updated
      })
      if (!touched) return
      store.setState({ notes: next })
      markDirty(id)
    },

    remove(id) {
      const { notes } = store.getState()
      store.setState({ notes: notes.filter((note) => note.id !== id) })
      dirty.delete(id)
      removed.add(id)
      writeSoon(() => void flush())
    },

    /** Puts a removed note back exactly as it was — the undo path. */
    restore(note) {
      const { notes } = store.getState()
      if (notes.some((existing) => existing.id === note.id)) return
      store.setState({ notes: sortByNewest([note, ...notes]) })
      markDirty(note.id)
    },

    flush,
  }
}
