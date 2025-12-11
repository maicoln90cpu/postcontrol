import { format as dateFnsFormat } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

// Cache do timezone para evitar múltiplas queries
let cachedTimezone: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Default timezone (BRT)
const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

/**
 * Busca o timezone configurado no sistema (async)
 * Usa cache para evitar múltiplas queries
 */
export async function getSystemTimezone(): Promise<string> {
  const now = Date.now();
  
  // Retorna cache se ainda válido
  if (cachedTimezone && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedTimezone;
  }
  
  try {
    const { data } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'system_timezone')
      .is('agency_id', null)
      .maybeSingle();
    
    cachedTimezone = data?.setting_value || DEFAULT_TIMEZONE;
    cacheTimestamp = now;
    return cachedTimezone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/**
 * Retorna o timezone do cache ou default (síncrono)
 */
export function getTimezone(): string {
  return cachedTimezone || DEFAULT_TIMEZONE;
}

/**
 * Invalida o cache de timezone (chamar após salvar configuração)
 */
export function invalidateTimezoneCache(): void {
  cachedTimezone = null;
  cacheTimestamp = 0;
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD no timezone configurado
 * Usado para filtragens de data que precisam considerar o fuso brasileiro
 */
export function getTodayBRT(): string {
  const timezone = getTimezone();
  // toLocaleDateString com locale 'en-CA' retorna formato YYYY-MM-DD
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

/**
 * Retorna o timestamp atual no timezone configurado
 */
export function getNowBRT(): Date {
  const timezone = getTimezone();
  const dateString = new Date().toLocaleString('en-US', { timeZone: timezone });
  return new Date(dateString);
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD em um timezone específico
 */
export function getTodayInTimezone(tz?: string): string {
  const timezone = tz || getTimezone();
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

/**
 * Retorna o timestamp atual em um timezone específico
 */
export function getNowInTimezone(tz?: string): Date {
  const timezone = tz || getTimezone();
  const dateString = new Date().toLocaleString('en-US', { timeZone: timezone });
  return new Date(dateString);
}

/**
 * Parse date and time in system timezone
 * @param date - Date string in format YYYY-MM-DD
 * @param time - Time string in format HH:mm or HH:mm:ss
 * @returns Date object in system timezone
 */
export function parseDateTimeBRT(date: string, time: string): Date {
  // Ensure time has seconds
  const timeWithSeconds = time.includes(':') && time.split(':').length === 2 
    ? `${time}:00` 
    : time;
  // Para BRT, offset é -03:00
  return new Date(`${date}T${timeWithSeconds}-03:00`);
}

/**
 * Parse date-only string in local timezone (avoids UTC midnight conversion)
 * @param date - Date string in format YYYY-MM-DD
 * @returns Date object at local midnight
 */
export function parseEventDateBRT(date: string): Date {
  return new Date(date + 'T00:00:00');
}

/**
 * Format date with pt-BR locale
 * @param date - Date object or string
 * @param formatStr - Format string (date-fns format)
 * @returns Formatted date string
 */
export function formatDateBRT(date: Date | string, formatStr: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateFnsFormat(dateObj, formatStr, { locale: ptBR });
}

/**
 * Format time from HH:mm:ss to HH:mm
 * @param time - Time string
 * @returns Formatted time string
 */
export function formatTimeBRT(time: string): string {
  return time.slice(0, 5); // HH:mm
}

/**
 * Check if event date/time has passed
 * @param eventDate - Date string in format YYYY-MM-DD
 * @param startTime - Time string in format HH:mm or HH:mm:ss (optional)
 * @returns true if event has passed
 */
export function hasEventPassed(eventDate: string, startTime?: string): boolean {
  const todayBRT = getTodayBRT();
  
  if (!startTime) {
    // If no time, compare dates only
    return eventDate < todayBRT;
  }
  
  const eventDateTime = parseDateTimeBRT(eventDate, startTime);
  const nowBRT = getNowBRT();
  return eventDateTime < nowBRT;
}

/**
 * Check if event has ended using smart rule:
 * - If end_time < start_time → end_time is on the NEXT day (e.g., 23h-07h → 07h is next day)
 * - If end_time >= start_time → end_time is on the SAME day (e.g., 09h-22h → 22h is same day)
 * @param eventDate - Date string in format YYYY-MM-DD
 * @param endTime - Time string in format HH:mm or HH:mm:ss
 * @param startTime - Optional start time to determine if end_time is next day
 * @returns true if event has ended
 */
export function hasEventEnded(eventDate: string, endTime: string, startTime?: string): boolean {
  const nowBRT = getNowBRT();
  
  // Determine if end_time is on next day (smart rule)
  let endDateStr = eventDate;
  
  if (startTime) {
    const endHours = parseInt(endTime.split(':')[0], 10);
    const startHours = parseInt(startTime.split(':')[0], 10);
    
    // If end_time < start_time → next day (e.g., 23h-07h means 07h is next day)
    if (endHours < startHours) {
      const eventDateObj = new Date(eventDate + 'T00:00:00');
      eventDateObj.setDate(eventDateObj.getDate() + 1);
      endDateStr = eventDateObj.toISOString().split('T')[0];
    }
  }
  
  // Create datetime for end time
  const endDateTime = parseDateTimeBRT(endDateStr, endTime);
  
  return endDateTime < nowBRT;
}
