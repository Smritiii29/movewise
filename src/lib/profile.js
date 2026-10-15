
import { supabase } from './supabase'

export async function ensureUserProfile(user) {
  if (!user?.id) {
    throw new Error('No authenticated user found.')
  }

  const fullName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    ''

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        full_name: fullName,
      },
      {
        onConflict: 'id',
        ignoreDuplicates: true,
      }
    )

  if (error) {
    throw error
  }
}
