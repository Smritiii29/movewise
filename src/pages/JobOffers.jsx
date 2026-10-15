// // import { useEffect, useState } from 'react'
// // import {
// //   Building2,
// //   MapPin,
// //   Plus,
// //   IndianRupee,
// //   LoaderCircle,
// //   Trash2,
// // } from 'lucide-react'
// // import { supabase } from '../lib/supabase'
// // import '../App.css'

// // const API_URL = 'http://localhost:3000/api'

// // const initialForm = {
// //   company_name: '',
// //   role_title: '',
// //   destination_city: '',
// //   annual_ctc: '',
// //   monthly_take_home: '',
// //   monthly_rent: '',
// //   monthly_food: '',
// //   monthly_transport: '',
// //   monthly_utilities: '',
// //   monthly_other_expenses: '',
// //   monthly_emi: '',
// //   relocation_cost: '',
// //   joining_bonus: '',
// //   relocation_assistance: '',
// // }

// // const money = (value) =>
// //   new Intl.NumberFormat('en-IN', {
// //     style: 'currency',
// //     currency: 'INR',
// //     maximumFractionDigits: 0,
// //   }).format(Number(value || 0))

// // export default function JobOffers() {
// //   const [form, setForm] = useState(initialForm)
// //   const [offers, setOffers] = useState([])
// //   const [loading, setLoading] = useState(true)
// //   const [saving, setSaving] = useState(false)
// //   const [error, setError] = useState('')
// //   const [success, setSuccess] = useState('')

// //   async function getToken() {
// //     const { data, error } = await supabase.auth.getSession()

// //     if (error) throw error
// //     if (!data.session) throw new Error('Please log in to continue.')

// //     return data.session.access_token
// //   }

// //   async function loadOffers() {
// //     setLoading(true)
// //     setError('')

// //     try {
// //       const token = await getToken()
// //       const response = await fetch(`${API_URL}/offers`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       })
// //       const result = await response.json()

// //       if (!response.ok) throw new Error(result.message || 'Could not load offers.')

// //       setOffers(result.offers)
// //     } catch (err) {
// //       setError(err.message || 'Could not load offers. Is the backend running?')
// //     } finally {
// //       setLoading(false)
// //     }
// //   }

// //   useEffect(() => {
// //     loadOffers()
// //   }, [])

// //   function handleChange(event) {
// //     const { name, value } = event.target
// //     setForm((previous) => ({ ...previous, [name]: value }))
// //   }

// //   async function handleSubmit(event) {
// //     event.preventDefault()
// //     setSaving(true)
// //     setError('')
// //     setSuccess('')

// //     try {
// //       const token = await getToken()
// //       const response = await fetch(`${API_URL}/offers`, {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/json',
// //           Authorization: `Bearer ${token}`,
// //         },
// //         body: JSON.stringify(form),
// //       })

// //       const result = await response.json()

// //       if (!response.ok) throw new Error(result.message || 'Could not save offer.')

// //       setOffers((previous) => [result.offer, ...previous])
// //       setForm(initialForm)
// //       setSuccess('Your job offer has been saved successfully.')
// //     } catch (err) {
// //       setError(err.message || 'Could not save your offer.')
// //     } finally {
// //       setSaving(false)
// //     }
// //   }

// //   const expenseFields = [
// //     ['monthly_rent', 'Monthly rent'],
// //     ['monthly_food', 'Monthly food'],
// //     ['monthly_transport', 'Monthly transport'],
// //     ['monthly_utilities', 'Monthly utilities'],
// //     ['monthly_other_expenses', 'Other monthly expenses'],
// //     ['monthly_emi', 'Monthly EMI'],
// //   ]

// //   return (
// //     <main className="offers-page">
// //       <header className="offers-heading">
// //         <div>
// //           <span className="offers-eyebrow">YOUR CAREER, YOUR NEXT MOVE</span>
// //           <h1>Job offers</h1>
// //           <p>Keep your opportunities in one place and prepare to compare them.</p>
// //         </div>

