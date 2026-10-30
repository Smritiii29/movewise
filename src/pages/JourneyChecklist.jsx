/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ClipboardList,
  DollarSign,
  Home,
  Loader2,
  MapPin,
  NotebookPen,
  Package,
  Plane,
  Star,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const API_URL = 'http://localhost:3000/api'

// ─── Default tasks per phase ────────────────────────────────────────────────
const DEFAULT_TASKS = [
  // Phase 1: Before Moving
  {
    phase: 'before_moving',
    task_key: 'confirm_offer',
    title: 'Review and confirm your job offer letter',
    icon: 'Briefcase',
    due_offset_days: -30,
  },
  {
    phase: 'before_moving',
    task_key: 'arrange_accommodation',
    title: 'Research and arrange accommodation in the new city',
    icon: 'Home',
    due_offset_days: -21,
  },
  {
    phase: 'before_moving',
    task_key: 'estimate_moving_costs',
    title: 'Estimate your moving and relocation expenses',
    icon: 'DollarSign',
    due_offset_days: -21,
  },
  {
    phase: 'before_moving',
    task_key: 'confirm_joining_date',
    title: 'Confirm your joining date with HR',
    icon: 'Calendar',
    due_offset_days: -14,
  },
  {
    phase: 'before_moving',
    task_key: 'arrange_travel',
    title: 'Book travel to your new city',
    icon: 'Plane',
    due_offset_days: -14,
  },
  {
    phase: 'before_moving',
    task_key: 'prepare_documents',
    title: 'Prepare all required documents (ID, certificates, references)',
    icon: 'Package',
    due_offset_days: -7,
  },

  // Phase 2: First Week (Days 1–7)
  {
    phase: 'first_week',
    task_key: 'settle_accommodation',
    title: 'Settle into your accommodation',
    icon: 'Home',
    due_offset_days: 2,
  },
  {
    phase: 'first_week',
    task_key: 'arrange_commute',
    title: 'Arrange your daily commute to the office',
    icon: 'MapPin',
    due_offset_days: 3,
  },
  {
    phase: 'first_week',
    task_key: 'explore_neighbourhood',
    title: 'Explore your new neighbourhood',
    icon: 'MapPin',
    due_offset_days: 5,
  },
  {
    phase: 'first_week',
    task_key: 'record_unexpected_expenses',
    title: 'Record any unexpected first-week expenses',
    icon: 'DollarSign',
    due_offset_days: 7,
  },

  // Phase 3: First Month (Days 8–30)
  {
    phase: 'first_month',
    task_key: 'track_actual_expenses',
    title: 'Track your actual monthly expenses',
    icon: 'TrendingUp',
    due_offset_days: 15,
  },
  {
    phase: 'first_month',
    task_key: 'compare_estimates',
    title: 'Compare actual expenses against your estimates',
    icon: 'ClipboardList',
    due_offset_days: 20,
  },
  {
    phase: 'first_month',
    task_key: 'update_budget',
    title: 'Update your monthly budget based on actuals',
    icon: 'Wallet',
    due_offset_days: 30,
  },

  // Phase 4: Days 31–90
  {
    phase: 'days_31_90',
    task_key: 'review_spending',
    title: 'Review your overall spending patterns',
    icon: 'TrendingUp',
    due_offset_days: 45,
  },
  {
    phase: 'days_31_90',
    task_key: 'complete_pending_tasks',
    title: 'Complete any pending setup tasks',
    icon: 'CheckCircle2',
    due_offset_days: 60,
  },
  {
    phase: 'days_31_90',
    task_key: 'track_adjustment',
    title: 'Track how well you have settled in',
    icon: 'Star',
    due_offset_days: 75,
  },
  {
    phase: 'days_31_90',
    task_key: 'generate_summary',
    title: 'Generate your 90-day relocation summary',
    icon: 'NotebookPen',
    due_offset_days: 90,
  },
]

const PHASES = [
  {
    key: 'before_moving',
    label: 'Before Moving',
    description: 'Prepare before you leave',
    colorClass: 'phase-jade',
    accentColor: '#00998A',
    bgColor: '#E3F3F0',
    textColor: '#00695C',
  },
  {
    key: 'first_week',
    label: 'First Week',
    description: 'Days 1–7: Settle in',
    colorClass: 'phase-blue',
    accentColor: '#5D84A8',
    bgColor: '#E8EEF5',
    textColor: '#3A5A7C',
  },
  {
    key: 'first_month',
    label: 'First Month',
    description: 'Days 8–30: Track expenses',
    colorClass: 'phase-coral',
    accentColor: '#D9704A',
    bgColor: '#FAE8DF',
    textColor: '#B05030',
  },
  {
    key: 'days_31_90',
    label: 'Days 31–90',
    description: 'Review and wrap up',
    colorClass: 'phase-sand',
    accentColor: '#8C7B5E',
    bgColor: '#F5EDD8',
    textColor: '#6B5C3E',
  },
]

