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
app.get('/api/analysis/:offerId', authenticateUser, async (req, res) => {
  try {
    const { offerId } = req.params

    if (!UUID_REGEX.test(offerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job offer ID.',
      })
    }

    // Retrieve the signed-in user's current financial profile.
    const { data: profile, error: profileError } = await req.supabase
      .from('profiles')
      .select(
        'current_city, monthly_take_home, monthly_expenses, monthly_emi',
      )
      .eq('id', req.user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Fetch profile for analysis error:', profileError.message)

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
      console.error('Fetch offer for analysis error:', offerError.message)

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

    // Current monthly financial position.
    const currentTakeHome = Number(profile.monthly_take_home || 0)
    const currentExpenses = Number(profile.monthly_expenses || 0)
    const currentEmi = Number(profile.monthly_emi || 0)

    const currentMonthlySavings =
      currentTakeHome - currentExpenses - currentEmi

    // Estimated monthly expenses in the destination city.
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

    const monthlySavingsDifference =
      projectedMonthlySavings - currentMonthlySavings

    const annualSavingsDifference = monthlySavingsDifference * 12

    // Positive = remaining cost; negative = benefits exceed costs.
    const netRelocationCost =
      Number(offer.relocation_cost || 0) -
      Number(offer.joining_bonus || 0) -
      Number(offer.relocation_assistance || 0)

    let breakEvenMonths = null
    let breakEvenMessage = ''

    if (netRelocationCost <= 0) {
      breakEvenMonths = 0
      breakEvenMessage =
        netRelocationCost < 0
          ? 'The joining bonus and relocation assistance exceed the estimated relocation cost.'
          : 'The joining bonus and relocation assistance exactly cover the estimated relocation cost.'
    } else if (monthlySavingsDifference > 0) {
      breakEvenMonths = netRelocationCost / monthlySavingsDifference
      breakEvenMessage =
        'Estimated months needed to recover the remaining relocation cost from additional monthly savings.'
    } else {
      breakEvenMessage =
        'There is no savings-based break-even under these assumptions because monthly savings do not increase.'
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
      },
      note: 'These are estimates based on the financial information and expense assumptions currently saved in your profile and job offer.',
    })
  } catch (error) {
    console.error('Analysis error:', error.message)

    res.status(500).json({
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

      const userId = req.user.id
      const { offerId } = req.params

      // Fetch the signed-in user's financial profile.
      const { data: profile, error: profileError } =
        await req.supabase
          .from('profiles')
          .select(`
            current_city,
            monthly_take_home,
            monthly_expenses,
            monthly_emi,
            current_savings,
            relocation_confidence,
            willingness_to_adapt,
            concerns,
            priorities
          `)
          .eq('id', userId)
          .single()

      if (profileError || !profile) {
        return res.status(404).json({
          error: 'Your financial profile could not be found.',
        })
      }

      // Fetch only an offer belonging to this user.
      const { data: offer, error: offerError } =
        await req.supabase
          .from('offers')
          .select('*')
          .eq('id', offerId)
          .eq('user_id', userId)
          .single()

      if (offerError || !offer) {
        return res.status(404).json({
          error: 'Job offer not found.',
        })
      }

      // Calculate the financial figures in the backend.
      const currentSavings =
        Number(profile.monthly_take_home || 0) -
        Number(profile.monthly_expenses || 0) -
        Number(profile.monthly_emi || 0)

      const destinationExpenses =
        Number(offer.monthly_rent || 0) +
        Number(offer.monthly_food || 0) +
        Number(offer.monthly_transport || 0) +
        Number(offer.monthly_utilities || 0) +
        Number(offer.monthly_other_expenses || 0)

      const projectedSavings =
        Number(offer.monthly_take_home || 0) -
        destinationExpenses -
        Number(offer.monthly_emi || 0)

      const monthlySavingsDifference =
        projectedSavings - currentSavings

      const netRelocationCost =
        Number(offer.relocation_cost || 0) -
        Number(offer.joining_bonus || 0) -
        Number(offer.relocation_assistance || 0)

      const financialSummary = {
        currentCity: profile.current_city || 'Not provided',
        destinationCity: offer.destination_city,
        company: offer.company_name,
        role: offer.role_title,
        currentMonthlySavings: currentSavings,
        projectedMonthlySavings: projectedSavings,
        monthlySavingsDifference,
        annualSavingsDifference: monthlySavingsDifference * 12,
        destinationMonthlyExpenses: destinationExpenses,
        netRelocationCost,
        relocationConfidence: profile.relocation_confidence,
        willingnessToAdapt: profile.willingness_to_adapt,
        concerns: profile.concerns || [],
        priorities: profile.priorities || {},
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
You are MoveWise's relocation decision-support assistant.

Explain the supplied financial comparison clearly and objectively.

Rules:
- Use only the supplied data. Do not invent figures, city facts,
  tax estimates, salary information, or personal circumstances.
- The supplied financial calculations are authoritative.
  Do not recalculate or change them.
- Explain the financial trade-offs and connect them to the user's
  stated priorities and concerns where relevant.
- Treat confidence and willingness-to-adapt scores as self-reported
  preferences, not psychological or clinical assessments.
- Do not make the relocation decision for the user.
- Do not assume that a higher salary automatically means a better move.
- If important information is missing, say what the user should verify.
- Keep the language simple, balanced, and useful.
- Return valid JSON only, using exactly these fields:
  "summary": a concise explanation,
  "keyConsiderations": an array of 3 to 5 short points,
  "questionsToAsk": an array of 2 to 4 practical questions.

Financial and personal data:
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
  }
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

    const netRelocationCost =
      pick('relocation_cost') -
      pick('joining_bonus') -
      pick('relocation_assistance')

    let breakEvenMonths = null
    let breakEvenMessage

    if (netRelocationCost <= 0) {
      breakEvenMonths = 0
      breakEvenMessage =
        'The joining bonus and relocation assistance cover the estimated relocation cost.'
    } else if (monthlySavingsDifference > 0) {
      breakEvenMonths = netRelocationCost / monthlySavingsDifference
      breakEvenMessage =
        'Estimated months needed to recover relocation costs from additional monthly savings.'
    } else {
      breakEvenMessage =
        'There is no savings-based break-even under these assumptions because monthly savings do not increase.'
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

app.listen(PORT, () => {
  console.log(`MoveWise backend running at http://localhost:${PORT}`)
})
