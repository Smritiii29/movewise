/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */

// import { useEffect, useState } from 'react'
// import {
//   ArrowRight,
//   CalendarDays,
//   Check,
//   CheckCircle2,
//   ChevronRight,
//   Clock3,
//   Compass,
//   House,
//   Luggage,
//   MapPin,
//   Package,
//   Plane,
//   Wallet,
// } from 'lucide-react'
// import { supabase } from '../lib/supabase'

// const API_URL = 'http://localhost:3000/api'

// const initialTasks = [
//   { id: 1, title: 'Review and confirm your job offer', category: 'Career', timing: 'Before moving', done: false },
//   { id: 2, title: 'Research accommodation options', category: 'Housing', timing: '2–4 weeks before', done: false },
//   { id: 3, title: 'Estimate your moving expenses', category: 'Finance', timing: '2–4 weeks before', done: false },
//   { id: 4, title: 'Arrange travel to your new city', category: 'Travel', timing: '1–2 weeks before', done: false },
//   { id: 5, title: 'Prepare important documents', category: 'Documents', timing: '1 week before', done: false },
//   { id: 6, title: 'Pack essentials for your first week', category: 'Moving', timing: '2–3 days before', done: false },
//   { id: 7, title: 'Explore your neighbourhood', category: 'Settling in', timing: 'First week', done: false },
// ]

// const categoryIcons = {
//   Career: CheckCircle2,
//   Housing: House,
//   Finance: Wallet,
//   Travel: Plane,
//   Documents: Package,
//   Moving: Luggage,
//   'Settling in': Compass,
// }

// const formatMoney = (amount) =>
//   new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//     maximumFractionDigits: 0,
//   }).format(Number(amount || 0))

// export default function RelocationHub({ onOpenChecklist }) {
//   const [tasks, setTasks] = useState(initialTasks)
//   const [budget, setBudget] = useState(25000)
//   const [estimatedCost, setEstimatedCost] = useState(32000)

//   const [apartments, setApartments] = useState([])
//   const [apartmentsLoading, setApartmentsLoading] = useState(true)
//   const [apartmentsError, setApartmentsError] = useState('')

//   const [offers, setOffers] = useState([])
//   const [offersLoading, setOffersLoading] = useState(true)
//   const [offersError, setOffersError] = useState('')
//   const [selectedOfferId, setSelectedOfferId] = useState('')
//   const [profileBudget, setProfileBudget] = useState(null)

//   const completed = tasks.filter((task) => task.done).length
//   const progress = Math.round((completed / tasks.length) * 100)

//   const selectedOffer =
//     offers.find((offer) => offer.id === selectedOfferId) || null

//   // Employer benefits are displayed separately from personal savings.
//   const relocationAssistance = Math.max(
//     0,
//     Number(selectedOffer?.relocation_assistance || 0),
//   )

//   const joiningBonus = Math.max(
//     0,
//     Number(selectedOffer?.joining_bonus || 0),
//   )

//   // Estimate the remaining relocation expense after assistance.
//   const netRelocationCost = Math.max(
//     0,
//     estimatedCost - relocationAssistance,
//   )

//   const gap = Math.max(0, netRelocationCost - budget)
//   const remainingFunds = Math.max(0, budget - netRelocationCost)

//   const cityApartments = selectedOffer
//     ? apartments.filter(
//         (apartment) =>
//           apartment.city?.trim().toLowerCase() ===
//           selectedOffer.destination_city?.trim().toLowerCase(),
//       )
//     : apartments

//   function toggleTask(id) {
//     setTasks((current) =>
//       current.map((task) =>
//         task.id === id ? { ...task, done: !task.done } : task,
//       ),
//     )
//   }

//   // Load saved offers and the user's relocation budget.
//   useEffect(() => {
//     let active = true

//     async function fetchOffersAndProfile() {
//       setOffersLoading(true)
//       setOffersError('')

//       try {
//         const { data: sessionData, error: sessionError } =
//           await supabase.auth.getSession()

//         if (sessionError) throw sessionError

//         const session = sessionData.session

//         if (!session) {
//           throw new Error('Please log in to load your saved job offers.')
//         }

//         const response = await fetch(`${API_URL}/offers`, {
//           headers: {
//             Authorization: `Bearer ${session.access_token}`,
//           },
//         })

//         const result = await response.json()

//         if (!response.ok) {
//           throw new Error(
//             result.message || 'Could not load saved job offers.',
//           )
//         }

//         const loadedOffers = Array.isArray(result)
//           ? result
//           : result.offers || []

//         const { data: profile, error: profileError } = await supabase
//           .from('profiles')
//           .select('available_relocation_budget')
//           .eq('id', session.user.id)
//           .maybeSingle()

//         if (profileError) throw profileError
//         if (!active) return

//         setOffers(loadedOffers)

//         const savedBudget =
//           profile?.available_relocation_budget == null
//             ? null
//             : Number(profile.available_relocation_budget)

//         setProfileBudget(savedBudget)

//         if (savedBudget != null) {
//           setBudget(Math.max(0, savedBudget))
//         }

//         if (loadedOffers.length > 0) {
//           setSelectedOfferId((current) => {
//             if (current && loadedOffers.some((offer) => offer.id === current)) {
//               return current
//             }
//             return loadedOffers[0].id
//           })
//         }
//       } catch (err) {
//         if (active) {
//           setOffersError(err.message || 'Could not load your job offers.')
//         }
//       } finally {
//         if (active) setOffersLoading(false)
//       }
//     }

//     fetchOffersAndProfile()

//     return () => {
//       active = false
//     }
//   }, [])

//   // When the selected offer changes, load its relocation-cost estimate.
//   useEffect(() => {
//     if (!selectedOffer) return

//     setEstimatedCost(
//       Math.max(0, Number(selectedOffer.relocation_cost || 0)),
//     )
//   }, [selectedOfferId])

//   // Load accommodation options from Supabase.
//   useEffect(() => {
//     let active = true

//     async function fetchApartments() {
//       setApartmentsLoading(true)
//       setApartmentsError('')

//       const { data, error } = await supabase
//         .from('apartments')
//         .select('*')
//         .order('city', { ascending: true })
//         .order('monthly_rent', { ascending: true })

//       if (!active) return

//       if (error) {
//         setApartmentsError(error.message)
//         setApartments([])
//       } else {
//         setApartments(data ?? [])
//       }

//       setApartmentsLoading(false)
//     }

//     fetchApartments()

//     return () => {
//       active = false
//     }
//   }, [])

//   return (
//     <main className="min-h-screen bg-[#FAF6EF] px-5 py-8 text-[#16211F] md:px-10 lg:px-14">
//       <div className="mx-auto max-w-7xl space-y-8">

//         {/* Page heading */}
//         <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
//           <div>
//             <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#00998A]">
//               YOUR NEXT CHAPTER
//             </p>