// //         <div className="offers-count">
// //           <Building2 size={20} />
// //           <div>
// //             <strong>{offers.length}</strong>
// //             <span>Saved offers</span>
// //           </div>
// //         </div>
// //       </header>

// //       {error && <div className="offers-alert offers-error">{error}</div>}
// //       {success && <div className="offers-alert offers-success">{success}</div>}

// //       <div className="offers-layout">
// //         <section className="offers-form-card">
// //           <div className="offers-section-heading">
// //             <span className="offers-icon"><Plus size={19} /></span>
// //             <div>
// //               <h2>Add a job offer</h2>
// //               <p>Enter the details of the opportunity you're considering.</p>
// //             </div>
// //           </div>

// //           <form onSubmit={handleSubmit} className="offers-form">
// //             <h3>Role details</h3>

// //             <div className="offers-fields">
// //               <label>
// //                 Company name *
// //                 <input
// //                   name="company_name"
// //                   value={form.company_name}
// //                   onChange={handleChange}
// //                   placeholder="e.g. Acme Technologies"
// //                   required
// //                 />
// //               </label>

// //               <label>
// //                 Job title *
// //                 <input
// //                   name="role_title"
// //                   value={form.role_title}
// //                   onChange={handleChange}
// //                   placeholder="e.g. Software Engineer"
// //                   required
// //                 />
// //               </label>

// //               <label>
// //                 Destination city *
// //                 <input
// //                   name="destination_city"
// //                   value={form.destination_city}
// //                   onChange={handleChange}
// //                   placeholder="e.g. Bengaluru"
// //                   required
// //                 />
// //               </label>

// //               <label>
// //                 Annual CTC (₹) *
// //                 <input
// //                   type="number"
// //                   min="0"
// //                   step="any"
// //                   name="annual_ctc"
// //                   value={form.annual_ctc}
// //                   onChange={handleChange}
// //                   placeholder="1200000"
// //                   required
// //                 />
// //               </label>

// //               <label className="offers-full-width">
// //                 Monthly take-home salary (₹) *
// //                 <input
// //                   type="number"
// //                   min="0"
// //                   step="any"
// //                   name="monthly_take_home"
// //                   value={form.monthly_take_home}
// //                   onChange={handleChange}
// //                   placeholder="80000"
// //                   required
// //                 />
// //                 <small>Enter your estimated monthly salary after deductions.</small>
// //               </label>
// //             </div>

// //             <div className="offers-form-divider" />
// //             <h3>Estimated monthly expenses</h3>

// //             <div className="offers-fields">
// //               {expenseFields.map(([name, label]) => (
// //                 <label key={name}>
// //                   {label} (₹)
// //                   <input
// //                     type="number"
// //                     min="0"
// //                     step="any"
// //                     name={name}
// //                     value={form[name]}
// //                     onChange={handleChange}
// //                     placeholder="0"
// //                   />
// //                 </label>
// //               ))}
// //             </div>

// //             <div className="offers-form-divider" />
// //             <h3>Relocation and bonuses</h3>

// //             <div className="offers-fields">
// //               <label>
// //                 One-time relocation cost (₹)
// //                 <input
// //                   type="number"
// //                   min="0"
// //                   step="any"
// //                   name="relocation_cost"
// //                   value={form.relocation_cost}
// //                   onChange={handleChange}
// //                   placeholder="20000"
// //                 />
// //               </label>

// //               <label>
// //                 Joining bonus (₹)
// //                 <input
// //                   type="number"
// //                   min="0"
// //                   step="any"
// //                   name="joining_bonus"
// //                   value={form.joining_bonus}
// //                   onChange={handleChange}
// //                   placeholder="0"
// //                 />
// //               </label>

