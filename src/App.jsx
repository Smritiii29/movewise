
// import { useEffect, useState } from 'react'
// import {
//   BrowserRouter,
//   Routes,
//   Route,
//   Navigate,
//   useLocation,
// } from 'react-router-dom'
// import { supabase } from './lib/supabase'
// import Landing from './pages/Landing'
// import Login from './pages/Login'
// import Signup from './pages/Signup'
// import Dashboard from './Dashboard'
// import JobOffers from './pages/JobOffers'

// function ProtectedRoute() {
//   const [session, setSession] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const location = useLocation()

//   useEffect(() => {
//     let active = true

//     async function loadSession() {
//       try {
//         const { data, error } = await supabase.auth.getSession()

//         if (!active) return

//         setSession(error ? null : data.session)
//       } catch {
//         if (active) setSession(null)
//       } finally {
//         if (active) setLoading(false)
//       }
//     }

//     loadSession()

//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((_event, nextSession) => {
//       if (active) {
//         setSession(nextSession)
//         setLoading(false)
//       }
//     })

//     return () => {
//       active = false
//       subscription.unsubscribe()
//     }
//   }, [])

//   if (loading) {
//     return <main className="route-loading">Loading MoveWise...</main>
//   }

//   if (!session) {
//     return <Navigate to="/" replace state={{ from: location }} />
//   }

//   if (location.pathname === '/job-offers') {
//     return <JobOffers />
//   }

//   return <Dashboard />
// }

// function AppRoutes() {
//   return (
//     <Routes>
//       <Route path="/" element={<Landing />} />
//       <Route path="/login" element={<Login />} />
//       <Route path="/signup" element={<Signup />} />
//       <Route path="/dashboard" element={<ProtectedRoute />} />
//       <Route path="/job-offers" element={<ProtectedRoute />} />
//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   )
// }

// export default function App() {
//   return (
//     <BrowserRouter>
//       <AppRoutes />
//     </BrowserRouter>
//   )
// }

import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'
import { supabase } from './lib/supabase'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './Dashboard'
import JobOffers from './pages/JobOffers'
import Onboarding from './pages/Onboarding'
import RelocationHub from './pages/RelocationHub'

function ProtectedRoute() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const location = useLocation()

  useEffect(() => {
    let active = true

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (!active) return

        if (error) throw error
        setSession(data.session)
      } catch {
        if (active) setSession(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession)
        setLoading(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadProfile() {
      if (!session?.user?.id) {
        setProfile(null)
        setProfileLoading(false)
        setProfileError('')
        return
      }

      setProfileLoading(true)
      setProfileError('')

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, career_stage, years_experience, onboarding_completed')
          .eq('id', session.user.id)
          .maybeSingle()

        if (error) throw error

        if (!data) {
          const { error: createError } = await supabase
            .from('profiles')
            .upsert(
              {
                id: session.user.id,
                full_name:
                  session.user.user_metadata?.full_name ??
                  session.user.user_metadata?.name ??
                  '',
              },
              { onConflict: 'id', ignoreDuplicates: true }
            )

          if (createError) throw createError

          const { data: newProfile, error: reloadError } = await supabase
            .from('profiles')
            .select('id, career_stage, years_experience, onboarding_completed')
            .eq('id', session.user.id)
            .single()

          if (reloadError) throw reloadError

          if (active) setProfile(newProfile)
        } else if (active) {
          setProfile(data)
        }
      } catch (err) {
        if (active) {
          setProfileError(
            err.message || 'Unable to load your profile. Please try again.'
          )
        }
      } finally {
        if (active) setProfileLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [session?.user?.id])

  if (loading) {
    return <main className="route-loading">Loading MoveWise...</main>
  }

  if (!session) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  if (profileLoading) {
    return <main className="route-loading">Preparing your workspace...</main>
  }

  if (profileError) {
    return (
      <main className="route-loading">
        <p>{profileError}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Try again
        </button>
      </main>
    )
  }

  const careerStageConfirmed =
    profile?.career_stage === 'recent_graduate' ||
    profile?.career_stage === 'working_professional'

  const onboardingComplete =
    profile?.onboarding_completed === true && careerStageConfirmed

  if (!onboardingComplete) {
    if (location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />
    }

    return <Onboarding />
  }

  if (location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />
  }

  if (location.pathname === '/job-offers') {
    return <JobOffers />
}

  if (location.pathname === '/relocation-hub') {
   return <RelocationHub />
}

return <Dashboard />

  
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<ProtectedRoute />} />
      <Route path="/job-offers" element={<ProtectedRoute />} />
      <Route path="/onboarding" element={<ProtectedRoute />} />
      <Route path="/relocation-hub" element={<ProtectedRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
