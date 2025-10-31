import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Running expire-guests cron job...");

    // Chamar a função SQL que expira convites
    const { data, error } = await supabase.rpc("expire_old_guest_invites");

    if (error) {
      console.error("Error expiring guests:", error);
      throw error;
    }

    console.log("Successfully expired old guest invites");

    // Buscar quantos convites foram expirados
    const { count } = await supabase
      .from("agency_guests")
      .select("*", { count: "exact", head: true })
      .eq("status", "expired")
      .gte("updated_at", new Date(Date.now() - 60000).toISOString()); // últimos 60 segundos

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Guest expiration check completed",
        expiredCount: count || 0
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in expire-guests function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
