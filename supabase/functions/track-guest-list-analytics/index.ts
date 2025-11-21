import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AnalyticsEventType = 'view' | 'form_start' | 'submission' | 'share_click';

interface TrackingPayload {
  eventId: string;
  dateId?: string;
  eventType: AnalyticsEventType;
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
    ref?: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, dateId, eventType, utmParams }: TrackingPayload = await req.json();
    
    // Validar event type
    const validEventTypes: AnalyticsEventType[] = ['view', 'form_start', 'submission', 'share_click'];
    if (!validEventTypes.includes(eventType)) {
      console.error('[ANALYTICS] ❌ Tipo de evento inválido:', eventType);
      return new Response(
        JSON.stringify({ 
          error: 'Tipo de evento inválido',
          validTypes: validEventTypes
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log('[ANALYTICS] 📊 Registrando evento:', { 
      eventId, 
      dateId, 
      eventType,
      hasUtmParams: !!utmParams
    });

    // Capturar IP e User Agent
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Inserir evento de analytics
    const { data, error } = await supabase
      .from('guest_list_analytics')
      .insert({
        event_id: eventId,
        date_id: dateId || null,
        event_type: eventType,
        ip_address: ipAddress,
        user_agent: userAgent,
        utm_params: utmParams ? {
          source: utmParams.source || null,
          medium: utmParams.medium || null,
          campaign: utmParams.campaign || null,
          ref: utmParams.ref || null
        } : null
      })
      .select()
      .single();

    if (error) {
      console.error('[ANALYTICS] ❌ Erro ao inserir analytics:', error);
      throw error;
    }

    console.log('[ANALYTICS] ✅ Evento registrado:', { 
      id: data.id, 
      eventType, 
      eventId 
    });

    // Estatísticas em tempo real (opcional - para debug)
    if (eventType === 'submission') {
      const { count: totalRegistrations } = await supabase
        .from('guest_list_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      const { count: totalViews } = await supabase
        .from('guest_list_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('event_type', 'view');

      console.log('[ANALYTICS] 📈 Estatísticas do evento:', {
        eventId,
        totalViews,
        totalRegistrations,
        conversionRate: (totalViews ?? 0) > 0 
          ? ((totalRegistrations || 0) / (totalViews ?? 1) * 100).toFixed(2) + '%' 
          : '0%'
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        tracked: data 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error('[ANALYTICS] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao registrar analytics' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});