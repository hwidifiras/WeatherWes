import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import CSS
import './index.css'

import SimpleChakraApp from './SimpleChakraApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SimpleChakraApp />
  </StrictMode>,
)
