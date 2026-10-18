import { useEffect, useMemo, useState } from 'react'
import {
  Award,
  CircleAlert,
  LoaderCircle,
  Scale,
  Sparkles,
  Trophy,
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

const CURRENT_COLOR = '#8CA8A0'
const OFFER_COLORS = ['#00998A', '#2F6FDE', '#E2874B', '#8A5CC2', '#C2486B', '#5A8F29']

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const compactMoney = (value) => {
  const n = Number(value || 0)
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(0)}k`
  return `${sign}₹${abs}`
}

async function authedFetch(path) {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const token = data.session?.access_token
  if (!token) throw new Error('Please sign in again.')

  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || result.error || 'Request failed.')
  }
  return result
}

const label = (o) => `${o.companyName} (${o.destinationCity})`

export default function CompareOffers() {
  const [offers, setOffers] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)
  const [error, setError] = useState('')
  const [comparison, setComparison] = useState(null)

  const [ai, setAi] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiRetry, setAiRetry] = useState(0)

  // 1. Load all saved offers and pre-select up to the first four.
  useEffect(() => {
    let active = true

    async function load() {
      try {
        const result = await authedFetch('/offers')
        if (!active) return
        const list = result.offers || []
        setOffers(list)
        setSelected(list.slice(0, 4).map((o) => o.id))
      } catch (err) {
        if (active) setError(err.message || 'Could not load your job offers.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const idsKey = useMemo(() => [...selected].sort().join(','), [selected])

  // 2. Recalculate whenever the selection changes.
  useEffect(() => {
    let active = true

    async function run() {
      setComparison(null)
      setError('')

      if (selected.length < 2) return

      setComparing(true)
      try {
        const result = await authedFetch(`/compare?ids=${idsKey}`)
        if (active) setComparison(result)
      } catch (err) {
        if (active) setError(err.message || 'Could not compare your offers.')
      } finally {
        if (active) setComparing(false)
      }
    }

    run()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey])

  // 3. Ask Gemini for the overall verdict (separate so charts show first).
  useEffect(() => {
    let active = true

    async function run() {
      setAi(null)
      setAiError('')

      if (selected.length < 2) return

      setAiLoading(true)
      try {
        const result = await authedFetch(`/ai-comparison?ids=${idsKey}`)
        if (active) setAi(result.comparison)
      } catch (err) {
        if (active) setAiError(err.message || 'The AI comparison is unavailable right now.')
      } finally {
        if (active) setAiLoading(false)
      }
    }

    run()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, aiRetry])

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  // Stable colour per offer, independent of ranking order.
  const colorFor = useMemo(() => {
    const map = {}
    offers.forEach((o, i) => {
      map[o.id] = OFFER_COLORS[i % OFFER_COLORS.length]
    })
    return map
  }, [offers])

  const list = comparison?.offers || []
  const highlights = comparison?.highlights || {}
  const winner = list[0]

  const savingsData = comparison
    ? [
        { name: 'Current', savings: comparison.currentMonthlySavings, color: CURRENT_COLOR },
        ...list.map((o) => ({
          name: o.companyName,
          savings: o.projectedMonthlySavings,
          color: colorFor[o.id],
        })),
      ]
    : []

  const gainData = list.map((o) => ({
    name: o.companyName,
    'Year 1': Math.round(o.firstYearNetGain),
    'Year 3': Math.round(o.threeYearNetGain),
  }))

  const costData = list.map((o) => ({
    name: o.companyName,
    expenses: o.destinationExpenses,
    color: colorFor[o.id],
  }))

  const badgesFor = (id) => {
    const b = []
    if (highlights.bestOverallId === id) b.push('Best overall')
    if (highlights.highestMonthlySavingsId === id) b.push('Highest savings')
    if (highlights.lowestRelocationCostId === id) b.push('Lowest upfront cost')
    if (highlights.fastestBreakEvenId === id) b.push('Fastest break-even')
    return b
  }

  const breakEvenText = (o) =>
    o.breakEvenMonths == null
      ? 'Not reached'
      : o.breakEvenMonths === 0
        ? 'Already covered'
        : `${o.breakEvenMonths.toFixed(1)} months`

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
          <span className="offers-eyebrow">SIDE BY SIDE</span>
          <h1>Compare offers</h1>
          <p>See which job offer leaves you better off, against each other and your current job.</p>
        </div>
        <span className="analysis-heading-icon">
          <Scale size={27} />
        </span>
      </header>

      {offers.length < 2 ? (
        <section className="analysis-empty">
          <Scale size={34} />
          <h2>Add at least two job offers</h2>
          <p>You need two or more saved offers to compare them side by side.</p>
        </section>
      ) : (
        <section className="compare-picker">
          <h2>Choose offers to compare</h2>
          <p className="analysis-panel-description">Select two or more. Your current job is always the baseline.</p>
          <div className="compare-chips">
            {offers.map((o) => {
              const on = selected.includes(o.id)
              return (
                <button
                  key={o.id}
                  type="button"
                  className={`compare-chip ${on ? 'on' : ''}`}
                  style={on ? { borderColor: colorFor[o.id] } : undefined}
                  onClick={() => toggle(o.id)}
                  aria-pressed={on}
                >
                  <span className="compare-dot" style={{ background: colorFor[o.id] }} />
                  <span>
                    <strong>{o.company_name}</strong>
                    <small>{o.role_title} · {o.destination_city}</small>
                  </span>
                </button>
              )
            })}
          </div>
          {selected.length < 2 && (
            <p className="compare-hint">Select at least two offers to see the comparison.</p>
          )}
        </section>
      )}

      {error && (
        <div className="offers-alert offers-error" role="alert">{error}</div>
      )}

      {comparing && (
        <section className="analysis-loading">
          <LoaderCircle size={25} className="analysis-spinner" />
          <p>Comparing your offers...</p>
        </section>
      )}

      {comparison && !comparing && winner && (
        <>
          {/* Winner banner */}
          <section className="recommendation-card recommendation-positive">
            <div className="recommendation-topline">
              <span className="recommendation-icon"><Trophy size={23} /></span>
              <div>
                <span className="eyebrow">FINANCIAL FRONT-RUNNER</span>
                <h2>{label(winner)} — {winner.roleTitle}</h2>
              </div>
            </div>
            <p className="recommendation-summary">
              Over three years, this offer is projected to leave you{' '}
              <strong>{money(winner.threeYearNetGain)}</strong> better off than staying in
              your current job, after upfront relocation costs.
              {list[1] && (
                <> That is {money(winner.threeYearNetGain - list[1].threeYearNetGain)} more than {list[1].companyName}, the next best.</>
              )}
            </p>
          </section>

          {/* Offer cards */}
          <section className="compare-cards">
            {list.map((o) => (
              <article
                key={o.id}
                className="analysis-panel compare-card"
                style={{ borderTop: `4px solid ${colorFor[o.id]}` }}
              >
                <div className="compare-card-top">
                  <span className="compare-rank">#{o.rank}</span>
                  <div>
                    <h3>{o.companyName}</h3>
                    <small>{o.roleTitle} · {o.destinationCity}</small>
                  </div>
                </div>

                <div className="compare-badges">
                  {badgesFor(o.id).map((b) => (
                    <span key={b} className="compare-badge"><Award size={12} /> {b}</span>
                  ))}
                </div>

                <div className="analysis-breakdown">
                  <div><span>Projected monthly savings</span><strong>{money(o.projectedMonthlySavings)}</strong></div>
                  <div>
                    <span>Change vs current</span>
                    <strong style={{ color: o.monthlySavingsDifference >= 0 ? '#0a7a5c' : '#b3402a' }}>
                      {o.monthlySavingsDifference > 0 ? '+' : ''}{money(o.monthlySavingsDifference)}
                    </strong>
                  </div>
                  <div><span>Net relocation cost</span><strong>{o.netRelocationCost < 0 ? `${money(-o.netRelocationCost)} surplus` : money(o.netRelocationCost)}</strong></div>
                  <div className="analysis-breakdown-total"><span>3-year net gain</span><strong>{money(o.threeYearNetGain)}</strong></div>
                </div>

                {o.warnings.map((w) => (
                  <p key={w} className="compare-warning"><CircleAlert size={14} /> {w}</p>
                ))}
              </article>
            ))}
          </section>

          {/* Chart 1: monthly savings */}
          <section className="analysis-panel analysis-chart-panel">
            <span className="eyebrow">MONTHLY SAVINGS</span>
            <h2>Money left over each month</h2>
            <p className="analysis-panel-description">Your current job versus every selected offer.</p>
            <div className="analysis-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={savingsData} margin={{ top: 16, right: 12, left: 12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={compactMoney} width={64} />
                  <Tooltip formatter={(v) => money(v)} />
                  <Bar dataKey="savings" name="Monthly savings" radius={[7, 7, 0, 0]}>
                    {savingsData.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Chart 2: cumulative net gain */}
          <section className="analysis-panel analysis-chart-panel">
            <span className="eyebrow">NET GAIN OVER TIME</span>
            <h2>What each offer is worth after upfront costs</h2>
            <p className="analysis-panel-description">
              Extra savings versus your current job, minus the net relocation cost. Below zero means the move has not paid for itself yet.
            </p>
            <div className="analysis-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gainData} margin={{ top: 16, right: 12, left: 12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={compactMoney} width={64} />
                  <Tooltip formatter={(v) => money(v)} />
                  <Legend />
                  <Bar dataKey="Year 1" fill="#8CA8A0" radius={[7, 7, 0, 0]} />
                  <Bar dataKey="Year 3" fill="#00998A" radius={[7, 7, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Chart 3: living costs */}
          <section className="analysis-panel analysis-chart-panel">
            <span className="eyebrow">COST OF LIVING</span>
            <h2>Estimated monthly expenses by offer</h2>
            <div className="analysis-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData} margin={{ top: 16, right: 12, left: 12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={compactMoney} width={64} />
                  <Tooltip formatter={(v) => money(v)} />
                  <Bar dataKey="expenses" name="Monthly expenses" radius={[7, 7, 0, 0]}>
                    {costData.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Comparison table */}
          <section className="analysis-panel">
            <span className="eyebrow">FULL BREAKDOWN</span>
            <h2>Everything side by side</h2>
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    {list.map((o) => (
                      <th key={o.id}>
                        <span className="compare-dot" style={{ background: colorFor[o.id] }} /> {o.companyName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Rank', (o) => `#${o.rank}`],
                    ['Destination', (o) => o.destinationCity],
                    ['Annual CTC', (o) => money(o.annualCtc)],
                    ['Monthly take-home', (o) => money(o.offerTakeHome)],
                    ['Monthly expenses', (o) => money(o.destinationExpenses)],
                    ['Monthly EMI', (o) => money(o.offerEmi)],
                    ['Projected monthly savings', (o) => money(o.projectedMonthlySavings)],
                    ['Savings change / month', (o) => money(o.monthlySavingsDifference)],
                    ['Net relocation cost', (o) => money(o.netRelocationCost)],
                    ['Break-even', breakEvenText],
                    ['Year 1 net gain', (o) => money(o.firstYearNetGain)],
                    ['Year 3 net gain', (o) => money(o.threeYearNetGain)],
                  ].map(([name, fn]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      {list.map((o) => <td key={o.id}>{fn(o)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* AI verdict */}
          <section className="analysis-panel ai-explanation-panel">
            <div className="ai-explanation-heading">
              <span className="analysis-metric-icon"><Sparkles size={21} /></span>
              <div>
                <span className="eyebrow">AI-POWERED INSIGHT</span>
                <h2>Which offer fits you best?</h2>
              </div>
            </div>

            <p className="analysis-panel-description">
              Gemini weighs the numbers above against your priorities and concerns. Use it as guidance, not a final decision.
            </p>

            {aiLoading && (
              <div className="ai-explanation-status" role="status">
                <LoaderCircle size={21} className="analysis-spinner" />
                <span>Gemini is comparing your offers...</span>
              </div>
            )}

            {!aiLoading && aiError && (
              <div className="offers-alert offers-error ai-explanation-error" role="alert">
                <p>{aiError}</p>
                <button type="button" className="ai-retry-button" onClick={() => setAiRetry((c) => c + 1)}>
                  Try again
                </button>
              </div>
            )}

            {!aiLoading && !aiError && ai && (
              <div className="ai-explanation-content">
                <p className="ai-explanation-summary">
                  <strong>Best fit: {ai.bestFit}.</strong> {ai.verdict}
                </p>

                <div className="compare-insights">
                  {ai.offerInsights?.map((item) => (
                    <div key={item.company} className="compare-insight">
                      <h3>{item.company}</h3>
                      <h4>Strengths</h4>
                      <ul>{item.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                      <h4>Watch out for</h4>
                      <ul>{item.concerns?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  ))}
                </div>

                {ai.questionsToAsk?.length > 0 && (
                  <div className="ai-explanation-list">
                    <h3>Questions to ask the employers</h3>
                    <ul>{ai.questionsToAsk.map((q, i) => <li key={i}>{q}</li>)}</ul>
                  </div>
                )}

                <p className="ai-explanation-disclaimer">
                  AI-generated guidance may be imperfect. Verify offer details and cost estimates before deciding.
                </p>
              </div>
            )}
          </section>

          <p className="analysis-disclaimer">{comparison.note}</p>
        </>
      )}
    </main>
  )
}
