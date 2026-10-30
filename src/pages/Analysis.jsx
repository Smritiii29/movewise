
// import { useEffect, useState } from 'react'
// import {
//   ArrowDownRight,
//   ArrowRight,
//   ArrowUpRight,
//   BriefcaseBusiness,
//   ChartNoAxesCombined,
//   CircleAlert,
//   Lightbulb,
//   Sparkles,
//   LoaderCircle,
//   PiggyBank,
//   Wallet,
// } from 'lucide-react'
// import {
//   Bar,
//   BarChart,
//   CartesianGrid,
//   Cell,
//   Legend,
//   ResponsiveContainer,
//   Tooltip,
//   XAxis,
//   YAxis,
// } from 'recharts'
// import { supabase } from '../lib/supabase'
// import '../App.css'

// const API_URL = 'http://localhost:3000/api'

// const money = (value) =>
//   new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//     maximumFractionDigits: 0,
//   }).format(Number(value || 0))


// function getRecommendation(values, preferences) {
//   const difference = Number(values.monthlySavingsDifference || 0)
//   const netCost = Number(values.netRelocationCost || 0)

//   const confidence = preferences?.relocation_confidence
//   const adaptability = preferences?.willingness_to_adapt
//   const priorities = preferences?.priorities || {}
//   const concerns = Array.isArray(preferences?.concerns)
//     ? preferences.concerns
//     : []

//   const lowReadiness =
//     (confidence != null && Number(confidence) <= 2) ||
//     (adaptability != null && Number(adaptability) <= 2)

//   const hasPersonalConsiderations =
//     concerns.length > 0 ||
//     lowReadiness ||
//     Number(priorities.family || 0) >= 4 ||
//     Number(priorities.work_life || 0) >= 4

//   let type = 'mixed'
//   let title = 'Consider the full picture'
//   let summary =
//     'Review the financial outcome alongside your personal priorities before deciding.'

//   if (difference > 0 && netCost <= 0) {
//     type = 'positive'
//     title = 'Financially favourable'
//     summary =
//       'Your projected monthly savings improve, and the relocation benefits cover the estimated upfront cost.'
//   } else if (difference > 0) {
//     type = 'positive'
//     title = 'Financially promising'
//     summary =
//       'Your projected monthly savings improve. Consider the remaining upfront relocation cost and how long it may take to recover it.'
//   } else if (difference < 0 && netCost > 0) {
//     type = 'negative'
//     title = 'Financially less favourable'
//     summary =
//       'Your monthly savings are projected to decrease, and there is a remaining upfront relocation cost.'
//   } else if (difference < 0) {
//     type = 'mixed'
//     title = 'A financial trade-off'
//     summary =
//       'Your monthly savings are projected to decrease, although the relocation benefits cover the estimated upfront cost.'
//   } else if (netCost <= 0) {
//     type = 'mixed'
//     title = 'A financially balanced move'
//     summary =
//       'Your monthly savings remain unchanged, and the relocation benefits cover the estimated upfront cost.'
//   } else {
//     type = 'mixed'
//     title = 'No monthly savings improvement'
//     summary =
//       'Your monthly savings are projected to remain the same, while the move adds an upfront cost.'
//   }

//   if (hasPersonalConsiderations) {
//     if (difference > 0) {
//       title = 'Financially favourable, with personal factors to consider'
//       summary =
//         'Your projected savings improve, and the relocation benefits cover the estimated upfront cost. Your profile also highlights personal factors worth reviewing before committing to the move.'
//     } else {
//       summary +=
//         ' Your profile also highlights personal factors worth reviewing before making a decision.'
//     }
//   } else if (!preferences) {
//     summary +=
//       ' Complete your profile preferences to include your personal priorities and relocation readiness.'
//   }

//   const personalNotes = []

//   if (lowReadiness) {
//     personalNotes.push(
//       'Your profile indicates lower relocation confidence or willingness to adapt. Consider what support would help you feel prepared.',
//     )
//   }

//   if (Number(priorities.family || 0) >= 4) {
//     personalNotes.push(
//       'Family is a high priority for you. Consider distance, responsibilities, and how often you could travel home.',
//     )
//   }

//   if (Number(priorities.work_life || 0) >= 4) {
//     personalNotes.push(
//       'Work-life balance is a high priority for you. Review expected working hours, commute, and flexibility with the employer.',
//     )
//   }

//   if (
//     Number(priorities.savings || 0) >= 4 &&
//     difference <= 0
//   ) {
//     personalNotes.push(
//       'Savings are a high priority for you, and this offer does not improve projected monthly savings.',
//     )
//   }

//   if (Number(priorities.career || 0) >= 4) {
//     personalNotes.push(
//       'Career growth is a high priority for you. Investigate this role’s learning opportunities and long-term progression alongside the financial outcome.',
//     )
//   }

//   if (concerns.length > 0) {
//     personalNotes.push(
//       `You identified these concerns in your profile: ${concerns.join(', ')}. Consider what practical steps could help address them before relocating.`,
//     )
//   }

//   if (!preferences) {
//     personalNotes.push(
//       'Your profile preferences could not be loaded. Review your profile to include personal factors in this assessment.',
//     )
//   } else if (personalNotes.length === 0) {
//     personalNotes.push(
//       'Your profile does not flag a specific concern under these rules. Consider your individual circumstances before deciding.',
//     )
//   }

//   return {
//     type,
//     title,
//     summary,
//     personalNotes,
//     confidence,
//     adaptability,
//   }
// }


// export default function Analysis() {
//   const [offers, setOffers] = useState([])
//   const [selectedId, setSelectedId] = useState('')
//   const [analysis, setAnalysis] = useState(null)
//   const [profilePreferences, setProfilePreferences] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [analysing, setAnalysing] = useState(false)
//   const [error, setError] = useState('')
//   const [aiExplanation, setAiExplanation] = useState(null)
//   const [aiLoading, setAiLoading] = useState(false)
//   const [aiError, setAiError] = useState('')
//   const [aiRetry, setAiRetry] = useState(0)