//             <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
//               Relocation Hub<span className="text-[#00998A]">.</span>
//             </h1>

//             <p className="mt-2 max-w-xl text-sm leading-6 text-[#445250]">
//               Plan your budget, organize your tasks, and prepare for your next destination.
//             </p>
//           </div>

//           <div className="flex items-center gap-3 rounded-2xl border border-[#E4DED0] bg-white px-4 py-3">
//             <div className="flex size-11 items-center justify-center rounded-xl bg-[#E3F3F0] text-[#00695C]">
//               <Compass size={22} />
//             </div>

//             <div>
//               <p className="text-xs text-[#445250]">Your relocation plan</p>
//               <p className="font-semibold">
//                 {completed} of {tasks.length} tasks done
//               </p>
//             </div>
//           </div>
//         </header>

//         {/* Hero */}
//         <section className="relative overflow-hidden rounded-3xl bg-[#16211F] p-7 text-white md:p-10">
//           <div className="pointer-events-none absolute -right-12 -top-20 size-72 rounded-full border border-white/10" />

//           <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
//             <div>
//               <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-[#BDE8DE]">
//                 <MapPin size={14} />
//                 YOUR MOVE, YOUR PACE
//               </div>

//               <h2 className="max-w-lg text-2xl font-semibold leading-snug md:text-3xl">
//                 Big moves become easier when you break them into small steps.
//               </h2>

//               <p className="mt-3 max-w-lg text-sm leading-6 text-white/65">
//                 Choose a job offer, compare accommodation, and plan your relocation expenses.
//               </p>

//               <button
//                 type="button"
//                 onClick={() =>
//                   document
//                     .getElementById('relocation-checklist')
//                     ?.scrollIntoView({ behavior: 'smooth' })
//                 }
//                 className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#00998A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#007F73]"
//               >
//                 Continue planning <ArrowRight size={16} />
//               </button>
//             </div>

//             <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6">
//               <div className="mb-4 flex items-center justify-between">
//                 <span className="text-sm text-white/70">
//                   Preparation progress
//                 </span>
//                 <span className="text-lg font-semibold">{progress}%</span>
//               </div>

//               <div className="h-2 overflow-hidden rounded-full bg-white/10">
//                 <div
//                   className="h-full rounded-full bg-[#4FBFAD] transition-all"
//                   style={{ width: `${progress}%` }}
//                 />
//               </div>

//               <div className="mt-6 grid grid-cols-2 gap-3">
//                 <div className="rounded-xl bg-white/[0.06] p-4">
//                   <Clock3 size={18} className="mb-3 text-[#4FBFAD]" />
//                   <p className="text-xl font-semibold">
//                     {tasks.length - completed}
//                   </p>
//                   <p className="mt-1 text-xs text-white/60">Tasks remaining</p>
//                 </div>

//                 <div className="rounded-xl bg-white/[0.06] p-4">
//                   <CalendarDays size={18} className="mb-3 text-[#4FBFAD]" />
//                   <p className="text-xl font-semibold">4 stages</p>
//                   <p className="mt-1 text-xs text-white/60">
//                     Planning to settling in
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Job offer selector */}
//         <section className="rounded-2xl border border-[#E4DED0] bg-white p-5 md:p-7">
//           <p className="text-xs font-semibold uppercase tracking-wider text-[#00998A]">
//             PERSONALIZE YOUR MOVE
//           </p>

//           <h2 className="mt-2 text-xl font-semibold">Choose the job offer</h2>

//           <p className="mt-1 text-sm leading-6 text-[#445250]">
//             Your selected offer determines the destination, salary, and relocation benefits used below.
//           </p>

//           {offersLoading ? (
//             <p className="mt-5 rounded-xl bg-[#FAF6EF] p-4 text-sm text-[#445250]">
//               Loading your saved job offers...
//             </p>
//           ) : offersError ? (
//             <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
//               {offersError}
//             </div>
//           ) : offers.length === 0 ? (
//             <p className="mt-5 rounded-xl bg-[#FAF6EF] p-4 text-sm text-[#445250]">
//               No saved job offers found. Add an offer on the Job Offers page to personalize your relocation plan.
//             </p>
//           ) : (
//             <>
//               <label
//                 className="mt-5 block text-sm font-medium"
//                 htmlFor="relocation-offer"
//               >
//                 Select a saved offer
//               </label>

//               <select
//                 id="relocation-offer"
//                 value={selectedOfferId}
//                 onChange={(event) => setSelectedOfferId(event.target.value)}
//                 className="mt-2 w-full rounded-xl border border-[#E4DED0] bg-white px-4 py-3 text-sm outline-none focus:border-[#00998A] sm:max-w-2xl"
//               >
//                 {offers.map((offer) => (
//                   <option key={offer.id} value={offer.id}>
//                     {offer.role_title} · {offer.company_name} · {offer.destination_city}
//                   </option>
//                 ))}
//               </select>

//               {selectedOffer && (
//                 <>
//                   <div className="mt-4 grid gap-3 sm:grid-cols-3">
//                     <div className="rounded-xl bg-[#FAF6EF] p-4">
//                       <p className="text-xs text-[#445250]">Destination</p>
//                       <p className="mt-1 font-semibold">
//                         {selectedOffer.destination_city}
//                       </p>
//                     </div>

//                     <div className="rounded-xl bg-[#FAF6EF] p-4">
//                       <p className="text-xs text-[#445250]">
//                         Monthly take-home
//                       </p>
//                       <p className="mt-1 font-semibold">
//                         {formatMoney(selectedOffer.monthly_take_home)}
//                       </p>
//                     </div>

//                     <div className="rounded-xl bg-[#FAF6EF] p-4">
//                       <p className="text-xs text-[#445250]">
//                         Available personal funds
//                       </p>
//                       <p className="mt-1 font-semibold">
//                         {profileBudget == null
//                           ? 'Enter below'
//                           : formatMoney(profileBudget)}
//                       </p>
//                     </div>
//                   </div>

//                   {/* Joining bonus card */}
//                   <div className="mt-4 rounded-xl border border-[#E4DED0] bg-[#FAF6EF] p-4">
//                     <p className="text-xs text-[#445250]">
//                       Joining bonus (not included in available funds)
//                     </p>

//                     <p className="mt-1 text-lg font-semibold">
//                       {formatMoney(joiningBonus)}
//                     </p>

//                     <p className="mt-1 text-xs leading-5 text-[#445250]">
//                       This is the bonus entered for your selected offer. Actual take-home may differ because of tax, payment timing, and eligibility conditions.
//                     </p>
//                   </div>
//                 </>
//               )}
//             </>
//           )}
//         </section>

//         {/* Financial summary */}
//         <section className="grid gap-5 md:grid-cols-3">
//           <div className="rounded-2xl border border-[#E4DED0] bg-white p-5">
//             <div className="flex items-center justify-between">
//               <p className="text-sm text-[#445250]">Available personal funds</p>
//               <Wallet size={19} className="text-[#00998A]" />
//             </div>

