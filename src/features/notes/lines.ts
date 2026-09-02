/**
 * Notes are plain text. This is the only place that knows a line beginning
 * `[ ] ` or `[x] ` means a task — pure functions over strings, so the same rules
 * hold in the workspace, in the floating window, and in an exported file.
 */

export type TaskState = 'none' | 'open' | 'done'

export type Line = {
  text: string
  task: TaskState
}

/** How a task is stored. */
const MARKER = /^\[([ xX])\]\s?/

/** What the user can type at the start of a line to turn it into one. */
const SHORTCUT = /^\[([ xX]?)\]\s/

export function parseLine(raw: string): Line {
  const match = MARKER.exec(raw)
  if (!match) return { text: raw, task: 'none' }
  return {
    text: raw.slice(match[0].length),
    task: match[1].toLowerCase() === 'x' ? 'done' : 'open',
  }
}

export function formatLine(line: Line): string {
  if (line.task === 'none') return line.text
  return `${line.task === 'done' ? '[x]' : '[ ]'} ${line.text}`
}

/** Always at least one line — a blank note is one blank line, not zero. */
export function parseLines(content: string): Line[] {
  if (content === '') return [{ text: '', task: 'none' }]
  return content.split('\n').map(parseLine)
}

export function formatLines(lines: readonly Line[]): string {
  return lines.map(formatLine).join('\n')
}

/** Returns the promoted line if `raw` opens with a task shortcut, else null. */
export function taskShortcut(raw: string): Line | null {
  const match = SHORTCUT.exec(raw)
  if (!match) return null
  return {
    text: raw.slice(match[0].length),
    task: match[1].toLowerCase() === 'x' ? 'done' : 'open',
  }
}

export function toggleTask(line: Line): Line {
  if (line.task === 'none') return { ...line, task: 'open' }
  return { ...line, task: line.task === 'open' ? 'done' : 'open' }
}

export function asProse(line: Line): Line {
  return line.task === 'none' ? line : { text: line.text, task: 'none' }
}
