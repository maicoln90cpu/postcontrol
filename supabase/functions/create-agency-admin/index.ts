import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAgencyAdminRequest {
  agencyId: string;
  agencyName: string;
  email: string;
  fullName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { agencyId, agencyName, email, fullName }: CreateAgencyAdminRequest = await req.json();

    console.log('Creating agency admin:', { agencyId, email, fullName });

    // 1. Create user in auth.users with temporary password
    const tempPassword = crypto.randomUUID().slice(0, 16);
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw new Error(`Erro ao criar usuário: ${authError.message}`);
    }

    console.log('Auth user created:', authUser.user.id);

    // 2. Update profile with agency_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        agency_id: agencyId,
        full_name: fullName 
      })
      .eq('id', authUser.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
    }

    console.log('Profile updated with agency_id');

    // 3. Insert agency_admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        role: 'agency_admin'
      });

    if (roleError) {
      console.error('Error inserting role:', roleError);
      throw new Error(`Erro ao atribuir role: ${roleError.message}`);
    }

    console.log('Agency admin role assigned');

    // 4. Update agencies.owner_id
    const { error: agencyError } = await supabaseAdmin
      .from('agencies')
      .update({ owner_id: authUser.user.id })
      .eq('id', agencyId);

    if (agencyError) {
      console.error('Error updating agency owner:', agencyError);
      throw new Error(`Erro ao vincular dono da agência: ${agencyError.message}`);
    }

    console.log('Agency owner_id updated');

    // 5. Generate password reset link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (resetError) {
      console.error('Error generating reset link:', resetError);
    }

    const resetLink = resetData?.properties?.action_link || '';

    console.log('Agency admin created successfully');

    return new Response(
      JSON.stringify({
        success: true,
        userId: authUser.user.id,
        resetLink,
        message: 'Admin criado com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in create-agency-admin:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro ao criar admin da agência'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
