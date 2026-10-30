import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 3000
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables in backend/.env')
}

const OFFER_FIELDS = [
  'company_name',
  'role_title',
  'destination_city',
  'annual_ctc',
  'monthly_take_home',
  'monthly_rent',
  'monthly_food',
  'monthly_transport',
  'monthly_utilities',
  'monthly_other_expenses',
  'monthly_emi',
  'relocation_cost',
  'joining_bonus',
  'relocation_assistance',
]

const REQUIRED_TEXT_FIELDS = ['company_name', 'role_title', 'destination_city']
const REQUIRED_NUMBER_FIELDS = ['annual_ctc', 'monthly_take_home']
const OPTIONAL_NUMBER_FIELDS = OFFER_FIELDS.filter(
  (field) =>
    !REQUIRED_TEXT_FIELDS.includes(field) &&
    !REQUIRED_NUMBER_FIELDS.includes(field),
)
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  
function normalizeCity(city) {
  return typeof city === 'string'
    ? city.trim().replace(/\s+/g, ' ').toLowerCase()
    : ''
}

function calculateRelocationCosts(profileCity, destinationCity, offer) {
  const current = normalizeCity(profileCity)
  const destination = normalizeCity(destinationCity)

  // Do not assume relocation is unnecessary when either city is unknown.
  const sameCity = Boolean(current && destination && current === destination)

  // Moving costs apply only when the city changes.
  const relocationCost = sameCity
    ? 0
    : Number(offer.relocation_cost || 0)

  // A same-city move has no city-level relocation cost or break-even period.
  if (sameCity) {
    return {
      sameCity: true,
      relocationCost: 0,
      netRelocationCost: 0,
      breakEvenMonths: null,
      breakEvenMessage:
        'Your current and destination cities are the same, so city-level relocation costs and break-even are not applicable.',
    }
  }

  const joiningBonus = Number(offer.joining_bonus || 0)
  const relocationAssistance = Number(offer.relocation_assistance || 0)

  const netRelocationCost =
    relocationCost - joiningBonus - relocationAssistance

  let breakEvenMonths = null
  let breakEvenMessage

  if (netRelocationCost < 0) {
    breakEvenMonths = 0
    breakEvenMessage =
      'The joining bonus and relocation assistance exceed the estimated relocation cost.'
  } else if (netRelocationCost === 0) {
    breakEvenMonths = 0
    breakEvenMessage =
      'The joining bonus and relocation assistance exactly cover the estimated relocation cost.'
  } else {
    breakEvenMessage =
      'There is no savings-based break-even under these assumptions because monthly savings do not increase.'

    // The caller can calculate a savings-based break-even when monthly
    // savings improve.
  }

  return {
    sameCity: false,
    relocationCost,
    netRelocationCost,
    breakEvenMonths,
    breakEvenMessage,
  }
}


function validateAndBuildOffer(body, userId, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object.' }
  }

  const updates = {}

  for (const field of REQUIRED_TEXT_FIELDS) {
    if (partial && !(field in body)) continue

    const value = body[field]

    if (typeof value !== 'string' || !value.trim()) {
      return { error: `${field} is required and must be text.` }
    }

    updates[field] = value.trim()
  }

  for (const field of [...REQUIRED_NUMBER_FIELDS, ...OPTIONAL_NUMBER_FIELDS]) {
    if (partial && !(field in body)) continue

    const value = body[field]

    if (value == null || value === '') {
      if (REQUIRED_NUMBER_FIELDS.includes(field)) {
        return {
          error: `${field} is required and must be a non-negative number.`,
        }
      }

      updates[field] = 0
      continue
    }

    if (!Number.isFinite(Number(value)) || Number(value) < 0) {
      return { error: `${field} must be a non-negative number.` }
    }

    updates[field] = Number(value)
  }

  if (!partial) updates.user_id = userId

  return { offer: updates }
}

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MoveWise backend is running!',
  })
})

// Verify the signed-in user's Supabase access token.
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required.',
      })
    }

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    )

    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.',
      })
    }

    req.user = data.user
    req.supabase = supabase
    next()
  } catch (error) {
    console.error('Authentication error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Authentication could not be completed.',
    })
  }
}

// GET: Retrieve offers belonging to the signed-in user.
app.get('/api/offers', authenticateUser, async (req, res) => {
  const { data, error } = await req.supabase
    .from('offers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fetch offers error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Could not retrieve job offers.',
    })
  }

  res.json({ success: true, offers: data })
})

