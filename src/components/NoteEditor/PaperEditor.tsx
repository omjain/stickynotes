import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type Ref,
} from 'react'

import {
  asProse,
  formatLines,
  parseLine,
  parseLines,
  taskShortcut,
  toggleTask,
  type Line,
} from '../../features/notes/lines'

export type PaperEditorHandle = {
  focus: (index?: number) => void
}

type Props = {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  className?: string
  ref?: Ref<PaperEditorHandle>
}

/** `offset: -1` means "the end of that line". */
type Caret = { index: number; offset: number }

/**
 * A note, written on lines.
 *
 * One input per line rather than one textarea, because a task needs a real
 * checkbox you can click — in the floating window especially. The text stays the
 * single source of truth: every edit round-trips through `formatLines`, so
 * nothing is stored that a plain text file could not hold.
 */
export function PaperEditor({ value, onChange, placeholder, className, ref }: Props) {
  const lines = parseLines(value)
  const rows = useRef<(HTMLInputElement | null)[]>([])
  const caret = useRef<Caret | null>(null)

  rows.current.length = lines.length

  const applyCaret = () => {
    const want = caret.current
    if (!want) return
    caret.current = null
    const input = rows.current[want.index]
    if (!input) return
    input.focus()
    const offset =
      want.offset < 0 ? input.value.length : Math.min(want.offset, input.value.length)
    input.setSelectionRange(offset, offset)
  }

  // Runs after every render; a no-op unless an edit asked for the caret to move.
  useLayoutEffect(applyCaret)

  useImperativeHandle(ref, () => ({
    focus(index = 0) {
      caret.current = { index, offset: -1 }
      applyCaret()
    },
  }))

  const commit = (next: Line[], moveTo?: Caret) => {
    const text = formatLines(next)
    caret.current = moveTo ?? null
    // A no-op edit produces no re-render, so the caret has to be moved here.
    if (text === value) applyCaret()
    else onChange(text)
  }

  const moveCaret = (index: number, offset: number) => {
    caret.current = { index, offset }
    applyCaret()
  }

  const handleChange = (index: number, raw: string) => {
    const line = lines[index]
    const next = [...lines]

    if (line.task === 'none') {
      const promoted = taskShortcut(raw)
      if (promoted) {
        next[index] = promoted
        commit(next, { index, offset: 0 })
        return
      }
    }

    next[index] = { ...line, text: raw }
    commit(next)
  }

  const handleToggle = (index: number) => {
    const next = [...lines]
    next[index] = toggleTask(lines[index])
    // Deliberately no caret move: ticking a box shouldn't pull focus into the text.
    commit(next)
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const line = lines[index]
    const at = input.selectionStart ?? 0
    const collapsed = input.selectionStart === input.selectionEnd
    const isLast = index === lines.length - 1

    if (event.key === 'Escape') {
      input.blur()
      return
    }

    // Make this line a task, or tick it off, without touching the syntax.
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      const next = [...lines]
      next[index] = toggleTask(line)
      commit(next, { index, offset: at })
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()

      // Enter on an empty task ends the list instead of making another one.
      if (line.task !== 'none' && line.text === '') {
        const next = [...lines]
        next[index] = asProse(line)
        commit(next, { index, offset: 0 })
        return
      }

      const next = [...lines]
      next[index] = { ...line, text: line.text.slice(0, at) }
      next.splice(index + 1, 0, {
        text: line.text.slice(at),
        // A new line after a task is a task. After prose, prose.
        task: line.task === 'none' ? 'none' : 'open',
      })
      commit(next, { index: index + 1, offset: 0 })
      return
    }

    if (event.key === 'Backspace' && at === 0 && collapsed) {
      // First press unmakes the task; only then does the line itself go.
      if (line.task !== 'none') {
        event.preventDefault()
        const next = [...lines]
        next[index] = asProse(line)
        commit(next, { index, offset: 0 })
        return
      }
      if (index > 0) {
        event.preventDefault()
        const previous = lines[index - 1]
        const next = [...lines]
        next[index - 1] = { ...previous, text: previous.text + line.text }
        next.splice(index, 1)
        commit(next, { index: index - 1, offset: previous.text.length })
        return
      }
    }

    if (event.key === 'Delete' && at === line.text.length && collapsed && !isLast) {
      event.preventDefault()
      const following = lines[index + 1]
      const next = [...lines]
      next[index] = { ...line, text: line.text + following.text }
      next.splice(index + 1, 1)
      commit(next, { index, offset: line.text.length })
      return
    }

    if (event.key === 'ArrowUp' && index > 0) {
      event.preventDefault()
      moveCaret(index - 1, at)
      return
    }
    if (event.key === 'ArrowDown' && !isLast) {
      event.preventDefault()
      moveCaret(index + 1, at)
      return
    }
    if (event.key === 'ArrowLeft' && at === 0 && collapsed && index > 0) {
      event.preventDefault()
      moveCaret(index - 1, -1)
      return
    }
    if (event.key === 'ArrowRight' && at === line.text.length && collapsed && !isLast) {
      event.preventDefault()
      moveCaret(index + 1, 0)
    }
  }

  /** Pasting a list should land as a list, not as one run-on line. */
  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text/plain')
    if (!pasted.includes('\n')) return

    event.preventDefault()
    const input = event.currentTarget
    const line = lines[index]
    const from = input.selectionStart ?? 0
    const to = input.selectionEnd ?? from
    const before = line.text.slice(0, from)
    const after = line.text.slice(to)
    const chunks = pasted.replace(/\r\n?/g, '\n').split('\n')

    // Pasting over the start of a line: a marker in the pasted text wins, so
    // `[ ] thing` lands as a checkbox rather than as literal brackets. Pasting
    // plain text there leaves the line's own checkbox alone.
    let head: Line
    if (before === '') {
      const parsed = parseLine(chunks[0])
      head = parsed.task === 'none' ? { ...line, text: chunks[0] } : parsed
    } else {
      head = { ...line, text: before + chunks[0] }
    }
    const tail = chunks.slice(1).map(parseLine)

    let target: Caret
    if (tail.length === 0) {
      head.text += after
      target = { index, offset: before.length + chunks[0].length }
    } else {
      const last = tail[tail.length - 1]
      target = { index: index + tail.length, offset: last.text.length }
      tail[tail.length - 1] = { ...last, text: last.text + after }
    }

    commit([...lines.slice(0, index), head, ...tail, ...lines.slice(index + 1)], target)
  }

  return (
    <div className={className === undefined ? 'paper__body' : `paper__body ${className}`}>
      {/* Keyed by position: lines have no identity of their own, and the caret
          is placed explicitly after every edit, so reuse is safe here. */}
      {lines.map((line, index) => (
        <div key={index} className={line.task === 'done' ? 'line line--done' : 'line'}>
          {line.task !== 'none' && (
            <button
              type="button"
              role="checkbox"
              aria-checked={line.task === 'done'}
              aria-label={line.text === '' ? 'Task' : line.text}
              className="line__box"
              onClick={() => handleToggle(index)}
            >
              <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                <path
                  d="M2 6.4 4.6 9 10 3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <input
            ref={(element) => {
              rows.current[index] = element
            }}
            className="line__text"
            value={line.text}
            placeholder={lines.length === 1 && index === 0 ? placeholder : undefined}
            aria-label={`Line ${index + 1}`}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => handlePaste(index, event)}
          />
        </div>
      ))}
    </div>
  )
}
