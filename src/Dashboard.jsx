// import { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import {
//   ArrowRight,
//   Bell,
//   BriefcaseBusiness,
//   ChartNoAxesCombined,
//   Check,
//   ChevronRight,
//   Compass,
//   HeartHandshake,
//   House,
//   MapPin,
//   PiggyBank,
//   Scale,
//   Settings2,
//   ShieldCheck,
//   SlidersHorizontal,
//   Sparkles,
//   UserRound,
// } from 'lucide-react'

// import { supabase } from './lib/supabase'
// import { ensureUserProfile } from './lib/profile'
// import ProfileForm from './components/ProfileForm'
// import JobOffers from './pages/JobOffers'
// import Analysis from './pages/Analysis'

// import './App.css'

// const navigation = [
//   { label: 'Dashboard', icon: House },
//   { label: 'My Profile', icon: UserRound },
//   { label: 'Job Offers', icon: BriefcaseBusiness },
//   { label: 'Analysis', icon: ChartNoAxesCombined },
//   { label: 'Scenarios', icon: SlidersHorizontal },
// ]

// const features = [
//   {
//     icon: Scale,
//     title: 'Personalised comparison',
//     description: 'See how each offer impacts your finances.',
//     color: 'jade',
//   },
//   {
//     icon: ChartNoAxesCombined,
//     title: 'City-wise cost analysis',
//     description: 'Understand living costs across cities.',
//     color: 'blue',
//   },
//   {
//     icon: Settings2,
//     title: 'Scenario simulation',
//     description: 'Adjust assumptions and explore outcomes.',
//     color: 'jade',
//   },
//   {
//     icon: HeartHandshake,
//     title: 'Personal readiness',
//     description: 'Consider financial and personal factors.',
//     color: 'coral',
//   },
// ]

// function CityIllustration() {
//   return (
//     <div className="city-art" aria-hidden="true">
//       <div className="art-sun" />
//       <div className="art-hill hill-back" />
//       <div className="art-hill hill-front" />

//       <div className="city-buildings">
//         <span className="building building-one" />
//         <span className="building building-two" />
//         <span className="building building-three" />
//         <span className="building building-four" />
//       </div>

//       <div className="art-water" />
//       <MapPin className="art-pin" size={24} />
//     </div>
//   )
// }

// export default function Dashboard() {
//   const navigate = useNavigate()

//   const [page, setPage] = useState('Dashboard')
//   const [user, setUser] = useState(null)
//   const [profileName, setProfileName] = useState('')
//   const [authLoading, setAuthLoading] = useState(true)
//   const [profileStatus, setProfileStatus] = useState('loading')
//   const [authError, setAuthError] = useState('')
//   const [signingIn, setSigningIn] = useState(false)
//   const [signingOut, setSigningOut] = useState(false)

//   const openPage = (name) => setPage(name)

//   // Restore the current session and listen for authentication changes.
//   useEffect(() => {
//     let mounted = true

//     async function loadSession() {
//       try {
//         const { data, error } = await supabase.auth.getSession()

//         if (!mounted) return

//         if (error) setAuthError(error.message)

//         setUser(data?.session?.user ?? null)
//       } catch (error) {
//         if (mounted) {
//           setAuthError(
//             error.message || 'Unable to restore your session.'
//           )
//         }
//       } finally {
//         if (mounted) setAuthLoading(false)
//       }
//     }

//     loadSession()

//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((_event, session) => {
//       if (mounted) {
//         setUser(session?.user ?? null)
//         setAuthError('')
//       }
//     })

//     return () => {
//       mounted = false
//       subscription.unsubscribe()
//     }
//   }, [])

//   // Ensure the authenticated user has a profile.
//   useEffect(() => {
//     let cancelled = false

//     async function createProfile() {
//       if (!user) {
//         setProfileStatus('signed-out')
//         return
//       }

//       setProfileStatus('loading')
//       setAuthError('')

//       try {
//         await ensureUserProfile(user)

//         const { data: profile, error: profileError } = await supabase
//           .from('profiles')
//           .select('full_name')
//           .eq('id', user.id)
//           .maybeSingle()