// //               <label className="offers-full-width">
// //                 Relocation assistance (₹)
// //                 <input
// //                   type="number"
// //                   min="0"
// //                   step="any"
// //                   name="relocation_assistance"
// //                   value={form.relocation_assistance}
// //                   onChange={handleChange}
// //                   placeholder="0"
// //                 />
// //               </label>
// //             </div>

// //             <button type="submit" className="offers-submit" disabled={saving}>
// //               {saving ? (
// //                 <><LoaderCircle size={17} className="offers-spinner" /> Saving offer...</>
// //               ) : (
// //                 <><Plus size={17} /> Save job offer</>
// //               )}
// //             </button>
// //           </form>
// //         </section>

// //         <aside className="offers-saved-section">
// //           <div className="offers-section-heading">
// //             <div>
// //               <h2>Your opportunities</h2>
// //               <p>Your saved offers, available whenever you return.</p>
// //             </div>
// //           </div>

// //           {loading ? (
// //             <div className="offers-empty">
// //               <LoaderCircle size={24} className="offers-spinner" />
// //               <p>Loading your offers...</p>
// //             </div>
// //           ) : offers.length === 0 ? (
// //             <div className="offers-empty">
// //               <Building2 size={30} />
// //               <h3>Your next opportunity starts here</h3>
// //               <p>Add your first offer to begin building your relocation comparison.</p>
// //             </div>
// //           ) : (
// //             <div className="offers-list">
// //               {offers.map((offer) => (
// //                 <article className="offer-card" key={offer.id}>
// //                   <div className="offer-card-top">
// //                     <span className="offers-icon"><Building2 size={19} /></span>
// //                     <span className="offer-label">JOB OFFER</span>
// //                   </div>

// //                   <h3>{offer.role_title}</h3>
// //                   <p className="offer-company">{offer.company_name}</p>
// //                   <p className="offer-city">
// //                     <MapPin size={15} /> {offer.destination_city}
// //                   </p>

// //                   <div className="offer-salary">
// //                     <IndianRupee size={19} />
// //                     <div>
// //                       <strong>{money(offer.monthly_take_home)}</strong>
// //                       <span>Monthly take-home</span>
// //                     </div>
// //                   </div>

// //                   <div className="offer-card-bottom">
// //                     <span>Annual CTC</span>
// //                     <strong>{money(offer.annual_ctc)}</strong>
// //                   </div>
// //                 </article>
// //               ))}
// //             </div>
// //           )}
// //         </aside>
// //       </div>
// //     </main>
// //   )
// // }

// import { useEffect, useState } from 'react'
// import {
//   Building2,
//   MapPin,
//   Plus,
//   IndianRupee,
//   LoaderCircle,
//   Trash2,
// } from 'lucide-react'
// import { supabase } from '../lib/supabase'
// import '../App.css'

// const API_URL = 'http://localhost:3000/api'

// const initialForm = {
//   company_name: '',
//   role_title: '',
//   destination_city: '',
//   annual_ctc: '',
//   monthly_take_home: '',
//   monthly_rent: '',
//   monthly_food: '',
//   monthly_transport: '',
//   monthly_utilities: '',
//   monthly_other_expenses: '',
//   monthly_emi: '',
//   relocation_cost: '',
//   joining_bonus: '',
//   relocation_assistance: '',
// }

// const money = (value) =>
//   new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//     maximumFractionDigits: 0,
//   }).format(Number(value || 0))

// export default function JobOffers() {
//   const [form, setForm] = useState(initialForm)
//   const [offers, setOffers] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [saving, setSaving] = useState(false)
//   const [deletingId, setDeletingId] = useState(null)
//   const [error, setError] = useState('')
//   const [success, setSuccess] = useState('')

//   async function getToken() {
//     const { data, error } = await supabase.auth.getSession()

//     if (error) throw error
//     if (!data.session) throw new Error('Please log in to continue.')

//     return data.session.access_token
//   }

//   async function loadOffers() {
//     setLoading(true)
//     setError('')

