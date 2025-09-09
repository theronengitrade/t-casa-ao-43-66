import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateCoordinatorRequest {
  condominium_id: string;
  coordinator: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    tempPassword: string;
  };
}

interface CreateCoordinatorResponse {
  success: boolean;
  message: string;
  data?: {
    coordinator_id: string;
    user_id: string;
    temp_password: string;
    must_change_password: boolean;
  };
  error?: string;
  code?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Create Coordinator Edge Function - Starting request processing');
    
    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Parse request body
    const requestBody: CreateCoordinatorRequest = await req.json();
    console.log('Request body received:', {
      condominium_id: requestBody.condominium_id,
      coordinator_email: requestBody.coordinator.email
    });

    const { condominium_id, coordinator } = requestBody;

    // Validate required fields
    if (!condominium_id || !coordinator.email || !coordinator.firstName || !coordinator.lastName || !coordinator.tempPassword) {
      console.error('Missing required fields in request');
      return new Response(JSON.stringify({
        success: false,
        error: 'Campos obrigatórios em falta',
        code: 'MISSING_FIELDS'
      } as CreateCoordinatorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Create user in Supabase Auth
    console.log('Creating user in Supabase Auth...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: coordinator.email,
      password: coordinator.tempPassword,
      email_confirm: true, // Auto-confirm email to avoid email verification step
      user_metadata: {
        first_name: coordinator.firstName,
        last_name: coordinator.lastName,
        phone: coordinator.phone || null,
        role: 'coordinator',
        condominium_id: condominium_id,
        created_by: 'super_admin',
        must_change_password: true
      }
    });

    if (authError) {
      console.error('Error creating user in Auth:', authError);
      return new Response(JSON.stringify({
        success: false,
        error: `Erro ao criar usuário: ${authError.message}`,
        code: 'AUTH_ERROR'
      } as CreateCoordinatorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!authUser.user) {
      console.error('User creation returned null user');
      return new Response(JSON.stringify({
        success: false,
        error: 'Falha na criação do usuário',
        code: 'USER_CREATION_FAILED'
      } as CreateCoordinatorResponse), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User created successfully:', authUser.user.id);

    // Step 2: Create coordinator profile using database function
    console.log('Creating coordinator profile...');
    const { data: profileResult, error: profileError } = await supabaseAdmin
      .rpc('create_coordinator_profile', {
        _user_id: authUser.user.id,
        _condominium_id: condominium_id,
        _first_name: coordinator.firstName,
        _last_name: coordinator.lastName,
        _phone: coordinator.phone || null
      });

    if (profileError) {
      console.error('Error creating coordinator profile:', profileError);
      
      // If profile creation fails, clean up the auth user
      console.log('Cleaning up auth user due to profile creation failure...');
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      
      return new Response(JSON.stringify({
        success: false,
        error: `Erro ao criar perfil: ${profileError.message}`,
        code: 'PROFILE_ERROR'
      } as CreateCoordinatorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!profileResult.success) {
      console.error('Profile creation function returned error:', profileResult);
      
      // Clean up auth user
      console.log('Cleaning up auth user due to profile function error...');
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      
      return new Response(JSON.stringify({
        success: false,
        error: profileResult.error,
        code: profileResult.code
      } as CreateCoordinatorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Coordinator created successfully:', profileResult.data);

    // Step 3: Log audit trail
    console.log('Creating audit log entry...');
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: authUser.user.id,
        condominium_id: condominium_id,
        action: 'CREATE',
        table_name: 'coordinator_creation',
        new_values: {
          coordinator_id: profileResult.data.profile_id,
          coordinator_email: coordinator.email,
          coordinator_name: `${coordinator.firstName} ${coordinator.lastName}`,
          created_via: 'edge_function'
        }
      });

    // Return success response
    const response: CreateCoordinatorResponse = {
      success: true,
      message: 'Coordenador criado com sucesso!',
      data: {
        coordinator_id: profileResult.data.profile_id,
        user_id: authUser.user.id,
        temp_password: coordinator.tempPassword,
        must_change_password: true
      }
    };

    console.log('Coordinator creation completed successfully');
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in create-coordinator function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Erro interno: ${error.message}`,
      code: 'INTERNAL_ERROR'
    } as CreateCoordinatorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});