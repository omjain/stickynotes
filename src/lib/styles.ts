import baseCss from '../styles/base.css?inline'
import floatingCss from '../styles/floating.css?inline'
import paperCss from '../styles/paper.css?inline'
import shellCss from '../styles/shell.css?inline'
import tokensCss from '../styles/tokens.css?inline'

/**
 * Stylesheets are imported as text and adopted into whichever document needs
 * them. The Document Picture-in-Picture window is a *separate document*, and the
 * spec's old `copyStyleSheets` option was removed — so rather than crawling
 * `document.styleSheets` and guessing between `<style>` (dev) and `<link>`
 * (build), both documents are fed the same strings. One code path everywhere,
 * and it works unchanged for a future native webview.
 */

/** Everything needed to render a sheet of paper. */
export const PAPER_STYLES: readonly string[] = [tokensCss, baseCss, paperCss]

/** Paper, plus the workspace shell around it. */
export const APP_STYLES: readonly string[] = [...PAPER_STYLES, shellCss]

/** Paper, laid out to fill a small always-on-top window. */
export const FLOATING_STYLES: readonly string[] = [...PAPER_STYLES, floatingCss]

export function adoptStyles(doc: Document, sources: readonly string[]): void {
  const view = doc.defaultView
  if (!view) return

  // A constructed stylesheet belongs to the realm that created it; handing the
  // PiP document a sheet built with the opener's constructor throws
  // NotAllowedError. Always construct with the *target* window's constructor.
  const sheets = sources.map((css) => {
    const sheet = new view.CSSStyleSheet()
    sheet.replaceSync(css)
    return sheet
  })

  doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, ...sheets]
}