//     try {
//       const token = await getToken()
//       const response = await fetch(`${API_URL}/offers`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       const result = await response.json()

//       if (!response.ok) {
//         throw new Error(result.message || 'Could not load offers.')
//       }

//       setOffers(result.offers)
//     } catch (err) {
//       setError(err.message || 'Could not load offers. Is the backend running?')
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     loadOffers()
//   }, [])

//   function handleChange(event) {
//     const { name, value } = event.target
//     setForm((previous) => ({ ...previous, [name]: value }))
//   }

//   async function handleSubmit(event) {
//     event.preventDefault()
//     setSaving(true)
//     setError('')
//     setSuccess('')

//     try {
//       const token = await getToken()
//       const response = await fetch(`${API_URL}/offers`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(form),
//       })

//       const result = await response.json()

//       if (!response.ok) {
//         throw new Error(result.message || 'Could not save offer.')
//       }

//       setOffers((previous) => [result.offer, ...previous])
//       setForm(initialForm)
//       setSuccess('Your job offer has been saved successfully.')
//     } catch (err) {
//       setError(err.message || 'Could not save your offer.')
//     } finally {
//       setSaving(false)
//     }
//   }

//   async function handleDelete(offerId) {
//     const confirmed = window.confirm(
//       'Are you sure you want to delete this job offer?'
//     )

//     if (!confirmed) return

//     setDeletingId(offerId)
//     setError('')
//     setSuccess('')

//     try {
//       const token = await getToken()
//       const response = await fetch(`${API_URL}/offers/${offerId}`, {
//         method: 'DELETE',
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       })

//       const result = await response.json()

//       if (!response.ok) {
//         throw new Error(result.message || 'Could not delete offer.')
//       }

//       setOffers((previous) =>
//         previous.filter((offer) => offer.id !== offerId)
//       )
//       setSuccess('Job offer deleted successfully.')
//     } catch (err) {
//       setError(err.message || 'Could not delete offer.')
//     } finally {
//       setDeletingId(null)
//     }
//   }

//   const expenseFields = [
//     ['monthly_rent', 'Monthly rent'],
//     ['monthly_food', 'Monthly food'],
//     ['monthly_transport', 'Monthly transport'],
//     ['monthly_utilities', 'Monthly utilities'],
//     ['monthly_other_expenses', 'Other monthly expenses'],
//     ['monthly_emi', 'Monthly EMI'],
//   ]

//   return (
//     <main className="offers-page">
//       <header className="offers-heading">
//         <div>
//           <span className="offers-eyebrow">YOUR CAREER, YOUR NEXT MOVE</span>
//           <h1>Job offers</h1>
//           <p>Keep your opportunities in one place and prepare to compare them.</p>
//         </div>

//         <div className="offers-count">
//           <Building2 size={20} />
//           <div>
//             <strong>{offers.length}</strong>
//             <span>Saved offers</span>
//           </div>
//         </div>
//       </header>

//       {error && <div className="offers-alert offers-error">{error}</div>}
//       {success && <div className="offers-alert offers-success">{success}</div>}

//       <div className="offers-layout">
//         <section className="offers-form-card">
//           <div className="offers-section-heading">
//             <span className="offers-icon"><Plus size={19} /></span>
//             <div>
//               <h2>Add a job offer</h2>
//               <p>Enter the details of the opportunity you're considering.</p>
//             </div>
//           </div>

//           <form onSubmit={handleSubmit} className="offers-form">
//             <h3>Role details</h3>

//             <div className="offers-fields">
//               <label>
//                 Company name *
//                 <input
//                   name="company_name"
//                   value={form.company_name}
//                   onChange={handleChange}
//                   placeholder="e.g. Acme Technologies"
//                   required
//                 />
//               </label>

//               <label>
//                 Job title *
//                 <input
//                   name="role_title"
//                   value={form.role_title}
//                   onChange={handleChange}
//                   placeholder="e.g. Software Engineer"
//                   required
//                 />
//               </label>

