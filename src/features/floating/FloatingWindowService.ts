import type { StoreApi } from 'zustand'

export type FloatingState = {
  /** The note currently out floating, or null. */
  noteId: string | null
  /** Why the last attempt to float failed, if it did. */
  error: string | null
}

export type WindowMount = {
  /**
   * Called once with the new window's document. Render into it and return the
   * teardown to run when the window goes away.
   */
  mount(doc: Document): () => void
}

/**
 * "Put this note somewhere it stays visible."
 *
 * Document Picture-in-Picture implements it today. A Tauri always-on-top window
 * would implement the same three methods, and nothing else in the app would
 * change — this interface is the whole seam between the product and the trick
 * that makes it float.
 */
export type FloatingWindowService = {
  readonly supported: boolean
  readonly store: StoreApi<FloatingState>
  /** Must be called from a user gesture: the browser rejects it otherwise. */
  open(noteId: string): Promise<void>
  close(): void
}
