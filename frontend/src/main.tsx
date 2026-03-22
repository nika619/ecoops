import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// No StrictMode — it causes double-mount which conflicts
// with R3F's WebGL context and SSE event listeners
createRoot(document.getElementById('root')!).render(
  <App />,
)