//               <label>
//                 Destination city *
//                 <input
//                   name="destination_city"
//                   value={form.destination_city}
//                   onChange={handleChange}
//                   placeholder="e.g. Bengaluru"
//                   required
//                 />
//               </label>

//               <label>
//                 Annual CTC (₹) *
//                 <input
//                   type="number"
//                   min="0"
//                   step="any"
//                   name="annual_ctc"
//                   value={form.annual_ctc}
//                   onChange={handleChange}
//                   placeholder="1200000"
//                   required
//                 />
//               </label>

//               <label className="offers-full-width">
//                 Monthly take-home salary (₹) *
//                 <input
//                   type="number"
//                   min="0"
//                   step="any"
//                   name="monthly_take_home"
//                   value={form.monthly_take_home}
//                   onChange={handleChange}
//                   placeholder="80000"
//                   required
//                 />
//                 <small>Enter your estimated monthly salary after deductions.</small>
//               </label>
//             </div>

//             <div className="offers-form-divider" />
//             <h3>Estimated monthly expenses</h3>

//             <div className="offers-fields">
//               {expenseFields.map(([name, label]) => (
//                 <label key={name}>
//                   {label} (₹)
//                   <input
//                     type="number"
//                     min="0"
//                     step="any"
//                     name={name}
//                     value={form[name]}
//                     onChange={handleChange}
//                     placeholder="0"
//                   />
//                 </label>
//               ))}
//             </div>

//             <div className="offers-form-divider" />
//             <h3>Relocation and bonuses</h3>

//             <div className="offers-fields">
//               <label>
//                 One-time relocation cost (₹)
//                 <input
//                   type="number"
//                   min="0"
//                   step="any"
//                   name="relocation_cost"
//                   value={form.relocation_cost}
//                   onChange={handleChange}
//                   placeholder="20000"
//                 />
//               </label>

//               <label>
//                 Joining bonus (₹)
//                 <input
//                   type="number"
//                   min="0"
//                   step="any"
//                   name="joining_bonus"
//                   value={form.joining_bonus}
//                   onChange={handleChange}
//                   placeholder="0"
//                 />
//               </label>

//               <label className="offers-full-width">
//                 Relocation assistance (₹)
//                 <input
//                   type="number"
//                   min="0"
//                   step="any"
//                   name="relocation_assistance"
//                   value={form.relocation_assistance}
//                   onChange={handleChange}
//                   placeholder="0"
//                 />
//               </label>
//             </div>

//             <button type="submit" className="offers-submit" disabled={saving}>
//               {saving ? (
//                 <><LoaderCircle size={17} className="offers-spinner" /> Saving offer...</>
//               ) : (
//                 <><Plus size={17} /> Save job offer</>
//               )}
//             </button>
//           </form>
//         </section>

//         <aside className="offers-saved-section">
//           <div className="offers-section-heading">
//             <div>
//               <h2>Your opportunities</h2>
//               <p>Your saved offers, available whenever you return.</p>
//             </div>
//           </div>

//           {loading ? (
//             <div className="offers-empty">
//               <LoaderCircle size={24} className="offers-spinner" />
//               <p>Loading your offers...</p>
//             </div>
//           ) : offers.length === 0 ? (
//             <div className="offers-empty">
//               <Building2 size={30} />
//               <h3>Your next opportunity starts here</h3>
//               <p>Add your first offer to begin building your relocation comparison.</p>
//             </div>
//           ) : (
//             <div className="offers-list">
//               {offers.map((offer) => (
//                 <article className="offer-card" key={offer.id}>
//                   <div className="offer-card-top">
//                     <span className="offers-icon"><Building2 size={19} /></span>