// POST: Create an offer for the signed-in user.
app.post('/api/offers', authenticateUser, async (req, res) => {
  const validation = validateAndBuildOffer(req.body, req.user.id)

  if (validation.error) {
    return res.status(400).json({
      success: false,
      message: validation.error,
    })
  }

  const { data, error } = await req.supabase
    .from('offers')
    .insert(validation.offer)
    .select()
    .single()

  if (error) {
    console.error('Create offer error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Could not save the job offer. Check the offers table schema.',
    })
  }

  res.status(201).json({ success: true, offer: data })
})
// Save joining date for all checklist tasks linked to an offer.
app.patch('/api/journey/date', authenticateUser, async (req, res) => {
  const { offer_id, joining_date } = req.body

  if (!UUID_REGEX.test(offer_id || '')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid offer ID.',
    })
  }

  if (
    joining_date &&
    !/^\d{4}-\d{2}-\d{2}$/.test(joining_date)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid joining date.',
    })
  }

  const { data, error } = await req.supabase
    .from('journey_tasks')
    .update({ joining_date: joining_date || null })
    .eq('offer_id', offer_id)
    .eq('user_id', req.user.id)
    .select('id')

  if (error) {
    console.error('Save journey joining date error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Could not save joining date.',
    })
  }

  if (!data || data.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No checklist tasks found for this offer.',
    })
  }

  res.json({
    success: true,
    message: 'Joining date saved.',
  })
})
// PATCH: Update an existing offer belonging to the signed-in user.
app.patch('/api/offers/:id', authenticateUser, async (req, res) => {
  const { id } = req.params

  if (!UUID_REGEX.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid job offer ID.',
    })
  }

  const validation = validateAndBuildOffer(req.body, req.user.id, {
    partial: true,
  })

  if (validation.error) {
    return res.status(400).json({
      success: false,
      message: validation.error,
    })
  }

  if (Object.keys(validation.offer).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid fields provided to update.',
    })
  }

  // Restrict updates to offers owned by the signed-in user.
  const { data, error } = await req.supabase
    .from('offers')
    .update(validation.offer)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .maybeSingle()

  if (error) {
    console.error('Update offer error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Could not update the job offer.',
    })
  }

  if (!data) {
    return res.status(404).json({
      success: false,
      message:
        'Job offer not found or you do not have permission to update it.',
    })
  }

  res.json({
    success: true,
    message: 'Job offer updated successfully.',
    offer: data,
  })
})

// DELETE: Delete an offer belonging to the signed-in user.
app.delete('/api/offers/:id', authenticateUser, async (req, res) => {
  const { id } = req.params

  if (!UUID_REGEX.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid job offer ID.',
    })
  }

  const { data, error } = await req.supabase
    .from('offers')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Delete offer error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Could not delete the job offer.',
    })
  }

  if (!data) {
    return res.status(404).json({
      success: false,
      message:
        'Job offer not found or you do not have permission to delete it.',
    })
  }

  res.json({
    success: true,
    message: 'Job offer deleted successfully.',
    id: data.id,
  })
})

// GET: Analyse the financial impact of a selected job offer.

