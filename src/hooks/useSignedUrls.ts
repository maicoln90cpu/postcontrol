import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SignedUrlCache } from '@/lib/signedUrlCache';

/**
 * ✅ FASE 2: Hook com cache persistente em localStorage
 */
export const useSignedUrls = () => {
  const [urlCache, setUrlCache] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // ✅ NOVO: Limpar cache expirado ao montar componente
  useEffect(() => {
    SignedUrlCache.clearExpired();
    
    // Debug: Mostrar estatísticas do cache
    const stats = SignedUrlCache.getStats();
    console.log('📦 [Cache] Estatísticas:', stats);
  }, []);

  const getSignedUrl = useCallback(async (screenshotUrl: string | null): Promise<string | null> => {
    if (!screenshotUrl) return null;

    // ✅ OTIMIZAÇÃO: Verificar cache em memória primeiro (mais rápido)
    if (urlCache[screenshotUrl]) {
      return urlCache[screenshotUrl];
    }

    // ✅ OTIMIZAÇÃO: Verificar localStorage (cache persistente)
    const cachedUrl = SignedUrlCache.get(screenshotUrl);
    if (cachedUrl) {
      console.log('✅ [Cache] Hit do localStorage:', screenshotUrl.slice(0, 50));
      setUrlCache(prev => ({ ...prev, [screenshotUrl]: cachedUrl }));
      return cachedUrl;
    }

    // Evitar múltiplas requisições simultâneas
    if (loading[screenshotUrl]) {
      return null;
    }

    try {
      setLoading(prev => ({ ...prev, [screenshotUrl]: true }));

      const path = screenshotUrl.split('/screenshots/')[1];
      if (!path) return screenshotUrl;

      console.log('🌐 [Cache] Miss - Gerando signed URL:', path.slice(0, 50));

      const { data, error } = await supabase.storage
        .from('screenshots')
        .createSignedUrl(path, 86400); // 24 horas

      if (error) {
        console.error('❌ [Cache] Erro ao gerar signed URL:', error);
        return screenshotUrl;
      }

      const signedUrl = data?.signedUrl || screenshotUrl;
      
      // ✅ Salvar nos dois caches (memória + localStorage)
      setUrlCache(prev => ({ ...prev, [screenshotUrl]: signedUrl }));
      SignedUrlCache.set(screenshotUrl, signedUrl);
      
      return signedUrl;
    } catch (error) {
      console.error('❌ [Cache] Exception:', error);
      return screenshotUrl;
    } finally {
      setLoading(prev => ({ ...prev, [screenshotUrl]: false }));
    }
  }, [urlCache, loading]);

  const preloadUrls = useCallback(async (urls: (string | null)[]) => {
    const validUrls = urls.filter((url): url is string => !!url && !urlCache[url]);
    
    if (validUrls.length === 0) return;

    console.log(`📦 [Cache] Preload de ${validUrls.length} URLs`);

    const results = await Promise.all(
      validUrls.map(url => getSignedUrl(url))
    );

    const newCache: Record<string, string> = {};
    validUrls.forEach((url, index) => {
      if (results[index]) {
        newCache[url] = results[index]!;
      }
    });

    setUrlCache(prev => ({ ...prev, ...newCache }));
  }, [urlCache, getSignedUrl]);

  return { getSignedUrl, preloadUrls, urlCache };
};
