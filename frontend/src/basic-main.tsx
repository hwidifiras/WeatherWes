import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import CSS
import './index.css'

// Simple working app without external dependencies
function BasicApp() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#2D3748', marginBottom: '20px' }}>
        WeatherWeS - Basic Version
      </h1>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>System Check</h2>
        <p>✅ React is working</p>
        <p>✅ Vite is working</p>
        <p>✅ The app is rendering</p>
        <p>🎯 Ready to add Chakra UI components</p>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BasicApp />
  </StrictMode>,
)