//         if (profileError) throw profileError

//         if (!cancelled) {
//           setProfileName(profile?.full_name?.trim() || '')
//           setProfileStatus('ready')
//         }
//       } catch (error) {
//         if (!cancelled) {
//           setProfileStatus('error')
//           setAuthError(
//             error.message || 'Unable to create or load your profile.'
//           )
//         }
//       }
//     }

//     createProfile()

//     return () => {
//       cancelled = true
//     }
//   }, [user])

//   async function handleGoogleSignIn() {
//     setSigningIn(true)
//     setAuthError('')

//     try {
//       const { error } = await supabase.auth.signInWithOAuth({
//         provider: 'google',
//         options: {
//           redirectTo: window.location.origin,
//         },
//       })

//       if (error) {
//         setAuthError(error.message)
//         setSigningIn(false)
//       }
//     } catch (error) {
//       setAuthError(
//         error.message || 'Unable to start Google sign-in.'
//       )
//       setSigningIn(false)
//     }
//   }

//   async function handleSignOut() {
//     setSigningOut(true)
//     setAuthError('')

//     try {
//       const { error } = await supabase.auth.signOut()

//       if (error) {
//         setAuthError(error.message)
//       } else {
//         setPage('Dashboard')
//         navigate('/', { replace: true })
//       }
//     } catch (error) {
//       setAuthError(error.message || 'Unable to sign out.')
//     } finally {
//       setSigningOut(false)
//     }
//   }

//   // Initial authentication loading screen.
//   if (authLoading) {
//     return (
//       <main className="auth-screen">
//         <section className="auth-card">
//           <h1>
//             MoveWise<span className="brand-dot">.</span>
//           </h1>
//           <p>Loading your relocation workspace...</p>
//         </section>
//       </main>
//     )
//   }

//   // Sign-in screen.
//   if (!user) {
//     return (
//       <main className="auth-screen">
//         <section className="auth-card">
//           <span className="auth-brand-mark">
//             <Compass size={30} />
//           </span>

//           <p className="eyebrow">YOUR NEXT CHAPTER</p>

//           <h1>
//             MoveWise<span className="brand-dot">.</span>
//           </h1>

//           <p className="auth-description">
//             Make your next move smarter. Sign in to compare opportunities,
//             understand relocation costs, and plan your financial future.
//           </p>

//           <button
//             className="primary-button auth-google-button"
//             onClick={handleGoogleSignIn}
//             disabled={signingIn}
//           >
//             {signingIn ? 'Connecting to Google...' : 'Continue with Google'}
//             {!signingIn && <ArrowRight size={17} />}
//           </button>

//           {authError && (
//             <p className="auth-error" role="alert">
//               {authError}
//             </p>
//           )}

//           <p className="auth-footnote">
//             Your relocation details are kept in your own account.
//           </p>
//         </section>
//       </main>
//     )
//   }

//   // Profile initialization loading screen.
//   if (profileStatus === 'loading') {
//     return (
//       <main className="auth-screen">
//         <section className="auth-card">
//           <span className="auth-brand-mark">
//             <Compass size={30} />
//           </span>

//           <h1>Preparing your workspace</h1>
//           <p>Setting up your MoveWise profile...</p>
//         </section>
//       </main>
//     )
//   }

//   // Profile initialization error screen.
//   if (profileStatus === 'error') {
//     return (
//       <main className="auth-screen">
//         <section className="auth-card">
//           <span className="auth-brand-mark">
//             <ShieldCheck size={30} />
//           </span>

//           <h1>Almost there!</h1>
//           <p>We couldn't finish setting up your profile.</p>

//           <p className="auth-error" role="alert">
//             {authError}
//           </p>

//           <button
//             className="primary-button"
//             onClick={() => {
//               setAuthError('')
//               setProfileStatus('loading')
//               setUser((currentUser) =>
//                 currentUser ? { ...currentUser } : null
//               )
//             }}
//           >
//             Try again <ArrowRight size={17} />
//           </button>

//           <button
//             className="secondary-button"
//             onClick={handleSignOut}
//             disabled={signingOut}
//           >
//             {signingOut ? 'Signing out...' : 'Sign out'}
//           </button>
//         </section>
//       </main>
//     )
//   }

