import { useStore } from 'zustand'

import { notes } from '../stores/notes'
import type { Note } from '../types/note'

export function useNoteList(): Note[] {
  return useStore(notes.store, (state) => state.notes)
}

export function useNote(id: string): Note | undefined {
  return useStore(notes.store, (state) => state.notes.find((note) => note.id === id))
}

export function useNotesStatus() {
  return useStore(notes.store, (state) => state.status)
}

export function useWriteError(): string | null {
  return useStore(notes.store, (state) => state.writeError)
}