//             <p className="mt-3 text-2xl font-semibold">
//               {formatMoney(budget)}
//             </p>

//             <p className="mt-2 text-xs text-[#445250]">
//               Your editable relocation budget
//             </p>
//           </div>

//           <div className="rounded-2xl border border-[#E4DED0] bg-white p-5">
//             <div className="flex items-center justify-between gap-2">
//               <p className="text-sm text-[#445250]">
//                 Cost after relocation assistance
//               </p>
//               <Luggage size={19} className="text-[#D9704A]" />
//             </div>

//             <p className="mt-3 text-2xl font-semibold">
//               {formatMoney(netRelocationCost)}
//             </p>

//             <p className="mt-2 text-xs leading-5 text-[#445250]">
//               Total estimated cost: {formatMoney(estimatedCost)}
//               {' · '}
//               Employer assistance: {formatMoney(relocationAssistance)}
//             </p>

//             <p className="mt-1 text-xs text-[#445250]">
//               Confirm the assistance amount and when it will be paid.
//             </p>
//           </div>

//           <div className="rounded-2xl border border-[#E4DED0] bg-white p-5">
//             <div className="flex items-center justify-between">
//               <p className="text-sm text-[#445250]">Funding gap</p>
//               <Compass size={19} className="text-[#5D84A8]" />
//             </div>

//             <p className="mt-3 text-2xl font-semibold">
//               {formatMoney(gap)}
//             </p>

//             <p className="mt-2 text-xs leading-5 text-[#445250]">
//               {gap > 0
//                 ? 'Additional funds needed after estimated employer relocation assistance.'
//                 : `Your estimated funds cover this cost, with ${formatMoney(remainingFunds)} remaining.`}
//             </p>
//           </div>
//         </section>

//         {/* Apartment listings */}
//         <section className="space-y-5">
//           <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
//             <div>
//               <p className="text-xs font-semibold uppercase tracking-wider text-[#00998A]">
//                 FIND YOUR NEXT HOME
//               </p>

//               <h2 className="mt-2 text-2xl font-semibold">
//                 Sample accommodation options
//               </h2>

//               <p className="mt-2 max-w-2xl text-sm leading-6 text-[#445250]">
//                 Compare rent and upfront costs in your selected destination. These are sample records, not verified or currently available properties.
//               </p>
//             </div>

//             <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#E3F3F0] px-3 py-2 text-xs font-semibold text-[#00695C]">
//               <House size={15} /> {cityApartments.length} sample options
//             </span>
//           </div>

//           {apartmentsLoading ? (
//             <div className="rounded-2xl border border-[#E4DED0] bg-white p-8 text-center text-sm text-[#445250]">
//               Loading accommodation options...
//             </div>
//           ) : apartmentsError ? (
//             <div className="rounded-2xl border border-red-200 bg-white p-5 text-sm text-red-700">
//               <p className="font-semibold">Could not load accommodation options.</p>
//               <p className="mt-1">{apartmentsError}</p>
//             </div>
//           ) : cityApartments.length === 0 ? (
//             <div className="rounded-2xl border border-[#E4DED0] bg-white p-8 text-center">
//               <House size={28} className="mx-auto text-[#00998A]" />

//               <p className="mt-3 font-semibold">No sample properties yet</p>

//               <p className="mt-1 text-sm text-[#445250]">
//                 {selectedOffer
//                   ? `No sample apartments are listed for ${selectedOffer.destination_city}. Add matching sample rows to your Supabase apartments table.`
//                   : 'Add sample rows to your apartments table and refresh this page.'}
//               </p>
//             </div>
//           ) : (
//             <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
//               {cityApartments.map((apartment) => {
//                 const moveInCost =
//                   Number(apartment.monthly_rent || 0) +
//                   Number(apartment.deposit || 0) +
//                   Number(apartment.brokerage || 0)

//                 return (
//                   <article
//                     key={apartment.id}
//                     className="flex flex-col rounded-2xl border border-[#E4DED0] bg-white p-5"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E3F3F0] text-[#00695C]">
//                         <House size={21} />
//                       </div>

//                       <span className="rounded-full bg-[#FAF6EF] px-2.5 py-1 text-[11px] font-medium text-[#445250]">
//                         {apartment.property_type}
//                       </span>
//                     </div>

//                     <h3 className="mt-4 text-lg font-semibold">
//                       {apartment.title}
//                     </h3>

//                     <p className="mt-1 flex items-center gap-1.5 text-sm text-[#445250]">
//                       <MapPin size={14} />
//                       {apartment.locality}, {apartment.city}
//                     </p>

//                     <div className="mt-5 rounded-xl bg-[#FAF6EF] p-3">
//                       <p className="text-xs text-[#445250]">Monthly rent</p>
//                       <p className="mt-1 text-xl font-semibold">
//                         {formatMoney(apartment.monthly_rent)}
//                       </p>
//                     </div>

//                     <div className="mt-4 grid grid-cols-2 gap-3">
//                       <div>
//                         <p className="text-xs text-[#445250]">Security deposit</p>
//                         <p className="mt-1 text-sm font-semibold">
//                           {formatMoney(apartment.deposit)}
//                         </p>
//                       </div>

//                       <div>
//                         <p className="text-xs text-[#445250]">Brokerage</p>
//                         <p className="mt-1 text-sm font-semibold">
//                           {formatMoney(apartment.brokerage)}
//                         </p>
//                       </div>

//                       <div>
//                         <p className="text-xs text-[#445250]">Furnishing</p>
//                         <p className="mt-1 text-sm font-semibold">
//                           {apartment.furnishing || 'Not specified'}
//                         </p>
//                       </div>

//                       <div>
//                         <p className="text-xs text-[#445250]">Commute estimate</p>
//                         <p className="mt-1 text-sm font-semibold">
//                           {apartment.commute_minutes != null
//                             ? `${apartment.commute_minutes} min`
//                             : 'Not specified'}
//                         </p>
//                       </div>
//                     </div>

//                     {apartment.description && (
//                       <p className="mt-4 text-sm leading-5 text-[#445250]">
//                         {apartment.description}
//                       </p>
//                     )}

//                     <div className="mt-auto pt-5">
//                       <div className="flex items-center justify-between gap-3 border-t border-[#EFE6D6] pt-4 text-sm">
//                         <span className="text-[#445250]">
//                           First month + deposit + brokerage
//                         </span>

//                         <span className="shrink-0 font-semibold">
//                           {formatMoney(moveInCost)}
//                         </span>
//                       </div>

//                       <p className="mt-2 text-[11px] leading-4 text-[#7A8581]">
//                         Illustrative move-in estimate. Check actual terms before making a decision.
//                       </p>
//                     </div>
//                   </article>
//                 )
//               })}
//             </div>
//           )}
//         </section>