/* GET: Analyse the financial impact of a selected job offer. */
app.get('/api/analysis/:offerId', authenticateUser, async (req, res) => {
  try {
    const { offerId } = req.params

    if (!UUID_REGEX.test(offerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job offer ID.',
      })
    }

    // 1. Retrieve the user's profile, including both career-stage fields.
    const { data: profile, error: profileError } = await req.supabase
      .from('profiles')
      .select(`
        career_stage,
        current_city,
        monthly_take_home,
        monthly_expenses,
        monthly_emi,
        current_savings,
        expected_monthly_salary,
        available_relocation_budget,
        family_financial_support,
        target_role,
        preferred_cities
      `)
      .eq('id', req.user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Fetch profile error:', profileError.message)
      return res.status(500).json({
        success: false,
        message: 'Could not retrieve your financial profile.',
      })
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Please complete your financial profile first.',
      })
    }

    // 2. Retrieve only an offer owned by the signed-in user.
    const { data: offer, error: offerError } = await req.supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .eq('user_id', req.user.id)
      .maybeSingle()

    if (offerError) {
      console.error('Fetch offer error:', offerError.message)
      return res.status(500).json({
        success: false,
        message: 'Could not retrieve the selected job offer.',
      })
    }

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Job offer not found.',
      })
    }

    const isGraduate = profile.career_stage === 'recent_graduate'

    // 3. Calculate monthly expenses and projected savings after joining.
    const currentTakeHome = Number(profile.monthly_take_home || 0)
    const currentExpenses = Number(profile.monthly_expenses || 0)
    const currentEmi = Number(profile.monthly_emi || 0)

    const currentMonthlySavings =
      currentTakeHome - currentExpenses - currentEmi

    const destinationExpenses =
      Number(offer.monthly_rent || 0) +
      Number(offer.monthly_food || 0) +
      Number(offer.monthly_transport || 0) +
      Number(offer.monthly_utilities || 0) +
      Number(offer.monthly_other_expenses || 0)

    const offerTakeHome = Number(offer.monthly_take_home || 0)
    const offerEmi = Number(offer.monthly_emi || 0)

    const projectedMonthlySavings =
      offerTakeHome - destinationExpenses - offerEmi

    // 4. Preserve the existing net relocation cost calculation.
    // This helper accounts for the existing relocation-cost rules,
    // including benefits such as joining bonuses/relocation assistance.
    const relocation = calculateRelocationCosts(
      profile.current_city,
      offer.destination_city,
      offer,
    )

    const {
      sameCity,
      relocationCost,
      netRelocationCost,
    } = relocation

    // 5. Build career-stage-specific analysis.
    let analysis

    if (isGraduate) {
      // Prefer the explicit moving budget. Fall back to current savings
      // only when no moving budget was entered.
      const availableRelocationFunds =
        profile.available_relocation_budget != null
          ? Number(profile.available_relocation_budget)
          : Number(profile.current_savings || 0)

      // Never treat a negative net relocation cost as a funding need.
      const remainingUpfrontCost = Math.max(0, netRelocationCost)

      const relocationFundingGap = Math.max(
        0,
        remainingUpfrontCost - availableRelocationFunds,
      )

      analysis = {
        analysisType: 'graduate_first_job',

        // Keep shared fields present for compatibility, but do not
        // present a graduate's lack of current salary as a comparison.
        currentTakeHome: null,
        currentExpenses,
        currentEmi: null,
        currentMonthlySavings: null,

        destinationExpenses,
        offerTakeHome,
        offerEmi,
        projectedMonthlySavings,
        annualProjectedSavings: projectedMonthlySavings * 12,

        // Preserve the original relocation-cost outputs.
        sameCity,
        relocationCost,
        netRelocationCost,
        breakEvenMonths: null,
        breakEvenMessage:
          'For a first job, compare the net upfront relocation cost with your available moving funds.',

        // Graduate-specific outputs.
        availableRelocationFunds,
        remainingUpfrontCost,
        relocationFundingGap,
        expectedMonthlySalary:
          profile.expected_monthly_salary == null
            ? null
            : Number(profile.expected_monthly_salary),
        familyFinancialSupport:
          Number(profile.family_financial_support || 0),
        targetRole: profile.target_role || offer.role_title,
        preferredCities: profile.preferred_cities || [],
      }
    } else {
      // Working-professional calculations remain current vs new job.
      const monthlySavingsDifference =
        projectedMonthlySavings - currentMonthlySavings

      const annualSavingsDifference = monthlySavingsDifference * 12

      let breakEvenMonths = relocation.breakEvenMonths
      let breakEvenMessage = relocation.breakEvenMessage

      // Use NET relocation cost, after benefits, for break-even.
      if (
        !sameCity &&
        netRelocationCost > 0 &&
        monthlySavingsDifference > 0
      ) {
        breakEvenMonths =
          netRelocationCost / monthlySavingsDifference

        breakEvenMessage =
          'Estimated months needed to recover the net relocation cost from additional monthly savings.'
      } else if (
        !sameCity &&
        netRelocationCost > 0 &&
        monthlySavingsDifference <= 0
      ) {
        breakEvenMonths = null
        breakEvenMessage =
          'The offer does not currently increase projected monthly savings, so a savings-based relocation payback period cannot be estimated.'
      }

      analysis = {
        analysisType: 'working_professional',
        currentTakeHome,
        currentExpenses,
        currentEmi,
        currentMonthlySavings,
        destinationExpenses,
        offerTakeHome,
        offerEmi,
        projectedMonthlySavings,
        monthlySavingsDifference,
        annualSavingsDifference,
        annualProjectedSavings: projectedMonthlySavings * 12,
        sameCity,
        relocationCost,
        netRelocationCost,
        breakEvenMonths,
        breakEvenMessage,
      }
    }

    return res.json({
      success: true,
      profile: {
        careerStage: profile.career_stage || 'working_professional',
        currentCity: profile.current_city,
      },
      offer: {
        id: offer.id,
        companyName: offer.company_name,
        roleTitle: offer.role_title,
        destinationCity: offer.destination_city,
      },
      analysis,
      note: isGraduate
        ? 'First-job estimates use the selected offer and stated relocation funds. Family financial support is shown separately and is not automatically added to the moving budget or projected monthly savings.'
        : 'Estimates are based on your saved financial profile, selected offer, and net relocation cost after applicable benefits.',
    })
  } catch (error) {
    console.error('Analysis error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Could not calculate the relocation analysis.',
    })
  }
})