//   useEffect(() => {
//     let active = true

//     async function loadOffers() {
//       setLoading(true)
//       setError('')

//       try {
//         const { data, error: sessionError } =
//           await supabase.auth.getSession()

//         if (sessionError) throw sessionError

//         const token = data.session?.access_token
//         if (!token) throw new Error('Please sign in again.')

//         const response = await fetch(`${API_URL}/offers`, {
//           headers: { Authorization: `Bearer ${token}` },
//         })

//         const result = await response.json()

//         if (!response.ok) {
//           throw new Error(result.message || 'Could not load job offers.')
//         }

//         if (!active) return

//         setOffers(result.offers || [])

//         if (result.offers?.length) {
//           setSelectedId(result.offers[0].id)
//         }
//       } catch (err) {
//         if (active) {
//           setError(err.message || 'Could not load your job offers.')
//         }
//       } finally {
//         if (active) setLoading(false)
//       }
//     }

//     loadOffers()

//     return () => {
//       active = false
//     }
//   }, [])

//   useEffect(() => {
//     let active = true

//     async function loadAnalysis() {
//       setAnalysis(null)
//       setProfilePreferences(null)

//       if (!selectedId) {
//         setAnalysing(false)
//         return
//       }

//       setAnalysing(true)
//       setError('')

//       try {
//         const { data, error: sessionError } =
//           await supabase.auth.getSession()

//         if (sessionError) throw sessionError

//         const token = data.session?.access_token
//         if (!token) throw new Error('Please sign in again.')

//         const response = await fetch(
//           `${API_URL}/analysis/${selectedId}`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           },
//         )

//         const result = await response.json()

//         if (!response.ok) {
//           throw new Error(result.message || 'Could not calculate analysis.')
//         }

//         if (active) setAnalysis(result)

//         // Load the user's existing preferences directly from Supabase.
//         // A preference loading failure should not hide financial analysis.
//         try {
//           const { data: sessionData, error: profileSessionError } =
//             await supabase.auth.getSession()

//           if (profileSessionError) throw profileSessionError

//           const userId = sessionData.session?.user?.id

//           if (userId) {
//             const { data: profile, error: profileError } =
//               await supabase
//                 .from('profiles')
//                 .select(
//                   'relocation_confidence, willingness_to_adapt, concerns, priorities',
//                 )
//                 .eq('id', userId)
//                 .maybeSingle()

//             if (profileError) throw profileError

//             if (active) setProfilePreferences(profile || null)
//           }
//         } catch (profileLoadError) {
//           console.error(
//             'Could not load profile preferences:',
//             profileLoadError.message,
//           )

//           if (active) setProfilePreferences(null)
//         }
//       } catch (err) {
//         if (active) {
//           setError(err.message || 'Could not calculate your analysis.')
//         }
//       } finally {
//         if (active) setAnalysing(false)
//       }
//     }

//     loadAnalysis()

//     return () => {
//       active = false
//     }
//   }, [selectedId])

//   // Gemini explains the backend's financial comparison; it does not replace
//   // the existing rule-based recommendation or calculate financial values.
//   useEffect(() => {
//     let active = true

//     async function loadAiExplanation() {
//       setAiExplanation(null)
//       setAiError('')

//       if (!selectedId) {
//         setAiLoading(false)
//         return
//       }

//       setAiLoading(true)

//       try {
//         const { data, error: sessionError } =
//           await supabase.auth.getSession()

//         if (sessionError) throw sessionError

//         const token = data.session?.access_token
//         if (!token) throw new Error('Please sign in again.')

//         const response = await fetch(
//           `${API_URL}/ai-explanation/${selectedId}`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           },
//         )

//         const result = await response.json()

//         if (!response.ok) {
//           throw new Error(
//             result.error || result.message || 'Could not generate the AI explanation.',
//           )
//         }

//         if (active) setAiExplanation(result.explanation)
//       } catch (err) {
//         if (active) {
//           setAiError(
//             err.message || 'The AI explanation is unavailable right now.',
//           )
//         }
//       } finally {
//         if (active) setAiLoading(false)
//       }
//     }

//     loadAiExplanation()

//     return () => {
//       active = false
//     }
//   }, [selectedId, aiRetry])

//   const values = analysis?.analysis
//   const savingsImproved = Number(values?.monthlySavingsDifference) > 0
//   const savingsUnchanged = Number(values?.monthlySavingsDifference) === 0

//   const chartData = values
//     ? [
//         {
//           name: 'Current',
//           savings: Number(values.currentMonthlySavings || 0),
//         },
//         {
//           name: 'With offer',
//           savings: Number(values.projectedMonthlySavings || 0),
//         },
//       ]
//     : []

//   const recommendation = values
//     ? getRecommendation(values, profilePreferences)
//     : null

//   if (loading) {
//     return (
//       <section className="analysis-loading">
//         <LoaderCircle size={26} className="analysis-spinner" />
//         <p>Loading your job offers...</p>
//       </section>
//     )
//   }

//   return (
//     <main className="analysis-page">
//       <header className="analysis-heading">
//         <div>
//           <span className="offers-eyebrow">YOUR NUMBERS, MADE CLEAR</span>
//           <h1>Relocation analysis</h1>
//           <p>Understand how a potential move could change your finances.</p>
//         </div>

//         <span className="analysis-heading-icon">
//           <ChartNoAxesCombined size={27} />
//         </span>
//       </header>

//       {offers.length > 0 && (
//         <section className="analysis-selector">
//           <label htmlFor="analysis-offer">
//             <BriefcaseBusiness size={19} />
//             Select a job offer
//           </label>

//           <select
//             id="analysis-offer"
//             value={selectedId}
//             onChange={(event) => setSelectedId(event.target.value)}
//           >
//             {offers.map((offer) => (
//               <option key={offer.id} value={offer.id}>
//                 {offer.company_name} — {offer.role_title} (
//                 {offer.destination_city})
//               </option>
//             ))}
//           </select>
//         </section>
//       )}

//       {error && (
//         <div className="offers-alert offers-error" role="alert">
//           {error}
//         </div>
//       )}

