import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { users } = await req.json();
    
    const results = {
      success: [] as string[],
      errors: [] as { email: string; error: string }[]
    };

    for (const user of users) {
      try {
        // Criar usuário com senha padrão
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: 'Temp@123!', // Senha padrão
          email_confirm: true, // Auto-confirmar email
          user_metadata: {
            full_name: user.full_name,
            instagram: user.instagram,
            phone: user.phone,
          }
        });

        if (error) throw error;
        
        results.success.push(user.email);
        
        // Enviar email de recuperação para o usuário definir sua senha
        await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: user.email,
        });
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({ email: user.email, error: errorMessage });
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