app.get(
  '/api/ai-explanation/:offerId',
  authenticateUser,
  async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'Gemini API key is not configured.',
        })
      }

      const { offerId } = req.params

      if (!UUID_REGEX.test(offerId)) {
        return res.status(400).json({
          error: 'Invalid job offer ID.',
        })
      }

      // Retrieve the user's profile and role-specific preferences.
      const { data: profile, error: profileError } =
        await req.supabase
          .from('profiles')
          .select(`
            career_stage,
            current_city,
            monthly_take_home,
            monthly_expenses,
            monthly_emi,
            current_savings,
            expected_monthly_salary,
            available_relocation_budget,
            family_financial_support,
            target_role,
            preferred_cities,
            relocation_confidence,
            willingness_to_adapt,
            concerns,
            priorities
          `)
          .eq('id', req.user.id)
          .maybeSingle()

      if (profileError) {
        console.error('AI profile fetch error:', profileError.message)
        return res.status(500).json({
          error: 'Could not retrieve your financial profile.',
        })
      }

      if (!profile) {
        return res.status(404).json({
          error: 'Your financial profile could not be found.',
        })
      }

      // Retrieve only an offer belonging to the signed-in user.
      const { data: offer, error: offerError } =
        await req.supabase
          .from('offers')
          .select('*')
          .eq('id', offerId)
          .eq('user_id', req.user.id)
          .maybeSingle()

      if (offerError) {
        console.error('AI offer fetch error:', offerError.message)
        return res.status(500).json({
          error: 'Could not retrieve the selected job offer.',
        })
      }

      if (!offer) {
        return res.status(404).json({
          error: 'Job offer not found.',
        })
      }

      const isGraduate = profile.career_stage === 'recent_graduate'

      // Calculate the offer's monthly financial position.
      const destinationExpenses =
        Number(offer.monthly_rent || 0) +
        Number(offer.monthly_food || 0) +
        Number(offer.monthly_transport || 0) +
        Number(offer.monthly_utilities || 0) +
        Number(offer.monthly_other_expenses || 0)

      const offerTakeHome = Number(offer.monthly_take_home || 0)
      const offerEmi = Number(offer.monthly_emi || 0)

      const projectedMonthlySavings =
        offerTakeHome - destinationExpenses - offerEmi

      // IMPORTANT: use the same net relocation-cost helper as the
      // financial analysis endpoint. Do not recalculate gross costs here.
      const relocation = calculateRelocationCosts(
        profile.current_city,
        offer.destination_city,
        offer,
      )

      let financialSummary

      if (isGraduate) {
        const availableRelocationFunds =
          profile.available_relocation_budget != null
            ? Number(profile.available_relocation_budget)
            : Number(profile.current_savings || 0)

        const remainingUpfrontCost = Math.max(
          0,
          relocation.netRelocationCost,
        )

        const relocationFundingGap = Math.max(
          0,
          remainingUpfrontCost - availableRelocationFunds,
        )

        financialSummary = {
          careerStage: 'recent_graduate',
          currentCity: profile.current_city || 'Not provided',
          destinationCity: offer.destination_city,
          company: offer.company_name,
          offeredRole: offer.role_title,
          targetRole: profile.target_role || offer.role_title,
          expectedMonthlySalary:
            profile.expected_monthly_salary == null
              ? null
              : Number(profile.expected_monthly_salary),
          offeredMonthlyTakeHome: offerTakeHome,
          destinationMonthlyExpenses: destinationExpenses,
          projectedMonthlySavings,
          annualProjectedSavings: projectedMonthlySavings * 12,
          availableRelocationFunds,
          grossRelocationCost: relocation.relocationCost,
          netRelocationCost: relocation.netRelocationCost,
          remainingUpfrontCost,
          relocationFundingGap,
          familyFinancialSupport:
            Number(profile.family_financial_support || 0),
          preferredCities: profile.preferred_cities || [],
          relocationConfidence: profile.relocation_confidence,
          willingnessToAdapt: profile.willingness_to_adapt,
          concerns: profile.concerns || [],
          priorities: profile.priorities || {},
          sameCity: relocation.sameCity,
        }
      } else {
        const currentMonthlySavings =
          Number(profile.monthly_take_home || 0) -
          Number(profile.monthly_expenses || 0) -
          Number(profile.monthly_emi || 0)

        const monthlySavingsDifference =
          projectedMonthlySavings - currentMonthlySavings

        let breakEvenMonths = relocation.breakEvenMonths
        let breakEvenMessage = relocation.breakEvenMessage

        if (
          !relocation.sameCity &&
          relocation.netRelocationCost > 0 &&
          monthlySavingsDifference > 0
        ) {
          breakEvenMonths =
            relocation.netRelocationCost / monthlySavingsDifference

          breakEvenMessage =
            'Estimated months to recover net relocation cost from additional monthly savings.'
        } else if (
          !relocation.sameCity &&
          relocation.netRelocationCost > 0 &&
          monthlySavingsDifference <= 0
        ) {
          breakEvenMonths = null
          breakEvenMessage =
            'The offer does not increase projected monthly savings, so a savings-based payback period cannot be estimated.'
        }

        financialSummary = {
          careerStage: 'working_professional',
          currentCity: profile.current_city || 'Not provided',
          destinationCity: offer.destination_city,
          company: offer.company_name,
          role: offer.role_title,
          currentMonthlyTakeHome:
            Number(profile.monthly_take_home || 0),
          currentMonthlyExpenses:
            Number(profile.monthly_expenses || 0),
          currentMonthlyEmi:
            Number(profile.monthly_emi || 0),
          currentMonthlySavings,
          projectedMonthlySavings,
          monthlySavingsDifference,
          annualSavingsDifference: monthlySavingsDifference * 12,
          destinationMonthlyExpenses: destinationExpenses,
          grossRelocationCost: relocation.relocationCost,
          netRelocationCost: relocation.netRelocationCost,
          breakEvenMonths,
          breakEvenMessage,
          sameCity: relocation.sameCity,
          relocationConfidence: profile.relocation_confidence,
          willingnessToAdapt: profile.willingness_to_adapt,
          concerns: profile.concerns || [],
          priorities: profile.priorities || {},
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: `
You are MoveWise's relocation decision-support assistant.

Explain the supplied analysis clearly, practically, and objectively.

Rules:
- Use only the supplied data. Never invent salaries, expenses, city facts,
  tax estimates, or personal circumstances.
- The supplied calculations are authoritative. Do not recalculate or
  change any financial values.
- Net relocation cost already accounts for applicable benefits according
  to the application's calculation helper. Do not subtract bonuses or
  relocation assistance a second time.
- Do not assume a higher salary automatically means a better move.
- Connect financial trade-offs to the user's stated priorities and
  concerns where relevant.
- Treat confidence and adaptability scores as self-reported preferences,
  not psychological or clinical assessments.
- Do not make the decision for the user.
- If important information is missing, explain what should be verified.

For a recent graduate:
- Do not compare the offer with a fictional current salary.
- Focus on projected savings after joining, upfront moving affordability,
  net relocation cost, and the relocation funding gap.
- Family financial support is informational only. Do not add it to
  available relocation funds or projected monthly savings.
- Treat expected salary as a profile estimate; the offer's take-home
  salary is used for the actual projection.

For a working professional:
- Compare current and projected monthly savings.
- Explain the annual savings difference and net relocation payback
  estimate when available.
- Do not claim a payback period exists when it cannot be estimated.

Return valid JSON only, with exactly these fields:
"summary": a concise explanation,
"keyConsiderations": an array of 3 to 5 short points,
"questionsToAsk": an array of 2 to 4 practical questions.

Analysis data:
${JSON.stringify(financialSummary, null, 2)}
        `,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              summary: { type: 'STRING' },
              keyConsiderations: {
                type: 'ARRAY',
                items: { type: 'STRING' },
              },
              questionsToAsk: {
                type: 'ARRAY',
                items: { type: 'STRING' },
              },
            },
            required: [
              'summary',
              'keyConsiderations',
              'questionsToAsk',
            ],
          },
        },
      })

      if (!response.text) {
        throw new Error('Gemini returned an empty response.')
      }

      const explanation = JSON.parse(response.text)

      return res.json({ explanation })
    } catch (error) {
      console.error('AI explanation error:', error.message)

      return res.status(502).json({
        error: 'Unable to generate the AI explanation right now.',
      })
    }
  },
)