//   const displayName =
//     profileName ||
//     user.user_metadata?.full_name ||
//     user.user_metadata?.name ||
//     user.email ||
//     'User'

//   const userInitial = displayName.trim().charAt(0).toUpperCase() || 'U'

//   return (
//     <div className="app-shell">
//       <header className="topbar">
//         <button
//           className="brand"
//           onClick={() => openPage('Dashboard')}
//           aria-label="MoveWise dashboard"
//         >
//           <span className="brand-mark">
//             <Compass size={25} strokeWidth={2.5} />
//           </span>

//           <span>
//             MoveWise<span className="brand-dot">.</span>
//           </span>
//         </button>

//         <div className="topbar-right">
//           <span className="topbar-label">
//             Your relocation workspace
//           </span>

//           <span className="topbar-divider" />

//           <button
//             className="icon-button"
//             aria-label="Notifications"
//             title="Notifications"
//           >
//             <Bell size={19} />
//           </button>

//           <div className="account-actions">
//             <button
//               type="button"
//               className="secondary-button account-signout"
//               onClick={handleSignOut}
//               disabled={signingOut}
//             >
//               {signingOut ? 'Signing out...' : 'Sign out'}
//             </button>

//             <span
//               className="avatar"
//               title={displayName}
//               aria-label={displayName}
//             >
//               {userInitial}
//             </span>
//           </div>
//         </div>
//       </header>

//       <div className="layout">
//         <aside className="sidebar">
//           <p className="sidebar-label">WORKSPACE</p>

//           <nav className="navigation">
//             {navigation.map(({ label, icon: Icon }) => (
//               <button
//                 key={label}
//                 className={`nav-item ${page === label ? 'active' : ''}`}
//                 onClick={() => openPage(label)}
//               >
//                 <Icon size={19} strokeWidth={1.8} />
//                 <span>{label}</span>
//                 {page === label && (
//                   <span className="nav-indicator" />
//                 )}
//               </button>
//             ))}
//           </nav>

//           <div className="sidebar-note">
//             <div className="sidebar-note-icon">
//               <Sparkles size={20} />
//             </div>

//             <p className="sidebar-note-title">Better decisions.</p>
//             <p className="sidebar-note-title">A brighter future.</p>

//             <p className="sidebar-note-copy">
//               Move for the right reasons, with your finances and priorities
//               in perspective.
//             </p>

//             <div className="note-decoration note-leaf-one" />
//             <div className="note-decoration note-leaf-two" />
//           </div>

//           <div className="sidebar-footer">
//             <span className="status-dot" />
//             Your next chapter starts here
//           </div>
//         </aside>

//         <main className="main-content">
//           <div className="container">
//             {authError && (
//               <p className="auth-error" role="alert">
//                 {authError}
//               </p>
//             )}

//             {page === 'Dashboard' ? (
//               <>
//                 <section className="hero">
//                   <div className="hero-copy">
//                     <p className="eyebrow">YOUR NEXT CHAPTER</p>

//                     <h1 className="page-title">
//                       Make your next move <span>smarter.</span>
//                     </h1>

//                     <p className="hero-description">
//                       Compare job opportunities, understand relocation costs,
//                       and explore how a move could shape your financial future.
//                     </p>

//                     <p className="welcome-user">
//                       Welcome, {displayName.split(' ')[0]}.
//                     </p>
//                   </div>

//                   <CityIllustration />
//                 </section>

//                 <section className="metric-grid">
//                   <button
//                     className="metric-card"
//                     onClick={() => openPage('My Profile')}
//                   >
//                     <span className="metric-icon jade-icon">
//                       <PiggyBank size={23} />
//                     </span>

//                     <span className="metric-content">
//                       <span className="metric-label">
//                         Current Monthly Savings
//                       </span>
//                       <span className="metric-value">—</span>
//                       <span className="metric-note">
//                         Add your profile to calculate
//                       </span>
//                     </span>

//                     <ChevronRight className="metric-arrow" size={19} />
//                   </button>

