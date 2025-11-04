import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🏭 [CREATE-STRIPE-PRODUCTS] Iniciando sincronização de produtos");

    // Verify master admin
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Check if user is master admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isMasterAdmin = roles?.some(r => r.role === 'master_admin');
    if (!isMasterAdmin) {
      throw new Error("Only master admins can sync products");
    }

    console.log("✅ [CREATE-STRIPE-PRODUCTS] Master admin verificado");

    // Get all plans without Stripe IDs
    const { data: plans, error: plansError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .or('stripe_product_id.is.null,stripe_price_id.is.null');

    if (plansError) {
      throw new Error(`Error fetching plans: ${plansError.message}`);
    }

    if (!plans || plans.length === 0) {
      console.log("ℹ️ [CREATE-STRIPE-PRODUCTS] Todos os planos já têm IDs Stripe");
      return new Response(
        JSON.stringify({ message: "All plans already have Stripe IDs", synced: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log(`📋 [CREATE-STRIPE-PRODUCTS] ${plans.length} planos para sincronizar`);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const results = [];

    for (const plan of plans) {
      try {
        console.log(`🔄 [CREATE-STRIPE-PRODUCTS] Processando: ${plan.plan_name}`);

        // Create product
        const product = await stripe.products.create({
          name: plan.plan_name,
          description: `Plano ${plan.plan_name} - ${plan.max_influencers} divulgadores, ${plan.max_events} eventos`,
          metadata: {
            plan_key: plan.plan_key,
            supabase_plan_id: plan.id,
          },
        });

        console.log(`✅ [CREATE-STRIPE-PRODUCTS] Produto criado:`, product.id);

        // Create price (monthly subscription)
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(Number(plan.monthly_price) * 100), // Convert to cents
          currency: 'brl',
          recurring: {
            interval: 'month',
          },
          metadata: {
            plan_key: plan.plan_key,
          },
        });

        console.log(`✅ [CREATE-STRIPE-PRODUCTS] Preço criado:`, price.id);

        // Update plan with Stripe IDs
        const { error: updateError } = await supabaseClient
          .from('subscription_plans')
          .update({
            stripe_product_id: product.id,
            stripe_price_id: price.id,
          })
          .eq('id', plan.id);

        if (updateError) {
          console.error(`❌ [CREATE-STRIPE-PRODUCTS] Erro ao atualizar plano ${plan.plan_name}:`, updateError);
          results.push({ plan: plan.plan_name, success: false, error: updateError.message });
        } else {
          console.log(`🎉 [CREATE-STRIPE-PRODUCTS] Plano sincronizado: ${plan.plan_name}`);
          results.push({
            plan: plan.plan_name,
            success: true,
            product_id: product.id,
            price_id: price.id,
          });
        }
      } catch (error) {
        console.error(`❌ [CREATE-STRIPE-PRODUCTS] Erro no plano ${plan.plan_name}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ plan: plan.plan_name, success: false, error: errorMessage });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✨ [CREATE-STRIPE-PRODUCTS] Sincronização completa: ${successCount}/${plans.length} sucesso`);

    return new Response(
      JSON.stringify({
        message: `Synced ${successCount} of ${plans.length} plans`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ [CREATE-STRIPE-PRODUCTS] Erro:", error);
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
