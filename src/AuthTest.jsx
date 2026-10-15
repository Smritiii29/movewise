
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function AuthTest() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        setMessage(error.message)
        return
      }
      setUser(data.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    setMessage(error?.message ?? '')
  }

  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>MoveWise — Authentication Test</h1>

      {user ? (
        <>
          <p>Google sign-in successful!</p>
          <p>Email: {user.email}</p>
          <p>Name: {user.user_metadata?.full_name ?? user.user_metadata?.name}</p>
          <button onClick={signOut}>Sign out</button>
        </>
      ) : (
        <button onClick={signInWithGoogle} disabled={loading}>
          {loading ? 'Redirecting...' : 'Continue with Google'}
        </button>
      )}

      {message && <p>{message}</p>}
    </main>
  )
}
