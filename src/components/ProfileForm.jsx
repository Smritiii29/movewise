
// import { useEffect, useState } from 'react'
// import { Check, LoaderCircle, Save, UserRound } from 'lucide-react'
// import { supabase } from '../lib/supabase'
// import '../App.css'

// const initialForm = {
//   full_name: '',
//   current_city: '',
//   monthly_take_home: '',
//   monthly_expenses: '',
//   monthly_emi: '',
//   current_savings: '',
//   relocation_confidence: 3,
//   willingness_to_adapt: 3,
//   concerns: [],
//   priorities: {
//     savings: 3,
//     career: 3,
//     work_life: 3,
//     family: 3,
//   },
// }

// const concernOptions = [
//   'Financial uncertainty',
//   'Being away from family',
//   'Finding accommodation',
//   'Adapting to a new city',
//   'Work-life balance',
//   'Career uncertainty',
// ]

// const priorityOptions = [
//   { key: 'savings', label: 'Financial savings' },
//   { key: 'career', label: 'Career growth' },
//   { key: 'work_life', label: 'Work-life balance' },
//   { key: 'family', label: 'Family and support system' },
// ]

// function toNumber(value) {
//   return value === '' ? 0 : Number(value)
// }

// export default function ProfileForm({ user }) {
//   const [form, setForm] = useState(initialForm)
//   const [loading, setLoading] = useState(true)
//   const [saving, setSaving] = useState(false)
//   const [error, setError] = useState('')
//   const [success, setSuccess] = useState('')

//   useEffect(() => {
//     let active = true

//     async function loadProfile() {
//       if (!user?.id) {
//         setError('Please sign in to access your profile.')
//         setLoading(false)
//         return
//       }

//       setLoading(true)
//       setError('')

//       try {
//         const { data, error } = await supabase
//           .from('profiles')
//           .select('*')
//           .eq('id', user.id)
//           .maybeSingle()

//         if (error) throw error
//         if (!active) return

//         if (data) {
//           setForm({
//             ...initialForm,
//             ...data,
//             full_name:
//               data.full_name ||
//               user.user_metadata?.full_name ||
//               user.user_metadata?.name ||
//               '',
//             monthly_take_home: data.monthly_take_home ?? '',
//             monthly_expenses: data.monthly_expenses ?? '',
//             monthly_emi: data.monthly_emi ?? '',
//             current_savings: data.current_savings ?? '',
//             relocation_confidence: data.relocation_confidence ?? 3,
//             willingness_to_adapt: data.willingness_to_adapt ?? 3,
//             concerns: data.concerns ?? [],
//             priorities: {
//               ...initialForm.priorities,
//               ...(data.priorities ?? {}),
//             },
//           })
//         } else {
//           setForm((current) => ({
//             ...current,
//             full_name:
//               user.user_metadata?.full_name ||
//               user.user_metadata?.name ||
//               '',
//           }))
//         }
//       } catch (err) {
//         if (active) {
//           setError(err.message || 'Unable to load your profile.')
//         }
//       } finally {
//         if (active) setLoading(false)
//       }
//     }

//     loadProfile()

//     return () => {
//       active = false
//     }
//   }, [user])

//   function updateField(field, value) {
//     setForm((current) => ({ ...current, [field]: value }))
//     setError('')
//     setSuccess('')
//   }

//   function toggleConcern(concern) {
//     setForm((current) => ({
//       ...current,
//       concerns: current.concerns.includes(concern)
//         ? current.concerns.filter((item) => item !== concern)
//         : [...current.concerns, concern],
//     }))
//     setError('')
//     setSuccess('')
//   }

//   function updatePriority(key, value) {
//     setForm((current) => ({
//       ...current,
//       priorities: {
//         ...current.priorities,
//         [key]: Number(value),
//       },
//     }))
//     setError('')
//     setSuccess('')
//   }

//   async function handleSubmit(event) {
//     event.preventDefault()
//     setError('')
//     setSuccess('')

//     if (!form.full_name.trim() || !form.current_city.trim()) {
//       setError('Please enter your name and current city.')
//       return
//     }

//     const numericFields = [
//       ['Monthly take-home pay', form.monthly_take_home],
//       ['Monthly expenses', form.monthly_expenses],
//       ['Monthly EMI payments', form.monthly_emi],
//       ['Current savings', form.current_savings],
//     ]