//       {offers.length === 0 && !error && (
//         <section className="analysis-empty">
//           <BriefcaseBusiness size={34} />
//           <h2>No job offers yet</h2>
//           <p>Add a job offer before calculating your relocation analysis.</p>
//         </section>
//       )}

//       {analysing && (
//         <section className="analysis-loading">
//           <LoaderCircle size={25} className="analysis-spinner" />
//           <p>Calculating your financial comparison...</p>
//         </section>
//       )}

//       {values && !analysing && (
//         <>
//           <section className="analysis-context">
//             <div>
//               <span>Current location</span>
//               <strong>{analysis.profile.currentCity || 'Not specified'}</strong>
//             </div>

//             <ArrowRight size={21} />

//             <div>
//               <span>Potential destination</span>
//               <strong>{analysis.offer.destinationCity}</strong>
//             </div>
//           </section>

//           <section className="analysis-metrics">
//             <article className="analysis-metric">
//               <span className="analysis-metric-icon">
//                 <Wallet size={21} />
//               </span>
//               <span className="analysis-metric-label">
//                 Current monthly savings
//               </span>
//               <strong>{money(values.currentMonthlySavings)}</strong>
//               <small>Based on your saved profile</small>
//             </article>

//             <article className="analysis-metric">
//               <span className="analysis-metric-icon">
//                 <PiggyBank size={21} />
//               </span>
//               <span className="analysis-metric-label">
//                 Projected monthly savings
//               </span>
//               <strong>{money(values.projectedMonthlySavings)}</strong>
//               <small>Based on the selected offer</small>
//             </article>

//             <article
//               className={`analysis-metric ${
//                 savingsImproved
//                   ? 'metric-positive'
//                   : savingsUnchanged
//                     ? ''
//                     : 'metric-negative'
//               }`}
//             >
//               <span className="analysis-metric-icon">
//                 {savingsImproved ? (
//                   <ArrowUpRight size={21} />
//                 ) : (
//                   <ArrowDownRight size={21} />
//                 )}
//               </span>

//               <span className="analysis-metric-label">
//                 Monthly savings change
//               </span>

//               <strong>
//                 {Number(values.monthlySavingsDifference) > 0 ? '+' : ''}
//                 {money(values.monthlySavingsDifference)}
//               </strong>

//               <small>
//                 {savingsImproved
//                   ? 'Projected improvement'
//                   : savingsUnchanged
//                     ? 'No projected change'
//                     : 'Projected decrease'}
//               </small>
//             </article>
//           </section>

//           <section
//             className={`recommendation-card recommendation-${recommendation.type}`}
//           >
//             <div className="recommendation-topline">
//               <span className="recommendation-icon">
//                 {recommendation.type === 'negative' ? (
//                   <CircleAlert size={23} />
//                 ) : (
//                   <Lightbulb size={23} />
//                 )}
//               </span>

//               <div>
//                 <span className="eyebrow">
//                   PRELIMINARY RECOMMENDATION
//                 </span>
//                 <h2>{recommendation.title}</h2>
//               </div>
//             </div>

//             <p className="recommendation-summary">
//               {recommendation.summary}
//             </p>

//             <div className="recommendation-reasons">
//               <div>
//                 <span>Monthly savings change</span>
//                 <strong>
//                   {Number(values.monthlySavingsDifference) > 0 ? '+' : ''}
//                   {money(values.monthlySavingsDifference)}
//                 </strong>
//               </div>

//               <div>
//                 <span>Annual savings change</span>
//                 <strong>{money(values.annualSavingsDifference)}</strong>
//               </div>

//               <div>
//                 <span>
//                   {values.netRelocationCost < 0
//                     ? 'Relocation benefit surplus'
//                     : values.netRelocationCost === 0
//                       ? 'Net relocation cost'
//                       : 'Remaining relocation cost'}
//                 </span>

//                 <strong>
//                   {values.netRelocationCost < 0
//                     ? `${money(Math.abs(values.netRelocationCost))} surplus`
//                     : money(values.netRelocationCost)}
//                 </strong>
//               </div>
//             </div>

//             <div className="recommendation-personal">
//               <h3>Personal factors to consider</h3>

//               <ul>
//                 {recommendation.personalNotes.map((note, index) => (
//                   <li key={`${index}-${note}`}>{note}</li>
//                 ))}
//               </ul>

//               {(recommendation.confidence != null ||
//                 recommendation.adaptability != null) && (
//                 <div className="readiness-summary">
//                   {recommendation.confidence != null && (
//                     <span>
//                       Relocation confidence:{' '}
//                       <strong>{recommendation.confidence}/5</strong>
//                     </span>
//                   )}

//                   {recommendation.adaptability != null && (
//                     <span>
//                       Willingness to adapt:{' '}
//                       <strong>{recommendation.adaptability}/5</strong>
//                     </span>
//                   )}
//                 </div>
//               )}
//             </div>

//             <p className="recommendation-note">
//               This is a rule-based preliminary assessment using your financial
//               estimates and saved profile preferences. It is not a definitive
//               decision about whether you should relocate.
//             </p>
//           </section>

//           <section className="analysis-panel ai-explanation-panel">
//             <div className="ai-explanation-heading">
//               <span className="analysis-metric-icon">
//                 <Sparkles size={21} />
//               </span>
//               <div>
//                 <span className="eyebrow">AI-POWERED INSIGHT</span>
//                 <h2>A closer look at your move</h2>
//               </div>
//             </div>

//             <p className="analysis-panel-description">
//               A plain-language explanation of your financial trade-offs and
//               personal priorities. Use it as guidance, not as a final decision.
//             </p>

//             {aiLoading && (
//               <div className="ai-explanation-status" role="status">
//                 <LoaderCircle size={21} className="analysis-spinner" />
//                 <span>Gemini is reviewing your comparison...</span>
//               </div>
//             )}