//                     <div className="offer-card-actions">
//                       <span className="offer-label">JOB OFFER</span>
//                       <button
//                         type="button"
//                         className="offer-delete-button"
//                         onClick={() => handleDelete(offer.id)}
//                         disabled={deletingId === offer.id}
//                         aria-label={`Delete ${offer.company_name} offer`}
//                         title="Delete offer"
//                       >
//                         {deletingId === offer.id ? (
//                           <LoaderCircle size={16} className="offers-spinner" />
//                         ) : (
//                           <Trash2 size={16} />
//                         )}
//                       </button>
//                     </div>
//                   </div>

//                   <h3>{offer.role_title}</h3>
//                   <p className="offer-company">{offer.company_name}</p>
//                   <p className="offer-city">
//                     <MapPin size={15} /> {offer.destination_city}
//                   </p>

//                   <div className="offer-salary">
//                     <IndianRupee size={19} />
//                     <div>
//                       <strong>{money(offer.monthly_take_home)}</strong>
//                       <span>Monthly take-home</span>
//                     </div>
//                   </div>

//                   <div className="offer-card-bottom">
//                     <span>Annual CTC</span>
//                     <strong>{money(offer.annual_ctc)}</strong>
//                   </div>
//                 </article>
//               ))}
//             </div>
//           )}
//         </aside>
//       </div>
//     </main>
//   )
// }

