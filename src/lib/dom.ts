/**
 * `instanceof` is unreliable here: the floating window is a different realm, so
 * its `HTMLInputElement` is not the opener's. These checks look at the node
 * itself and work from either window.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (target === null || !(target instanceof Object) || !('tagName' in target)) {
    return false
  }
  const element = target as HTMLElement
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.isContentEditable === true
  )
}