/* POST: Recalculate the relocation analysis with caller-supplied overrides.
 *
 * All body fields are optional.  Any field that is not supplied falls back to
 * the value saved in the database for that offer, so the response shape and
 * the calculation formulas are identical to those of the GET endpoint. */
app.post('/api/analysis/:offerId', authenticateUser, async (req, res) => {
  try {
    const { offerId } = req.params

    // Retrieve the signed-in user's current financial profile.
    const { data: profile, error: profileError } = await req.supabase
      .from('profiles')
      .select('current_city, monthly_take_home, monthly_expenses, monthly_emi')
      .eq('id', req.user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Fetch profile for scenario error:', profileError.message)
      return res.status(500).json({
        success: false,
        message: 'Could not retrieve your financial profile.',
      })
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Please complete your financial profile first.',
      })
    }

    // Retrieve the selected offer, restricted to this user.
    const { data: offer, error: offerError } = await req.supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .eq('user_id', req.user.id)
      .maybeSingle()

    if (offerError) {
      console.error('Fetch offer for scenario error:', offerError.message)
      return res.status(500).json({
        success: false,
        message: 'Could not retrieve the selected job offer.',
      })
    }

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Job offer not found.',
      })
    }

    // Validate every numeric override supplied in the request body.
    const overrideKeys = [
      'monthly_take_home',
      'monthly_rent',
      'monthly_food',
      'monthly_transport',
      'monthly_utilities',
      'monthly_other_expenses',
      'monthly_emi',
      'relocation_cost',
      'joining_bonus',
      'relocation_assistance',
    ]

    for (const key of overrideKeys) {
      const v = req.body[key]
      if (v != null && (v === '' || !Number.isFinite(Number(v)) || Number(v) < 0)) {
        return res.status(400).json({
          success: false,
          message: `${key} must be a non-negative number.`,
        })
      }
    }

    // Merge caller overrides on top of DB offer values.
    function pick(key) {
      return req.body[key] != null ? Number(req.body[key]) : Number(offer[key] || 0)
    }

    // Current monthly financial position (always from profile).
    const currentTakeHome = Number(profile.monthly_take_home || 0)
    const currentExpenses = Number(profile.monthly_expenses || 0)
    const currentEmi      = Number(profile.monthly_emi || 0)

    const currentMonthlySavings = currentTakeHome - currentExpenses - currentEmi

    // Adjusted offer values (override > DB).
    const offerTakeHome   = pick('monthly_take_home')
    const offerEmi        = pick('monthly_emi')

    const destinationExpenses =
      pick('monthly_rent') +
      pick('monthly_food') +
      pick('monthly_transport') +
      pick('monthly_utilities') +
      pick('monthly_other_expenses')

    const projectedMonthlySavings = offerTakeHome - destinationExpenses - offerEmi
    const monthlySavingsDifference = projectedMonthlySavings - currentMonthlySavings
    const annualSavingsDifference  = monthlySavingsDifference * 12

 
const relocation = calculateRelocationCosts(
  profile.current_city,
  offer.destination_city,
  {
    relocation_cost: pick('relocation_cost'),
    joining_bonus: pick('joining_bonus'),
    relocation_assistance: pick('relocation_assistance'),
  },
)

const {
  sameCity,
  relocationCost,
  netRelocationCost,
} = relocation

let breakEvenMonths = relocation.breakEvenMonths
let breakEvenMessage = relocation.breakEvenMessage

if (!sameCity && netRelocationCost > 0) {
  if (monthlySavingsDifference > 0) {
    breakEvenMonths = netRelocationCost / monthlySavingsDifference
    breakEvenMessage =
      'Estimated months needed to recover the remaining relocation cost from additional monthly savings.'
  }
}


    res.json({
      success: true,
      profile: {
        currentCity: profile.current_city,
      },
      offer: {
        id: offer.id,
        companyName: offer.company_name,
        roleTitle: offer.role_title,
        destinationCity: offer.destination_city,
      },
      analysis: {
        currentTakeHome,
        currentExpenses,
        currentEmi,
        currentMonthlySavings,
        destinationExpenses,
        offerTakeHome,
        offerEmi,
        projectedMonthlySavings,
        monthlySavingsDifference,
        annualSavingsDifference,
        netRelocationCost,
        breakEvenMonths,
        breakEvenMessage,
        sameCity,
relocationCost,

      },
      note: 'These are scenario estimates based on the adjusted assumptions you have entered.',
    })
  } catch (error) {
    console.error('Scenario analysis error:', error.message)
    res.status(500).json({
      success: false,
      message: 'Could not calculate the scenario analysis.',
    })
  }
})


