import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ChatPage } from './pages/ChatPage'
import { CalculatorsPage } from './pages/CalculatorsPage'
import { AuthPage } from './pages/AuthPage'
import { HistoryPage } from './pages/HistoryPage'
import { SessionProvider } from './contexts/SessionContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import type { ReactNode } from 'react'

// Initialize Firebase (side-effect import)
import './lib/firebase'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    // Blank screen while Firebase resolves the session
    return (
      <div
        className="bg-bg-soft flex items-center justify-center"
        style={{ minHeight: '100dvh' }}
      />
    )
  }

  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionProvider>
          <Routes>
            {/* Public */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Protected */}
            <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
            <Route path="/chat/:mode" element={<RequireAuth><ChatPage /></RequireAuth>} />
            <Route path="/calculators" element={<RequireAuth><CalculatorsPage /></RequireAuth>} />
            <Route path="/history" element={<RequireAuth><HistoryPage /></RequireAuth>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SessionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