const ICON_MAP = {
  Briefcase,
  Home,
  DollarSign,
  Calendar,
  Plane,
  Package,
  MapPin,
  TrendingUp,
  ClipboardList,
  Wallet,
  CheckCircle2,
  Star,
  NotebookPen,
}

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getJoiningDate(offer) {
  return offer?.joining_date || offer?.start_date || null
}

function computeDueDate(joiningDate, offsetDays) {
  if (!joiningDate || offsetDays == null) return null
  const base = new Date(joiningDate)
  base.setDate(base.getDate() + offsetDays)
  return base.toISOString().split('T')[0]
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function JourneyChecklist({ onBack }) {
  // Auth & data
  const [session, setSession] = useState(null)

  // Offers
  const [offers, setOffers] = useState([])
  const [offersLoading, setOffersLoading] = useState(true)
  const [offersError, setOffersError] = useState('')
  const [selectedOfferId, setSelectedOfferId] = useState('')

  // Tasks
  // Tasks
const [tasks, setTasks] = useState([])
const [tasksLoading, setTasksLoading] = useState(false)
const [tasksError, setTasksError] = useState('')

// Joining date
const [joiningDate, setJoiningDate] = useState('')
const [savingJoiningDate, setSavingJoiningDate] = useState(false)
const [joiningDateMessage, setJoiningDateMessage] = useState('')
  // UI state
  const [collapsedPhases, setCollapsedPhases] = useState({})
  const [editingNotes, setEditingNotes] = useState(null) // task id
  const [noteDraft, setNoteDraft] = useState('')
  const [savingTaskId, setSavingTaskId] = useState(null)
  const [showSummary, setShowSummary] = useState(false)

  const selectedOffer = offers.find((o) => o.id === selectedOfferId) || null

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null)
    })
  }, [])

  // ── Load offers ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return
    let active = true

    async function loadOffers() {
      setOffersLoading(true)
      setOffersError('')
      try {
        const res = await fetch(`${API_URL}/offers`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.message || 'Could not load offers.')
        const loaded = Array.isArray(json) ? json : json.offers || []
        if (!active) return
        setOffers(loaded)
        if (loaded.length > 0) setSelectedOfferId(loaded[0].id)
      } catch (err) {
        if (active) setOffersError(err.message || 'Could not load offers.')
      } finally {
        if (active) setOffersLoading(false)
      }
    }

    loadOffers()
    return () => { active = false }
  }, [session])

  // ── Load/seed tasks when offer changes ───────────────────────────────────
  useEffect(() => {
    if (!session || !selectedOfferId) return
    let active = true

    async function loadTasks() {
      setTasksLoading(true)
      setTasksError('')
      setJoiningDate('')
setJoiningDateMessage('')
      try {
        const token = session.access_token

        // 1. Seed default tasks (idempotent — server ignores existing keys)
        await fetch(`${API_URL}/journey/tasks/seed`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ offer_id: selectedOfferId }),
        })

        // 2. Fetch tasks for this offer
        const res = await fetch(
          `${API_URL}/journey/tasks?offer_id=${selectedOfferId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        )
        const json = await res.json()
        if (!res.ok) throw new Error(json.message || 'Could not load tasks.')
        if (!active) return
const loadedTasks = Array.isArray(json) ? json : []

setTasks(loadedTasks)
setJoiningDate(loadedTasks[0]?.joining_date || '')
setJoiningDateMessage('')
      } catch (err) {
        if (active) setTasksError(err.message || 'Could not load tasks.')
      } finally {
        if (active) setTasksLoading(false)
      }
    }

    loadTasks()
    return () => { active = false }
  }, [session, selectedOfferId])
  // Save joining date
const saveJoiningDate = async () => {
  if (!session || !selectedOfferId || !joiningDate) return

  setSavingJoiningDate(true)
  setJoiningDateMessage('')

  try {
    const res = await fetch(`${API_URL}/journey/date`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offer_id: selectedOfferId,
        joining_date: joiningDate,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      throw new Error(json.message || 'Could not save joining date.')
    }

    setTasks((prev) =>
      prev.map((task) => ({
        ...task,
        joining_date: joiningDate,
      })),
    )

    setJoiningDateMessage('Joining date saved successfully.')
  } catch (error) {
    setJoiningDateMessage(error.message || 'Could not save joining date.')
  } finally {
    setSavingJoiningDate(false)
  }
}
  // ── Toggle task completion ────────────────────────────────────────────────
  const toggleTask = useCallback(async (task) => {
    if (!session) return
    const newCompleted = !task.completed
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: newCompleted } : t)),
    )
    setSavingTaskId(task.id)
    try {
      const res = await fetch(`${API_URL}/journey/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: newCompleted }),
      })
      if (!res.ok) {
        // Revert on failure
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)),
        )
      }
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)),
      )
    } finally {
      setSavingTaskId(null)
    }
  }, [session])

  // ── Save notes ────────────────────────────────────────────────────────────
  const saveNotes = useCallback(async (taskId, notes) => {
    if (!session) return
    setSavingTaskId(taskId)
    try {
      await fetch(`${API_URL}/journey/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      })
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, notes } : t)),
      )
    } finally {
      setSavingTaskId(null)
      setEditingNotes(null)
    }
  }, [session])

  // ── Computed stats ────────────────────────────────────────────────────────
  const tasksByPhase = useMemo(() => {
    const map = {}
    for (const phase of PHASES) {
      map[phase.key] = tasks.filter((t) => t.phase === phase.key)
    }
    return map
  }, [tasks])

  const overallCompleted = tasks.filter((t) => t.completed).length
  const overallTotal = tasks.length
  const overallPct = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0

  const is90DayComplete = overallPct >= 80

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="journey-page">
      <div className="journey-container">

        {/* Header */}
        <header className="journey-header">
          <button type="button" className="journey-back-btn" onClick={onBack}>
            <ArrowLeft size={18} />
            Back to Relocation Hub
          </button>

          <div className="journey-title-group">
            <p className="eyebrow">YOUR 90-DAY PLAN</p>
            <h1 className="page-title">
              Relocation Journey<span style={{ color: 'var(--jade)' }}>.</span>
            </h1>
            <p className="journey-subtitle">
              A structured 90-day checklist to help you move, settle in, and track your finances.
            </p>
          </div>

          {/* Overall progress */}
          {overallTotal > 0 && (
            <div className="journey-overall-progress">
              <div className="journey-progress-header">
                <span className="journey-progress-label">Overall progress</span>
                <span className="journey-progress-pct">{overallPct}%</span>
              </div>
              <div className="journey-progress-bar-bg">
                <div
                  className="journey-progress-bar-fill"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <p className="journey-progress-sub">
                {overallCompleted} of {overallTotal} tasks complete
              </p>
            </div>
          )}
        </header>

        {/* Offer selector */}
        <section className="journey-section">
          {offersLoading ? (
            <div className="journey-loading">
              <Loader2 size={20} className="journey-spinner" />
              Loading your job offers…
            </div>
          ) : offersError ? (
            <div className="journey-error">
              <AlertCircle size={18} />
              {offersError}
            </div>
          ) : offers.length === 0 ? (
            <div className="journey-empty">
              <Briefcase size={28} className="journey-empty-icon" />
              <p className="journey-empty-title">No job offers saved</p>
              <p className="journey-empty-sub">
                Add a job offer on the Job Offers page to link your 90-day journey.
              </p>
            </div>
          ) : (
            <div className="journey-offer-selector">
              <label className="journey-field-label" htmlFor="journey-offer">
                Select the job offer for this journey
              </label>
              <select
                id="journey-offer"
                value={selectedOfferId}
                onChange={(e) => setSelectedOfferId(e.target.value)}
                className="journey-select"
              >
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.role_title} · {o.company_name} · {o.destination_city}
                  </option>
                ))}
              </select>

              {selectedOffer && (
  <div className="journey-offer-chips">
    <span className="journey-chip">
      <MapPin size={13} />
      {selectedOffer.destination_city}
    </span>
  </div>
)}

{selectedOffer && (
  <div className="journey-date-field">
    <label className="journey-field-label" htmlFor="journey-joining-date">
      Expected Joining Date
    </label>

    <div className="journey-date-input-row">
      <input
        id="journey-joining-date"
        type="date"
        value={joiningDate}
        onChange={(e) => {
          setJoiningDate(e.target.value)
          setJoiningDateMessage('')
        }}
        className="journey-select"
      />

      <button
        type="button"
        onClick={saveJoiningDate}
        disabled={!joiningDate || savingJoiningDate || tasksLoading}
        className="journey-save-date-btn"
      >
        {savingJoiningDate ? 'Saving...' : 'Save Date'}
      </button>
    </div>

    {joiningDateMessage && (
      <p className="journey-date-message">{joiningDateMessage}</p>
    )}

    {!joiningDate && (
      <p className="journey-date-hint">
        Enter your expected joining date to calculate your checklist deadlines.
      </p>
    )}
  </div>
)}
            </div>
          )}
        </section>

        {/* Tasks */}
        {selectedOfferId && (
          <>
            {tasksLoading ? (
              <div className="journey-loading">
                <Loader2 size={20} className="journey-spinner" />
                Loading your tasks…
              </div>
            ) : tasksError ? (
              <div className="journey-error">
                <AlertCircle size={18} />
                {tasksError}
              </div>
            ) : (
              <div className="journey-phases">
                {PHASES.map((phase) => {
                  const phaseTasks = tasksByPhase[phase.key] || []
                  const phaseCompleted = phaseTasks.filter((t) => t.completed).length
                  const phaseTotal = phaseTasks.length
                  const phasePct = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0
                  const isCollapsed = collapsedPhases[phase.key]

                  return (
                    <section key={phase.key} className="journey-phase-card">
                      {/* Phase header */}
                      <button
                        type="button"
                        className="journey-phase-header"
                        onClick={() =>
                          setCollapsedPhases((prev) => ({
                            ...prev,
                            [phase.key]: !prev[phase.key],
                          }))
                        }
                      >
                        <div className="journey-phase-title-group">
                          <span
                            className="journey-phase-dot"
                            style={{ background: phase.accentColor }}
                          />
                          <div>
                            <p
                              className="journey-phase-label"
                              style={{ color: phase.accentColor }}
                            >
                              {phase.label}
                            </p>
                            <p className="journey-phase-desc">{phase.description}</p>
                          </div>
                        </div>

                        <div className="journey-phase-right">
                          <span
                            className="journey-phase-badge"
                            style={{
                              background: phase.bgColor,
                              color: phase.textColor,
                            }}
                          >
                            {phaseCompleted}/{phaseTotal}
                          </span>
                          <div className="journey-phase-mini-bar-bg">
                            <div
                              className="journey-phase-mini-bar-fill"
                              style={{
                                width: `${phasePct}%`,
                                background: phase.accentColor,
                              }}
                            />
                          </div>
                          {isCollapsed ? (
                            <ChevronDown size={18} className="journey-chevron" />
                          ) : (
                            <ChevronUp size={18} className="journey-chevron" />
                          )}
                        </div>
                      </button>

                      {/* Phase tasks */}
                      {!isCollapsed && (
                        <div className="journey-task-list">
                          {phaseTasks.length === 0 ? (
                            <p className="journey-empty-phase">No tasks in this phase.</p>
                          ) : (
                            phaseTasks.map((task) => {
                              const IconComponent = ICON_MAP[task.icon] || Circle
                              const dueDate = joiningDate
                                ? computeDueDate(joiningDate, task.due_offset_days)
                                : task.actual_due_date || null
                              const isSaving = savingTaskId === task.id
                              const isEditingNote = editingNotes === task.id

                              return (
                                <div
                                  key={task.id}
                                  className={`journey-task-item ${task.completed ? 'journey-task-done' : ''}`}
                                >
                                  {/* Checkbox + content row */}
                                  <div className="journey-task-row">
                                    <button
                                      type="button"
                                      className={`journey-task-check ${task.completed ? 'checked' : ''}`}
                                      style={task.completed ? { background: phase.accentColor, borderColor: phase.accentColor } : {}}
                                      onClick={() => toggleTask(task)}
                                      aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                                      disabled={isSaving}
                                    >
                                      {isSaving ? (
                                        <Loader2 size={14} className="journey-spinner" />
                                      ) : task.completed ? (
                                        <CheckCircle2 size={14} />
                                      ) : (
                                        <Circle size={14} />
                                      )}
                                    </button>

                                    <div className="journey-task-icon-wrap" style={{ background: phase.bgColor, color: phase.textColor }}>
                                      <IconComponent size={15} />
                                    </div>

                                    <div className="journey-task-body">
                                      <p className={`journey-task-title ${task.completed ? 'journey-task-strikethrough' : ''}`}>
                                        {task.title}
                                      </p>
                                      {dueDate && (
                                        <p className="journey-task-due">
                                          <Calendar size={11} />
                                          Due: {formatDate(dueDate)}
                                        </p>
                                      )}
                                      {task.notes && !isEditingNote && (
                                        <p className="journey-task-note">{task.notes}</p>
                                      )}
                                    </div>

                                    {/* Notes toggle */}
                                    <button
                                      type="button"
                                      className="journey-notes-btn"
                                      title="Add / edit notes"
                                      onClick={() => {
                                        if (isEditingNote) {
                                          setEditingNotes(null)
                                        } else {
                                          setEditingNotes(task.id)
                                          setNoteDraft(task.notes || '')
                                        }
                                      }}
                                    >
                                      {isEditingNote ? <X size={15} /> : <NotebookPen size={15} />}
                                    </button>
                                  </div>

                                  {/* Inline notes editor */}
                                  {isEditingNote && (
                                    <div className="journey-notes-editor">
                                      <textarea
                                        className="journey-notes-textarea"
                                        placeholder="Add a note…"
                                        value={noteDraft}
                                        onChange={(e) => setNoteDraft(e.target.value)}
                                        rows={3}
                                        autoFocus
                                      />
                                      <div className="journey-notes-actions">
                                        <button
                                          type="button"
                                          className="journey-notes-save"
                                          onClick={() => saveNotes(task.id, noteDraft)}
                                          disabled={isSaving}
                                        >
                                          {isSaving ? 'Saving…' : 'Save note'}
                                        </button>
                                        <button
                                          type="button"
                                          className="journey-notes-cancel"
                                          onClick={() => setEditingNotes(null)}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}
                    </section>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* 90-Day Summary */}
        {is90DayComplete && selectedOffer && !tasksLoading && (
          <section className="journey-summary-card">
            <div className="journey-summary-header">
              <div>
                <p className="eyebrow">90-DAY MILESTONE</p>
                <h2 className="journey-summary-title">Relocation Summary</h2>
                <p className="journey-summary-sub">
                  You've completed {overallPct}% of your 90-day journey. Here's how things look.
                </p>
              </div>
              <button
                type="button"
                className="journey-summary-toggle"
                onClick={() => setShowSummary((v) => !v)}
              >
                {showSummary ? 'Hide details' : 'Show details'}
              </button>
            </div>

            {showSummary && (
              <div className="journey-summary-body">
                {/* Task completion breakdown */}
                <div className="journey-summary-grid">
                  {PHASES.map((phase) => {
                    const phaseTasks = tasksByPhase[phase.key] || []
                    const done = phaseTasks.filter((t) => t.completed).length
                    return (
                      <div key={phase.key} className="journey-summary-stat" style={{ borderLeftColor: phase.accentColor }}>
                        <p className="journey-summary-stat-label">{phase.label}</p>
                        <p className="journey-summary-stat-value" style={{ color: phase.accentColor }}>
                          {done}/{phaseTasks.length}
                        </p>
                        <p className="journey-summary-stat-sub">tasks complete</p>
                      </div>
                    )
                  })}
                </div>

                {/* Financial comparison */}
                {selectedOffer && (
                  <div className="journey-summary-finance">
                    <h3 className="journey-summary-finance-title">Financial snapshot</h3>
                    <div className="journey-summary-finance-grid">
                      <div className="journey-summary-finance-item">
                        <p className="journey-summary-finance-label">Monthly take-home</p>
                        <p className="journey-summary-finance-value">
                          {formatMoney(selectedOffer.monthly_take_home)}
                        </p>
                      </div>
                      <div className="journey-summary-finance-item">
                        <p className="journey-summary-finance-label">Estimated relocation cost</p>
                        <p className="journey-summary-finance-value">
                          {formatMoney(selectedOffer.relocation_cost)}
                        </p>
                      </div>
                      <div className="journey-summary-finance-item">
                        <p className="journey-summary-finance-label">Employer assistance</p>
                        <p className="journey-summary-finance-value">
                          {formatMoney(selectedOffer.relocation_assistance)}
                        </p>
                      </div>
                      <div className="journey-summary-finance-item">
                        <p className="journey-summary-finance-label">Joining bonus</p>
                        <p className="journey-summary-finance-value">
                          {formatMoney(selectedOffer.joining_bonus)}
                        </p>
                      </div>
                    </div>
                    <p className="journey-summary-finance-note">
                      These figures are from your saved offer record. Update them on the Job Offers page if actuals differ.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <footer className="journey-footer">
          MoveWise · Plan thoughtfully. Move confidently.
        </footer>
      </div>
    </main>
  )
}