/* ------------------------------------------------------------------ *
 * MULTI-OFFER COMPARISON
 * ------------------------------------------------------------------ */

// Same formulas as /api/analysis, but reusable for any number of offers.
function computeOfferMetrics(profile, offer) {
  const currentMonthlySavings =
    Number(profile.monthly_take_home || 0) -
    Number(profile.monthly_expenses || 0) -
    Number(profile.monthly_emi || 0)

  const destinationExpenses =
    Number(offer.monthly_rent || 0) +
    Number(offer.monthly_food || 0) +
    Number(offer.monthly_transport || 0) +
    Number(offer.monthly_utilities || 0) +
    Number(offer.monthly_other_expenses || 0)

  const offerTakeHome = Number(offer.monthly_take_home || 0)
  const offerEmi = Number(offer.monthly_emi || 0)
  const projectedMonthlySavings = offerTakeHome - destinationExpenses - offerEmi
  const monthlySavingsDifference = projectedMonthlySavings - currentMonthlySavings

  
const relocation = calculateRelocationCosts(
  profile.current_city,
  offer.destination_city,
  offer,
)

const {
  sameCity,
  relocationCost,
  netRelocationCost,
} = relocation

let breakEvenMonths = relocation.breakEvenMonths

if (!sameCity && netRelocationCost > 0 && monthlySavingsDifference > 0) {
  breakEvenMonths = netRelocationCost / monthlySavingsDifference
}


  // First-year net gain vs. staying put, after one-time costs/benefits.
  const firstYearNetGain = monthlySavingsDifference * 12 - netRelocationCost
  const threeYearNetGain = monthlySavingsDifference * 36 - netRelocationCost

  // Data sanity: monthly take-home can't realistically exceed CTC / 12.
  const annualCtc = Number(offer.annual_ctc || 0)
  const warnings = []
  if (annualCtc > 0 && offerTakeHome > annualCtc / 12) {
    warnings.push(
      'Monthly take-home is higher than annual CTC ÷ 12. Please check this offer for a data-entry mistake.',
    )
  }
  if (destinationExpenses === 0) {
    warnings.push('No destination expenses entered, so savings may be overstated.')
  }

  return {
    id: offer.id,
    companyName: offer.company_name,
    roleTitle: offer.role_title,
    destinationCity: offer.destination_city,
    annualCtc,
    offerTakeHome,
    destinationExpenses,
    offerEmi,
    projectedMonthlySavings,
    monthlySavingsDifference,
    annualSavingsDifference: monthlySavingsDifference * 12,
    sameCity,
    relocationCost,
    netRelocationCost,
    breakEvenMonths,
    firstYearNetGain,
    threeYearNetGain,
    warnings,
  }
}

// Loads profile + the requested offers (or all offers) and computes a ranking.
async function buildComparison(req, offerIds) {
  const { data: profile, error: profileError } = await req.supabase
    .from('profiles')
    .select(
      'current_city, monthly_take_home, monthly_expenses, monthly_emi, relocation_confidence, willingness_to_adapt, concerns, priorities',
    )
    .eq('id', req.user.id)
    .maybeSingle()

  if (profileError) return { status: 500, message: 'Could not retrieve your financial profile.' }
  if (!profile) return { status: 404, message: 'Please complete your financial profile first.' }

  let query = req.supabase.from('offers').select('*').eq('user_id', req.user.id)
  if (offerIds?.length) query = query.in('id', offerIds)

  const { data: offers, error: offersError } = await query
  if (offersError) return { status: 500, message: 'Could not retrieve your job offers.' }
  if (!offers || offers.length < 2)
    return { status: 400, message: 'Select at least two job offers to compare.' }

  const results = offers.map((o) => computeOfferMetrics(profile, o))

  // Rank by 3-year net gain (captures both monthly savings and upfront cost).
  const ranked = [...results].sort((a, b) => b.threeYearNetGain - a.threeYearNetGain)
  ranked.forEach((r, i) => { r.rank = i + 1 })

  const best = (key, dir = 'max') => {
    const valid = results.filter((r) => r[key] != null)
    if (!valid.length) return null
    const pick = valid.reduce((a, b) =>
      dir === 'max' ? (b[key] > a[key] ? b : a) : (b[key] < a[key] ? b : a),
    )
    return pick.id
  }

  const currentMonthlySavings =
    Number(profile.monthly_take_home || 0) -
    Number(profile.monthly_expenses || 0) -
    Number(profile.monthly_emi || 0)

  return {
    profile,
    currentMonthlySavings,
    offers: ranked,
    highlights: {
      bestOverallId: ranked[0].id,
      highestMonthlySavingsId: best('projectedMonthlySavings'),
      lowestRelocationCostId: best('netRelocationCost', 'min'),
      fastestBreakEvenId: best('breakEvenMonths', 'min'),
      lowestExpensesId: best('destinationExpenses', 'min'),
    },
  }
}

function parseOfferIds(raw) {
  if (!raw) return []
  return String(raw).split(',').map((s) => s.trim()).filter(Boolean)
}

