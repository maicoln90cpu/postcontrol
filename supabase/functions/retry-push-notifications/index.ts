import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Calcular próximo retry com backoff exponencial
function calculateNextRetry(attemptCount: number): Date {
  // Backoff exponencial: 5min, 15min, 1h, 3h
  const delays = [5, 15, 60, 180]; // minutos
  const delayMinutes = delays[Math.min(attemptCount, delays.length - 1)];
  
  const nextRetry = new Date();
  nextRetry.setMinutes(nextRetry.getMinutes() + delayMinutes);
  return nextRetry;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[RETRY-PUSH] 🔄 Iniciando processamento de retries");

    // Buscar notificações pendentes de retry
    const { data: retries, error: fetchError } = await supabase
      .from("push_notification_retries")
      .select("*")
      .in("status", ["pending", "retrying"])
      .lte("next_retry_at", new Date().toISOString())
      .lt("attempt_count", 3) // Máximo 3 tentativas
      .order("next_retry_at", { ascending: true })
      .limit(50); // Processar 50 por vez

    if (fetchError) {
      console.error("[RETRY-PUSH] ❌ Erro ao buscar retries:", fetchError);
      throw fetchError;
    }

    console.log(`[RETRY-PUSH] 📊 Retries encontrados: ${retries?.length || 0}`);

    if (!retries || retries.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum retry pendente" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let successCount = 0;
    let failureCount = 0;
    let permanentFailures = 0;

    // Processar cada retry
    for (const retry of retries) {
      console.log(`[RETRY-PUSH] 🔄 Processando retry ${retry.id} (tentativa ${retry.attempt_count + 1})`);

      try {
        // Chamar edge function de envio
        const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            userId: retry.user_id,
            title: retry.title,
            body: retry.body,
            data: retry.data,
            notificationType: retry.notification_type,
          }),
        });

        const result = await sendResponse.json();

        if (result.sent > 0) {
          // Sucesso - marcar como concluído
          await supabase
            .from("push_notification_retries")
            .update({ status: "success" })
            .eq("id", retry.id);
          
          successCount++;
          console.log(`[RETRY-PUSH] ✅ Retry ${retry.id} enviado com sucesso`);
        } else {
          throw new Error(result.error || "Falha ao enviar");
        }
      } catch (error) {
        failureCount++;
        const newAttemptCount = retry.attempt_count + 1;
        const errorMessage = error instanceof Error ? error.message : String(error);

        console.error(`[RETRY-PUSH] ❌ Erro no retry ${retry.id}:`, errorMessage);

        if (newAttemptCount >= retry.max_attempts) {
          // Atingiu máximo de tentativas - marcar como falha permanente
          await supabase
            .from("push_notification_retries")
            .update({
              status: "failed",
              attempt_count: newAttemptCount,
              last_attempt_at: new Date().toISOString(),
              last_error: errorMessage,
            })
            .eq("id", retry.id);
          
          permanentFailures++;
          console.log(`[RETRY-PUSH] 💀 Retry ${retry.id} falhou permanentemente após ${newAttemptCount} tentativas`);
        } else {
          // Agendar próximo retry com backoff
          const nextRetry = calculateNextRetry(newAttemptCount);

          await supabase
            .from("push_notification_retries")
            .update({
              status: "retrying",
              attempt_count: newAttemptCount,
              last_attempt_at: new Date().toISOString(),
              next_retry_at: nextRetry.toISOString(),
              last_error: errorMessage,
            })
            .eq("id", retry.id);

          console.log(`[RETRY-PUSH] ⏰ Próximo retry de ${retry.id} agendado para ${nextRetry.toISOString()}`);
        }
      }
    }

    const result = {
      success: true,
      processed: retries.length,
      successful: successCount,
      failed: failureCount,
      permanentFailures,
    };

    console.log("[RETRY-PUSH] ✅ Processamento concluído:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[RETRY-PUSH] ❌ Erro crítico:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