//                   <button
//                     className="metric-card"
//                     onClick={() => openPage('Job Offers')}
//                   >
//                     <span className="metric-icon blue-icon">
//                       <BriefcaseBusiness size={23} />
//                     </span>

//                     <span className="metric-content">
//                       <span className="metric-label">Job Offers</span>
//                       <span className="metric-value">View</span>
//                       <span className="metric-note">
//                         Manage your opportunities
//                       </span>
//                     </span>

//                     <ChevronRight className="metric-arrow" size={19} />
//                   </button>

//                   <button
//                     className="metric-card"
//                     onClick={() => openPage('My Profile')}
//                   >
//                     <span className="metric-icon coral-icon">
//                       <ShieldCheck size={23} />
//                     </span>

//                     <span className="metric-content">
//                       <span className="metric-label">
//                         Relocation Readiness
//                       </span>
//                       <span className="metric-value readiness-value">
//                         Not assessed
//                       </span>
//                       <span className="metric-note">
//                         Your priorities matter, too
//                       </span>
//                     </span>

//                     <ChevronRight className="metric-arrow" size={19} />
//                   </button>
//                 </section>

//                 <section className="middle-grid">
//                   <div className="start-card">
//                     <div className="start-card-content">
//                       <p className="eyebrow">GET STARTED</p>
//                       <h2>Your relocation, understood.</h2>

//                       <p>
//                         Start with your finances, add a job offer, and compare
//                         projected savings, living costs, one-time moving expenses,
//                         and personal readiness.
//                       </p>

//                       <button
//                         className="primary-button"
//                         onClick={() => openPage('My Profile')}
//                       >
//                         Set up my profile <ArrowRight size={17} />
//                       </button>
//                     </div>

//                     <div className="signpost" aria-hidden="true">
//                       <div className="signpost-pole" />

//                       <div className="signpost-label signpost-green">
//                         NEW CITY <MapPin size={13} />
//                       </div>

//                       <div className="signpost-label signpost-blue">
//                         CAREER GROWTH
//                       </div>

//                       <div className="signpost-label signpost-peach">
//                         SAVINGS
//                       </div>

//                       <div className="signpost-label signpost-sand">
//                         BETTER LIFE
//                       </div>

//                       <div className="signpost-ground" />
//                     </div>
//                   </div>

//                   <div className="journey-card">
//                     <p className="eyebrow">YOUR JOURNEY</p>
//                     <h2>Four simple steps</h2>

//                     {[
//                       'Build your financial profile',
//                       'Add a job offer',
//                       'Compare the numbers',
//                       'Explore your options',
//                     ].map((step, index) => (
//                       <button
//                         key={step}
//                         className="journey-step"
//                         onClick={() =>
//                           openPage(
//                             [
//                               'My Profile',
//                               'Job Offers',
//                               'Analysis',
//                               'Scenarios',
//                             ][index]
//                           )
//                         }
//                       >
//                         <span className="step-number">
//                           {index === 0 ? (
//                             <UserRound size={15} />
//                           ) : (
//                             index + 1
//                           )}
//                         </span>

//                         <span>{step}</span>
//                         <ChevronRight size={15} className="step-arrow" />
//                       </button>
//                     ))}
//                   </div>
//                 </section>

//                 <section className="bottom-grid">
//                   <div className="features-card">
//                     <p className="eyebrow">WHAT YOU CAN EXPLORE</p>

//                     <div className="features-grid">
//                       {features.map(
//                         ({ icon: Icon, title, description, color }) => (
//                           <button
//                             className="feature-item"
//                             key={title}
//                             onClick={() =>
//                               openPage(
//                                 title.includes('comparison')
//                                   ? 'Job Offers'
//                                   : title.includes('cost')
//                                     ? 'Analysis'
//                                     : title.includes('Scenario')
//                                       ? 'Scenarios'
//                                       : 'My Profile'
//                               )
//                             }
//                           >
//                             <span className={`feature-icon ${color}-icon`}>
//                               <Icon size={21} />
//                             </span>

//                             <span className="feature-title">{title}</span>
//                             <span className="feature-description">
//                               {description}
//                             </span>
//                           </button>
//                         )
//                       )}
//                     </div>
//                   </div>