//         {/* Relocation checklist and budget */}
//         <section className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
//           <div
//             id="relocation-checklist"
//             className="rounded-2xl border border-[#E4DED0] bg-white p-5 md:p-7"
//           >
//             <div className="flex flex-wrap items-start justify-between gap-3">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wider text-[#00998A]">
//                   YOUR ACTION PLAN
//                 </p>

//                 <h2 className="mt-2 text-xl font-semibold">
//                   Relocation checklist
//                 </h2>

//                 <p className="mt-1 text-sm text-[#445250]">
//                   Check off each step as you complete it.
//                 </p>
//               </div>

//               <span className="rounded-full bg-[#E3F3F0] px-3 py-1.5 text-xs font-semibold text-[#00695C]">
//                 {completed}/{tasks.length} complete
//               </span>
//             </div>

//             <div className="mt-6 space-y-2">
//               {tasks.map((task) => {
//                 const Icon = categoryIcons[task.category]

//                 return (
//                   <button
//                     key={task.id}
//                     type="button"
//                     onClick={() => toggleTask(task.id)}
//                     className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
//                       task.done
//                         ? 'border-[#C6E8DF] bg-[#F2FAF7]'
//                         : 'border-[#EFE6D6] bg-white hover:bg-[#FAF6EF]'
//                     }`}
//                   >
//                     <span
//                       className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
//                         task.done
//                           ? 'bg-[#00998A] text-white'
//                           : 'bg-[#E3F3F0] text-[#00695C]'
//                       }`}
//                     >
//                       {task.done ? <Check size={17} /> : <Icon size={17} />}
//                     </span>

//                     <span className="min-w-0 flex-1">
//                       <span
//                         className={`block text-sm font-medium ${
//                           task.done ? 'text-[#445250] line-through' : ''
//                         }`}
//                       >
//                         {task.title}
//                       </span>

//                       <span className="mt-1 block text-xs text-[#7A8581]">
//                         {task.category} · {task.timing}
//                       </span>
//                     </span>

//                     <ChevronRight size={17} className="shrink-0 text-[#A2AAA6]" />
//                   </button>
//                 )
//               })}
//             </div>
//           </div>

//           <aside className="space-y-6">
//             <div className="rounded-2xl border border-[#E4DED0] bg-white p-5 md:p-6">
//               <div className="flex items-center gap-3">
//                 <div className="flex size-10 items-center justify-center rounded-xl bg-[#E3F3F0] text-[#00695C]">
//                   <Wallet size={20} />
//                 </div>

//                 <div>
//                   <h2 className="font-semibold">Your moving budget</h2>
//                   <p className="text-xs text-[#445250]">
//                     Adjust the estimates in INR
//                   </p>
//                 </div>
//               </div>

//               <label className="mt-6 block text-sm font-medium">
//                 Available relocation funds

//                 <span className="mt-2 flex items-center rounded-xl border border-[#E4DED0] px-3">
//                   <span className="text-sm text-[#445250]">₹</span>

//                   <input
//                     type="number"
//                     min="0"
//                     value={budget}
//                     onChange={(event) =>
//                       setBudget(Math.max(0, Number(event.target.value) || 0))
//                     }
//                     className="w-full bg-transparent px-2 py-3 text-sm outline-none"
//                   />
//                 </span>
//               </label>

//               <label className="mt-4 block text-sm font-medium">
//                 Estimated relocation cost

//                 <span className="mt-2 flex items-center rounded-xl border border-[#E4DED0] px-3">
//                   <span className="text-sm text-[#445250]">₹</span>

//                   <input
//                     type="number"
//                     min="0"
//                     value={estimatedCost}
//                     onChange={(event) =>
//                       setEstimatedCost(
//                         Math.max(0, Number(event.target.value) || 0),
//                       )
//                     }
//                     className="w-full bg-transparent px-2 py-3 text-sm outline-none"
//                   />
//                 </span>
//               </label>

//               <div className="mt-5 rounded-xl bg-[#FAF6EF] p-4">
//                 <p className="text-xs text-[#445250]">
//                   Estimated relocation cost
//                 </p>

//                 <p className="mt-1 text-lg font-semibold">
//                   {formatMoney(estimatedCost)}
//                 </p>

//                 <div className="mt-3 flex items-center justify-between gap-3 text-sm">
//                   <span className="text-[#445250]">
//                     Employer relocation assistance
//                   </span>
//                   <span className="font-medium">
//                     −{formatMoney(relocationAssistance)}
//                   </span>
//                 </div>

//                 <div className="mt-3 border-t border-[#E4DED0] pt-3">
//                   <p className="text-xs text-[#445250]">
//                     Estimated cost after assistance
//                   </p>
//                   <p className="mt-1 text-xl font-semibold">
//                     {formatMoney(netRelocationCost)}
//                   </p>
//                 </div>

//                 <div className="mt-4 border-t border-[#E4DED0] pt-3">
//                   <p className="text-xs text-[#445250]">
//                     Remaining funding gap
//                   </p>
//                   <p className="mt-1 text-xl font-semibold">
//                     {formatMoney(gap)}
//                   </p>
//                   <p className="mt-2 text-xs leading-5 text-[#445250]">
//                     {gap > 0
//                       ? 'You may need additional funds to cover the estimated cost.'
//                       : `Your estimated funds cover this cost, with ${formatMoney(remainingFunds)} remaining.`}
//                   </p>
//                 </div>
//               </div>

//               <p className="mt-4 text-xs leading-5 text-[#7A8581]">
//                 This estimate assumes the employer assistance can be applied to the relocation cost. If the company reimburses expenses later, you may need more cash upfront. The joining bonus is shown separately and is not automatically counted as available funds.
//               </p>
//             </div>

//             <div className="rounded-2xl border border-[#CDE8E1] bg-[#E3F3F0] p-5">
//               <div className="flex items-center gap-2 text-[#00695C]">
//                 <Compass size={19} />
//                 <h2 className="font-semibold">A small reminder</h2>
//               </div>

//               <p className="mt-3 text-sm leading-6 text-[#445250]">
//                 You don't need to figure everything out today. Update your plan as your costs and employer benefits become clearer.
//               </p>
//             </div>
//           </aside>
//         </section>

//         <footer className="border-t border-[#E4DED0] py-5 text-center text-xs text-[#7A8581]">
//           MoveWise · Plan thoughtfully. Move confidently.
//         </footer>
//       </div>
//     </main>
//   )
// }

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  House,
  Luggage,
  MapPin,
  Package,
  Plane,
  Wallet,
  BriefcaseBusiness,
  TrendingUp,
  CircleAlert,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const API_URL = 'http://localhost:3000/api'

