import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetPasswordRequest {
  userId: string;
  newPassword?: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
  data?: {
    new_password: string;
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
    console.log('Reset Coordinator Password Edge Function - Starting request processing');
    
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
    const requestBody: ResetPasswordRequest = await req.json();
    console.log('Request body received:', requestBody);

    const { userId, newPassword } = requestBody;

    // Validate required fields
    if (!userId) {
      console.error('Missing required fields in request');
      return new Response(JSON.stringify({
        success: false,
        error: 'userId é obrigatório',
        code: 'MISSING_FIELDS'
      } as ResetPasswordResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate new temporary password (or use provided one)
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let tempPassword = newPassword;
    if (!tempPassword) {
      tempPassword = '';
      for (let i = 0; i < 12; i++) {
        tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    console.log('Generated/Using password for user:', userId);

    // Step 1: Verify user exists and get their profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, role, condominium_id, user_id')
      .eq('user_id', userId)
      .in('role', ['coordinator', 'city_viewer'])
      .single();

    if (profileError || !userProfile) {
      console.error('User not found:', profileError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Utilizador não encontrado',
        code: 'USER_NOT_FOUND'
      } as ResetPasswordResponse), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User found:', userProfile.first_name, userProfile.last_name, 'Role:', userProfile.role);

    // Step 2: Reset password in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: tempPassword
      }
    );

    if (authError) {
      console.error('Error resetting password in Auth:', authError);
      return new Response(JSON.stringify({
        success: false,
        error: `Erro ao redefinir password: ${authError.message}`,
        code: 'AUTH_ERROR'
      } as ResetPasswordResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Password reset successfully in Auth');

    // Step 3: Update profile to require password change
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        must_change_password: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError);
      return new Response(JSON.stringify({
        success: false,
        error: `Erro ao atualizar perfil: ${updateProfileError.message}`,
        code: 'PROFILE_UPDATE_ERROR'
      } as ResetPasswordResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Profile updated successfully');

    // Step 4: Log audit trail
    console.log('Creating audit log entry...');
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: userId,
        condominium_id: userProfile.condominium_id,
        action: 'UPDATE',
        table_name: 'password_reset',
        new_values: {
          user_id: userId,
          user_name: `${userProfile.first_name} ${userProfile.last_name}`,
          user_role: userProfile.role,
          reset_via: 'admin_edge_function',
          must_change_password: true
        }
      });

    // Return success response
    const response: ResetPasswordResponse = {
      success: true,
      message: 'Password redefinida com sucesso!',
      data: {
        new_password: tempPassword,
        must_change_password: true
      }
    };

    console.log('Password reset completed successfully');
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in reset-coordinator-password function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Erro interno: ${error.message}`,
      code: 'INTERNAL_ERROR'
    } as ResetPasswordResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});