import { format as dateFnsFormat } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Offset BRT em minutos (UTC-3)
const BRT_OFFSET_MINUTES = -3 * 60;

/**
 * Retorna a data de hoje no formato YYYY-MM-DD em BRT (UTC-3)
 * Usado para filtragens de data que precisam considerar o fuso brasileiro
 */
export function getTodayBRT(): string {
  const now = new Date();
  const utcOffset = now.getTimezoneOffset(); // offset local em minutos
  const brtTime = new Date(now.getTime() + (utcOffset + BRT_OFFSET_MINUTES) * 60000);
  return brtTime.toISOString().split('T')[0];
}

/**
 * Retorna o timestamp atual em BRT
 */
export function getNowBRT(): Date {
  const now = new Date();
  const utcOffset = now.getTimezoneOffset();
  return new Date(now.getTime() + (utcOffset + BRT_OFFSET_MINUTES) * 60000);
}

/**
 * Parse date and time in BRT (UTC-3) timezone
 * @param date - Date string in format YYYY-MM-DD
 * @param time - Time string in format HH:mm or HH:mm:ss
 * @returns Date object in BRT timezone
 */
export function parseDateTimeBRT(date: string, time: string): Date {
  // Ensure time has seconds
  const timeWithSeconds = time.includes(':') && time.split(':').length === 2 
    ? `${time}:00` 
    : time;
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
 * Format date in BRT with pt-BR locale
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
  if (!startTime) {
    // If no time, compare dates only
    const eventDay = parseEventDateBRT(eventDate);
    const today = parseEventDateBRT(new Date().toISOString().split('T')[0]);
    return eventDay < today;
  }
  
  const eventDateTime = parseDateTimeBRT(eventDate, startTime);
  return eventDateTime < new Date();
}
