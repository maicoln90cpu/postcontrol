import { useState, useCallback, useEffect } from 'react';
import { SignedUrlCache } from '@/lib/signedUrlCache';
import { getBatchSignedUrls, extractPathFromUrl } from '@/services/signedUrlService';
import { logger } from '@/lib/logger';

/**
 * ✅ FASE 1: Hook otimizado com batch de signed URLs
 * - Batch: 50 requests → 1 request
 * - Cache persistente em localStorage
 * - Cache em memória para acesso instantâneo
 */
export const useSignedUrls = () => {
  const [urlCache, setUrlCache] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [pendingUrls, setPendingUrls] = useState<Set<string>>(new Set());

  // Limpar cache expirado ao montar componente
  useEffect(() => {
    SignedUrlCache.clearExpired();
    const stats = SignedUrlCache.getStats();
    logger.info('[SignedURL] Cache stats:', stats);
  }, []);

  /**
   * Busca uma única signed URL (com cache)
   */
  const getSignedUrl = useCallback(async (screenshotUrl: string | null): Promise<string | null> => {
    if (!screenshotUrl) return null;

    // Cache em memória (mais rápido)
    if (urlCache[screenshotUrl]) {
      return urlCache[screenshotUrl];
    }

    // Cache persistente (localStorage)
    const cachedUrl = SignedUrlCache.get(screenshotUrl);
    if (cachedUrl) {
      logger.info('[SignedURL] Cache hit:', screenshotUrl.slice(0, 40));
      setUrlCache(prev => ({ ...prev, [screenshotUrl]: cachedUrl }));
      return cachedUrl;
    }

    // Adiciona à fila de pendentes para batch
    setPendingUrls(prev => new Set(prev).add(screenshotUrl));
    return null;
  }, [urlCache]);

  /**
   * ✅ BATCH: Pré-carrega múltiplas URLs em uma única chamada
   * Substitui N requests por 1 request
   */
  const preloadUrls = useCallback(async (urls: (string | null)[]) => {
    const validUrls = urls.filter((url): url is string => {
      if (!url) return false;
      // Já em cache de memória
      if (urlCache[url]) return false;
      // Já em cache persistente
      if (SignedUrlCache.get(url)) {
        // Mover para cache de memória
        setUrlCache(prev => ({ ...prev, [url]: SignedUrlCache.get(url)! }));
        return false;
      }
      return true;
    });

    if (validUrls.length === 0) return;

    setLoading(true);
    logger.info(`[SignedURL] Batch preload: ${validUrls.length} URLs`);

    try {
      // Extrair paths das URLs
      const paths = validUrls
        .map(url => extractPathFromUrl(url))
        .filter((path): path is string => !!path);

      if (paths.length === 0) {
        setLoading(false);
        return;
      }

      // ✅ UMA ÚNICA CHAMADA para todas as URLs
      const signedUrlMap = await getBatchSignedUrls(paths);

      // Mapear de volta para URLs originais
      const newCache: Record<string, string> = {};
      validUrls.forEach(originalUrl => {
        const path = extractPathFromUrl(originalUrl);
        if (path && signedUrlMap[path]) {
          newCache[originalUrl] = signedUrlMap[path];
          SignedUrlCache.set(originalUrl, signedUrlMap[path]);
        }
      });

      setUrlCache(prev => ({ ...prev, ...newCache }));
      logger.info(`[SignedURL] Cached ${Object.keys(newCache).length} URLs`);
    } catch (error) {
      logger.error('[SignedURL] Batch preload error:', error);
    } finally {
      setLoading(false);
    }
  }, [urlCache]);

  /**
   * Retorna URL do cache (sync) ou null se não disponível
   */
  const getCachedUrl = useCallback((screenshotUrl: string | null): string | null => {
    if (!screenshotUrl) return null;
    return urlCache[screenshotUrl] || SignedUrlCache.get(screenshotUrl) || null;
  }, [urlCache]);

  return { 
    getSignedUrl, 
    preloadUrls, 
    getCachedUrl,
    urlCache, 
    loading 
  };
};
