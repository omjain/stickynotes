# Sticky notes

Notes that float above your other windows, so you never have to open an app to
see what you wrote down.

```bash
npm install
npm run dev
```

Then press `N`, type, and click **Float**.

## What it does

- Create, edit, colour, and discard notes on a single page
- A line starting `[ ]` becomes a real checkbox you can tick
- **Float** puts one note in a small always-on-top window that survives
  minimising the browser and other apps going fullscreen
- Everything is stored locally in IndexedDB — no account, no server

## Browser support

Floating uses the [Document Picture-in-Picture
API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Picture-in-Picture_API):

| Browser      | Floating notes |
| ------------ | -------------- |
| Chrome 116+  | yes            |
| Edge 116+    | yes            |
| Firefox 151+ | yes            |
| Safari       | no             |

Everything except floating works everywhere. Where floating is unavailable the
app says so instead of failing quietly.

## How it fits together

```
        StickyNote (desk)        FloatingNote (PiP window)
              │                            │
              └────────────┬───────────────┘
                           │        PaperEditor, ColorDots
                    notesStore  (vanilla — no React)
                           │
                    NoteRepository  ← the only storage contract
                           │
                       IndexedDB
```

- `src/features/notes/` — note logic as pure functions. No React, no storage.
- `src/stores/notesStore.ts` — one vanilla store, shared by *both* windows by
  direct reference. The PiP window is same-origin and same-realm, so there is no
  message passing and no second copy of the logic.
- `src/db/` — the IndexedDB implementation of `NoteRepository`. Writes are
  debounced while typing and flushed on hide, blur, and window close.
- `src/features/floating/` — the only code that knows Picture-in-Picture exists.
  `FloatingWindowService` is the seam a native always-on-top window would
  implement instead.
- `src/lib/styles.ts` — stylesheets are imported as text and adopted into
  whichever document needs them, because the floating window is a separate
  document with no stylesheet of its own.

## Known limits

- One floating window per tab (a browser rule). Floating a second note swaps
  what the existing window shows, keeping its size and position.
- The browser must stay running; the floating window closes with its tab.
- Two tabs of the app open at once will not see each other's edits. The
  repository is the place to add that.
