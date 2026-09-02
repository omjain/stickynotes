/**
 * A sheet of paper is never quite square to the desk. The angle is derived from
 * the note id rather than random, so a note keeps the same tilt across reloads
 * and across windows — it reads as one physical object, not a redraw.
 */
export function tiltFor(id: string): number {
  let hash = 5381
  for (let index = 0; index < id.length; index += 1) {
    hash = ((hash << 5) + hash + id.charCodeAt(index)) | 0
  }
  const unit = ((hash >>> 0) % 1000) / 1000
  return Math.round((unit * 1.5 - 0.75) * 100) / 100
}
