/**
 * Conditional Logger Utility
 * Fase 1: Performance - Remove console.logs in production
 * ✅ FASE 1 AUDIT: Adicionado debug() para logs verbosos apenas em dev
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Debug level - only in development, for verbose/heavy logs
   * Use for expensive operations like mapping arrays
   */
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment && import.meta.env.VITE_DEBUG === 'true') {
      console.log(`🔍 ${message}`, ...args);
    }
  },

  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  },

  error: (message: string, ...args: any[]) => {
    // Errors always logged
    console.error(`❌ ${message}`, ...args);
  },

  time: (label: string) => {
    if (isDevelopment) {
      console.time(`⏱️ ${label}`);
    }
  },

  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(`⏱️ ${label}`);
    }
  },

  group: (label: string) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  table: (data: any) => {
    if (isDevelopment) {
      console.table(data);
    }
  },
};
