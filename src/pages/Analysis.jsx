
import { useEffect, useState } from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  LoaderCircle,
  PiggyBank,
  Wallet,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import '../App.css'

const API_URL = 'http://localhost:3000/api'

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

export default function Analysis() {
  const [offers, setOffers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analysing, setAnalysing] = useState(false)
  const [error, setError] = useState('')

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
          }
        )

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Could not calculate analysis.')
        }

        if (active) setAnalysis(result)
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

  const values = analysis?.analysis
  const savingsImproved = values?.monthlySavingsDifference > 0
  const savingsUnchanged = values?.monthlySavingsDifference === 0

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
                Current monthly savings
              </span>
              <strong>{money(values.currentMonthlySavings)}</strong>
              <small>Based on your saved profile</small>
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
                Monthly savings change
              </span>
              <strong>
                {values.monthlySavingsDifference > 0 ? '+' : ''}
                {money(values.monthlySavingsDifference)}
              </strong>
              <small>
                {values.monthlySavingsDifference > 0
                  ? 'Projected improvement'
                  : values.monthlySavingsDifference < 0
                    ? 'Projected decrease'
                    : 'No projected change'}
              </small>
            </article>
          </section>

          <section className="analysis-detail-grid">
            <article className="analysis-panel">
              <span className="eyebrow">MONTHLY BREAKDOWN</span>
              <h2>Where your money goes</h2>

              <div className="analysis-breakdown">
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
                  <span>Net relocation cost after benefits</span>
                  <strong>{money(values.netRelocationCost)}</strong>
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

          <p className="analysis-disclaimer">{analysis.note}</p>
        </>
      )}
    </main>
  )
}
