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

    // 1. Check if user already exists
    const { data: existingUsersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw new Error(`Erro ao verificar usuários: ${listError.message}`);
    }

    const existingUser = existingUsersData.users.find(u => u.email === email);
    
    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      // User already exists - use existing ID
      userId = existingUser.id;
      isNewUser = false;
      console.log('User already exists, updating roles and agency linkage:', userId);
    } else {
      // Create new user
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

      userId = authUser.user.id;
      isNewUser = true;
      console.log('Auth user created:', userId);
    }

    // 2. Update profile with agency_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        agency_id: agencyId,
        full_name: fullName 
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
    }

    console.log('Profile updated with agency_id');

    // 3. Insert agency_admin role (ignore if already exists)
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'agency_admin'
      });

    // Ignore duplicate key error (code 23505)
    if (roleError && roleError.code !== '23505') {
      console.error('Error inserting role:', roleError);
      throw new Error(`Erro ao atribuir role: ${roleError.message}`);
    }

    console.log('Agency admin role assigned');

    // 4. Update agencies.owner_id
    const { error: agencyError } = await supabaseAdmin
      .from('agencies')
      .update({ owner_id: userId })
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
        userId: userId,
        resetLink,
        isNewUser,
        message: isNewUser ? 'Admin criado com sucesso' : 'Admin existente atualizado com sucesso'
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