// GET /api/compare?ids=a,b,c  (omit ids to compare all of the user's offers)
app.get('/api/compare', authenticateUser, async (req, res) => {
  try {
    const ids = parseOfferIds(req.query.ids)
    if (ids.some((id) => !UUID_REGEX.test(id))) {
      return res.status(400).json({ success: false, message: 'Invalid job offer ID.' })
    }

    const result = await buildComparison(req, ids)
    if (result.status) {
      return res.status(result.status).json({ success: false, message: result.message })
    }

    res.json({
      success: true,
      currentCity: result.profile.current_city,
      currentMonthlySavings: result.currentMonthlySavings,
      offers: result.offers,
      highlights: result.highlights,
      preferences: {
        relocation_confidence: result.profile.relocation_confidence,
        willingness_to_adapt: result.profile.willingness_to_adapt,
        concerns: result.profile.concerns || [],
        priorities: result.profile.priorities || {},
      },
      note: 'Ranking is based on estimated 3-year net financial gain versus your current situation. Personal factors are not included in the ranking.',
    })
  } catch (error) {
    console.error('Compare error:', error.message)
    res.status(500).json({ success: false, message: 'Could not compare your job offers.' })
  }
})

// GET /api/ai-comparison?ids=a,b,c  -> Gemini explains which offer fits best.
app.get('/api/ai-comparison', authenticateUser, async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured.' })
    }

    const ids = parseOfferIds(req.query.ids)
    if (ids.some((id) => !UUID_REGEX.test(id))) {
      return res.status(400).json({ error: 'Invalid job offer ID.' })
    }

    const result = await buildComparison(req, ids)
    if (result.status) {
      return res.status(result.status).json({ error: result.message })
    }

    const { profile } = result
    const summary = {
      currentCity: profile.current_city || 'Not provided',
      currentMonthlySavings: result.currentMonthlySavings,
      relocationConfidence: profile.relocation_confidence,
      willingnessToAdapt: profile.willingness_to_adapt,
      concerns: profile.concerns || [],
      priorities: profile.priorities || {},
      offers: result.offers.map((o) => ({
        company: o.companyName,
        role: o.roleTitle,
        city: o.destinationCity,
        financialRank: o.rank,
        annualCtc: o.annualCtc,
        projectedMonthlySavings: o.projectedMonthlySavings,
        monthlySavingsChange: o.monthlySavingsDifference,
        destinationMonthlyExpenses: o.destinationExpenses,
        netRelocationCost: o.netRelocationCost,
        breakEvenMonths: o.breakEvenMonths,
        threeYearNetGain: o.threeYearNetGain,
        dataWarnings: o.warnings,
      })),
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: `
You are MoveWise's relocation decision-support assistant.

The user is comparing several job offers against their current situation.
Explain which offer looks strongest and why, and where the trade-offs are.

Rules:
- Use only the supplied data. Do not invent figures, city facts, tax estimates or salaries.
- The supplied financial calculations and "financialRank" are authoritative. Do not recalculate them.
- Weigh the financial ranking against the user's priorities and concerns (e.g. career, work_life, family, savings; priorities are scored 1-5).
- If an offer has dataWarnings, say its numbers need verifying before it is trusted.
- A higher salary does not automatically mean a better offer.
- Treat confidence/adaptability scores as self-reported preferences.
- You may name a best fit, but frame it as guidance, not a final decision.
- Keep language simple and balanced.
- Return valid JSON only, using exactly these fields:
  "bestFit": the company name of the offer that looks best overall (must match a supplied company),
  "verdict": 2-4 sentences explaining the recommendation,
  "offerInsights": an array with one item per offer: {"company": string, "strengths": string[] (1-3), "concerns": string[] (1-3)},
  "questionsToAsk": an array of 2 to 4 practical questions.

Data:
${JSON.stringify(summary, null, 2)}
      `,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            bestFit: { type: 'STRING' },
            verdict: { type: 'STRING' },
            offerInsights: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  company: { type: 'STRING' },
                  strengths: { type: 'ARRAY', items: { type: 'STRING' } },
                  concerns: { type: 'ARRAY', items: { type: 'STRING' } },
                },
                required: ['company', 'strengths', 'concerns'],
              },
            },
            questionsToAsk: { type: 'ARRAY', items: { type: 'STRING' } },
          },
          required: ['bestFit', 'verdict', 'offerInsights', 'questionsToAsk'],
        },
      },
    })

    if (!response.text) throw new Error('Gemini returned an empty response.')

    return res.json({ comparison: JSON.parse(response.text) })
  } catch (error) {
    console.error('AI comparison error:', error.message)
    return res.status(502).json({ error: 'Unable to generate the AI comparison right now.' })
  }
})

// ─── 90-Day Journey Routes ────────────────────────────────────────────────────