//                   <div className="insight-card">
//                     <div className="insight-orb" />

//                     <p className="eyebrow">A DIFFERENT PERSPECTIVE</p>
//                     <h2>More than just a salary.</h2>

//                     <p>
//                       A better decision considers savings, cost of living,
//                       career growth, and your personal well-being.
//                     </p>

//                     <div className="insight-plant" aria-hidden="true">
//                       <span />
//                       <span />
//                       <span />
//                     </div>

//                     <div className="insight-icon">
//                       <Check size={17} />
//                     </div>
//                   </div>
//                 </section>
//               </>
//             ) : page === 'My Profile' ? (
//               <ProfileForm
//                 user={user}
//                 onProfileSaved={setProfileName}
//               />
//             ) : page === 'Job Offers' ? (
//               <JobOffers />
//             ) : page === 'Analysis' ? (
//               <Analysis />
//             ) : (
//               <section className="subpage">
//                 <p className="eyebrow">MOVEWISE WORKSPACE</p>

//                 <h1 className="page-title">{page}</h1>

//                 <p className="hero-description">
//                   Adjust your assumptions to explore different financial and
//                   relocation outcomes.
//                 </p>

//                 <div className="subpage-card">
//                   <span className="subpage-icon">
//                     <Settings2 size={26} />
//                   </span>

//                   <h2>Let's build your {page.toLowerCase()}.</h2>

//                   <p>
//                     This is where we will add the working forms, saved data,
//                     and financial calculations for MoveWise.
//                   </p>

//                   <button
//                     className="secondary-button"
//                     onClick={() => openPage('Dashboard')}
//                   >
//                     Back to dashboard
//                   </button>
//                 </div>
//               </section>
//             )}
//           </div>
//         </main>
//       </div>
//     </div>
//   )
// }

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  Compass,
  HeartHandshake,
  House,
  MapPin,
  PiggyBank,
  Scale,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from 'lucide-react'

import { supabase } from './lib/supabase'
import { ensureUserProfile } from './lib/profile'
import ProfileForm from './components/ProfileForm'
import JobOffers from './pages/JobOffers'
import Analysis from './pages/Analysis'
import CompareOffers from './pages/CompareOffers'
import ScenarioBuilder from './pages/ScenarioBuilder'
import RelocationHub from './pages/RelocationHub'
import JourneyChecklist from './pages/JourneyChecklist'

import './App.css'

const navigation = [
  { label: 'Dashboard', icon: House },
  { label: 'My Profile', icon: UserRound },
  { label: 'Job Offers', icon: BriefcaseBusiness },
  { label: 'Analysis', icon: ChartNoAxesCombined },
  { label: 'Compare Offers', icon: Scale },
  { label: 'Scenarios', icon: SlidersHorizontal },
  { label: 'Relocation Hub', icon: MapPin },
]
const features = [
  {
    icon: Scale,
    title: 'Personalised comparison',
    description: 'See how each offer impacts your finances.',
    color: 'jade',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'City-wise cost analysis',
    description: 'Understand living costs across cities.',
    color: 'blue',
  },
  {
    icon: Settings2,
    title: 'Scenario simulation',
    description: 'Adjust assumptions and explore outcomes.',
    color: 'jade',
  },
  {
    icon: HeartHandshake,
    title: 'Personal readiness',
    description: 'Consider financial and personal factors.',
    color: 'coral',
  },
]

