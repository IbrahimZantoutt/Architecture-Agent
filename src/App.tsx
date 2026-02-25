import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ChatPage } from './pages/ChatPage'
import { CalculatorsPage } from './pages/CalculatorsPage'
import { SessionProvider } from './contexts/SessionContext'

// Initialize Firebase (side-effect import)
import './lib/firebase'

function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat/:mode" element={<ChatPage />} />
          <Route path="/calculators" element={<CalculatorsPage />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  )
}

export default App