const DEFAULT_JOURNEY_TASKS = [
  // Before Moving
  { phase: 'before_moving', task_key: 'confirm_offer',        title: 'Review and confirm your job offer letter',                    icon: 'Briefcase',     due_offset_days: -30 },
  { phase: 'before_moving', task_key: 'arrange_accommodation',title: 'Research and arrange accommodation in the new city',          icon: 'Home',          due_offset_days: -21 },
  { phase: 'before_moving', task_key: 'estimate_moving_costs',title: 'Estimate your moving and relocation expenses',                icon: 'DollarSign',    due_offset_days: -21 },
  { phase: 'before_moving', task_key: 'confirm_joining_date', title: 'Confirm your joining date with HR',                           icon: 'Calendar',      due_offset_days: -14 },
  { phase: 'before_moving', task_key: 'arrange_travel',       title: 'Book travel to your new city',                               icon: 'Plane',         due_offset_days: -14 },
  { phase: 'before_moving', task_key: 'prepare_documents',    title: 'Prepare all required documents (ID, certificates, references)',icon: 'Package',      due_offset_days:  -7 },
  // First Week
  { phase: 'first_week',    task_key: 'settle_accommodation',     title: 'Settle into your accommodation',                         icon: 'Home',          due_offset_days:   2 },
  { phase: 'first_week',    task_key: 'arrange_commute',          title: 'Arrange your daily commute to the office',               icon: 'MapPin',        due_offset_days:   3 },
  { phase: 'first_week',    task_key: 'explore_neighbourhood',    title: 'Explore your new neighbourhood',                         icon: 'MapPin',        due_offset_days:   5 },
  { phase: 'first_week',    task_key: 'record_unexpected_expenses',title: 'Record any unexpected first-week expenses',              icon: 'DollarSign',    due_offset_days:   7 },
  // First Month
  { phase: 'first_month',   task_key: 'track_actual_expenses',    title: 'Track your actual monthly expenses',                     icon: 'TrendingUp',    due_offset_days:  15 },
  { phase: 'first_month',   task_key: 'compare_estimates',        title: 'Compare actual expenses against your estimates',         icon: 'ClipboardList', due_offset_days:  20 },
  { phase: 'first_month',   task_key: 'update_budget',            title: 'Update your monthly budget based on actuals',            icon: 'Wallet',        due_offset_days:  30 },
  // Days 31–90
  { phase: 'days_31_90',    task_key: 'review_spending',          title: 'Review your overall spending patterns',                  icon: 'TrendingUp',    due_offset_days:  45 },
  { phase: 'days_31_90',    task_key: 'complete_pending_tasks',   title: 'Complete any pending setup tasks',                       icon: 'CheckCircle2',  due_offset_days:  60 },
  { phase: 'days_31_90',    task_key: 'track_adjustment',         title: 'Track how well you have settled in',                     icon: 'Star',          due_offset_days:  75 },
  { phase: 'days_31_90',    task_key: 'generate_summary',         title: 'Generate your 90-day relocation summary',               icon: 'NotebookPen',   due_offset_days:  90 },
]

// GET /api/journey/tasks?offer_id=<uuid>
app.get('/api/journey/tasks', authenticateUser, async (req, res) => {
  const { offer_id } = req.query
  try {
    let query = req.supabase
      .from('journey_tasks')
      .select('*')
      .order('due_offset_days', { ascending: true })

    if (offer_id) query = query.eq('offer_id', offer_id)

    const { data, error } = await query
    if (error) return res.status(500).json({ message: error.message })
    return res.json(data || [])
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// POST /api/journey/tasks/seed  — creates default tasks for user+offer (idempotent)
app.post('/api/journey/tasks/seed', authenticateUser, async (req, res) => {
  const { offer_id } = req.body
  if (!offer_id) return res.status(400).json({ message: 'offer_id is required.' })

  try {
    // Find which task_keys already exist for this user+offer
    const { data: existing, error: fetchErr } = await req.supabase
      .from('journey_tasks')
      .select('task_key')
      .eq('offer_id', offer_id)

    if (fetchErr) return res.status(500).json({ message: fetchErr.message })

    const existingKeys = new Set((existing || []).map((r) => r.task_key))

    const toInsert = DEFAULT_JOURNEY_TASKS
      .filter((t) => !existingKeys.has(t.task_key))
      .map((t) => ({
        user_id: req.user.id,
        offer_id,
        phase: t.phase,
        task_key: t.task_key,
        title: t.title,
        icon: t.icon,
        due_offset_days: t.due_offset_days,
        completed: false,
      }))

    if (toInsert.length === 0) return res.json({ seeded: 0 })

    const { error: insertErr } = await req.supabase
      .from('journey_tasks')
      .insert(toInsert)

    if (insertErr) return res.status(500).json({ message: insertErr.message })
    return res.json({ seeded: toInsert.length })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// PATCH /api/journey/tasks/:id  — update completed and/or notes
app.patch('/api/journey/tasks/:id', authenticateUser, async (req, res) => {
  const { id } = req.params
  const { completed, notes, actual_due_date } = req.body

  const updates = { updated_at: new Date().toISOString() }
  if (completed !== undefined) updates.completed = Boolean(completed)
  if (notes !== undefined) updates.notes = notes
  if (actual_due_date !== undefined) updates.actual_due_date = actual_due_date

  try {
    const { data, error } = await req.supabase
      .from('journey_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ message: error.message })
    return res.json(data)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// DELETE /api/journey/tasks/:id
app.delete('/api/journey/tasks/:id', authenticateUser, async (req, res) => {
  const { id } = req.params
  try {
    const { error } = await req.supabase
      .from('journey_tasks')
      .delete()
      .eq('id', id)

    if (error) return res.status(500).json({ message: error.message })
    return res.json({ deleted: true })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`MoveWise backend running at http://localhost:${PORT}`)
})
