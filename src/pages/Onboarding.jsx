
// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { GraduationCap, BriefcaseBusiness, ArrowRight, LoaderCircle } from 'lucide-react'
// import { supabase } from '../lib/supabase'
// import '../App.css'

// export default function Onboarding() {
//   const navigate = useNavigate()

//   const [careerStage, setCareerStage] = useState('')
//   const [yearsExperience, setYearsExperience] = useState('1')
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')

//   async function handleContinue() {
//     if (!careerStage) {
//       setError('Please choose your career path to continue.')
//       return
//     }

//     const experience =
//       careerStage === 'recent_graduate' ? 0 : Number(yearsExperience)

//     if (
//       careerStage === 'working_professional' &&
//       (!Number.isInteger(experience) || experience < 0 || experience > 60)
//     ) {
//       setError('Enter a valid number of years of work experience.')
//       return
//     }

//     setLoading(true)
//     setError('')

//     try {
//       const { data: { user }, error: userError } =
//         await supabase.auth.getUser()

//       if (userError) throw userError
//       if (!user) throw new Error('Your session has expired. Please sign in again.')

    

//       const { error: saveError } = await supabase
//         .from('profiles')
//         .upsert(
//           {
//             id: user.id,
//             career_stage: careerStage,
//             years_experience: experience,
//             onboarding_completed: true,
//           },
//           { onConflict: 'id' }
//         )

//       if (saveError) throw saveError

//       navigate('/dashboard', { replace: true })
//     } catch (err) {
//       setError(err.message || 'Unable to save your selection. Please try again.')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const cardStyle = (selected) => ({
//     flex: '1 1 240px',
//     padding: '28px 22px',
//     border: selected ? '2px solid #00998A' : '1px solid #E0D4BD',
//     borderRadius: '18px',
//     background: selected ? '#E3F3F0' : '#FFFFFF',
//     color: '#16211F',
//     cursor: 'pointer',
//     textAlign: 'left',
//   })

//   return (
//     <main
//       style={{
//         minHeight: '100vh',
//         background: '#FAF6EF',
//         padding: '48px 20px',
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//       }}
//     >
//       <section style={{ width: '100%', maxWidth: '900px' }}>
//         <p
//           style={{
//             color: '#00695C',
//             fontWeight: 700,
//             letterSpacing: '3px',
//             fontSize: '12px',
//           }}
//         >
//           YOUR NEXT CHAPTER
//         </p>

//         <h1 style={{ fontSize: 'clamp(30px, 5vw, 44px)', marginBottom: '12px' }}>
//           How would you describe your career stage?
//         </h1>

//         <p style={{ color: '#445250', lineHeight: 1.7, marginBottom: '30px' }}>
//           We'll tailor MoveWise's relocation guidance to your career and
//           financial situation. You can update these details later.
//         </p>

//         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px' }}>
//           <button
//             type="button"
//             aria-pressed={careerStage === 'recent_graduate'}
//             onClick={() => {
//               setCareerStage('recent_graduate')
//               setYearsExperience('0')
//               setError('')
//             }}
//             style={cardStyle(careerStage === 'recent_graduate')}
//           >
//             <GraduationCap size={32} color="#00695C" />
//             <h2 style={{ fontSize: '22px', margin: '16px 0 8px' }}>
//               Recent graduate
//             </h2>
//             <p style={{ color: '#445250', lineHeight: 1.6, margin: 0 }}>
//               I'm starting my career or looking for my first full-time role.
//             </p>
//           </button>

//           <button
//             type="button"
//             aria-pressed={careerStage === 'working_professional'}
//             onClick={() => {
//               setCareerStage('working_professional')
//               setYearsExperience('1')
//               setError('')
//             }}
//             style={cardStyle(careerStage === 'working_professional')}
//           >
//             <BriefcaseBusiness size={32} color="#00695C" />
//             <h2 style={{ fontSize: '22px', margin: '16px 0 8px' }}>
//               Working professional
//             </h2>
//             <p style={{ color: '#445250', lineHeight: 1.6, margin: 0 }}>
//               I have work experience and am considering my next opportunity.
//             </p>
//           </button>
//         </div>

//         {careerStage === 'working_professional' && (
//           <div style={{ marginTop: '24px', maxWidth: '360px' }}>
//             <label
//               htmlFor="yearsExperience"
//               style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}
//             >
//               Years of work experience
//             </label>
//             <input
//               id="yearsExperience"
//               type="number"
//               min="0"
//               max="60"
//               step="1"
//               value={yearsExperience}
//               onChange={(event) => setYearsExperience(event.target.value)}
//               style={{
//                 width: '100%',
//                 boxSizing: 'border-box',
//                 padding: '13px 14px',
//                 border: '1px solid #E0D4BD',
//                 borderRadius: '10px',
//                 background: '#FFFFFF',
//                 fontSize: '16px',
//               }}
//             />
//           </div>
//         )}

//         {error && (
//           <p role="alert" style={{ color: '#B42318', marginTop: '18px' }}>
//             {error}
//           </p>
//         )}

