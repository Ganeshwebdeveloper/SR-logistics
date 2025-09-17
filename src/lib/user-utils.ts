import { supabase } from '@/lib/supabase'

export const createUserProfileManually = async (userId: string) => {
  try {
    // Get auth user data
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      throw new Error('Failed to get auth user: ' + authError?.message)
    }

    // Create user profile
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email: authUser.email!,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          role: authUser.user_metadata?.role || 'driver'
        }
      ])
      .select()
      .single()

    if (insertError) {
      throw new Error('Failed to create user profile: ' + insertError.message)
    }

    return newUser
  } catch (error) {
    console.error('Error creating user profile manually:', error)
    throw error
  }
}

export const ensureUserProfileExists = async (userId: string) => {
  try {
    // Check if user profile exists
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (selectError || !existingUser) {
      // If not exists, create it
      return await createUserProfileManually(userId)
    }

    return existingUser
  } catch (error) {
    console.error('Error ensuring user profile exists:', error)
    throw error
  }
}