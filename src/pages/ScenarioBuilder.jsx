// offerToScenario()	
// isValidAmount()	
// loadOffers()	
// loadBaseline()	
// recalculate()	
// handleSliderChange()	
// commitInput()	
// resetToBaseline()


// Current savings	= Current take-home − current expenses − current EMI
// Destination expenses	= Rent + food + transport + utilities + other expenses
// Projected savings = 	Offer take-home − destination expenses − offer EMI
// Monthly savings difference	= Projected savings − current savings
// Annual savings difference =	Monthly savings difference × 12
// Net relocation cost =	Relocation cost − joining bonus − relocation assistance

//Break-even months = {Net relocation cost}/{Monthly savings difference}

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  HelpCircle,
  LoaderCircle,
  PiggyBank,
  RotateCcw,
  SlidersHorizontal,
  Target,
  Wallet,
  XCircle,
  Zap,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { supabase } from '../lib/supabase'
import '../App.css'

const API_URL = 'http://localhost:3000/api'

// ─── helpers ────────────────────────────────────────────────────────────────

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const moneyShort = (value) => {
  const n = Number(value || 0)
  if (Math.abs(n) >= 100_000)
    return `₹${(n / 100_000).toFixed(1)}L`
  if (Math.abs(n) >= 1_000)
    return `₹${(n / 1_000).toFixed(0)}K`
  return `₹${n}`
}

/** Slider field definition: key, label, min, max, step */
const SLIDER_FIELDS = [
  { key: 'monthly_take_home', label: 'Monthly take-home (₹)', min: 0, max: 500_000, step: 1_000 },
  { key: 'monthly_rent', label: 'Monthly rent (₹)', min: 0, max: 150_000, step: 500 },
  { key: 'monthly_food', label: 'Monthly food (₹)', min: 0, max: 50_000, step: 500 },
  { key: 'monthly_transport', label: 'Monthly transport (₹)', min: 0, max: 30_000, step: 500 },
  { key: 'monthly_utilities', label: 'Monthly utilities (₹)', min: 0, max: 20_000, step: 500 },
  { key: 'monthly_other_expenses', label: 'Other monthly expenses (₹)', min: 0, max: 50_000, step: 500 },
  { key: 'monthly_emi', label: 'Monthly EMI (₹)', min: 0, max: 100_000, step: 500 },
  { key: 'relocation_cost', label: 'One-time relocation cost (₹)', min: 0, max: 500_000, step: 5_000 },
  { key: 'joining_bonus', label: 'Joining bonus (₹)', min: 0, max: 2_000_000, step: 5_000 },
  { key: 'relocation_assistance', label: 'Relocation assistance (₹)', min: 0, max: 500_000, step: 5_000 },
]

/** Build a scenario state object from an offer (DB values). */
function offerToScenario(offer) {
  return {
    monthly_take_home: Number(offer.monthly_take_home || 0),
    monthly_rent: Number(offer.monthly_rent || 0),
    monthly_food: Number(offer.monthly_food || 0),
    monthly_transport: Number(offer.monthly_transport || 0),
    monthly_utilities: Number(offer.monthly_utilities || 0),
    monthly_other_expenses: Number(offer.monthly_other_expenses || 0),
    monthly_emi: Number(offer.monthly_emi || 0),
    relocation_cost: Number(offer.relocation_cost || 0),
    joining_bonus: Number(offer.joining_bonus || 0),
    relocation_assistance: Number(offer.relocation_assistance || 0),
  }
}

/** Returns true if value is a valid non-negative number. */
function isValidAmount(v) {
  return v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0
}

// ─── custom recharts tooltip ─────────────────────────────────────────────────

function SavingsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="scenario-chart-tooltip">
      <p className="scenario-chart-tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name}: {money(p.value)}
        </p>
      ))}
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