//     for (const [label, value] of numericFields) {
//       if (value === '' || !Number.isFinite(Number(value)) || Number(value) < 0) {
//         setError(`${label} must be a valid non-negative number.`)
//         return
//       }
//     }

//     setSaving(true)

//     try {
//       const payload = {
//         id: user.id,
//         full_name: form.full_name.trim(),
//         current_city: form.current_city.trim(),
//         monthly_take_home: toNumber(form.monthly_take_home),
//         monthly_expenses: toNumber(form.monthly_expenses),
//         monthly_emi: toNumber(form.monthly_emi),
//         current_savings: toNumber(form.current_savings),
//         relocation_confidence: Number(form.relocation_confidence),
//         willingness_to_adapt: Number(form.willingness_to_adapt),
//         concerns: form.concerns,
//         priorities: form.priorities,
//       }

//       const { error } = await supabase
//         .from('profiles')
//         .upsert(payload, { onConflict: 'id' })

//       if (error) throw error

//       setSuccess('Your profile has been saved successfully.')
//     } catch (err) {
//       setError(err.message || 'Unable to save your profile. Please try again.')
//     } finally {
//       setSaving(false)
//     }
//   }

//   if (loading) {
//     return (
//       <section className="profile-state">
//         <LoaderCircle className="spin" size={24} />
//         <p>Loading your profile...</p>
//       </section>
//     )
//   }

//   return (
//     <section className="profile-form-page">
//       <div className="profile-form-heading">
//         <div>
//           <p className="eyebrow">YOUR FINANCIAL STARTING POINT</p>
//           <h2>My Profile</h2>
//           <p>
//             Tell us about your current situation so MoveWise can compare
//             relocation opportunities against your existing lifestyle.
//           </p>
//         </div>

//         <span className="profile-heading-icon">
//           <UserRound size={25} />
//         </span>
//       </div>

//       <form className="profile-form" onSubmit={handleSubmit}>
//         <section className="profile-section">
//           <div className="profile-section-heading">
//             <span className="profile-section-number">01</span>
//             <div>
//               <h3>About you</h3>
//               <p>Start with your name and current location.</p>
//             </div>
//           </div>

//           <div className="profile-fields-grid">
//             <label className="profile-field">
//               Full name
//               <input
//                 type="text"
//                 value={form.full_name}
//                 onChange={(event) =>
//                   updateField('full_name', event.target.value)
//                 }
//                 placeholder="Your full name"
//                 autoComplete="name"
//                 required
//               />
//             </label>

//             <label className="profile-field">
//               Current city
//               <input
//                 type="text"
//                 value={form.current_city}
//                 onChange={(event) =>
//                   updateField('current_city', event.target.value)
//                 }
//                 placeholder="e.g. Chennai"
//                 required
//               />
//             </label>
//           </div>
//         </section>

//         <section className="profile-section">
//           <div className="profile-section-heading">
//             <span className="profile-section-number">02</span>
//             <div>
//               <h3>Current finances</h3>
//               <p>Enter monthly amounts in your local currency (₹).</p>
//             </div>
//           </div>

//           <div className="profile-fields-grid">
//             <label className="profile-field">
//               Monthly take-home pay (₹)
//               <input
//                 type="number"
//                 min="0"
//                 step="0.01"
//                 value={form.monthly_take_home}
//                 onChange={(event) =>
//                   updateField('monthly_take_home', event.target.value)
//                 }
//                 placeholder="e.g. 65000"
//                 required
//               />
//             </label>

//             <label className="profile-field">
//               Monthly living expenses (₹)
//               <input
//                 type="number"
//                 min="0"
//                 step="0.01"
//                 value={form.monthly_expenses}
//                 onChange={(event) =>
//                   updateField('monthly_expenses', event.target.value)
//                 }
//                 placeholder="e.g. 20000"
//                 required
//               />
//             </label>

//             <label className="profile-field">
//               Monthly EMI payments (₹)
//               <input
//                 type="number"
//                 min="0"
//                 step="0.01"
//                 value={form.monthly_emi}
//                 onChange={(event) =>
//                   updateField('monthly_emi', event.target.value)
//                 }
//                 placeholder="Enter 0 if none"
//                 required
//               />
//             </label>

//             <label className="profile-field">
//               Current savings (₹)
//               <input
//                 type="number"
//                 min="0"
//                 step="0.01"
//                 value={form.current_savings}
//                 onChange={(event) =>
//                   updateField('current_savings', event.target.value)
//                 }
//                 placeholder="e.g. 150000"
//                 required
//               />
//             </label>
//           </div>

