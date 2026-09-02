export type Debouncer = {
  (task: () => void): void
  cancel(): void
  pending(): boolean
}

/**
 * Collapses a burst of calls into one trailing run. Used so typing persists
 * once the user pauses rather than once per keystroke — with `cancel()` so a
 * forced flush can take over immediately.
 */
export function createDebouncer(waitMs: number): Debouncer {
  let timer: ReturnType<typeof setTimeout> | undefined
  let queued: (() => void) | undefined

  const schedule = ((task: () => void) => {
    queued = task
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      const run = queued
      queued = undefined
      run?.()
    }, waitMs)
  }) as Debouncer

  schedule.cancel = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    queued = undefined
  }

  schedule.pending = () => timer !== undefined

  return schedule
}
