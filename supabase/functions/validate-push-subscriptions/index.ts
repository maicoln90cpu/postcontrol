import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[VALIDATE-SUBSCRIPTIONS] 🔍 Iniciando validação de subscriptions");

    // Buscar todas as subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth, created_at");

    if (fetchError) {
      console.error("[VALIDATE-SUBSCRIPTIONS] ❌ Erro ao buscar subscriptions:", fetchError);
      throw fetchError;
    }

    console.log(`[VALIDATE-SUBSCRIPTIONS] 📊 Total de subscriptions encontradas: ${subscriptions?.length || 0}`);

    // Validar formato das chaves (Base64URL não deve conter / ou +)
    const invalidSubscriptions = subscriptions?.filter((sub) => {
      const hasInvalidChars = 
        sub.p256dh.includes("/") || 
        sub.p256dh.includes("+") ||
        sub.auth.includes("/") || 
        sub.auth.includes("+");
      
      if (hasInvalidChars) {
        console.log(`[VALIDATE-SUBSCRIPTIONS] ⚠️ Subscription inválida encontrada: ${sub.id}`);
      }
      
      return hasInvalidChars;
    }) || [];

    console.log(`[VALIDATE-SUBSCRIPTIONS] ❌ Subscriptions inválidas: ${invalidSubscriptions.length}`);

    // Remover subscriptions inválidas
    if (invalidSubscriptions.length > 0) {
      const idsToDelete = invalidSubscriptions.map((sub) => sub.id);
      
      const { error: deleteError } = await supabase
        .from("push_subscriptions")
        .delete()
        .in("id", idsToDelete);

      if (deleteError) {
        console.error("[VALIDATE-SUBSCRIPTIONS] ❌ Erro ao deletar subscriptions:", deleteError);
        throw deleteError;
      }

      console.log(`[VALIDATE-SUBSCRIPTIONS] ✅ ${invalidSubscriptions.length} subscriptions inválidas removidas`);
    }

    // Remover subscriptions antigas (não usadas há mais de 60 dias)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: oldSubscriptions, error: oldError } = await supabase
      .from("push_subscriptions")
      .delete()
      .lt("last_used_at", sixtyDaysAgo.toISOString())
      .select("id");

    const oldCount = oldSubscriptions?.length || 0;
    if (oldCount > 0) {
      console.log(`[VALIDATE-SUBSCRIPTIONS] 🗑️ ${oldCount} subscriptions antigas removidas`);
    }

    const result = {
      success: true,
      totalSubscriptions: subscriptions?.length || 0,
      invalidRemoved: invalidSubscriptions.length,
      oldRemoved: oldCount,
      validRemaining: (subscriptions?.length || 0) - invalidSubscriptions.length - oldCount,
    };

    console.log("[VALIDATE-SUBSCRIPTIONS] ✅ Validação concluída:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[VALIDATE-SUBSCRIPTIONS] ❌ Erro crítico:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
