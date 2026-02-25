import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/ui/Logo'
import { useAuth } from '../contexts/AuthContext'

type AuthMode = 'signin' | 'signup'

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
  </svg>
)

export function AuthPage() {
  const navigate = useNavigate()
  const { signIn, signUp, signInWithGoogle } = useAuth()

  const [mode, setMode] = useState<AuthMode>('signin')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const clearError = () => setError('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        if (!displayName.trim()) {
          setError('Please enter your name.')
          setLoading(false)
          return
        }
        await signUp(email, password, displayName.trim())
      }
      navigate('/')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Incorrect email or password.')
      } else if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.')
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.')
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      navigate('/')
    } catch {
      setError('Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError('')
    setDisplayName('')
    setEmail('')
    setPassword('')
  }

  return (
    <div
      className="bg-bg-soft font-outfit flex flex-col items-center justify-center"
      style={{ minHeight: '100dvh', padding: '24px 20px' }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <Logo size="lg" />
      </div>

      {/* Card */}
      <div
        className="bg-bg-card rounded-2xl border border-border w-full flex flex-col"
        style={{ maxWidth: 420, padding: '32px 32px 28px' }}
      >
        {/* Title */}
        <h1
          className="font-outfit font-bold text-text-primary"
          style={{ fontSize: 22, marginBottom: 6 }}
        >
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="font-outfit text-text-secondary" style={{ fontSize: 14, marginBottom: 24 }}>
          {mode === 'signin'
            ? 'Sign in to continue to ArchPal.'
            : 'Join ArchPal to save your sessions.'}
        </p>

        {/* Google Button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-bg-card border border-border rounded-[10px] font-outfit font-medium text-text-primary hover:border-border-strong transition-colors disabled:opacity-50"
          style={{ padding: '10px 16px', fontSize: 14, marginBottom: 20, width: '100%' }}
        >
          {GOOGLE_ICON}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
          <div className="flex-1 border-t border-border" />
          <span className="font-outfit text-text-muted" style={{ fontSize: 12 }}>or</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: 14 }}>
          {mode === 'signup' && (
            <div className="flex flex-col" style={{ gap: 6 }}>
              <label className="font-outfit font-medium text-text-primary" style={{ fontSize: 13 }}>
                Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); clearError() }}
                placeholder="Your name"
                className="bg-bg-input border border-border rounded-[10px] font-outfit text-text-primary placeholder:text-text-muted outline-none transition-all focus:border-accent"
                style={{ padding: '10px 14px', fontSize: 14 }}
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="flex flex-col" style={{ gap: 6 }}>
            <label className="font-outfit font-medium text-text-primary" style={{ fontSize: 13 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError() }}
              placeholder="you@example.com"
              className="bg-bg-input border border-border rounded-[10px] font-outfit text-text-primary placeholder:text-text-muted outline-none transition-all focus:border-accent"
              style={{ padding: '10px 14px', fontSize: 14 }}
              autoComplete={mode === 'signin' ? 'email' : 'email'}
              required
            />
          </div>

          <div className="flex flex-col" style={{ gap: 6 }}>
            <label className="font-outfit font-medium text-text-primary" style={{ fontSize: 13 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError() }}
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              className="bg-bg-input border border-border rounded-[10px] font-outfit text-text-primary placeholder:text-text-muted outline-none transition-all focus:border-accent"
              style={{ padding: '10px 14px', fontSize: 14 }}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          {/* Error */}
          {error && (
            <p
              className="font-outfit text-center"
              style={{ fontSize: 13, color: '#E8607A', marginTop: -4 }}
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center font-outfit font-semibold text-white rounded-[10px] transition-colors disabled:opacity-50"
            style={{
              padding: '11px 16px',
              fontSize: 14,
              backgroundColor: loading ? '#D14D68' : '#E8607A',
              marginTop: 4,
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#D14D68' }}
            onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E8607A' }}
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Switch mode */}
        <p
          className="font-outfit text-text-secondary text-center"
          style={{ fontSize: 13, marginTop: 20 }}
        >
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={switchMode}
            className="font-medium"
            style={{ color: '#E8607A' }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      {/* Footer */}
      <p className="font-outfit text-text-muted text-center" style={{ fontSize: 12, marginTop: 24 }}>
        ArchPal — by Ibrahim Zantout
      </p>
    </div>
  )
}
