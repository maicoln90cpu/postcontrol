import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[AUTO-DEACTIVATE-DATES] Iniciando desativação automática de datas...');

    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar timezone configurado no sistema
    const { data: tzData } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'system_timezone')
      .is('agency_id', null)
      .single();

    const systemTimezone = tzData?.setting_value || 'America/Sao_Paulo';
    console.log(`[AUTO-DEACTIVATE-DATES] Usando timezone: ${systemTimezone}`);

    // Buscar datas que devem ser desativadas:
    // - auto_deactivate_after_start = true
    // - is_active = true
    // - event_date + end_time < NOW() (usando regra inteligente)
    const { data: datesToDeactivate, error: fetchError } = await supabase
      .from('guest_list_dates')
      .select('id, name, event_date, start_time, end_time')
      .eq('auto_deactivate_after_start', true)
      .eq('is_active', true);

    if (fetchError) {
      console.error('[AUTO-DEACTIVATE-DATES] Erro ao buscar datas:', fetchError);
      throw fetchError;
    }

    if (!datesToDeactivate || datesToDeactivate.length === 0) {
      console.log('[AUTO-DEACTIVATE-DATES] Nenhuma data para desativar');
      return new Response(
        JSON.stringify({ 
          success: true, 
          deactivated: 0,
          message: 'Nenhuma data precisa ser desativada' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AUTO-DEACTIVATE-DATES] Encontradas ${datesToDeactivate.length} datas candidatas`);

    // Obter hora atual no timezone configurado de forma confiável
    const getNowInTimezone = (tz: string): Date => {
      const now = new Date();
      // Converter para string no timezone e depois criar Date
      const tzString = now.toLocaleString("en-US", { timeZone: tz });
      return new Date(tzString);
    };

    // Obter data de hoje no timezone configurado (formato YYYY-MM-DD)
    const getTodayInTimezone = (tz: string): string => {
      return new Date().toLocaleDateString('en-CA', { timeZone: tz });
    };

    /**
     * Check if event has ended using smart rule:
     * - If end_time < start_time → end_time is on the NEXT day (e.g., 23h-07h)
     * - If end_time >= start_time → end_time is on the SAME day (e.g., 09h-22h)
     */
    const hasEventEnded = (eventDate: string, endTime: string, startTime: string | null, nowTz: Date): boolean => {
      let endDateStr = eventDate;
      
      if (startTime) {
        const endHours = parseInt(endTime.split(':')[0], 10);
        const startHours = parseInt(startTime.split(':')[0], 10);
        
        if (endHours < startHours) {
          const eventDateObj = new Date(eventDate + 'T00:00:00');
          eventDateObj.setDate(eventDateObj.getDate() + 1);
          endDateStr = eventDateObj.toISOString().split('T')[0];
        }
      }
      
      const [hours, minutes] = endTime.split(':').map(Number);
      const endDateTime = new Date(endDateStr + 'T00:00:00');
      endDateTime.setHours(hours, minutes, 0);
      
      return endDateTime < nowTz;
    };

    const nowTZ = getNowInTimezone(systemTimezone);
    const todayTZ = getTodayInTimezone(systemTimezone);
    const dateIdsToDeactivate: string[] = [];

    console.log(`[AUTO-DEACTIVATE-DATES] Data hoje (${systemTimezone}): ${todayTZ}`);
    console.log(`[AUTO-DEACTIVATE-DATES] Hora atual (${systemTimezone}): ${nowTZ.toLocaleString('pt-BR')}`);

    for (const date of datesToDeactivate) {
      // Ignorar datas sem horário definido
      if (!date.start_time) {
        console.log(`[AUTO-DEACTIVATE-DATES] Data sem horário, pulando: ${date.name || date.event_date}`);
        continue;
      }

      // Se tem end_time, usar regra inteligente para verificar se terminou
      if (date.end_time) {
        const ended = hasEventEnded(date.event_date, date.end_time, date.start_time, nowTZ);
        if (ended) {
          console.log(`[AUTO-DEACTIVATE-DATES] Evento terminou (end_time): ${date.name || date.event_date} ${date.start_time}-${date.end_time}`);
          dateIdsToDeactivate.push(date.id);
        }
        continue;
      }

      // Se não tem end_time, desativar quando start_time passar
      const [hours, minutes, seconds = '00'] = date.start_time.split(':');
      const eventDateTime = new Date(date.event_date + 'T00:00:00');
      eventDateTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || '0'));
      
      console.log(`[AUTO-DEACTIVATE-DATES] Comparando evento: ${date.event_date} ${date.start_time} vs agora (${systemTimezone}): ${nowTZ.toLocaleString('pt-BR')}`);

      // Se o evento já começou e não tem end_time, marcar para desativar
      if (eventDateTime < nowTZ) {
        console.log(`[AUTO-DEACTIVATE-DATES] Data passada (sem end_time): ${date.name || date.event_date} às ${date.start_time}`);
        dateIdsToDeactivate.push(date.id);
      }
    }

    if (dateIdsToDeactivate.length === 0) {
      console.log('[AUTO-DEACTIVATE-DATES] Nenhuma data passou do horário ainda');
      return new Response(
        JSON.stringify({ 
          success: true, 
          deactivated: 0,
          message: 'Nenhuma data precisa ser desativada ainda' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Desativar datas em lote
    const { error: updateError } = await supabase
      .from('guest_list_dates')
      .update({ is_active: false })
      .in('id', dateIdsToDeactivate);

    if (updateError) {
      console.error('[AUTO-DEACTIVATE-DATES] Erro ao desativar datas:', updateError);
      throw updateError;
    }

    console.log(`[AUTO-DEACTIVATE-DATES] ✅ ${dateIdsToDeactivate.length} datas desativadas com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deactivated: dateIdsToDeactivate.length,
        timezone: systemTimezone,
        message: `${dateIdsToDeactivate.length} data(s) desativada(s) automaticamente`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[AUTO-DEACTIVATE-DATES] ❌ Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
