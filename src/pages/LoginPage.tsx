import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Building2 } from 'lucide-react'

type Mode = 'signin' | 'signup' | 'reset'

export function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      if (mode === 'reset') {
        await resetPassword(email)
        setMessage('Password reset email sent. Check your inbox.')
        setMode('signin')
      } else if (mode === 'signup') {
        await signUp(email, password)
        navigate('/')
      } else {
        await signIn(email, password)
        navigate('/')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="bg-blue-700 text-white p-3 rounded-xl">
            <Building2 size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">CapEx Assess</h1>
          <p className="text-sm text-gray-500">Capital Planning & Asset Assessment</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Reset password' : 'Sign in'}
          </h2>

          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
          {message && <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">{message}</div>}

          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />

          {mode !== 'reset' && (
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          )}

          <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
            {mode === 'signup' ? 'Create Account' : mode === 'reset' ? 'Send Reset Email' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm text-gray-500">
          {mode === 'signin' && (
            <>
              <button onClick={() => setMode('reset')} className="text-blue-600 hover:underline">Forgot password?</button>
              <span>No account? <button onClick={() => setMode('signup')} className="text-blue-600 hover:underline">Sign up</button></span>
            </>
          )}
          {mode !== 'signin' && (
            <button onClick={() => setMode('signin')} className="text-blue-600 hover:underline">Back to sign in</button>
          )}
        </div>
      </div>
    </div>
  )
}
