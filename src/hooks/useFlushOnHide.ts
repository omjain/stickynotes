import { useEffect } from 'react'

import { notes } from '../stores/notes'

/**
 * Writes are debounced while typing, so anything still queued must be forced
 * out before the tab can go away. `visibilitychange` is the reliable signal;
 * `pagehide` covers the rest.
 */
export function useFlushOnHide(): void {
  useEffect(() => {
    const flush = () => void notes.flush()
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
    }
  }, [])
}