//             {!aiLoading && aiError && (
//               <div className="offers-alert offers-error ai-explanation-error" role="alert">
//                 <p>{aiError}</p>
//                 <button
//                   type="button"
//                   className="ai-retry-button"
//                   onClick={() => setAiRetry((count) => count + 1)}
//                 >
//                   Try again
//                 </button>
//               </div>
//             )}

//             {!aiLoading && !aiError && aiExplanation && (
//               <div className="ai-explanation-content">
//                 <p className="ai-explanation-summary">
//                   {aiExplanation.summary}
//                 </p>

//                 {Array.isArray(aiExplanation.keyConsiderations) &&
//                   aiExplanation.keyConsiderations.length > 0 && (
//                     <div className="ai-explanation-list">
//                       <h3>Key considerations</h3>
//                       <ul>
//                         {aiExplanation.keyConsiderations.map((item, index) => (
//                           <li key={`${index}-${item}`}>{item}</li>
//                         ))}
//                       </ul>
//                     </div>
//                   )}

//                 {Array.isArray(aiExplanation.questionsToAsk) &&
//                   aiExplanation.questionsToAsk.length > 0 && (
//                     <div className="ai-explanation-list">
//                       <h3>Questions to consider</h3>
//                       <ul>
//                         {aiExplanation.questionsToAsk.map((item, index) => (
//                           <li key={`${index}-${item}`}>{item}</li>
//                         ))}
//                       </ul>
//                     </div>
//                   )}

//                 <p className="ai-explanation-disclaimer">
//                   AI-generated guidance may be imperfect. Verify offer details
//                   and cost estimates before making a relocation decision.
//                 </p>
//               </div>
//             )}
//           </section>

//           <section className="analysis-panel analysis-chart-panel">
//             <span className="eyebrow">SAVINGS COMPARISON</span>
//             <h2>How your monthly savings could change</h2>

//             <p className="analysis-panel-description">
//               Compare the money left over each month in your current situation
//               and with the selected offer.
//             </p>

//             <div className="analysis-chart">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart
//                   data={chartData}
//                   margin={{ top: 16, right: 12, left: 12, bottom: 8 }}
//                 >
//                   <CartesianGrid
//                     strokeDasharray="3 3"
//                     vertical={false}
//                   />
//                   <XAxis
//                     dataKey="name"
//                     axisLine={false}
//                     tickLine={false}
//                   />
//                   <YAxis
//                     axisLine={false}
//                     tickLine={false}
//                     tickFormatter={(value) =>
//                       `₹${Number(value) / 1000}k`
//                     }
//                     width={60}
//                   />
//                   <Tooltip formatter={(value) => money(value)} />
//                   <Legend />

//                   <Bar
//                     dataKey="savings"
//                     name="Monthly savings"
//                     radius={[7, 7, 0, 0]}
//                   >
//                     {chartData.map((entry) => (
//                       <Cell
//                         key={entry.name}
//                         fill={
//                           entry.name === 'Current' ? '#8CA8A0' : '#00998A'
//                         }
//                       />
//                     ))}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </section>

//           <section className="analysis-detail-grid">
//             <article className="analysis-panel">
//               <span className="eyebrow">MONTHLY BREAKDOWN</span>
//               <h2>Where your money goes</h2>

//               <div className="analysis-breakdown">
//                 <div>
//                   <span>Current take-home</span>
//                   <strong>{money(values.currentTakeHome)}</strong>
//                 </div>
//                 <div>
//                   <span>Current expenses</span>
//                   <strong>− {money(values.currentExpenses)}</strong>
//                 </div>
//                 <div>
//                   <span>Current EMI</span>
//                   <strong>− {money(values.currentEmi)}</strong>
//                 </div>
//                 <div className="analysis-breakdown-total">
//                   <span>Current monthly savings</span>
//                   <strong>{money(values.currentMonthlySavings)}</strong>
//                 </div>
//               </div>

//               <div className="analysis-breakdown">
//                 <div>
//                   <span>New take-home</span>
//                   <strong>{money(values.offerTakeHome)}</strong>
//                 </div>
//                 <div>
//                   <span>Destination living expenses</span>
//                   <strong>− {money(values.destinationExpenses)}</strong>
//                 </div>
//                 <div>
//                   <span>Monthly EMI</span>
//                   <strong>− {money(values.offerEmi)}</strong>
//                 </div>
//                 <div className="analysis-breakdown-total">
//                   <span>Projected monthly savings</span>
//                   <strong>{money(values.projectedMonthlySavings)}</strong>
//                 </div>
//               </div>
//             </article>

//             <article className="analysis-panel">
//               <span className="eyebrow">RELOCATION COSTS</span>
//               <h2>Upfront costs and benefits</h2>

//               <div className="analysis-breakdown">
//                 <div>
//                   <span>
//                     {values.netRelocationCost < 0
//                       ? 'Relocation benefit surplus'
//                       : values.netRelocationCost === 0
//                         ? 'Net relocation cost'
//                         : 'Remaining relocation cost'}
//                   </span>

//                   <strong>
//                     {values.netRelocationCost < 0
//                       ? `${money(Math.abs(values.netRelocationCost))} surplus`
//                       : money(values.netRelocationCost)}
//                   </strong>
//                 </div>

//                 <div className="analysis-breakdown-total">
//                   <span>Estimated break-even</span>
//                   <strong>
//                     {values.sameCity
//   ? 'Not applicable'
//   : values.breakEvenMonths == null
//     ? 'Not reached'
//     : values.breakEvenMonths === 0
//       ? 'Immediate'
//       : `${values.breakEvenMonths.toFixed(1)} months`}
//                   </strong>
//                 </div>
//               </div>

//               <p className="analysis-explanation">
//                 {values.breakEvenMessage}
//               </p>

//               <div className="analysis-annual">
//                 <span>Annual savings difference</span>
//                 <strong>{money(values.annualSavingsDifference)}</strong>
//               </div>
//             </article>
//           </section>

//           <p className="analysis-disclaimer">
//             {analysis.note} The recommendation is a preliminary assessment,
//             not a definitive decision about whether you should relocate.
//           </p>
//         </>
//       )}
//     </main>
//   )
// }
import { useEffect, useState } from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  CircleAlert,
  Lightbulb,
  Sparkles,
  LoaderCircle,
  PiggyBank,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { supabase } from '../lib/supabase'
