
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables in backend/.env')
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
      }
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
  const {
    company_name,
    role_title,
    destination_city,
    annual_ctc,
    monthly_take_home,
    monthly_rent,
    monthly_food,
    monthly_transport,
    monthly_utilities,
    monthly_other_expenses,
    monthly_emi,
    relocation_cost,
    joining_bonus,
    relocation_assistance,
  } = req.body

  if (
    !company_name?.trim() ||
    !role_title?.trim() ||
    !destination_city?.trim() ||
    annual_ctc == null ||
    monthly_take_home == null
  ) {
    return res.status(400).json({
      success: false,
      message:
        'Company, role, destination, annual CTC and monthly take-home are required.',
    })
  }

  const numericFields = {
    annual_ctc,
    monthly_take_home,
    monthly_rent,
    monthly_food,
    monthly_transport,
    monthly_utilities,
    monthly_other_expenses,
    monthly_emi,
    relocation_cost,
    joining_bonus,
    relocation_assistance,
  }

  for (const [field, value] of Object.entries(numericFields)) {
    if (
      value != null &&
      (value === '' ||
        !Number.isFinite(Number(value)) ||
        Number(value) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: `${field} must be a non-negative number.`,
      })
    }
  }

  const offer = {
    user_id: req.user.id,
    company_name: company_name.trim(),
    role_title: role_title.trim(),
    destination_city: destination_city.trim(),
    annual_ctc: Number(annual_ctc),
    monthly_take_home: Number(monthly_take_home),
    monthly_rent: Number(monthly_rent ?? 0),
    monthly_food: Number(monthly_food ?? 0),
    monthly_transport: Number(monthly_transport ?? 0),
    monthly_utilities: Number(monthly_utilities ?? 0),
    monthly_other_expenses: Number(monthly_other_expenses ?? 0),
    monthly_emi: Number(monthly_emi ?? 0),
    relocation_cost: Number(relocation_cost ?? 0),
    joining_bonus: Number(joining_bonus ?? 0),
    relocation_assistance: Number(relocation_assistance ?? 0),
  }

  const { data, error } = await req.supabase
    .from('offers')
    .insert(offer)
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

// DELETE: Delete an offer belonging to the signed-in user.
app.delete('/api/offers/:id', authenticateUser, async (req, res) => {
  const { id } = req.params

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
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
      message: 'Job offer not found or you do not have permission to delete it.',
    })
  }

  res.json({
    success: true,
    message: 'Job offer deleted successfully.',
    id: data.id,
  })
})

app.listen(PORT, () => {
  console.log(`MoveWise backend running at http://localhost:${PORT}`)
})