function CityIllustration() {
  return (
    <div className="city-art" aria-hidden="true">
      <div className="art-sun" />
      <div className="art-hill hill-back" />
      <div className="art-hill hill-front" />

      <div className="city-buildings">
        <span className="building building-one" />
        <span className="building building-two" />
        <span className="building building-three" />
        <span className="building building-four" />
      </div>

      <div className="art-water" />
      <MapPin className="art-pin" size={24} />
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  const [page, setPage] = useState('Dashboard')
  const [user, setUser] = useState(null)
  const [profileName, setProfileName] = useState('')
  const [authLoading, setAuthLoading] = useState(true)
  const [profileStatus, setProfileStatus] = useState('loading')
  const [authError, setAuthError] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const openPage = (name) => setPage(name)

  // Restore the session and listen for authentication changes.
  useEffect(() => {
    let mounted = true

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) setAuthError(error.message)

        setUser(data?.session?.user ?? null)
      } catch (error) {
        if (mounted) {
          setAuthError(
            error.message || 'Unable to restore your session.'
          )
        }
      } finally {
        if (mounted) setAuthLoading(false)
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
        setAuthError('')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Initialise the profile only when the authenticated user's ID changes.
  // A routine token refresh should not restart workspace initialisation.
  useEffect(() => {
    let cancelled = false

    async function createProfile() {
      if (!user?.id) {
        setProfileStatus('signed-out')
        return
      }

      setProfileStatus('loading')
      setAuthError('')

      try {
        await ensureUserProfile(user)

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) throw profileError

        if (!cancelled) {
          setProfileName(profile?.full_name?.trim() || '')
          setProfileStatus('ready')
        }
      } catch (error) {
        if (!cancelled) {
          setProfileStatus('error')
          setAuthError(
            error.message || 'Unable to create or load your profile.'
          )
        }
      }
    }

    createProfile()

    return () => {
      cancelled = true
    }

    // Intentionally depend on the user ID, not the changing session user object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  async function handleGoogleSignIn() {
    setSigningIn(true)
    setAuthError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })

      if (error) {
        setAuthError(error.message)
        setSigningIn(false)
      }
    } catch (error) {
      setAuthError(
        error.message || 'Unable to start Google sign-in.'
      )
      setSigningIn(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    setAuthError('')

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        setAuthError(error.message)
      } else {
        setPage('Dashboard')
        navigate('/', { replace: true })
      }
    } catch (error) {
      setAuthError(error.message || 'Unable to sign out.')
    } finally {
      setSigningOut(false)
    }
  }

  if (authLoading) {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <h1>
            MoveWise<span className="brand-dot">.</span>
          </h1>
          <p>Loading your relocation workspace...</p>
        </section>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <span className="auth-brand-mark">
            <Compass size={30} />
          </span>

          <p className="eyebrow">YOUR NEXT CHAPTER</p>

          <h1>
            MoveWise<span className="brand-dot">.</span>
          </h1>

          <p className="auth-description">
            Make your next move smarter. Sign in to compare opportunities,
            understand relocation costs, and plan your financial future.
          </p>

          <button
            className="primary-button auth-google-button"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
          >
            {signingIn ? 'Connecting to Google...' : 'Continue with Google'}
            {!signingIn && <ArrowRight size={17} />}
          </button>

          {authError && (
            <p className="auth-error" role="alert">
              {authError}
            </p>
          )}

          <p className="auth-footnote">
            Your relocation details are kept in your own account.
          </p>
        </section>
      </main>
    )
  }

  if (profileStatus === 'loading') {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <span className="auth-brand-mark">
            <Compass size={30} />
          </span>

          <h1>Preparing your workspace</h1>
          <p>Setting up your MoveWise profile...</p>
        </section>
      </main>
    )
  }

  if (profileStatus === 'error') {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <span className="auth-brand-mark">
            <ShieldCheck size={30} />
          </span>

          <h1>Almost there!</h1>
          <p>We couldn't finish setting up your profile.</p>

          <p className="auth-error" role="alert">
            {authError}
          </p>

          <button
            className="primary-button"
            onClick={() => {
              setAuthError('')
              setProfileStatus('loading')
              setUser((currentUser) =>
                currentUser ? { ...currentUser } : null
              )
            }}
          >
            Try again <ArrowRight size={17} />
          </button>

          <button
            className="secondary-button"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </section>
      </main>
    )
  }

  const displayName =
    profileName ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    'User'

  const userInitial = displayName.trim().charAt(0).toUpperCase() || 'U'

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => openPage('Dashboard')}
          aria-label="MoveWise dashboard"
        >
          <span className="brand-mark">
            <Compass size={25} strokeWidth={2.5} />
          </span>

          <span>
            MoveWise<span className="brand-dot">.</span>
          </span>
        </button>

        <div className="topbar-right">
          <span className="topbar-label">
            Your relocation workspace
          </span>

          <span className="topbar-divider" />

          <button
            className="icon-button"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={19} />
          </button>

          <div className="account-actions">
            <button
              type="button"
              className="secondary-button account-signout"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>

            <span
              className="avatar"
              title={displayName}
              aria-label={displayName}
            >
              {userInitial}
            </span>
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <p className="sidebar-label">WORKSPACE</p>

          <nav className="navigation">
            {navigation.map(({ label, icon: Icon }) => (
              <button
                key={label}
                className={`nav-item ${page === label ? 'active' : ''}`}
                onClick={() => openPage(label)}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{label}</span>
                {page === label && (
                  <span className="nav-indicator" />
                )}
              </button>
            ))}
          </nav>

          <div className="sidebar-note">
            <div className="sidebar-note-icon">
              <Sparkles size={20} />
            </div>

            <p className="sidebar-note-title">Better decisions.</p>
            <p className="sidebar-note-title">A brighter future.</p>

            <p className="sidebar-note-copy">
              Move for the right reasons, with your finances and priorities
              in perspective.
            </p>

            <div className="note-decoration note-leaf-one" />
            <div className="note-decoration note-leaf-two" />
          </div>

          <div className="sidebar-footer">
            <span className="status-dot" />
            Your next chapter starts here
          </div>
        </aside>

        <main className="main-content">
          <div className="container">
            {authError && (
              <p className="auth-error" role="alert">
                {authError}
              </p>
            )}

            {page === 'Dashboard' ? (
              <>
                <section className="hero">
                  <div className="hero-copy">
                    <p className="eyebrow">YOUR NEXT CHAPTER</p>

                    <h1 className="page-title">
                      Make your next move <span>smarter.</span>
                    </h1>

                    <p className="hero-description">
                      Compare job opportunities, understand relocation costs,
                      and explore how a move could shape your financial future.
                    </p>

                    <p className="welcome-user">
                      Welcome, {displayName.split(' ')[0]}.
                    </p>
                  </div>

                  <CityIllustration />
                </section>

                <section className="metric-grid">
                  <button
                    className="metric-card"
                    onClick={() => openPage('My Profile')}
                  >
                    <span className="metric-icon jade-icon">
                      <PiggyBank size={23} />
                    </span>

                    <span className="metric-content">
                      <span className="metric-label">
                        Current Monthly Savings
                      </span>
                      <span className="metric-value">—</span>
                      <span className="metric-note">
                        Add your profile to calculate
                      </span>
                    </span>

                    <ChevronRight className="metric-arrow" size={19} />
                  </button>

                  <button
                    className="metric-card"
                    onClick={() => openPage('Job Offers')}
                  >
                    <span className="metric-icon blue-icon">
                      <BriefcaseBusiness size={23} />
                    </span>

                    <span className="metric-content">
                      <span className="metric-label">Job Offers</span>
                      <span className="metric-value">View</span>
                      <span className="metric-note">
                        Manage your opportunities
                      </span>
                    </span>

                    <ChevronRight className="metric-arrow" size={19} />
                  </button>

                  <button
                    className="metric-card"
                    onClick={() => openPage('My Profile')}
                  >
                    <span className="metric-icon coral-icon">
                      <ShieldCheck size={23} />
                    </span>

                    <span className="metric-content">
                      <span className="metric-label">
                        Relocation Readiness
                      </span>
                      <span className="metric-value readiness-value">
                        Not assessed
                      </span>
                      <span className="metric-note">
                        Your priorities matter, too
                      </span>
                    </span>

                    <ChevronRight className="metric-arrow" size={19} />
                  </button>
                </section>

                <section className="middle-grid">
                  <div className="start-card">
                    <div className="start-card-content">
                      <p className="eyebrow">GET STARTED</p>
                      <h2>Your relocation, understood.</h2>

                      <p>
                        Start with your finances, add a job offer, and compare
                        projected savings, living costs, one-time moving expenses,
                        and personal readiness.
                      </p>

                      <button
                        className="primary-button"
                        onClick={() => openPage('My Profile')}
                      >
                        Set up my profile <ArrowRight size={17} />
                      </button>
                    </div>

                    <div className="signpost" aria-hidden="true">
                      <div className="signpost-pole" />

                      <div className="signpost-label signpost-green">
                        NEW CITY <MapPin size={13} />
                      </div>

                      <div className="signpost-label signpost-blue">
                        CAREER GROWTH
                      </div>

                      <div className="signpost-label signpost-peach">
                        SAVINGS
                      </div>

                      <div className="signpost-label signpost-sand">
                        BETTER LIFE
                      </div>

                      <div className="signpost-ground" />
                    </div>
                  </div>

                  <div className="journey-card">
                    <p className="eyebrow">YOUR JOURNEY</p>
                    <h2>Four simple steps</h2>

                    {[
                      'Build your financial profile',
                      'Add a job offer',
                      'Compare the numbers',
                      'Explore your options',
                    ].map((step, index) => (
                      <button
                        key={step}
                        className="journey-step"
                        onClick={() =>
                          openPage(
                            [
                              'My Profile',
                              'Job Offers',
                              'Analysis',
                              'Scenarios',
                            ][index]
                          )
                        }
                      >
                        <span className="step-number">
                          {index === 0 ? (
                            <UserRound size={15} />
                          ) : (
                            index + 1
                          )}
                        </span>

                        <span>{step}</span>
                        <ChevronRight size={15} className="step-arrow" />
                      </button>
                    ))}
                  </div>
                </section>

                <section className="bottom-grid">
                  <div className="features-card">
                    <p className="eyebrow">WHAT YOU CAN EXPLORE</p>

                    <div className="features-grid">
                      {features.map(
                        ({ icon: Icon, title, description, color }) => (
                          <button
                            className="feature-item"
                            key={title}
                            onClick={() =>
                              openPage(
                                title.includes('comparison')
                                  ? 'Job Offers'
                                  : title.includes('cost')
                                    ? 'Analysis'
                                    : title.includes('Scenario')
                                      ? 'Scenarios'
                                      : 'My Profile'
                              )
                            }
                          >
                            <span className={`feature-icon ${color}-icon`}>
                              <Icon size={21} />
                            </span>

                            <span className="feature-title">{title}</span>
                            <span className="feature-description">
                              {description}
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="insight-card">
                    <div className="insight-orb" />

                    <p className="eyebrow">A DIFFERENT PERSPECTIVE</p>
                    <h2>More than just a salary.</h2>

                    <p>
                      A better decision considers savings, cost of living,
                      career growth, and your personal well-being.
                    </p>

                    <div className="insight-plant" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>

                    <div className="insight-icon">
                      <Check size={17} />
                    </div>
                  </div>
                </section>
              </>
            ) : page === 'My Profile' ? (
              <ProfileForm
                user={user}
                onProfileSaved={setProfileName}
              />
            ) : page === 'Job Offers' ? (
              <JobOffers />
            ) : page === 'Analysis' ? (
              <Analysis />
            ) : page === 'Compare Offers' ? (
              <CompareOffers />
            ) : page === 'Scenarios' ? (
              <ScenarioBuilder />
            ) : page === 'Relocation Hub' ? (
              <RelocationHub onOpenChecklist={() => openPage('Journey Checklist')} />
            ) : page === 'Journey Checklist' ? (
              <JourneyChecklist onBack={() => openPage('Relocation Hub')} />
            ) : (
              <section className="subpage">
                <p className="eyebrow">MOVEWISE WORKSPACE</p>

                <h1 className="page-title">{page}</h1>

                <p className="hero-description">
                  Adjust your assumptions to explore different financial and
                  relocation outcomes.
                </p>

                <div className="subpage-card">
                  <span className="subpage-icon">
                    <Settings2 size={26} />
                  </span>

                  <h2>Let's build your {page.toLowerCase()}.</h2>

                  <p>
                    This is where we will add the working forms, saved data,
                    and financial calculations for MoveWise.
                  </p>

                  <button
                    className="secondary-button"
                    onClick={() => openPage('Dashboard')}
                  >
                    Back to dashboard
                  </button>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
