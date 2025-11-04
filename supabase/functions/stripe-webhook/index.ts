import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔔 [STRIPE-WEBHOOK] Webhook recebido");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature!,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
    } catch (err) {
      console.error("❌ [STRIPE-WEBHOOK] Erro na verificação da assinatura:", err);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log("📋 [STRIPE-WEBHOOK] Tipo de evento:", event.type);

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("✅ [STRIPE-WEBHOOK] Checkout completado:", session.id);

        const agencyId = session.metadata?.agency_id;
        const planKey = session.metadata?.plan_key;

        if (!agencyId || !planKey) {
          console.error("❌ [STRIPE-WEBHOOK] Metadata ausente:", { agencyId, planKey });
          break;
        }

        // Get plan details
        const { data: plan } = await supabaseClient
          .from('subscription_plans')
          .select('*')
          .eq('plan_key', planKey)
          .single();

        if (!plan) {
          console.error("❌ [STRIPE-WEBHOOK] Plano não encontrado:", planKey);
          break;
        }

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        // Update agency
        const { error: updateError } = await supabaseClient
          .from('agencies')
          .update({
            subscription_status: 'active',
            subscription_plan: planKey,
            plan_expiry_date: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('id', agencyId);

        if (updateError) {
          console.error("❌ [STRIPE-WEBHOOK] Erro ao atualizar agency:", updateError);
          break;
        }

        // Create subscription record
        const { error: subError } = await supabaseClient
          .from('subscriptions')
          .insert({
            agency_id: agencyId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: 'active',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          });

        if (subError) {
          console.error("❌ [STRIPE-WEBHOOK] Erro ao criar subscription:", subError);
        } else {
          console.log("🎉 [STRIPE-WEBHOOK] Agência ativada com sucesso:", agencyId);
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("🔄 [STRIPE-WEBHOOK] Assinatura atualizada:", subscription.id);

        // Update subscription status
        const { error } = await supabaseClient
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error("❌ [STRIPE-WEBHOOK] Erro ao atualizar subscription:", error);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("🗑️ [STRIPE-WEBHOOK] Assinatura cancelada:", subscription.id);

        // Get subscription record
        const { data: subRecord } = await supabaseClient
          .from('subscriptions')
          .select('agency_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (subRecord) {
          // Update agency to suspended
          await supabaseClient
            .from('agencies')
            .update({
              subscription_status: 'suspended',
            })
            .eq('id', subRecord.agency_id);

          // Update subscription status
          await supabaseClient
            .from('subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);

          console.log("✅ [STRIPE-WEBHOOK] Agência suspensa:", subRecord.agency_id);
        }

        break;
      }

      default:
        console.log("ℹ️ [STRIPE-WEBHOOK] Evento não tratado:", event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ [STRIPE-WEBHOOK] Erro:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