import '../App.css'

const API_URL = 'http://localhost:3000/api'

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))


function getRecommendation(values, preferences) {
  if (values.analysisType === 'graduate_first_job') {
    const fundingGap = Number(values.relocationFundingGap || 0)
    const confidence = preferences?.relocation_confidence
    const adaptability = preferences?.willingness_to_adapt
    const concerns = Array.isArray(preferences?.concerns)
      ? preferences.concerns
      : []
    const personalNotes = []

    if (fundingGap > 0) {
      personalNotes.push(
        'Your available relocation funds do not fully cover the estimated upfront cost. Confirm how you would cover the shortfall before committing.',
      )
    } else {
      personalNotes.push(
        'Your stated relocation funds cover the estimated net upfront relocation cost. Keep a buffer for deposits and unexpected expenses.',
      )
    }

    if (Number(confidence) > 0 && Number(confidence) <= 2) {
      personalNotes.push(
        'Your relocation confidence is low. Consider what practical support would help you feel prepared for the move.',
      )
    }

    if (Number(adaptability) > 0 && Number(adaptability) <= 2) {
      personalNotes.push(
        'You reported lower willingness to adapt to a new city. Research accommodation, commute, and support options before deciding.',
      )
    }

    if (concerns.length) {
      personalNotes.push(
        `You identified these concerns: ${concerns.join(', ')}. Consider how you would address them before relocating.`,
      )
    }

    if (!preferences) {
      personalNotes.push(
        'Your personal preferences could not be loaded. Review your profile to include them in this assessment.',
      )
    }

    return {
      type: fundingGap > 0 ? 'negative' : 'mixed',
      title:
        fundingGap > 0
          ? 'Check your upfront relocation budget'
          : 'Review affordability and career fit',
      summary:
        fundingGap > 0
          ? 'This offer may provide a path to your first role, but your stated relocation funds fall short of the estimated upfront cost. Confirm a realistic plan for the gap before accepting.'
          : 'Review the projected monthly savings after joining alongside the upfront moving cost, role fit, and personal priorities. This assessment does not compare the offer against a current salary.',
      personalNotes,
      confidence,
      adaptability,
    }
  }

  const difference = Number(values.monthlySavingsDifference || 0)
  const netCost = Number(values.netRelocationCost || 0)

  const confidence = preferences?.relocation_confidence
  const adaptability = preferences?.willingness_to_adapt
  const priorities = preferences?.priorities || {}
  const concerns = Array.isArray(preferences?.concerns)
    ? preferences.concerns
    : []

  const lowReadiness =
    (confidence != null && Number(confidence) <= 2) ||
    (adaptability != null && Number(adaptability) <= 2)

  const hasPersonalConsiderations =
    concerns.length > 0 ||
    lowReadiness ||
    Number(priorities.family || 0) >= 4 ||
    Number(priorities.work_life || 0) >= 4

  let type = 'mixed'
  let title = 'Consider the full picture'
  let summary =
    'Review the financial outcome alongside your personal priorities before deciding.'

  if (difference > 0 && netCost <= 0) {
    type = 'positive'
    title = 'Financially favourable'
    summary =
      'Your projected monthly savings improve, and the relocation benefits cover the estimated upfront cost.'
  } else if (difference > 0) {
    type = 'positive'
    title = 'Financially promising'
    summary =
      'Your projected monthly savings improve. Consider the remaining upfront relocation cost and how long it may take to recover it.'
  } else if (difference < 0 && netCost > 0) {
    type = 'negative'
    title = 'Financially less favourable'
    summary =
      'Your monthly savings are projected to decrease, and there is a remaining upfront relocation cost.'
  } else if (difference < 0) {
    type = 'mixed'
    title = 'A financial trade-off'
    summary =
      'Your monthly savings are projected to decrease, although the relocation benefits cover the estimated upfront cost.'
  } else if (netCost <= 0) {
    type = 'mixed'
    title = 'A financially balanced move'
    summary =
      'Your monthly savings remain unchanged, and the relocation benefits cover the estimated upfront cost.'
  } else {
    type = 'mixed'
    title = 'No monthly savings improvement'
    summary =
      'Your monthly savings are projected to remain the same, while the move adds an upfront cost.'
  }

  if (hasPersonalConsiderations) {
    if (difference > 0) {
      title = 'Financially favourable, with personal factors to consider'
      summary =
        'Your projected savings improve, and the relocation benefits cover the estimated upfront cost. Your profile also highlights personal factors worth reviewing before committing to the move.'
    } else {
      summary +=
        ' Your profile also highlights personal factors worth reviewing before making a decision.'
    }
  } else if (!preferences) {
    summary +=
      ' Complete your profile preferences to include your personal priorities and relocation readiness.'
  }

  const personalNotes = []

  if (lowReadiness) {
    personalNotes.push(
      'Your profile indicates lower relocation confidence or willingness to adapt. Consider what support would help you feel prepared.',
    )
  }

  if (Number(priorities.family || 0) >= 4) {
    personalNotes.push(
      'Family is a high priority for you. Consider distance, responsibilities, and how often you could travel home.',
    )
  }

  if (Number(priorities.work_life || 0) >= 4) {
    personalNotes.push(
      'Work-life balance is a high priority for you. Review expected working hours, commute, and flexibility with the employer.',
    )
  }

  if (
    Number(priorities.savings || 0) >= 4 &&
    difference <= 0
  ) {
    personalNotes.push(
      'Savings are a high priority for you, and this offer does not improve projected monthly savings.',
    )
  }

  if (Number(priorities.career || 0) >= 4) {
    personalNotes.push(
      'Career growth is a high priority for you. Investigate this role’s learning opportunities and long-term progression alongside the financial outcome.',
    )
  }

  if (concerns.length > 0) {
    personalNotes.push(
      `You identified these concerns in your profile: ${concerns.join(', ')}. Consider what practical steps could help address them before relocating.`,
    )
  }

  if (!preferences) {
    personalNotes.push(
      'Your profile preferences could not be loaded. Review your profile to include personal factors in this assessment.',
    )
  } else if (personalNotes.length === 0) {
    personalNotes.push(
      'Your profile does not flag a specific concern under these rules. Consider your individual circumstances before deciding.',
    )
  }

  return {
    type,
    title,
    summary,
    personalNotes,
    confidence,
    adaptability,
  }
}