import { useEffect, useState } from 'react'
import {
  Building2,
  MapPin,
  Plus,
  IndianRupee,
  LoaderCircle,
  Trash2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import '../App.css'

const API_URL = 'http://localhost:3000/api'

const initialForm = {
  company_name: '',
  role_title: '',
  destination_city: '',
  annual_ctc: '',
  monthly_take_home: '',
  monthly_rent: '',
  monthly_food: '',
  monthly_transport: '',
  monthly_utilities: '',
  monthly_other_expenses: '',
  monthly_emi: '',
  relocation_cost: '',
  joining_bonus: '',
  relocation_assistance: '',
}

const expenseFields = [
  ['monthly_rent', 'Monthly rent'],
  ['monthly_food', 'Monthly food'],
  ['monthly_transport', 'Monthly transport'],
  ['monthly_utilities', 'Monthly utilities'],
  ['monthly_other_expenses', 'Other monthly expenses'],
]

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

export default function JobOffers() {
  const [form, setForm] = useState(initialForm)
  const [offers, setOffers] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingCities, setLoadingCities] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function getToken() {
    const { data, error } = await supabase.auth.getSession()

    if (error) throw error
    if (!data.session) throw new Error('Please log in to continue.')

    return data.session.access_token
  }

  async function loadOffers() {
    setLoading(true)

    try {
      const token = await getToken()
      const response = await fetch(`${API_URL}/offers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Could not load offers.')
      }

      setOffers(result.offers)
    } catch (err) {
      setError(err.message || 'Could not load offers. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  async function loadReferenceData() {
    setLoadingCities(true)

    try {
      const { data: cityData, error: cityError } = await supabase
        .from('city_data')
        .select(
          'city, monthly_rent, monthly_food, monthly_transport, monthly_utilities, monthly_other_expenses'
        )
        .order('city')

      if (cityError) throw cityError

      setCities(cityData || [])

      // Use the saved profile EMI as the initial value.
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession()

      if (sessionError) throw sessionError

      const user = sessionData.session?.user

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('monthly_emi')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) throw profileError

        if (profile?.monthly_emi != null) {
          setForm((previous) => ({
            ...previous,
            monthly_emi: String(profile.monthly_emi),
          }))
        }
      }
    } catch (err) {
      setError(
        err.message ||
          'Could not load city estimates or profile information.'
      )
    } finally {
      setLoadingCities(false)
    }
  }

  useEffect(() => {
    async function initialize() {
      try {
        await Promise.all([loadOffers(), loadReferenceData()])
      } catch {
        // Errors are captured within loadOffers and loadReferenceData
      }
    }

    initialize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleChange(event) {
    const { name, value } = event.target

    if (name === 'destination_city') {
      const city = cities.find((item) => item.city === value)

      setForm((previous) => ({
        ...previous,
        destination_city: value,
        monthly_rent:
          city ? String(city.monthly_rent ?? 0) : '',
        monthly_food:
          city ? String(city.monthly_food ?? 0) : '',
        monthly_transport:
          city ? String(city.monthly_transport ?? 0) : '',
        monthly_utilities:
          city ? String(city.monthly_utilities ?? 0) : '',
        monthly_other_expenses:
          city ? String(city.monthly_other_expenses ?? 0) : '',
      }))

      setError('')
      setSuccess('')
      return
    }

    setForm((previous) => ({ ...previous, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const token = await getToken()
      const response = await fetch(`${API_URL}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Could not save offer.')
      }

      setOffers((previous) => [result.offer, ...previous])

      // Preserve the profile EMI when resetting the form.
      setForm({
        ...initialForm,
        monthly_emi: form.monthly_emi,
      })

      setSuccess('Your job offer has been saved successfully.')
    } catch (err) {
      setError(err.message || 'Could not save your offer.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(offerId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this job offer?'
    )

    if (!confirmed) return

    setDeletingId(offerId)
    setError('')
    setSuccess('')

    try {
      const token = await getToken()
      const response = await fetch(`${API_URL}/offers/${offerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Could not delete offer.')
      }

      setOffers((previous) =>
        previous.filter((offer) => offer.id !== offerId)
      )
      setSuccess('Job offer deleted successfully.')
    } catch (err) {
      setError(err.message || 'Could not delete offer.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="offers-page">
      <header className="offers-heading">
        <div>
          <span className="offers-eyebrow">YOUR CAREER, YOUR NEXT MOVE</span>
          <h1>Job offers</h1>
          <p>Keep your opportunities in one place and prepare to compare them.</p>
        </div>

        <div className="offers-count">
          <Building2 size={20} />
          <div>
            <strong>{offers.length}</strong>
            <span>Saved offers</span>
          </div>
        </div>
      </header>

      {error && <div className="offers-alert offers-error">{error}</div>}
      {success && <div className="offers-alert offers-success">{success}</div>}

      <div className="offers-layout">
        <section className="offers-form-card">
          <div className="offers-section-heading">
            <span className="offers-icon"><Plus size={19} /></span>
            <div>
              <h2>Add a job offer</h2>
              <p>Enter the details of the opportunity you're considering.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="offers-form">
            <h3>Role details</h3>

            <div className="offers-fields">
              <label>
                Company name *
                <input
                  name="company_name"
                  value={form.company_name}
                  onChange={handleChange}
                  placeholder="e.g. Acme Technologies"
                  required
                />
              </label>

              <label>
                Job title *
                <input
                  name="role_title"
                  value={form.role_title}
                  onChange={handleChange}
                  placeholder="e.g. Software Engineer"
                  required
                />
              </label>

              <label>
                Destination city *
                <select
                  name="destination_city"
                  value={form.destination_city}
                  onChange={handleChange}
                  required
                  disabled={loadingCities}
                >
                  <option value="">
                    {loadingCities ? 'Loading cities...' : 'Select a city'}
                  </option>
                  {cities.map((city) => (
                    <option key={city.city} value={city.city}>
                      {city.city}
                    </option>
                  ))}
                </select>
                <small>Choose a city to autofill estimated expenses.</small>
              </label>

              <label>
                Annual CTC (₹) *
                <input
                  type="number"
                  min="0"
                  step="any"
                  name="annual_ctc"
                  value={form.annual_ctc}
                  onChange={handleChange}
                  placeholder="1200000"
                  required
                />
              </label>

              <label className="offers-full-width">
                Monthly take-home salary (₹) *
                <input
                  type="number"
                  min="0"
                  step="any"
                  name="monthly_take_home"
                  value={form.monthly_take_home}
                  onChange={handleChange}
                  placeholder="80000"
                  required
                />
                <small>Enter the estimated monthly salary after deductions.</small>
              </label>
            </div>

            <div className="offers-form-divider" />
            <h3>Estimated monthly expenses</h3>
            <p className="offers-helper">
              These values come from our city estimates. Adjust them to match
              your expected lifestyle.
            </p>

            <div className="offers-fields">
              {expenseFields.map(([name, label]) => (
                <label key={name}>
                  {label} (₹)
                  <input
                    type="number"
                    min="0"
                    step="any"
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </label>
              ))}

              <label>
                Monthly EMI (₹)
                <input
                  type="number"
                  min="0"
                  step="any"
                  name="monthly_emi"
                  value={form.monthly_emi}
                  onChange={handleChange}
                  placeholder="From your profile"
                />
                <small>Prefilled from your profile; change if needed.</small>
              </label>
            </div>

            <div className="offers-form-divider" />
            <h3>Relocation and bonuses</h3>

            <div className="offers-fields">
              <label>
                One-time relocation cost (₹)
                <input
                  type="number"
                  min="0"
                  step="any"
                  name="relocation_cost"
                  value={form.relocation_cost}
                  onChange={handleChange}
                  placeholder="Estimated moving cost"
                />
              </label>

              <label>
                Joining bonus (₹)
                <input
                  type="number"
                  min="0"
                  step="any"
                  name="joining_bonus"
                  value={form.joining_bonus}
                  onChange={handleChange}
                  placeholder="0"
                />
              </label>

              <label className="offers-full-width">
                Relocation assistance (₹)
                <input
                  type="number"
                  min="0"
                  step="any"
                  name="relocation_assistance"
                  value={form.relocation_assistance}
                  onChange={handleChange}
                  placeholder="0"
                />
              </label>
            </div>

            <button type="submit" className="offers-submit" disabled={saving}>
              {saving ? (
                <><LoaderCircle size={17} className="offers-spinner" /> Saving offer...</>
              ) : (
                <><Plus size={17} /> Save job offer</>
              )}
            </button>
          </form>
        </section>

        <aside className="offers-saved-section">
          <div className="offers-section-heading">
            <div>
              <h2>Your opportunities</h2>
              <p>Your saved offers, available whenever you return.</p>
            </div>
          </div>

          {loading ? (
            <div className="offers-empty">
              <LoaderCircle size={24} className="offers-spinner" />
              <p>Loading your offers...</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="offers-empty">
              <Building2 size={30} />
              <h3>Your next opportunity starts here</h3>
              <p>Add your first offer to begin building your relocation comparison.</p>
            </div>
          ) : (
            <div className="offers-list">
              {offers.map((offer) => (
                <article className="offer-card" key={offer.id}>
                  <div className="offer-card-top">
                    <span className="offers-icon"><Building2 size={19} /></span>

                    <div className="offer-card-actions">
                      <span className="offer-label">JOB OFFER</span>
                      <button
                        type="button"
                        className="offer-delete-button"
                        onClick={() => handleDelete(offer.id)}
                        disabled={deletingId === offer.id}
                        aria-label={`Delete ${offer.company_name} offer`}
                        title="Delete offer"
                      >
                        {deletingId === offer.id ? (
                          <LoaderCircle size={16} className="offers-spinner" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <h3>{offer.role_title}</h3>
                  <p className="offer-company">{offer.company_name}</p>
                  <p className="offer-city">
                    <MapPin size={15} /> {offer.destination_city}
                  </p>

                  <div className="offer-salary">
                    <IndianRupee size={19} />
                    <div>
                      <strong>{money(offer.monthly_take_home)}</strong>
                      <span>Monthly take-home</span>
                    </div>
                  </div>

                  <div className="offer-card-bottom">
                    <span>Annual CTC</span>
                    <strong>{money(offer.annual_ctc)}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}
