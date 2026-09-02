import { useEffect } from 'react'

import { isTypingTarget } from '../lib/dom'

/**
 * A single unmodified key, active only when the user isn't typing.
 *
 * Deliberately not Cmd/Ctrl+N: Chrome reserves it for a new window and a page
 * cannot intercept it. Bare keys collide with nothing.
 */
export function useShortcut(
  key: string,
  handler: () => void,
  target: Document = document,
): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() !== key.toLowerCase()) return
      if (isTypingTarget(event.target)) return
      event.preventDefault()
      handler()
    }
    target.addEventListener('keydown', onKeyDown)
    return () => target.removeEventListener('keydown', onKeyDown)
  }, [key, handler, target])
}
