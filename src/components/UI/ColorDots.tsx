import { NOTE_COLORS, type NoteColor } from '../../types/note'

const LABELS: Record<NoteColor, string> = {
  butter: 'Butter',
  blush: 'Blush',
  mint: 'Mint',
  sky: 'Sky',
  lilac: 'Lilac',
  sand: 'Sand',
}

type Props = {
  value: NoteColor
  onChange: (color: NoteColor) => void
}

export function ColorDots({ value, onChange }: Props) {
  return (
    <div className="dots">
      {NOTE_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={`dot dot--${color}`}
          aria-pressed={color === value}
          aria-label={LABELS[color]}
          title={LABELS[color]}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  )
}
