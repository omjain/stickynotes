type Props = {
  /** A pin pushed in reads as "this one is already up". */
  pressed?: boolean
}

export function PinIcon({ pressed = false }: Props) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path
        d="M6 7.2V11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M3.1 4.4h5.8a.6.6 0 0 1 .45 1L6.9 7.2h-1.8L2.65 5.4a.6.6 0 0 1 .45-1Z"
        fill={pressed ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M4.4 4.4 5 1.2h2l.6 3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}
