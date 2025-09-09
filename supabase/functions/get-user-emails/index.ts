import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  userIds: string[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { userIds }: RequestBody = await req.json()

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid userIds array' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Fetching emails for user IDs:', userIds)

    // Get user emails using admin client
    const emailPromises = userIds.map(async (userId) => {
      try {
        const { data: authUser, error } = await supabaseAdmin.auth.admin.getUserById(userId)
        
        if (error) {
          console.error(`Error fetching user ${userId}:`, error)
          return { userId, email: 'Email não disponível', error: error.message }
        }

        return {
          userId,
          email: authUser.user?.email || 'Email não disponível'
        }
      } catch (error) {
        console.error(`Exception fetching user ${userId}:`, error)
        return { userId, email: 'Email não disponível', error: 'Exception occurred' }
      }
    })

    const results = await Promise.all(emailPromises)
    
    console.log('Email fetch results:', results)

    return new Response(
      JSON.stringify({ 
        success: true, 
        emails: results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in get-user-emails function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})