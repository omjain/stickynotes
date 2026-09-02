import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Every byte a note contains stays on the device. That is a promise the code
 * has to keep, not a line in a README — so the production build ships a Content
 * Security Policy that makes leaving impossible rather than merely unintended.
 *
 * `connect-src 'none'` is the important one: no fetch, no XHR, no WebSocket, no
 * EventSource, no `navigator.sendBeacon`. If a dependency ever tried to phone
 * home, the browser would refuse the request. `default-src 'none'` closes
 * everything not named below, and `form-action 'none'` means nothing can be
 * POSTed anywhere either.
 *
 * Build-only: the dev server needs a WebSocket for hot reload, and weakening
 * the policy to accommodate that would defeat the point of having one.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  // Inline styles are required: the note's tilt is set as a style attribute.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  // The whole point. Nothing leaves.
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ')

const PLACEHOLDER = '<!--#lockdown-->'

function lockdown(): Plugin {
  return {
    name: 'sticky-notes:lockdown',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // Replacing a placeholder rather than prepending, so the policy lands
        // after <meta charset> (which must stay near the top) but still before
        // the module script it governs.
        const tags = [
          `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`,
          '<meta name="referrer" content="no-referrer" />',
        ].join('\n    ')

        if (!html.includes(PLACEHOLDER)) {
          throw new Error(`index.html is missing the ${PLACEHOLDER} marker — the CSP would not ship.`)
        }
        return html.replace(PLACEHOLDER, tags)
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), lockdown()],
})