//         <button
//           type="button"
//           onClick={handleContinue}
//           disabled={loading || !careerStage}
//           style={{
//             marginTop: '28px',
//             padding: '14px 22px',
//             border: 'none',
//             borderRadius: '10px',
//             background: loading || !careerStage ? '#9ABDB7' : '#00998A',
//             color: '#FFFFFF',
//             fontSize: '16px',
//             fontWeight: 600,
//             cursor: loading || !careerStage ? 'not-allowed' : 'pointer',
//             display: 'inline-flex',
//             alignItems: 'center',
//             gap: '10px',
//           }}
//         >
//           {loading ? (
//             <>
//               <LoaderCircle size={18} /> Saving...
//             </>
//           ) : (
//             <>
//               Continue <ArrowRight size={18} />
//             </>
//           )}
//         </button>
//       </section>
//     </main>
//   )
// }

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  BriefcaseBusiness,
  ArrowRight,
  LoaderCircle,
  ArrowLeft,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import '../App.css'

export default function Onboarding() {
  const navigate = useNavigate()

  const [careerStage, setCareerStage] = useState('')
  const [yearsExperience, setYearsExperience] = useState('1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleContinue() {
    if (!careerStage) {
      setError('Please choose your career path to continue.')
      return
    }

    const experience =
      careerStage === 'recent_graduate' ? 0 : Number(yearsExperience)

    if (
      careerStage === 'working_professional' &&
      (!Number.isInteger(experience) ||
        experience < 0 ||
        experience > 60)
    ) {
      setError('Enter a valid number of years of work experience.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError

      if (!user) {
        throw new Error('Your session has expired. Please sign in again.')
      }

      const { error: saveError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            career_stage: careerStage,
            years_experience: experience,
            onboarding_completed: true,
          },
          { onConflict: 'id' }
        )

      if (saveError) throw saveError

      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(
        err.message ||
          'Unable to save your selection. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const cardStyle = (selected) => ({
    flex: '1 1 240px',
    padding: '28px 22px',
    border: selected
      ? '2px solid #00998A'
      : '1px solid #E0D4BD',
    borderRadius: '18px',
    background: selected ? '#E3F3F0' : '#FFFFFF',
    color: '#16211F',
    cursor: 'pointer',
    textAlign: 'left',
  })

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#FAF6EF',
        padding: '32px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <section style={{ width: '100%', maxWidth: '900px' }}>
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate('/')}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 0',
            marginBottom: '24px',
            border: 'none',
            background: 'transparent',
            color: '#445250',
            fontSize: '15px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <ArrowLeft size={18} />
          Back to home
        </button>

        <p
          style={{
            color: '#00695C',
            fontWeight: 700,
            letterSpacing: '3px',
            fontSize: '12px',
          }}
        >
          YOUR NEXT CHAPTER
        </p>

        <h1
          style={{
            fontSize: 'clamp(30px, 5vw, 44px)',
            marginBottom: '12px',
          }}
        >
          How would you describe your career stage?
        </h1>

        <p
          style={{
            color: '#445250',
            lineHeight: 1.7,
            marginBottom: '30px',
          }}
        >
          We'll tailor MoveWise's relocation guidance to your
          career and financial situation. You can update these
          details later.
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '18px',
          }}
        >
          <button
            type="button"
            aria-pressed={careerStage === 'recent_graduate'}
            onClick={() => {
              setCareerStage('recent_graduate')
              setYearsExperience('0')
              setError('')
            }}
            style={cardStyle(careerStage === 'recent_graduate')}
          >
            <GraduationCap size={32} color="#00695C" />

            <h2 style={{ fontSize: '22px', margin: '16px 0 8px' }}>
              Recent graduate
            </h2>

            <p style={{ color: '#445250', lineHeight: 1.6, margin: 0 }}>
              I'm starting my career or looking for my first
              full-time role.
            </p>
          </button>

          <button
            type="button"
            aria-pressed={careerStage === 'working_professional'}
            onClick={() => {
              setCareerStage('working_professional')
              setYearsExperience('1')
              setError('')
            }}
            style={cardStyle(careerStage === 'working_professional')}
          >
            <BriefcaseBusiness size={32} color="#00695C" />

            <h2 style={{ fontSize: '22px', margin: '16px 0 8px' }}>
              Working professional
            </h2>

            <p style={{ color: '#445250', lineHeight: 1.6, margin: 0 }}>
              I have work experience and am considering my next
              opportunity.
            </p>
          </button>
        </div>

        {careerStage === 'working_professional' && (
          <div style={{ marginTop: '24px', maxWidth: '360px' }}>
            <label
              htmlFor="yearsExperience"
              style={{
                display: 'block',
                fontWeight: 600,
                marginBottom: '8px',
              }}
            >
              Years of work experience
            </label>

            <input
              id="yearsExperience"
              type="number"
              min="0"
              max="60"
              step="1"
              value={yearsExperience}
              onChange={(event) =>
                setYearsExperience(event.target.value)
              }
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '13px 14px',
                border: '1px solid #E0D4BD',
                borderRadius: '10px',
                background: '#FFFFFF',
                fontSize: '16px',
              }}
            />
          </div>
        )}

        {error && (
          <p
            role="alert"
            style={{ color: '#B42318', marginTop: '18px' }}
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={loading || !careerStage}
          style={{
            marginTop: '28px',
            padding: '14px 22px',
            border: 'none',
            borderRadius: '10px',
            background:
              loading || !careerStage ? '#9ABDB7' : '#00998A',
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 600,
            cursor:
              loading || !careerStage ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {loading ? (
            <>
              <LoaderCircle size={18} />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </section>
    </main>
  )
}
