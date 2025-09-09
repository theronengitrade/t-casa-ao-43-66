import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateViewerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  selectedCities: string[];
  isActive: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key (admin privileges)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const requestData: CreateViewerRequest = await req.json();
    
    console.log('Creating city viewer user:', {
      email: requestData.email,
      cities: requestData.selectedCities.length
    });

    // Validate required fields
    if (!requestData.firstName || !requestData.lastName || !requestData.email || !requestData.password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Todos os campos obrigatórios devem ser preenchidos'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (requestData.selectedCities.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Selecione pelo menos uma cidade'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create user in Supabase Auth using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: requestData.email,
      password: requestData.password,
      email_confirm: true,
      user_metadata: {
        first_name: requestData.firstName,
        last_name: requestData.lastName,
        phone: requestData.phone || null,
        role: 'city_viewer'
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro na criação do usuário: ${authError.message}`
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Falha ao criar usuário'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('User created successfully:', authData.user.id);

    // Create city viewer profile using database function
    const { data: functionResult, error: functionError } = await supabaseAdmin
      .rpc('create_city_viewer_user', {
        _user_id: authData.user.id,
        _first_name: requestData.firstName,
        _last_name: requestData.lastName,
        _city_ids: requestData.selectedCities,
        _phone: requestData.phone || null
      });

    if (functionError) {
      console.error('Profile creation error:', functionError);
      
      // Cleanup: delete the auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro na criação do perfil: ${functionError.message}`
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!(functionResult as any)?.success) {
      console.error('Profile creation failed:', functionResult);
      
      // Cleanup: delete the auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: (functionResult as any)?.error || 'Erro ao criar visualizador'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('City viewer created successfully:', {
      userId: authData.user.id,
      email: requestData.email
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Visualizador criado com sucesso',
        user_id: authData.user.id
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erro interno: ${error.message}`
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});