//           <p className="profile-help">
//             Enter your take-home pay after deductions, not your annual CTC.
//           </p>
//         </section>

//         <section className="profile-section">
//           <div className="profile-section-heading">
//             <span className="profile-section-number">03</span>
//             <div>
//               <h3>Personal readiness</h3>
//               <p>There is more to relocation than money.</p>
//             </div>
//           </div>

//           <div className="profile-rating">
//             <div>
//               <h4>How confident do you feel about relocating?</h4>
//               <p>1 = Not confident · 5 = Very confident</p>
//             </div>
//             <div className="rating-options">
//               {[1, 2, 3, 4, 5].map((value) => (
//                 <button
//                   key={value}
//                   type="button"
//                   className={
//                     Number(form.relocation_confidence) === value
//                       ? 'rating-button selected'
//                       : 'rating-button'
//                   }
//                   aria-pressed={Number(form.relocation_confidence) === value}
//                   onClick={() =>
//                     updateField('relocation_confidence', value)
//                   }
//                 >
//                   {value}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div className="profile-rating">
//             <div>
//               <h4>How willing are you to adapt to a new city?</h4>
//               <p>1 = Not willing · 5 = Very willing</p>
//             </div>
//             <div className="rating-options">
//               {[1, 2, 3, 4, 5].map((value) => (
//                 <button
//                   key={value}
//                   type="button"
//                   className={
//                     Number(form.willingness_to_adapt) === value
//                       ? 'rating-button selected'
//                       : 'rating-button'
//                   }
//                   aria-pressed={Number(form.willingness_to_adapt) === value}
//                   onClick={() => updateField('willingness_to_adapt', value)}
//                 >
//                   {value}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div className="profile-concerns">
//             <h4>What concerns you about relocating?</h4>
//             <p>Select all that apply.</p>
//             <div className="concern-options">
//               {concernOptions.map((concern) => (
//                 <label className="concern-option" key={concern}>
//                   <input
//                     type="checkbox"
//                     checked={form.concerns.includes(concern)}
//                     onChange={() => toggleConcern(concern)}
//                   />
//                   <span>{concern}</span>
//                 </label>
//               ))}
//             </div>
//           </div>
//         </section>

//         <section className="profile-section">
//           <div className="profile-section-heading">
//             <span className="profile-section-number">04</span>
//             <div>
//               <h3>Your priorities</h3>
//               <p>Rate how important each factor is to your decision.</p>
//             </div>
//           </div>

//           {priorityOptions.map(({ key, label }) => (
//             <label className="priority-row" key={key}>
//               <span>{label}</span>
//               <select
//                 value={form.priorities[key]}
//                 onChange={(event) => updatePriority(key, event.target.value)}
//               >
//                 <option value={1}>1 — Low</option>
//                 <option value={2}>2 — Somewhat low</option>
//                 <option value={3}>3 — Moderate</option>
//                 <option value={4}>4 — Important</option>
//                 <option value={5}>5 — Very important</option>
//               </select>
//             </label>
//           ))}
//         </section>

//         {error && (
//           <p className="profile-message profile-message-error" role="alert">
//             {error}
//           </p>
//         )}

//         {success && (
//           <p className="profile-message profile-message-success" role="status">
//             <Check size={17} />
//             {success}
//           </p>
//         )}