export default function Analysis() {
  const [offers, setOffers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [profilePreferences, setProfilePreferences] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analysing, setAnalysing] = useState(false)
  const [error, setError] = useState('')
  const [aiExplanation, setAiExplanation] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiRetry, setAiRetry] = useState(0)

  useEffect(() => {
    let active = true

    async function loadOffers() {
      setLoading(true)
      setError('')

      try {
        const { data, error: sessionError } =
          await supabase.auth.getSession()

        if (sessionError) throw sessionError

        const token = data.session?.access_token
        if (!token) throw new Error('Please sign in again.')

        const response = await fetch(`${API_URL}/offers`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Could not load job offers.')
        }

        if (!active) return

        setOffers(result.offers || [])

        if (result.offers?.length) {
          setSelectedId(result.offers[0].id)
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Could not load your job offers.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadOffers()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadAnalysis() {
      setAnalysis(null)
      setProfilePreferences(null)

      if (!selectedId) {
        setAnalysing(false)
        return
      }

      setAnalysing(true)
      setError('')

      try {
        const { data, error: sessionError } =
          await supabase.auth.getSession()

        if (sessionError) throw sessionError

        const token = data.session?.access_token
        if (!token) throw new Error('Please sign in again.')

        const response = await fetch(
          `${API_URL}/analysis/${selectedId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Could not calculate analysis.')
        }

        if (active) setAnalysis(result)

        // Load the user's existing preferences directly from Supabase.
        // A preference loading failure should not hide financial analysis.
        try {
          const { data: sessionData, error: profileSessionError } =
            await supabase.auth.getSession()

          if (profileSessionError) throw profileSessionError

          const userId = sessionData.session?.user?.id

          if (userId) {
            const { data: profile, error: profileError } =
              await supabase
                .from('profiles')
                .select(
                  'relocation_confidence, willingness_to_adapt, concerns, priorities',
                )
                .eq('id', userId)
                .maybeSingle()

            if (profileError) throw profileError

            if (active) setProfilePreferences(profile || null)
          }
        } catch (profileLoadError) {
          console.error(
            'Could not load profile preferences:',
            profileLoadError.message,
          )

          if (active) setProfilePreferences(null)
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Could not calculate your analysis.')
        }
      } finally {
        if (active) setAnalysing(false)
      }
    }

    loadAnalysis()

    return () => {
      active = false
    }
  }, [selectedId])

  // Gemini explains the backend's financial comparison; it does not replace
  // the existing rule-based recommendation or calculate financial values.
  useEffect(() => {
    let active = true

    async function loadAiExplanation() {
      setAiExplanation(null)
      setAiError('')

      if (!selectedId) {
        setAiLoading(false)
        return
      }

      setAiLoading(true)

      try {
        const { data, error: sessionError } =
          await supabase.auth.getSession()

        if (sessionError) throw sessionError

        const token = data.session?.access_token
        if (!token) throw new Error('Please sign in again.')

        const response = await fetch(
          `${API_URL}/ai-explanation/${selectedId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )

        const result = await response.json()

        if (!response.ok) {
          throw new Error(
            result.error || result.message || 'Could not generate the AI explanation.',
          )
        }

        if (active) setAiExplanation(result.explanation)
      } catch (err) {
        if (active) {
          setAiError(
            err.message || 'The AI explanation is unavailable right now.',
          )
        }
      } finally {
        if (active) setAiLoading(false)
      }
    }

    loadAiExplanation()

    return () => {
      active = false
    }
  }, [selectedId, aiRetry])

  const values = analysis?.analysis
  const savingsImproved = Number(values?.monthlySavingsDifference) > 0
  const savingsUnchanged = Number(values?.monthlySavingsDifference) === 0

  const isGraduate = analysis?.profile?.careerStage === 'recent_graduate'

  const chartData = values
    ? isGraduate
      ? [
          {
            name: 'After joining',
            savings: Number(values.projectedMonthlySavings || 0),
          },
        ]
      : [
          {
            name: 'Current',
            savings: Number(values.currentMonthlySavings || 0),
          },
          {
            name: 'With offer',
            savings: Number(values.projectedMonthlySavings || 0),
          },
        ]
    : []

  const recommendation = values
    ? getRecommendation(values, profilePreferences)
    : null

  if (loading) {
    return (
      <section className="analysis-loading">
        <LoaderCircle size={26} className="analysis-spinner" />
        <p>Loading your job offers...</p>
      </section>
    )
  }

  return (
    <main className="analysis-page">
      <header className="analysis-heading">
        <div>
          <span className="offers-eyebrow">YOUR NUMBERS, MADE CLEAR</span>
          <h1>Relocation analysis</h1>
          <p>Understand how a potential move could change your finances.</p>
        </div>

        <span className="analysis-heading-icon">
          <ChartNoAxesCombined size={27} />
        </span>
      </header>

      {offers.length > 0 && (
        <section className="analysis-selector">
          <label htmlFor="analysis-offer">
            <BriefcaseBusiness size={19} />
            Select a job offer
          </label>

          <select
            id="analysis-offer"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {offers.map((offer) => (
              <option key={offer.id} value={offer.id}>
                {offer.company_name} — {offer.role_title} (
                {offer.destination_city})
              </option>
            ))}
          </select>
        </section>
      )}

      {error && (
        <div className="offers-alert offers-error" role="alert">
          {error}
        </div>
      )}

      {offers.length === 0 && !error && (
        <section className="analysis-empty">
          <BriefcaseBusiness size={34} />
          <h2>No job offers yet</h2>
          <p>Add a job offer before calculating your relocation analysis.</p>
        </section>
      )}

      {analysing && (
        <section className="analysis-loading">
          <LoaderCircle size={25} className="analysis-spinner" />
          <p>Calculating your financial comparison...</p>
        </section>
      )}

      {values && !analysing && (
        <>
          <section className="analysis-context">
            <div>
              <span>Current location</span>
              <strong>{analysis.profile.currentCity || 'Not specified'}</strong>
            </div>

            <ArrowRight size={21} />

            <div>
              <span>Potential destination</span>
              <strong>{analysis.offer.destinationCity}</strong>
            </div>
          </section>

          <section className="analysis-metrics">
            <article className="analysis-metric">
              <span className="analysis-metric-icon">
                <Wallet size={21} />
              </span>
              <span className="analysis-metric-label">
                {isGraduate ? 'Available relocation funds' : 'Current monthly savings'}
              </span>
              <strong>
                {money(
                  isGraduate
                    ? values.availableRelocationFunds
                    : values.currentMonthlySavings,
                )}
              </strong>
              <small>
                {isGraduate
                  ? 'Your stated moving budget, or current savings if no budget was entered'
                  : 'Based on your saved profile'}
              </small>
            </article>

            <article className="analysis-metric">
              <span className="analysis-metric-icon">
                <PiggyBank size={21} />
              </span>
              <span className="analysis-metric-label">
                Projected monthly savings
              </span>
              <strong>{money(values.projectedMonthlySavings)}</strong>
              <small>Based on the selected offer</small>
            </article>

            <article
              className={`analysis-metric ${
                savingsImproved
                  ? 'metric-positive'
                  : savingsUnchanged
                    ? ''
                    : 'metric-negative'
              }`}
            >
              <span className="analysis-metric-icon">
                {savingsImproved ? (
                  <ArrowUpRight size={21} />
                ) : (
                  <ArrowDownRight size={21} />
                )}
              </span>

              <span className="analysis-metric-label">
                {isGraduate ? 'Upfront relocation funding gap' : 'Monthly savings change'}
              </span>

              <strong>
                {isGraduate
                  ? money(values.relocationFundingGap)
                  : `${Number(values.monthlySavingsDifference) > 0 ? '+' : ''}${money(values.monthlySavingsDifference)}`}
              </strong>

              <small>
                {isGraduate
                  ? values.relocationFundingGap > 0
                    ? 'Estimated amount not covered by your stated relocation funds'
                    : 'Your stated funds cover the estimated net upfront cost'
                  : savingsImproved
                    ? 'Projected improvement'
                    : savingsUnchanged
                      ? 'No projected change'
                      : 'Projected decrease'}
              </small>
            </article>
          </section>

          <section
            className={`recommendation-card recommendation-${recommendation.type}`}
          >
            <div className="recommendation-topline">
              <span className="recommendation-icon">
                {recommendation.type === 'negative' ? (
                  <CircleAlert size={23} />
                ) : (
                  <Lightbulb size={23} />
                )}
              </span>

              <div>
                <span className="eyebrow">
                  PRELIMINARY RECOMMENDATION
                </span>
                <h2>{recommendation.title}</h2>
              </div>
            </div>

            <p className="recommendation-summary">
              {recommendation.summary}
            </p>

            <div className="recommendation-reasons">
              {isGraduate ? (
                <>
                  <div>
                    <span>Projected annual savings after joining</span>
                    <strong>{money(values.annualProjectedSavings)}</strong>
                  </div>
                  <div>
                    <span>Available relocation funds</span>
                    <strong>{money(values.availableRelocationFunds)}</strong>
                  </div>
                  <div>
                    <span>Upfront funding gap</span>
                    <strong>{money(values.relocationFundingGap)}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span>Monthly savings change</span>
                    <strong>
                      {Number(values.monthlySavingsDifference) > 0 ? '+' : ''}
                      {money(values.monthlySavingsDifference)}
                    </strong>
                  </div>
                  <div>
                    <span>Annual savings change</span>
                    <strong>{money(values.annualSavingsDifference)}</strong>
                  </div>
                </>
              )}

              <div>
                <span>
                  {values.netRelocationCost < 0
                    ? 'Relocation benefit surplus'
                    : values.netRelocationCost === 0
                      ? 'Net relocation cost'
                      : 'Remaining relocation cost'}
                </span>

                <strong>
                  {values.netRelocationCost < 0
                    ? `${money(Math.abs(values.netRelocationCost))} surplus`
                    : money(values.netRelocationCost)}
                </strong>
              </div>
            </div>

            <div className="recommendation-personal">
              <h3>Personal factors to consider</h3>

              <ul>
                {recommendation.personalNotes.map((note, index) => (
                  <li key={`${index}-${note}`}>{note}</li>
                ))}
              </ul>

              {(recommendation.confidence != null ||
                recommendation.adaptability != null) && (
                <div className="readiness-summary">
                  {recommendation.confidence != null && (
                    <span>
                      Relocation confidence:{' '}
                      <strong>{recommendation.confidence}/5</strong>
                    </span>
                  )}

                  {recommendation.adaptability != null && (
                    <span>
                      Willingness to adapt:{' '}
                      <strong>{recommendation.adaptability}/5</strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            <p className="recommendation-note">
              This is a rule-based preliminary assessment using your financial
              estimates and saved profile preferences. It is not a definitive
              decision about whether you should relocate.
            </p>
          </section>

          <section className="analysis-panel ai-explanation-panel">
            <div className="ai-explanation-heading">
              <span className="analysis-metric-icon">
                <Sparkles size={21} />
              </span>
              <div>
                <span className="eyebrow">AI-POWERED INSIGHT</span>
                <h2>A closer look at your move</h2>
              </div>
            </div>

            <p className="analysis-panel-description">
              A plain-language explanation of your financial trade-offs and
              personal priorities. Use it as guidance, not as a final decision.
            </p>

            {aiLoading && (
              <div className="ai-explanation-status" role="status">
                <LoaderCircle size={21} className="analysis-spinner" />
                <span>Gemini is reviewing your comparison...</span>
              </div>
            )}

            {!aiLoading && aiError && (
              <div className="offers-alert offers-error ai-explanation-error" role="alert">
                <p>{aiError}</p>
                <button
                  type="button"
                  className="ai-retry-button"
                  onClick={() => setAiRetry((count) => count + 1)}
                >
                  Try again
                </button>
              </div>
            )}

            {!aiLoading && !aiError && aiExplanation && (
              <div className="ai-explanation-content">
                <p className="ai-explanation-summary">
                  {aiExplanation.summary}
                </p>

                {Array.isArray(aiExplanation.keyConsiderations) &&
                  aiExplanation.keyConsiderations.length > 0 && (
                    <div className="ai-explanation-list">
                      <h3>Key considerations</h3>
                      <ul>
                        {aiExplanation.keyConsiderations.map((item, index) => (
                          <li key={`${index}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {Array.isArray(aiExplanation.questionsToAsk) &&
                  aiExplanation.questionsToAsk.length > 0 && (
                    <div className="ai-explanation-list">
                      <h3>Questions to consider</h3>
                      <ul>
                        {aiExplanation.questionsToAsk.map((item, index) => (
                          <li key={`${index}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                <p className="ai-explanation-disclaimer">
                  AI-generated guidance may be imperfect. Verify offer details
                  and cost estimates before making a relocation decision.
                </p>
              </div>
            )}
          </section>

          <section className="analysis-panel analysis-chart-panel">
            <span className="eyebrow">
              {isGraduate ? 'PROJECTED SAVINGS' : 'SAVINGS COMPARISON'}
            </span>
            <h2>
              {isGraduate
                ? 'Estimated monthly savings after joining'
                : 'How your monthly savings could change'}
            </h2>

            <p className="analysis-panel-description">
              {isGraduate
                ? 'This estimate shows what may remain each month after the offer income, destination living costs, and offer EMI.'
                : 'Compare the money left over each month in your current situation and with the selected offer.'}
            </p>

            <div className="analysis-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 16, right: 12, left: 12, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `₹${Number(value) / 1000}k`
                    }
                    width={60}
                  />
                  <Tooltip formatter={(value) => money(value)} />
                  <Legend />

                  <Bar
                    dataKey="savings"
                    name="Monthly savings"
                    radius={[7, 7, 0, 0]}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          entry.name === 'Current' ? '#8CA8A0' : '#00998A'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="analysis-detail-grid">
            <article className="analysis-panel">
              <span className="eyebrow">
                {isGraduate ? 'FIRST-JOB BUDGET' : 'MONTHLY BREAKDOWN'}
              </span>
              <h2>
                {isGraduate ? 'Moving funds and monthly budget' : 'Where your money goes'}
              </h2>

              <div className="analysis-breakdown">
                {isGraduate ? (
                  <>
                    <div>
                      <span>Available relocation funds</span>
                      <strong>{money(values.availableRelocationFunds)}</strong>
                    </div>
                    <div>
                      <span>Estimated net upfront relocation cost</span>
                      <strong>{money(values.remainingUpfrontCost)}</strong>
                    </div>
                    <div>
                      <span>Family financial support (monthly, reported)</span>
                      <strong>{money(values.familyFinancialSupport)}</strong>
                    </div>
                    <div className="analysis-breakdown-total">
                      <span>Upfront funding gap</span>
                      <strong>{money(values.relocationFundingGap)}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span>Current take-home</span>
                      <strong>{money(values.currentTakeHome)}</strong>
                    </div>
                    <div>
                      <span>Current expenses</span>
                      <strong>− {money(values.currentExpenses)}</strong>
                    </div>
                    <div>
                      <span>Current EMI</span>
                      <strong>− {money(values.currentEmi)}</strong>
                    </div>
                    <div className="analysis-breakdown-total">
                      <span>Current monthly savings</span>
                      <strong>{money(values.currentMonthlySavings)}</strong>
                    </div>
                  </>
                )}
              </div>

              <div className="analysis-breakdown">
                <div>
                  <span>New take-home</span>
                  <strong>{money(values.offerTakeHome)}</strong>
                </div>
                <div>
                  <span>Destination living expenses</span>
                  <strong>− {money(values.destinationExpenses)}</strong>
                </div>
                <div>
                  <span>Monthly EMI</span>
                  <strong>− {money(values.offerEmi)}</strong>
                </div>
                <div className="analysis-breakdown-total">
                  <span>Projected monthly savings</span>
                  <strong>{money(values.projectedMonthlySavings)}</strong>
                </div>
              </div>
            </article>

            <article className="analysis-panel">
              <span className="eyebrow">RELOCATION COSTS</span>
              <h2>Upfront costs and benefits</h2>

              <div className="analysis-breakdown">
                <div>
                  <span>
                    {values.netRelocationCost < 0
                      ? 'Relocation benefit surplus'
                      : values.netRelocationCost === 0
                        ? 'Net relocation cost'
                        : 'Remaining relocation cost'}
                  </span>

                  <strong>
                    {values.netRelocationCost < 0
                      ? `${money(Math.abs(values.netRelocationCost))} surplus`
                      : money(values.netRelocationCost)}
                  </strong>
                </div>

                <div className="analysis-breakdown-total">
                  <span>Estimated break-even</span>
                  <strong>
                    {values.breakEvenMonths == null
                      ? 'Not reached'
                      : values.breakEvenMonths === 0
                        ? 'Already covered'
                        : `${values.breakEvenMonths.toFixed(1)} months`}
                  </strong>
                </div>
              </div>

              <p className="analysis-explanation">
                {values.breakEvenMessage}
              </p>

              <div className="analysis-annual">
                <span>Annual savings difference</span>
                <strong>{money(values.annualSavingsDifference)}</strong>
              </div>
            </article>
          </section>

          <p className="analysis-disclaimer">
            {analysis.note} The recommendation is a preliminary assessment,
            not a definitive decision about whether you should relocate.
          </p>
        </>
      )}
    </main>
  )
}
