import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Compass, Mail, Lock, UserRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import '../App.css'

export default function Auth({ mode = 'login' }) {
  const isSignup = mode === 'signup'
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleGoogle() {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      })

      if (error) throw error
    } catch (err) {
      setError(err.message || 'Unable to continue with Google. Please try again.')
      setLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        })

        if (error) throw error

        if (data.session) {
          navigate('/dashboard', { replace: true })
        } else {
          setSuccess(
            'Account created! Check your email for the confirmation link, then sign in.'
          )
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-nav">
        <Link to="/" className="public-brand">
          <Compass size={27} />
          <span>
            MoveWise<span className="brand-dot">.</span>
          </span>
        </Link>

        <Link to="/" className="auth-back">
          <ArrowLeft size={16} /> Back to home
        </Link>
      </header>

      <div className="auth-layout">
        <section className="auth-intro">
          <p className="eyebrow">YOUR NEXT CHAPTER</p>
          <h1>
            Every big move
            <br />
            starts with a
            <br />
            <span>clearer picture.</span>
          </h1>
          <p>
            Make informed relocation decisions by understanding your finances,
            opportunities and personal priorities.
          </p>

          <div className="auth-intro-note">
            <Compass size={22} />
            <span>
              A thoughtful move is more than a number on an offer letter.
            </span>
          </div>
        </section>

        <section className="auth-form-card">
          <p className="eyebrow">{isSignup ? 'GET STARTED' : 'WELCOME BACK'}</p>
          <h2>{isSignup ? 'Create your account' : 'Sign in to MoveWise'}</h2>
          <p className="auth-form-description">
            {isSignup
              ? 'Create an account to start planning your next move.'
              : 'Pick up where you left off with your relocation plans.'}
          </p>

          <button
            type="button"
            className="google-button"
            onClick={handleGoogle}
            disabled={loading}
          >
            <span className="google-g">G</span>
            {loading ? 'Please wait...' : 'Continue with Google'}
          </button>

          <div className="auth-separator">
            <span>or continue with email</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {isSignup && (
              <label>
                Full name
                <span className="auth-input-wrap">
                  <UserRound size={17} />
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    required
                  />
                </span>
              </label>
            )}

            <label>
              Email address
              <span className="auth-input-wrap">
                <Mail size={17} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </span>
            </label>

            <label>
              Password
              <span className="auth-input-wrap">
                <Lock size={17} />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  minLength={6}
                  required
                />
              </span>
            </label>

            <button
              type="submit"
              className="primary-button auth-submit"
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : isSignup
                  ? 'Create account'
                  : 'Sign in'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          {error && (
            <p className="auth-message auth-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="auth-message auth-success" role="status">
              {success}
            </p>
          )}

          <p className="auth-switch">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link to={isSignup ? '/login' : '/signup'}>
              {isSignup ? 'Sign in' : 'Create one'}
            </Link>
          </p>

          <p className="auth-privacy">
            Your relocation information is private to your account.
          </p>
        </section>
      </div>
    </main>
  )
}
