/**
 * Cache persistente para signed URLs com TTL (Time To Live)
 * Reduz chamadas desnecessárias ao Supabase Storage
 */

interface CacheEntry {
  url: string;
  expiresAt: number; // timestamp Unix
}

const CACHE_KEY = 'postcontrol_signed_urls_cache';
const DEFAULT_TTL = 23 * 60 * 60 * 1000; // 23 horas (signed URL dura 24h)

export class SignedUrlCache {
  /**
   * Salvar URL no cache com TTL
   */
  static set(originalUrl: string, signedUrl: string, ttl: number = DEFAULT_TTL): void {
    try {
      const expiresAt = Date.now() + ttl;
      const entry: CacheEntry = { url: signedUrl, expiresAt };
      
      const cache = this.getAll();
      cache[originalUrl] = entry;
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('⚠️ [Cache] Erro ao salvar no localStorage:', error);
      // Falhar silenciosamente - não bloquear a aplicação
    }
  }

  /**
   * Recuperar URL do cache (retorna null se expirado)
   */
  static get(originalUrl: string): string | null {
    try {
      const cache = this.getAll();
      const entry = cache[originalUrl];
      
      if (!entry) return null;
      
      // Verificar se expirou
      if (Date.now() > entry.expiresAt) {
        this.delete(originalUrl);
        return null;
      }
      
      return entry.url;
    } catch (error) {
      console.warn('⚠️ [Cache] Erro ao ler localStorage:', error);
      return null;
    }
  }

  /**
   * Deletar entrada específica
   */
  static delete(originalUrl: string): void {
    try {
      const cache = this.getAll();
      delete cache[originalUrl];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('⚠️ [Cache] Erro ao deletar do localStorage:', error);
    }
  }

  /**
   * Limpar todo o cache
   */
  static clear(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.warn('⚠️ [Cache] Erro ao limpar localStorage:', error);
    }
  }

  /**
   * Limpar entradas expiradas (garbage collection)
   */
  static clearExpired(): void {
    try {
      const cache = this.getAll();
      const now = Date.now();
      let hasChanges = false;
      
      Object.keys(cache).forEach((key) => {
        if (cache[key].expiresAt < now) {
          delete cache[key];
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      }
    } catch (error) {
      console.warn('⚠️ [Cache] Erro ao limpar expirados:', error);
    }
  }

  /**
   * Obter todo o cache
   */
  private static getAll(): Record<string, CacheEntry> {
    try {
      const data = localStorage.getItem(CACHE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn('⚠️ [Cache] Erro ao parsear cache:', error);
      return {};
    }
  }

  /**
   * Obter estatísticas do cache (útil para debug)
   */
  static getStats(): { total: number; expired: number; valid: number } {
    const cache = this.getAll();
    const now = Date.now();
    let expired = 0;
    
    Object.values(cache).forEach((entry) => {
      if (entry.expiresAt < now) expired++;
    });
    
    return {
      total: Object.keys(cache).length,
      expired,
      valid: Object.keys(cache).length - expired,
    };
  }
}

// ✅ Executar garbage collection ao iniciar
SignedUrlCache.clearExpired();
