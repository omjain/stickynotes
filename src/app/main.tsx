import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { adoptStyles, APP_STYLES } from '../lib/styles'
import { App } from './App'

adoptStyles(document, APP_STYLES)

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
