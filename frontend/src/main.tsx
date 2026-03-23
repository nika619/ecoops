import { createRoot } from 'react-dom/client'
import './index.css'
import GlobalMatrixApp from './globalmatrix/GlobalMatrixApp.tsx'

// No StrictMode — it causes double-mount which conflicts
// with cobe's WebGL context and SSE event listeners
createRoot(document.getElementById('root')!).render(
  <GlobalMatrixApp />,
)