const initialTasks = [
  { id: 1, title: 'Review and confirm your job offer', category: 'Career', timing: 'Before moving', done: false },
  { id: 2, title: 'Research accommodation options', category: 'Housing', timing: '2–4 weeks before', done: false },
  { id: 3, title: 'Estimate your moving expenses', category: 'Finance', timing: '2–4 weeks before', done: false },
  { id: 4, title: 'Arrange travel to your new city', category: 'Travel', timing: '1–2 weeks before', done: false },
  { id: 5, title: 'Prepare important documents', category: 'Documents', timing: '1 week before', done: false },
  { id: 6, title: 'Pack essentials for your first week', category: 'Moving', timing: '2–3 days before', done: false },
  { id: 7, title: 'Explore your neighbourhood', category: 'Settling in', timing: 'First week', done: false },
]

const categoryIcons = {
  Career: CheckCircle2,
  Housing: House,
  Finance: Wallet,
  Travel: Plane,
  Documents: Package,
  Moving: Luggage,
  'Settling in': Compass,
}

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))

const toAmount = (value) => Math.max(0, Number(value) || 0)

export default function RelocationHub({ onOpenChecklist }) {
  const [tasks, setTasks] = useState(initialTasks)

  const [budget, setBudget] = useState(25000)
  const [estimatedCost, setEstimatedCost] = useState(32000)

  const [offers, setOffers] = useState([])
  const [offersLoading, setOffersLoading] = useState(true)
  const [offersError, setOffersError] = useState('')
  const [selectedOfferId, setSelectedOfferId] = useState('')
  const [profileBudget, setProfileBudget] = useState(null)

  const [apartments, setApartments] = useState([])
  const [apartmentsLoading, setApartmentsLoading] = useState(true)
  const [apartmentsError, setApartmentsError] = useState('')
  const [selectedApartmentId, setSelectedApartmentId] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [planLoaded, setPlanLoaded] = useState(false)

  const completed = tasks.filter((task) => task.done).length
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0

  const selectedOffer = offers.find(
    (offer) => offer.id === selectedOfferId,
  ) || null

  const cityApartments = useMemo(() => {
    if (!selectedOffer) return []

    return apartments.filter(
      (apartment) =>
        apartment.city?.trim().toLowerCase() ===
        selectedOffer.destination_city?.trim().toLowerCase(),
    )
  }, [apartments, selectedOffer])

  const selectedApartment = cityApartments.find(
    (apartment) => apartment.id === selectedApartmentId,
  ) || null

  // Upfront housing costs: first month's rent + deposit + brokerage.
  const apartmentMonthlyRent = toAmount(selectedApartment?.monthly_rent)
  const apartmentDeposit = toAmount(selectedApartment?.deposit)
  const apartmentBrokerage = toAmount(selectedApartment?.brokerage)

  const apartmentUpfrontCost = selectedApartment
    ? apartmentMonthlyRent + apartmentDeposit + apartmentBrokerage
    : 0

  // Benefits belonging to the selected job offer.
  const relocationAssistance = toAmount(
    selectedOffer?.relocation_assistance,
  )

  const joiningBonus = toAmount(selectedOffer?.joining_bonus)

  // estimatedCost represents moving/travel/setup expenses EXCLUDING
  // apartment rent, deposit, and brokerage.
  const netOtherRelocationCost = Math.max(
    0,
    estimatedCost - relocationAssistance,
  )

  // Calculate the complete upfront requirement without counting housing twice.
  const totalUpfrontCost = estimatedCost + apartmentUpfrontCost

  // Assistance is applied once to the combined upfront estimate.
  const netUpfrontCost = Math.max(
    0,
    totalUpfrontCost - relocationAssistance,
  )

  const fundingGap = Math.max(0, netUpfrontCost - budget)
  const remainingFunds = Math.max(0, budget - netUpfrontCost)

  // Monthly affordability:
  // The selected apartment's rent REPLACES the offer's monthly_rent value.
  // Other recurring costs come from the selected job offer.
  const monthlyTakeHome = toAmount(selectedOffer?.monthly_take_home)
  const monthlyFood = toAmount(selectedOffer?.monthly_food)
  const monthlyTransport = toAmount(selectedOffer?.monthly_transport)
  const monthlyUtilities = toAmount(selectedOffer?.monthly_utilities)
  const monthlyOtherExpenses = toAmount(
    selectedOffer?.monthly_other_expenses,
  )
  const monthlyEmi = toAmount(selectedOffer?.monthly_emi)

  const monthlyLivingExpenses =
    apartmentMonthlyRent +
    monthlyFood +
    monthlyTransport +
    monthlyUtilities +
    monthlyOtherExpenses +
    monthlyEmi

  const projectedMonthlySavings = monthlyTakeHome - monthlyLivingExpenses

  const hasMonthlyExpenseInputs = Boolean(
    selectedApartment &&
    selectedOffer &&
    (
      selectedOffer.monthly_food != null ||
      selectedOffer.monthly_transport != null ||
      selectedOffer.monthly_utilities != null ||
      selectedOffer.monthly_other_expenses != null ||
      selectedOffer.monthly_emi != null
    ),
  )
  
async function saveRelocationPlan(
  apartmentId = selectedApartmentId,
  taskList = tasks,
) {
  if (!currentUserId || !planLoaded) return

  const completedTaskIds = taskList
    .filter((task) => task.done)
    .map((task) => task.id)

  const { error } = await supabase
    .from('relocation_plans')
    .upsert(
      {
        user_id: currentUserId,
        selected_apartment_id: apartmentId || null,
        completed_task_ids: completedTaskIds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  if (error) {
    console.error('Could not save relocation plan:', error.message)
  }
}

function toggleTask(id) {
  const updatedTasks = tasks.map((task) =>
    task.id === id ? { ...task, done: !task.done } : task,
  )

  setTasks(updatedTasks)
  void saveRelocationPlan(selectedApartmentId, updatedTasks)
}

function selectApartment(apartment) {
  setSelectedApartmentId(apartment.id)
  void saveRelocationPlan(apartment.id, tasks)
}

function clearApartmentSelection() {
  setSelectedApartmentId('')
  void saveRelocationPlan('', tasks)
}




  // Load saved offers and the user's relocation budget.
  useEffect(() => {
    let active = true

    async function fetchOffersAndProfile() {
      setOffersLoading(true)
      setOffersError('')

      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession()

        if (sessionError) throw sessionError

        const session = sessionData.session

        if (!session) {
          throw new Error('Please log in to load your saved job offers.')
        }
        if (active) {
            setCurrentUserId(session.user.id)
        }

        const response = await fetch(`${API_URL}/offers`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(
            result.message || 'Could not load saved job offers.',
          )
        }

        const loadedOffers = Array.isArray(result)
          ? result
          : result.offers || []

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('available_relocation_budget')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profileError) throw profileError
        if (!active) return

        setOffers(loadedOffers)

        const savedBudget =
          profile?.available_relocation_budget == null
            ? null
            : toAmount(profile.available_relocation_budget)

        setProfileBudget(savedBudget)

        if (savedBudget != null) {
          setBudget(savedBudget)
        }

        if (loadedOffers.length > 0) {
          setSelectedOfferId((current) => {
            if (
              current &&
              loadedOffers.some((offer) => offer.id === current)
            ) {
              return current
            }

            return loadedOffers[0].id
          })
        }
      } catch (err) {
        if (active) {
          setOffersError(
            err.message || 'Could not load your job offers.',
          )
        }
      } finally {
        if (active) setOffersLoading(false)
      }
    }

    fetchOffersAndProfile()

    return () => {
      active = false
    }
  }, [])

  // Load apartment sample data from Supabase.
  useEffect(() => {
    let active = true

    async function fetchApartments() {
      setApartmentsLoading(true)
      setApartmentsError('')

      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .order('city', { ascending: true })
        .order('monthly_rent', { ascending: true })

      if (!active) return

      if (error) {
        setApartmentsError(error.message)
        setApartments([])
      } else {
        setApartments(data ?? [])
      }

      setApartmentsLoading(false)
    }

    fetchApartments()

    return () => {
      active = false
    }
  }, [])

  // When the selected job offer changes, update the relocation estimate
  // and clear the selected apartment if it is not in the new destination.
  useEffect(() => {
    if (!selectedOffer) return

    setEstimatedCost(
      toAmount(selectedOffer.relocation_cost),
    )

    setSelectedApartmentId('')
  }, [selectedOfferId])

  // When apartment results change, clear a selection that no longer exists.
  useEffect(() => {
    if (
      selectedApartmentId &&
      !cityApartments.some(
        (apartment) => apartment.id === selectedApartmentId,
      )
    ) {
      setSelectedApartmentId('')
    }
  }, [cityApartments, selectedApartmentId])
  
useEffect(() => {
  if (!currentUserId || apartmentsLoading) return

  let active = true

  async function loadRelocationPlan() {
    const { data, error } = await supabase
      .from('relocation_plans')
      .select('selected_apartment_id, completed_task_ids')
      .eq('user_id', currentUserId)
      .maybeSingle()

    if (!active) return

    if (error) {
      console.error('Could not load relocation plan:', error.message)
      setPlanLoaded(true)
      return
    }

    if (data) {
      setSelectedApartmentId(data.selected_apartment_id || '')

      const completedIds = data.completed_task_ids || []

      setTasks(
        initialTasks.map((task) => ({
          ...task,
          done: completedIds.includes(task.id),
        })),
      )
    }

    setPlanLoaded(true)
  }

  loadRelocationPlan()

  return () => {
    active = false
  }
}, [currentUserId, apartmentsLoading, apartments])

  return (
    <main className="min-h-screen bg-[#FAF6EF] px-5 py-8 text-[#16211F] md:px-10 lg:px-14">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Page heading */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#00998A]">
              YOUR NEXT CHAPTER
            </p>

            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Relocation Hub<span className="text-[#00998A]">.</span>
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#445250]">
              Choose a job offer, compare accommodation, and understand
              the financial impact of moving to a new city.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenChecklist}
            className="flex items-center gap-3 rounded-2xl border border-[#E4DED0] bg-white px-4 py-3 transition hover:border-[#00998A] hover:shadow-sm"
            title="Open 90-day journey checklist"
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#E3F3F0] text-[#00695C]">
              <Compass size={22} />
            </div>

            <div className="text-left">
              <p className="text-xs text-[#445250]">Your relocation plan</p>
              <p className="font-semibold">
                {completed} of {tasks.length} tasks done
              </p>
              <p className="mt-0.5 text-[11px] text-[#00998A]">Open 90-day journey →</p>
            </div>
          </button>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-[#16211F] p-7 text-white md:p-10">
          <div className="pointer-events-none absolute -right-12 -top-20 size-72 rounded-full border border-white/10" />

          <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-[#BDE8DE]">
                <MapPin size={14} />
                YOUR MOVE, YOUR PACE
              </div>

              <h2 className="max-w-lg text-2xl font-semibold leading-snug md:text-3xl">
                Big moves become easier when you break them into small steps.
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-white/65">
                Compare upfront costs and monthly affordability before
                committing to a move.
              </p>

              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById('relocation-checklist')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#00998A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#007F73]"
              >
                Continue planning <ArrowRight size={16} />
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-white/70">
                  Preparation progress
                </span>
                <span className="text-lg font-semibold">{progress}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#4FBFAD] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/[0.06] p-4">
                  <Clock3 size={18} className="mb-3 text-[#4FBFAD]" />
                  <p className="text-xl font-semibold">
                    {tasks.length - completed}
                  </p>
                  <p className="mt-1 text-xs text-white/60">Tasks remaining</p>
                </div>

                <div className="rounded-xl bg-white/[0.06] p-4">
                  <CalendarDays size={18} className="mb-3 text-[#4FBFAD]" />
                  <p className="text-xl font-semibold">4 stages</p>
                  <p className="mt-1 text-xs text-white/60">
                    Planning to settling in
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Select job offer */}
        <section className="rounded-2xl border border-[#E4DED0] bg-white p-5 md:p-7">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#E3F3F0] text-[#00695C]">
              <BriefcaseBusiness size={20} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#00998A]">
                STEP 1
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                Choose your job offer
              </h2>
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-[#445250]">
            Your selected offer determines the destination, salary,
            relocation estimate, and employer benefits used below.
          </p>

          {offersLoading ? (
            <p className="mt-5 rounded-xl bg-[#FAF6EF] p-4 text-sm text-[#445250]">
              Loading your saved job offers...
            </p>
          ) : offersError ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {offersError}
            </div>
          ) : offers.length === 0 ? (
            <p className="mt-5 rounded-xl bg-[#FAF6EF] p-4 text-sm text-[#445250]">
              No saved job offers found. Add an offer on the Job Offers page
              to personalize your relocation plan.
            </p>
          ) : (
            <>
              <label
                className="mt-5 block text-sm font-medium"
                htmlFor="relocation-offer"
              >
                Select a saved offer
              </label>

              <select
                id="relocation-offer"
                value={selectedOfferId}
                onChange={(event) => setSelectedOfferId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#E4DED0] bg-white px-4 py-3 text-sm outline-none focus:border-[#00998A] sm:max-w-2xl"
              >
                {offers.map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.role_title} · {offer.company_name} · {offer.destination_city}
                  </option>
                ))}
              </select>

              {selectedOffer && (
                <>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-[#FAF6EF] p-4">
                      <p className="text-xs text-[#445250]">Destination</p>
                      <p className="mt-1 font-semibold">
                        {selectedOffer.destination_city}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#FAF6EF] p-4">
                      <p className="text-xs text-[#445250]">
                        Monthly take-home
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatMoney(monthlyTakeHome)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#FAF6EF] p-4">
                      <p className="text-xs text-[#445250]">
                        Available personal funds
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatMoney(budget)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#E4DED0] bg-white p-4">
                      <p className="text-xs text-[#445250]">
                        Employer relocation assistance
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatMoney(relocationAssistance)}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#7A8581]">
                        Confirm when and how the company pays this amount.
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E4DED0] bg-white p-4">
                      <p className="text-xs text-[#445250]">
                        Joining bonus — separate
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatMoney(joiningBonus)}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#7A8581]">
                        Not counted as available funds because tax and payment
                        timing may affect the amount you receive.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </section>

        {/* Select apartment */}
        <section className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#00998A]">
              STEP 2
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Choose your accommodation
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#445250]">
              Apartment options automatically filter by your selected offer's
              destination. Select one to include its first month's rent,
              deposit, and brokerage in your upfront affordability estimate.
            </p>
          </div>

          {!selectedOffer ? (
            <div className="rounded-2xl border border-[#E4DED0] bg-white p-6 text-sm text-[#445250]">
              Select a saved job offer above to see accommodation options
              for its destination.
            </div>
          ) : apartmentsLoading ? (
            <div className="rounded-2xl border border-[#E4DED0] bg-white p-8 text-center text-sm text-[#445250]">
              Loading accommodation options...
            </div>
          ) : apartmentsError ? (
            <div className="rounded-2xl border border-red-200 bg-white p-5 text-sm text-red-700">
              <p className="font-semibold">
                Could not load accommodation options.
              </p>
              <p className="mt-1">{apartmentsError}</p>
              <p className="mt-2 text-xs">
                Check the apartments table and its authenticated-user SELECT
                policy in Supabase.
              </p>
            </div>
          ) : cityApartments.length === 0 ? (
            <div className="rounded-2xl border border-[#E4DED0] bg-white p-8 text-center">
              <House size={28} className="mx-auto text-[#00998A]" />

              <p className="mt-3 font-semibold">
                No sample properties in {selectedOffer.destination_city}
              </p>

              <p className="mt-1 text-sm leading-6 text-[#445250]">
                Add sample records for this destination to the Supabase
                apartments table. The currently seeded properties are
                illustrative, not verified listings.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-[#E3F3F0] px-3 py-2 text-xs font-semibold text-[#00695C]">
                  {cityApartments.length} sample options · {selectedOffer.destination_city}
                </span>

                {selectedApartment && (
                  <button
                    type="button"
                    onClick={clearApartmentSelection}
                    className="text-sm font-medium text-[#00695C] underline underline-offset-4"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cityApartments.map((apartment) => {
                  const isSelected = selectedApartmentId === apartment.id

                  const moveInCost =
                    toAmount(apartment.monthly_rent) +
                    toAmount(apartment.deposit) +
                    toAmount(apartment.brokerage)

                  return (
                    <article
                      key={apartment.id}
                      className={`flex flex-col rounded-2xl border bg-white p-5 transition ${
                        isSelected
                          ? 'border-[#00998A] ring-2 ring-[#00998A]/20'
                          : 'border-[#E4DED0] hover:border-[#4FBFAD]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E3F3F0] text-[#00695C]">
                          <House size={21} />
                        </div>

                        <span className="rounded-full bg-[#FAF6EF] px-2.5 py-1 text-[11px] font-medium text-[#445250]">
                          {apartment.property_type}
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-semibold">
                        {apartment.title}
                      </h3>

                      <p className="mt-1 flex items-center gap-1.5 text-sm text-[#445250]">
                        <MapPin size={14} />
                        {apartment.locality}, {apartment.city}
                      </p>

                      <div className="mt-5 rounded-xl bg-[#FAF6EF] p-3">
                        <p className="text-xs text-[#445250]">Monthly rent</p>
                        <p className="mt-1 text-xl font-semibold">
                          {formatMoney(apartment.monthly_rent)}
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-[#445250]">
                            Security deposit
                          </p>
                          <p className="mt-1 text-sm font-semibold">
                            {formatMoney(apartment.deposit)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-[#445250]">Brokerage</p>
                          <p className="mt-1 text-sm font-semibold">
                            {formatMoney(apartment.brokerage)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-[#445250]">Furnishing</p>
                          <p className="mt-1 text-sm font-semibold">
                            {apartment.furnishing || 'Not specified'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-[#445250]">
                            Commute estimate
                          </p>
                          <p className="mt-1 text-sm font-semibold">
                            {apartment.commute_minutes != null
                              ? `${apartment.commute_minutes} min`
                              : 'Not specified'}
                          </p>
                        </div>
                      </div>

                      {apartment.description && (
                        <p className="mt-4 text-sm leading-5 text-[#445250]">
                          {apartment.description}
                        </p>
                      )}

                      <div className="mt-auto pt-5">
                        <div className="border-t border-[#EFE6D6] pt-4">
                          <p className="text-xs text-[#445250]">
                            Estimated first month + deposit + brokerage
                          </p>
                          <p className="mt-1 text-lg font-semibold">
                            {formatMoney(moveInCost)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => selectApartment(apartment)}
                          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                            isSelected
                              ? 'bg-[#E3F3F0] text-[#00695C]'
                              : 'bg-[#00695C] text-white hover:bg-[#00564B]'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle2 size={17} />
                              Selected apartment
                            </>
                          ) : (
                            <>
                              Select this apartment
                              <ArrowRight size={16} />
                            </>
                          )}
                        </button>

                        <p className="mt-2 text-[11px] leading-4 text-[#7A8581]">
                          Sample data only. Not a verified or live property
                          listing.
                        </p>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </section>

        {/* Upfront affordability */}
        <section className="rounded-2xl border border-[#E4DED0] bg-white p-5 md:p-7">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E3F3F0] text-[#00695C]">
              <Wallet size={22} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#00998A]">
                STEP 3
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                Upfront relocation affordability
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#445250]">
                See how much cash you may need before your move and whether
                your personal funds cover the estimated upfront cost.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="space-y-5">
              <label className="block text-sm font-medium">
                Available personal relocation funds (₹)

                <input
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(event) =>
                    setBudget(toAmount(event.target.value))
                  }
                  className="mt-2 w-full rounded-xl border border-[#E4DED0] bg-white px-4 py-3 text-base outline-none focus:border-[#00998A]"
                />
              </label>

              <label className="block text-sm font-medium">
                Other moving expenses, excluding apartment costs (₹)

                <input
                  type="number"
                  min="0"
                  value={estimatedCost}
                  onChange={(event) =>
                    setEstimatedCost(toAmount(event.target.value))
                  }
                  className="mt-2 w-full rounded-xl border border-[#E4DED0] bg-white px-4 py-3 text-base outline-none focus:border-[#00998A]"
                />

                <span className="mt-2 block text-xs font-normal leading-5 text-[#7A8581]">
                  Initially populated from the selected offer's one-time
                  relocation cost. Adjust it if that estimate includes costs
                  that should be treated separately.
                </span>
              </label>
            </div>

            <div className="rounded-2xl bg-[#FAF6EF] p-5">
              <h3 className="font-semibold">Upfront cost breakdown</h3>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[#445250]">
                    Other moving expenses
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(estimatedCost)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="text-[#445250]">
                    First month's apartment rent
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(apartmentMonthlyRent)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="text-[#445250]">Security deposit</span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(apartmentDeposit)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="text-[#445250]">Brokerage</span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(apartmentBrokerage)}
                  </span>
                </div>

                <div className="border-t border-[#E0D4BD] pt-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold">Total before assistance</span>
                    <span className="font-semibold tabular-nums">
                      {formatMoney(totalUpfrontCost)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="text-[#445250]">
                    Employer relocation assistance
                  </span>
                  <span className="font-medium tabular-nums">
                    −{formatMoney(relocationAssistance)}
                  </span>
                </div>

                <div className="border-t border-[#E0D4BD] pt-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold">
                      Estimated net upfront cost
                    </span>
                    <span className="text-lg font-semibold tabular-nums">
                      {formatMoney(netUpfrontCost)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-white p-4">
                <p className="text-sm text-[#445250]">
                  {fundingGap > 0
                    ? 'Estimated additional funds needed'
                    : 'Estimated personal funds remaining'}
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {formatMoney(
                    fundingGap > 0 ? fundingGap : remainingFunds,
                  )}
                </p>

                <p className="mt-2 text-xs leading-5 text-[#445250]">
                  {fundingGap > 0
                    ? 'Your current personal funds do not cover the estimated upfront requirement after assistance.'
                    : 'Your estimated personal funds cover the upfront requirement after assistance.'}
                </p>
              </div>
            </div>
          </div>

          {!selectedApartment && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#E0D4BD] bg-[#FFF9EF] p-4 text-sm">
              <CircleAlert size={19} className="mt-0.5 shrink-0 text-[#A66B19]" />
              <p className="leading-6 text-[#6F552C]">
                Select an apartment above to include its rent, deposit, and
                brokerage. Until then, those housing costs are shown as ₹0,
                so the total is incomplete.
              </p>
            </div>
          )}

          <p className="mt-5 text-xs leading-5 text-[#7A8581]">
            This estimate assumes the relocation assistance can be applied
            to the listed upfront costs. If the company reimburses expenses
            after you pay them, you may still need enough cash to cover the
            costs initially. The joining bonus is not included in available
            funds. Deposits are upfront cash requirements and are not treated
            as recurring monthly expenses.
          </p>
        </section>

        {/* Monthly affordability */}
        <section className="rounded-2xl border border-[#E4DED0] bg-white p-5 md:p-7">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E3F3F0] text-[#00695C]">
              <TrendingUp size={22} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#00998A]">
                STEP 4
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                Monthly affordability
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#445250]">
                Estimate what may remain each month after rent and the
                recurring expenses recorded for your selected offer.
              </p>
            </div>
          </div>

          {!selectedOffer ? (
            <p className="mt-5 rounded-xl bg-[#FAF6EF] p-4 text-sm text-[#445250]">
              Select a job offer to calculate monthly affordability.
            </p>
          ) : !selectedApartment ? (
            <p className="mt-5 rounded-xl bg-[#FAF6EF] p-4 text-sm text-[#445250]">
              Select an apartment above to calculate monthly affordability
              using its rent.
            </p>
          ) : (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl bg-[#FAF6EF] p-4">
                  <p className="text-sm text-[#445250]">Monthly take-home</p>
                  <p className="mt-2 text-xl font-semibold">
                    {formatMoney(monthlyTakeHome)}
                  </p>
                </div>

                <div className="rounded-xl bg-[#FAF6EF] p-4">
                  <p className="text-sm text-[#445250]">
                    Selected apartment rent
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    {formatMoney(apartmentMonthlyRent)}
                  </p>
                </div>

                <div className="rounded-xl bg-[#FAF6EF] p-4">
                  <p className="text-sm text-[#445250]">
                    Other monthly expenses and EMI
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    {formatMoney(
                      monthlyFood +
                      monthlyTransport +
                      monthlyUtilities +
                      monthlyOtherExpenses +
                      monthlyEmi,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[#E4DED0] p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm text-[#445250]">
                      Projected monthly savings
                    </p>
                    <p
                      className={`mt-1 text-3xl font-semibold ${
                        projectedMonthlySavings < 0
                          ? 'text-[#B64C36]'
                          : 'text-[#00695C]'
                      }`}
                    >
                      {formatMoney(projectedMonthlySavings)}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-2 text-xs font-semibold ${
                      projectedMonthlySavings < 0
                        ? 'bg-red-50 text-red-700'
                        : 'bg-[#E3F3F0] text-[#00695C]'
                    }`}
                  >
                    {projectedMonthlySavings < 0
                      ? 'Monthly shortfall'
                      : 'Estimated monthly surplus'}
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#445250]">
                      Monthly take-home salary
                    </span>
                    <span className="font-medium">
                      {formatMoney(monthlyTakeHome)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#445250]">Apartment rent</span>
                    <span className="font-medium">
                      −{formatMoney(apartmentMonthlyRent)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#445250]">Food</span>
                    <span className="font-medium">
                      −{formatMoney(monthlyFood)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#445250]">Transport</span>
                    <span className="font-medium">
                      −{formatMoney(monthlyTransport)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#445250]">Utilities</span>
                    <span className="font-medium">
                      −{formatMoney(monthlyUtilities)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#445250]">Other expenses</span>
                    <span className="font-medium">
                      −{formatMoney(monthlyOtherExpenses)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#445250]">Monthly EMI</span>
                    <span className="font-medium">
                      −{formatMoney(monthlyEmi)}
                    </span>
                  </div>
                </div>

                {!hasMonthlyExpenseInputs && (
                  <div className="mt-5 rounded-xl bg-[#FFF9EF] p-4 text-xs leading-5 text-[#6F552C]">
                    Some monthly expense fields are missing from this offer.
                    The calculation treats missing values as ₹0. Enter realistic
                    estimates before relying on the projected savings.
                  </div>
                )}

                <p className="mt-4 text-xs leading-5 text-[#7A8581]">
                  This is an estimate based on the saved offer and selected
                  sample apartment. It does not include every possible
                  expense or guarantee future savings.
                </p>
              </div>
            </>
          )}
        </section>

        
        <footer className="border-t border-[#E4DED0] py-5 text-center text-xs text-[#7A8581]">
          MoveWise · Plan thoughtfully. Move confidently.
        </footer>
      </div>
    </main>
  )
}