//         <div className="profile-form-footer">
//           <p>Your information is saved to your MoveWise account.</p>
//           <button
//             type="submit"
//             className="primary-button"
//             disabled={saving}
//           >
//             {saving ? (
//               <>
//                 <LoaderCircle className="spin" size={17} />
//                 Saving...
//               </>
//             ) : (
//               <>
//                 <Save size={17} />
//                 Save Profile
//               </>
//             )}
//           </button>
//         </div>
//       </form>
//     </section>
//   )
// }
import { useEffect, useState } from 'react'
import { Check, LoaderCircle, Save, UserRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import '../App.css'

const initialForm = {
  full_name: '',
  current_city: '',
  monthly_take_home: '',
  monthly_expenses: '',
  monthly_emi: '',
  current_savings: '',
  relocation_confidence: 3,
  willingness_to_adapt: 3,
  concerns: [],
  priorities: {
    savings: 3,
    career: 3,
    work_life: 3,
    family: 3,
  },
}

const concernOptions = [
  'Financial uncertainty',
  'Being away from family',
  'Finding accommodation',
  'Adapting to a new city',
  'Work-life balance',
  'Career uncertainty',
]

const priorityOptions = [
  { key: 'savings', label: 'Financial savings' },
  { key: 'career', label: 'Career growth' },
  { key: 'work_life', label: 'Work-life balance' },
  { key: 'family', label: 'Family and support system' },
]

function toNumber(value) {
  return value === '' ? 0 : Number(value)
}

export default function ProfileForm({ user, onProfileSaved }) {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  useEffect(() => {
    let active = true
    async function loadProfile() {
      if (!user?.id) {
        setError('Please sign in to access your profile.')
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        if (error) throw error
        if (!active) return
        if (data) {
          setForm({
            ...initialForm,
            ...data,
            full_name:
              data.full_name ||
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              '',
            monthly_take_home: data.monthly_take_home ?? '',
            monthly_expenses: data.monthly_expenses ?? '',
            monthly_emi: data.monthly_emi ?? '',
            current_savings: data.current_savings ?? '',
            relocation_confidence: data.relocation_confidence ?? 3,
            willingness_to_adapt: data.willingness_to_adapt ?? 3,
            concerns: data.concerns ?? [],
            priorities: {
              ...initialForm.priorities,
              ...(data.priorities ?? {}),
            },
          })
        } else {
          setForm((current) => ({
            ...current,
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              '',
          }))
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load your profile.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    loadProfile()
    return () => {
      active = false
    }
  }, [user])
  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
    setSuccess('')
  }
  function toggleConcern(concern) {
    setForm((current) => ({
      ...current,
      concerns: current.concerns.includes(concern)
        ? current.concerns.filter((item) => item !== concern)
        : [...current.concerns, concern],
    }))
    setError('')
    setSuccess('')
  }
  function updatePriority(key, value) {
    setForm((current) => ({
      ...current,
      priorities: {
        ...current.priorities,
        [key]: Number(value),
      },
    }))
    setError('')
    setSuccess('')
  }
  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!form.full_name.trim() || !form.current_city.trim()) {
      setError('Please enter your name and current city.')
      return
    }
    const numericFields = [
      ['Monthly take-home pay', form.monthly_take_home],
      ['Monthly expenses', form.monthly_expenses],
      ['Monthly EMI payments', form.monthly_emi],
      ['Current savings', form.current_savings],
    ]
    for (const [label, value] of numericFields) {
      if (value === '' || !Number.isFinite(Number(value)) || Number(value) < 0) {
        setError(`${label} must be a valid non-negative number.`)
        return
      }
    }
    setSaving(true)
    try {
      const payload = {
        id: user.id,
        full_name: form.full_name.trim(),
        current_city: form.current_city.trim(),
        monthly_take_home: toNumber(form.monthly_take_home),
        monthly_expenses: toNumber(form.monthly_expenses),
        monthly_emi: toNumber(form.monthly_emi),
        current_savings: toNumber(form.current_savings),
        relocation_confidence: Number(form.relocation_confidence),
        willingness_to_adapt: Number(form.willingness_to_adapt),
        concerns: form.concerns,
        priorities: form.priorities,
      }
      const { error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
      if (error) throw error
      onProfileSaved?.(payload.full_name)
      setSuccess('Your profile has been saved successfully.')
    } catch (err) {
      setError(err.message || 'Unable to save your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }
  if (loading) {
    return (
      <section className="profile-state">
        <LoaderCircle className="spin" size={24} />
        <p>Loading your profile...</p>
      </section>
    )
  }
  return (
    <section className="profile-form-page">
      <div className="profile-form-heading">
        <div>
          <p className="eyebrow">YOUR FINANCIAL STARTING POINT</p>
          <h2>My Profile</h2>
          <p>
            Tell us about your current situation so MoveWise can compare
            relocation opportunities against your existing lifestyle.
          </p>
        </div>
        <span className="profile-heading-icon">
          <UserRound size={25} />
        </span>
      </div>
      <form className="profile-form" onSubmit={handleSubmit}>
        <section className="profile-section">
          <div className="profile-section-heading">
            <span className="profile-section-number">01</span>
            <div>
              <h3>About you</h3>
              <p>Start with your name and current location.</p>
            </div>
          </div>
          <div className="profile-fields-grid">
            <label className="profile-field">
              Full name
              <input
                type="text"
                value={form.full_name}
                onChange={(event) =>
                  updateField('full_name', event.target.value)
                }
                placeholder="Your full name"
                autoComplete="name"
                required
              />
            </label>
            <label className="profile-field">
              Current city
              <input
                type="text"
                value={form.current_city}
                onChange={(event) =>
                  updateField('current_city', event.target.value)
                }
                placeholder="e.g. Chennai"
                required
              />
            </label>
          </div>
        </section>
        <section className="profile-section">
          <div className="profile-section-heading">
            <span className="profile-section-number">02</span>
            <div>
              <h3>Current finances</h3>
              <p>Enter monthly amounts in your local currency (₹).</p>
            </div>
          </div>
          <div className="profile-fields-grid">
            <label className="profile-field">
              Monthly take-home pay (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.monthly_take_home}
                onChange={(event) =>
                  updateField('monthly_take_home', event.target.value)
                }
                placeholder="e.g. 65000"
                required
              />
            </label>
            <label className="profile-field">
              Monthly living expenses (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.monthly_expenses}
                onChange={(event) =>
                  updateField('monthly_expenses', event.target.value)
                }
                placeholder="e.g. 20000"
                required
              />
            </label>
            <label className="profile-field">
              Monthly EMI payments (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.monthly_emi}
                onChange={(event) =>
                  updateField('monthly_emi', event.target.value)
                }
                placeholder="Enter 0 if none"
                required
              />
            </label>
            <label className="profile-field">
              Current savings (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.current_savings}
                onChange={(event) =>
                  updateField('current_savings', event.target.value)
                }
                placeholder="e.g. 150000"
                required
              />
            </label>
          </div>
          <p className="profile-help">
            Enter your take-home pay after deductions, not your annual CTC.
          </p>
        </section>
        <section className="profile-section">
          <div className="profile-section-heading">
            <span className="profile-section-number">03</span>
            <div>
              <h3>Personal readiness</h3>
              <p>There is more to relocation than money.</p>
            </div>
          </div>
          <div className="profile-rating">
            <div>
              <h4>How confident do you feel about relocating?</h4>
              <p>1 = Not confident · 5 = Very confident</p>
            </div>
            <div className="rating-options">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={
                    Number(form.relocation_confidence) === value
                      ? 'rating-button selected'
                      : 'rating-button'
                  }
                  aria-pressed={Number(form.relocation_confidence) === value}
                  onClick={() =>
                    updateField('relocation_confidence', value)
                  }
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className="profile-rating">
            <div>
              <h4>How willing are you to adapt to a new city?</h4>
              <p>1 = Not willing · 5 = Very willing</p>
            </div>
            <div className="rating-options">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={
                    Number(form.willingness_to_adapt) === value
                      ? 'rating-button selected'
                      : 'rating-button'
                  }
                  aria-pressed={Number(form.willingness_to_adapt) === value}
                  onClick={() => updateField('willingness_to_adapt', value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className="profile-concerns">
            <h4>What concerns you about relocating?</h4>
            <p>Select all that apply.</p>
            <div className="concern-options">
              {concernOptions.map((concern) => (
                <label className="concern-option" key={concern}>
                  <input
                    type="checkbox"
                    checked={form.concerns.includes(concern)}
                    onChange={() => toggleConcern(concern)}
                  />
                  <span>{concern}</span>
                </label>
              ))}
            </div>
          </div>
        </section>
        <section className="profile-section">
          <div className="profile-section-heading">
            <span className="profile-section-number">04</span>
            <div>
              <h3>Your priorities</h3>
              <p>Rate how important each factor is to your decision.</p>
            </div>
          </div>
          {priorityOptions.map(({ key, label }) => (
            <label className="priority-row" key={key}>
              <span>{label}</span>
              <select
                value={form.priorities[key]}
                onChange={(event) => updatePriority(key, event.target.value)}
              >
                <option value={1}>1 — Low</option>
                <option value={2}>2 — Somewhat low</option>
                <option value={3}>3 — Moderate</option>
                <option value={4}>4 — Important</option>
                <option value={5}>5 — Very important</option>
              </select>
            </label>
          ))}
        </section>
        {error && (
          <p className="profile-message profile-message-error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="profile-message profile-message-success" role="status">
            <Check size={17} />
            {success}
          </p>
        )}
        <div className="profile-form-footer">
          <p>Your information is saved to your MoveWise account.</p>
          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving ? (
              <>
                <LoaderCircle className="spin" size={17} />
                Saving...
              </>
            ) : (
              <>
                <Save size={17} />
                Save Profile
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  )
}