export default function ScenarioBuilder() {
  // Offer list state
  const [offers, setOffers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [selectedOffer, setSelectedOffer] = useState(null)

  // Baseline analysis (from GET endpoint, DB values)
  const [baseline, setBaseline] = useState(null)

  // Scenario controls: mirrors SLIDER_FIELDS keys → numeric values
  const [scenario, setScenario] = useState({})

  // Input text values (kept separate so typed partial values like "1" don't
  // get coerced immediately and break the UX)
  const [inputText, setInputText] = useState({})

  // Validation errors per field
  const [fieldErrors, setFieldErrors] = useState({})

  // Adjusted analysis result (from POST endpoint)
  const [adjusted, setAdjusted] = useState(null)

  // Financial savings target
  const [savingsTarget, setSavingsTarget] = useState('')
  const [activePreset, setActivePreset] = useState(null)

  // UI states
  const [loadingOffers, setLoadingOffers] = useState(true)
  const [loadingBaseline, setLoadingBaseline] = useState(false)
  const [computing, setComputing] = useState(false)
  const [error, setError] = useState('')

  // Debounce timer ref for slider-driven recalculation
  const debounceRef = useRef(null)

  // ── helpers ──────────────────────────────────────────────────────────────

  async function getToken() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    if (!data.session) throw new Error('Please sign in again.')
    return data.session.access_token
  }

  // ── load offers ───────────────────────────────────────────────────────────

  useEffect(() => {
    let active = true

    async function loadOffers() {
      setLoadingOffers(true)
      setError('')
      try {
        const token = await getToken()
        const response = await fetch(`${API_URL}/offers`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Could not load job offers.')
        if (!active) return
        setOffers(result.offers || [])
        if (result.offers?.length) setSelectedId(result.offers[0].id)
      } catch (err) {
        if (active) setError(err.message || 'Could not load your job offers.')
      } finally {
        if (active) setLoadingOffers(false)
      }
    }

    loadOffers()
    return () => { active = false }
  }, [])

  // ── load baseline when selected offer changes ─────────────────────────────

  useEffect(() => {
    let active = true

    async function loadBaseline() {
      if (!selectedId) return

      setBaseline(null)
      setAdjusted(null)
      setError('')
      setLoadingBaseline(true)

      try {
        const token = await getToken()
        const response = await fetch(`${API_URL}/analysis/${selectedId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Could not load baseline analysis.')
        if (!active) return

        // Find the full offer object so we can seed scenario sliders.
        const offer = offers.find((o) => o.id === selectedId) || {}
        const initial = offerToScenario(offer)

        setBaseline(result)
        setSelectedOffer(offer)
        setScenario(initial)
        setInputText(Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, String(v)])))
        setFieldErrors({})
        setAdjusted(result) // start with baseline = adjusted
      } catch (err) {
        if (active) setError(err.message || 'Could not calculate baseline analysis.')
      } finally {
        if (active) setLoadingBaseline(false)
      }
    }

    loadBaseline()
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // ── recalculate with current scenario overrides ───────────────────────────

  const recalculate = useCallback(async (scenarioValues) => {
    if (!selectedId) return
    setComputing(true)
    setError('')
    try {
      const token = await getToken()
      const response = await fetch(`${API_URL}/analysis/${selectedId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(scenarioValues),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not calculate scenario.')
      setAdjusted(result)
    } catch (err) {
      setError(err.message || 'Could not update the scenario calculation.')
    } finally {
      setComputing(false)
    }
  }, [selectedId])

  // ── slider change (debounced) ─────────────────────────────────────────────

  function handleSliderChange(key, rawValue) {
    const numValue = Number(rawValue)
    const nextScenario = { ...scenario, [key]: numValue }
    setActivePreset(null)
    setScenario(nextScenario)
    setInputText((prev) => ({ ...prev, [key]: String(numValue) }))
    setFieldErrors((prev) => ({ ...prev, [key]: '' }))

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => recalculate(nextScenario), 400)
  }

  // ── number input change (immediate on blur / Enter) ───────────────────────

  function handleInputChange(key, text) {
    setInputText((prev) => ({ ...prev, [key]: text }))
    if (!isValidAmount(text)) {
      setFieldErrors((prev) => ({ ...prev, [key]: 'Enter a valid non-negative number.' }))
    } else {
      setFieldErrors((prev) => ({ ...prev, [key]: '' }))
    }
  }

  function commitInput(key) {
    const text = inputText[key]
    if (!isValidAmount(text)) return // leave error, don't recalculate
    const numValue = Math.max(0, Number(text))
    const nextScenario = { ...scenario, [key]: numValue }
    setActivePreset(null)
    setScenario(nextScenario)
    setInputText((prev) => ({ ...prev, [key]: String(numValue) }))
    recalculate(nextScenario)
  }

  function handleInputKeyDown(event, key) {
    if (event.key === 'Enter') {
      event.target.blur()
      commitInput(key)
    }
  }

  // ── reset to baseline ─────────────────────────────────────────────────────

  function resetToBaseline() {
    if (!selectedOffer) return
    const initial = offerToScenario(selectedOffer)
    setActivePreset(null)
    setScenario(initial)
    setInputText(Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, String(v)])))
    setFieldErrors({})
    setAdjusted(baseline)
  }

  // ── apply preset ──────────────────────────────────────────────────────────

  function applyPreset(presetKey) {
    if (!selectedOffer) return
    const base = offerToScenario(selectedOffer)
    let next = { ...base }

    if (presetKey === 'rent_plus_20') {
      next.monthly_rent = Math.round(base.monthly_rent * 1.2)
    } else if (presetKey === 'increased_expenses') {
      next.monthly_rent = Math.round(base.monthly_rent * 1.2)
      next.monthly_food = Math.round(base.monthly_food * 1.25)
      next.monthly_transport = Math.round(base.monthly_transport * 1.2)
      next.monthly_utilities = Math.round(base.monthly_utilities * 1.15)
      next.monthly_other_expenses = Math.round(base.monthly_other_expenses * 1.25)
    } else if (presetKey === 'frugal_living') {
      next.monthly_rent = Math.round(base.monthly_rent * 0.85)
      next.monthly_food = Math.round(base.monthly_food * 0.8)
      next.monthly_other_expenses = Math.round(base.monthly_other_expenses * 0.75)
    } else if (presetKey === 'higher_relocation') {
      next.relocation_cost = Math.round(base.relocation_cost * 1.5) || 50000
    }

    setActivePreset(presetKey)
    setScenario(next)
    setInputText(Object.fromEntries(Object.entries(next).map(([k, v]) => [k, String(v)])))
    setFieldErrors({})
    recalculate(next)
  }

  // ── computed display values ───────────────────────────────────────────────

  const baseValues = baseline?.analysis
  const adjValues  = adjusted?.analysis
  const savingsImproved  = adjValues ? adjValues.monthlySavingsDifference > 0 : false
  const savingsUnchanged = adjValues ? adjValues.monthlySavingsDifference === 0 : false

  const hasAnyError = Object.values(fieldErrors).some(Boolean)

  // Savings comparison chart data
  const chartData = baseValues && adjValues
    ? [
        {
          name: 'Current\n(profile)',
          'Monthly savings': baseValues.currentMonthlySavings,
        },
        {
          name: 'Baseline\n(offer)',
          'Monthly savings': baseValues.projectedMonthlySavings,
        },
        {
          name: 'Scenario\n(adjusted)',
          'Monthly savings': adjValues.projectedMonthlySavings,
        },
      ]
    : []

  // ── render ────────────────────────────────────────────────────────────────

  if (loadingOffers) {
    return (
      <section className="analysis-loading">
        <LoaderCircle size={26} className="analysis-spinner" />
        <p>Loading your job offers…</p>
      </section>
    )
  }

  return (
    <main className="scenario-page">
      {/* Page header */}
      <header className="analysis-heading">
        <div>
          <span className="offers-eyebrow">ADJUST ASSUMPTIONS · EXPLORE OUTCOMES</span>
          <h1>Scenario Builder</h1>
          <p>
            Tweak salary, expenses, and relocation costs to see how different
            assumptions change your financial picture.
          </p>
        </div>
        <span className="analysis-heading-icon">
          <SlidersHorizontal size={27} />
        </span>
      </header>

      {/* Offer selector */}
      {offers.length > 0 && (
        <section className="analysis-selector">
          <label htmlFor="scenario-offer">
            <BriefcaseBusiness size={19} />
            Select a job offer
          </label>
          <select
            id="scenario-offer"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {offers.map((offer) => (
              <option key={offer.id} value={offer.id}>
                {offer.company_name} — {offer.role_title} ({offer.destination_city})
              </option>
            ))}
          </select>
        </section>
      )}

      {/* Global error */}
      {error && (
        <div className="offers-alert offers-error" role="alert">
          {error}
        </div>
      )}

      {/* Empty state */}
      {offers.length === 0 && !error && (
        <section className="analysis-empty">
          <BriefcaseBusiness size={34} />
          <h2>No job offers yet</h2>
          <p>Add a job offer before building your scenario.</p>
        </section>
      )}

      {/* Baseline loading */}
      {loadingBaseline && (
        <section className="analysis-loading">
          <LoaderCircle size={25} className="analysis-spinner" />
          <p>Loading baseline analysis…</p>
        </section>
      )}

      {/* Main content */}
      {baseValues && !loadingBaseline && (
        <>
          {/* Current ↔ Destination context */}
          <section className="analysis-context">
            <div>
              <span>Current location</span>
              <strong>{baseline.profile?.currentCity || 'Not specified'}</strong>
            </div>
            <ArrowRight size={21} />
            <div>
              <span>Potential destination</span>
              <strong>{baseline.offer?.destinationCity}</strong>
            </div>
          </section>

          {/* Two-column layout: controls left, results right */}
          <div className="scenario-layout">
            {/* ── Left: sliders & numeric inputs ── */}
            <section className="scenario-controls-panel">
              <div className="scenario-panel-header">
                <SlidersHorizontal size={18} />
                <div>
                  <h2>Adjust assumptions</h2>
                  <p>Drag the sliders or type a value. Results update automatically.</p>
                </div>
                <button
                  type="button"
                  className="scenario-reset-button"
                  onClick={resetToBaseline}
                  title="Reset all values to the saved offer"
                >
                  <RotateCcw size={15} />
                  Reset
                </button>
              </div>

              {/* ── Scenario Presets ── */}
              <div className="scenario-presets-card">
                <div className="scenario-presets-header">
                  <Zap size={16} />
                  <span>Quick Presets</span>
                </div>
                <div className="scenario-presets-grid">
                  <button
                    type="button"
                    className={`scenario-preset-pill ${activePreset === 'rent_plus_20' ? 'active' : ''}`}
                    onClick={() => applyPreset('rent_plus_20')}
                  >
                    Rent +20%
                  </button>
                  <button
                    type="button"
                    className={`scenario-preset-pill ${activePreset === 'increased_expenses' ? 'active' : ''}`}
                    onClick={() => applyPreset('increased_expenses')}
                  >
                    Higher Living Cost
                  </button>
                  <button
                    type="button"
                    className={`scenario-preset-pill ${activePreset === 'frugal_living' ? 'active' : ''}`}
                    onClick={() => applyPreset('frugal_living')}
                  >
                    Frugal Budget
                  </button>
                  <button
                    type="button"
                    className={`scenario-preset-pill ${activePreset === 'higher_relocation' ? 'active' : ''}`}
                    onClick={() => applyPreset('higher_relocation')}
                  >
                    Relocation +50%
                  </button>
                </div>
              </div>

              <div className="scenario-sliders">
                {SLIDER_FIELDS.map(({ key, label, min, max, step }) => (
                  <div key={key} className="scenario-field">
                    <div className="scenario-field-header">
                      <label htmlFor={`slider-${key}`}>{label}</label>
                      <input
                        type="number"
                        id={`input-${key}`}
                        className={`scenario-number-input ${fieldErrors[key] ? 'scenario-input-error' : ''}`}
                        min={min}
                        step={step}
                        value={inputText[key] ?? ''}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        onBlur={() => commitInput(key)}
                        onKeyDown={(e) => handleInputKeyDown(e, key)}
                        aria-label={label}
                      />
                    </div>
                    {fieldErrors[key] && (
                      <p className="scenario-field-error" role="alert">
                        {fieldErrors[key]}
                      </p>
                    )}
                    <input
                      type="range"
                      id={`slider-${key}`}
                      className="scenario-slider"
                      min={min}
                      max={max}
                      step={step}
                      value={scenario[key] ?? 0}
                      onChange={(e) => handleSliderChange(key, e.target.value)}
                      aria-label={label}
                    />
                    <div className="scenario-slider-range">
                      <span>{moneyShort(min)}</span>
                      <span>{moneyShort(max)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {hasAnyError && (
                <div className="offers-alert offers-error scenario-validation-banner" role="alert">
                  Some fields have invalid values. Fix them before the results will update.
                </div>
              )}
            </section>

            {/* ── Right: results ── */}
            <section className="scenario-results-panel">
              {/* Computing indicator */}
              {computing && (
                <div className="scenario-computing">
                  <LoaderCircle size={16} className="analysis-spinner" />
                  Recalculating…
                </div>
              )}

              {/* Summary metrics */}
              {adjValues && (
                <>
                  <section className="analysis-metrics scenario-metrics">
                    <article className="analysis-metric">
                      <span className="analysis-metric-icon"><Wallet size={21} /></span>
                      <span className="analysis-metric-label">Current monthly savings</span>
                      <strong>{money(adjValues.currentMonthlySavings)}</strong>
                      <small>Your saved profile</small>
                    </article>

                    <article className="analysis-metric">
                      <span className="analysis-metric-icon"><PiggyBank size={21} /></span>
                      <span className="analysis-metric-label">Baseline projected savings</span>
                      <strong>{money(baseValues.projectedMonthlySavings)}</strong>
                      <small>Offer as saved</small>
                    </article>

                    <article
                      className={`analysis-metric ${
                        savingsImproved ? 'metric-positive' : savingsUnchanged ? '' : 'metric-negative'
                      }`}
                    >
                      <span className="analysis-metric-icon">
                        {savingsImproved ? <ArrowUpRight size={21} /> : <ArrowDownRight size={21} />}
                      </span>
                      <span className="analysis-metric-label">Scenario projected savings</span>
                      <strong>{money(adjValues.projectedMonthlySavings)}</strong>
                      <small>
                        {adjValues.monthlySavingsDifference > 0
                          ? `+${money(adjValues.monthlySavingsDifference)} vs current`
                          : adjValues.monthlySavingsDifference < 0
                            ? `${money(adjValues.monthlySavingsDifference)} vs current`
                            : 'No change vs current'}
                      </small>
                    </article>
                  </section>

                  {/* Savings comparison chart */}
                  <div className="scenario-chart-card">
                    <span className="eyebrow">MONTHLY SAVINGS COMPARISON</span>
                    <h3>How your scenario compares</h3>
                    <div className="scenario-chart-wrap">
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                          data={chartData}
                          margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                          barCategoryGap="35%"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E4DED0" vertical={false} />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: '#445250' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tickFormatter={(v) => moneyShort(v)}
                            tick={{ fontSize: 11, fill: '#445250' }}
                            axisLine={false}
                            tickLine={false}
                            width={62}
                          />
                          <Tooltip content={<SavingsTooltip />} />
                          <Bar dataKey="Monthly savings" radius={[5, 5, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell
                                key={index}
                                fill={
                                  index === 2
                                    ? entry['Monthly savings'] >= chartData[0]['Monthly savings']
                                      ? '#00998A'
                                      : '#D9704A'
                                    : index === 1
                                      ? '#5D84A8'
                                      : '#A5BFBB'
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="scenario-chart-legend">
                      <span className="scenario-legend-dot" style={{ background: '#A5BFBB' }} />
                      <span>Current</span>
                      <span className="scenario-legend-dot" style={{ background: '#5D84A8' }} />
                      <span>Baseline offer</span>
                      <span className="scenario-legend-dot" style={{ background: '#00998A' }} />
                      <span>Scenario</span>
                    </div>
                  </div>

                  {/* ── Financial Savings Target ── */}
                  <div className="scenario-target-card">
                    <div className="scenario-target-header">
                      <div className="scenario-target-title">
                        <Target size={18} />
                        <div>
                          <span className="eyebrow">GOAL TRACKING</span>
                          <h3>Monthly Savings Target</h3>
                        </div>
                      </div>
                      <div className="scenario-target-input-wrap">
                        <span className="scenario-target-currency">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="e.g. 50000"
                          value={savingsTarget}
                          onChange={(e) => setSavingsTarget(e.target.value)}
                          className="scenario-target-input"
                          aria-label="Financial monthly savings target"
                        />
                      </div>
                    </div>
                    {savingsTarget !== '' && Number(savingsTarget) > 0 ? (
                      (() => {
                        const targetNum = Number(savingsTarget)
                        const scenarioSavings = adjValues.projectedMonthlySavings
                        const targetDiff = scenarioSavings - targetNum
                        const targetMet = targetDiff >= 0
                        return (
                          <div
                            className={`scenario-target-status ${
                              targetMet ? 'scenario-target-met' : 'scenario-target-unmet'
                            }`}
                          >
                            <div className="scenario-target-status-icon">
                              {targetMet ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                            </div>
                            <div className="scenario-target-status-text">
                              <strong>
                                {targetMet
                                  ? `Target Achieved! (+${money(targetDiff)} above target)`
                                  : `Target Missed by ${money(Math.abs(targetDiff))}`}
                              </strong>
                              <p>
                                {targetMet
                                  ? `Under this adjusted scenario, you project to save ${money(
                                      scenarioSavings
                                    )}/month, comfortably meeting your goal of ${money(targetNum)}/month.`
                                  : `Your projected savings of ${money(
                                      scenarioSavings
                                    )}/month fall short of your ${money(
                                      targetNum
                                    )}/month goal. Consider trimming expenses or negotiating a higher take-home.`}
                              </p>
                            </div>
                          </div>
                        )
                      })()
                    ) : (
                      <p className="scenario-target-hint">
                        Set an optional monthly savings goal to instantly verify whether this adjusted scenario satisfies your personal financial milestones.
                      </p>
                    )}
                  </div>

                  {/* ── What Changed? Section ── */}
                  <div className="scenario-what-changed-card">
                    <div className="scenario-what-changed-header">
                      <HelpCircle size={18} />
                      <div>
                        <span className="eyebrow">SCENARIO COMPARISON</span>
                        <h3>What changed?</h3>
                      </div>
                    </div>
                    <div className="scenario-what-changed-grid">
                      <div className="scenario-what-changed-item">
                        <span className="scenario-what-changed-label">Baseline Offer Savings</span>
                        <strong className="scenario-what-changed-value">
                          {money(baseValues.projectedMonthlySavings)}
                        </strong>
                        <small>From saved offer</small>
                      </div>
                      <div className="scenario-what-changed-item">
                        <span className="scenario-what-changed-label">Scenario Savings</span>
                        <strong className="scenario-what-changed-value">
                          {money(adjValues.projectedMonthlySavings)}
                        </strong>
                        <small>With your adjustments</small>
                      </div>
                      <div
                        className={`scenario-what-changed-item ${
                          adjValues.projectedMonthlySavings - baseValues.projectedMonthlySavings > 0
                            ? 'item-positive'
                            : adjValues.projectedMonthlySavings - baseValues.projectedMonthlySavings < 0
                            ? 'item-negative'
                            : ''
                        }`}
                      >
                        <span className="scenario-what-changed-label">Difference vs Baseline</span>
                        <strong className="scenario-what-changed-value">
                          {adjValues.projectedMonthlySavings - baseValues.projectedMonthlySavings > 0
                            ? '+'
                            : ''}
                          {money(
                            adjValues.projectedMonthlySavings - baseValues.projectedMonthlySavings
                          )}
                        </strong>
                        <small>Monthly impact</small>
                      </div>
                    </div>

                    <div className="scenario-what-changed-insight">
                      {(() => {
                        const scenarioDelta =
                          adjValues.projectedMonthlySavings - baseValues.projectedMonthlySavings
                        const currentDelta = adjValues.monthlySavingsDifference
                        if (scenarioDelta > 0) {
                          return (
                            <p>
                              Your scenario modifications increase your monthly savings by{' '}
                              <strong>{money(scenarioDelta)}</strong> compared to the baseline offer.
                              {currentDelta > 0
                                ? ` You will save ${money(currentDelta)}/month more than your current city.`
                                : ` However, overall monthly savings remain ${money(Math.abs(currentDelta))}/month lower than your current city.`}
                            </p>
                          )
                        } else if (scenarioDelta < 0) {
                          return (
                            <p>
                              Your scenario adjustments reduce your projected monthly savings by{' '}
                              <strong>{money(Math.abs(scenarioDelta))}</strong> compared to the original offer.
                              {currentDelta > 0
                                ? ` You still gain ${money(currentDelta)}/month over your current city lifestyle.`
                                : ` Under these assumptions, moving yields ${money(Math.abs(currentDelta))}/month less in savings than staying in your current city.`}
                            </p>
                          )
                        } else {
                          return (
                            <p>
                              Your scenario assumptions match the baseline job offer. Tweak any slider or pick a Quick Preset to simulate alternative outcomes.
                            </p>
                          )
                        }
                      })()}
                    </div>
                  </div>

                  {/* Detailed breakdown */}
                  <div className="scenario-detail-grid">
                    <article className="analysis-panel">
                      <span className="eyebrow">MONTHLY BREAKDOWN</span>
                      <h2>Where your money goes</h2>

                      <div className="analysis-breakdown">
                        <div>
                          <span>Scenario take-home</span>
                          <strong>{money(adjValues.offerTakeHome)}</strong>
                        </div>
                        <div>
                          <span>Destination living expenses</span>
                          <strong>− {money(adjValues.destinationExpenses)}</strong>
                        </div>
                        <div>
                          <span>Monthly EMI</span>
                          <strong>− {money(adjValues.offerEmi)}</strong>
                        </div>
                        <div className="analysis-breakdown-total">
                          <span>Scenario projected savings</span>
                          <strong>{money(adjValues.projectedMonthlySavings)}</strong>
                        </div>
                      </div>
                    </article>

                    <article className="analysis-panel">
                      <span className="eyebrow">RELOCATION COSTS</span>
                      <h2>Upfront costs and benefits</h2>

                      <div className="analysis-breakdown">
                        <div>
                          <span>Net relocation cost after benefits</span>
                          <strong>{money(adjValues.netRelocationCost)}</strong>
                        </div>
                        <div className="analysis-breakdown-total">
                          <span>Estimated break-even</span>
                          <strong>
                            {adjValues.breakEvenMonths == null
                              ? 'Not reached'
                              : adjValues.breakEvenMonths === 0
                                ? 'Already covered'
                                : `${adjValues.breakEvenMonths.toFixed(1)} months`}
                          </strong>
                        </div>
                      </div>

                      <p className="analysis-explanation">{adjValues.breakEvenMessage}</p>

                      <div className="analysis-annual">
                        <span>Annual savings difference</span>
                        <strong>{money(adjValues.annualSavingsDifference)}</strong>
                      </div>
                    </article>
                  </div>

                  <p className="analysis-disclaimer">{adjusted.note}</p>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  )
}
