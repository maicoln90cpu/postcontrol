import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * ✅ FASE 1: Hook para geração lazy de signed URLs
 * Gera URLs apenas quando necessário (visíveis na tela)
 */
export const useSignedUrls = () => {
  const [urlCache, setUrlCache] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const getSignedUrl = useCallback(async (screenshotUrl: string | null): Promise<string | null> => {
    if (!screenshotUrl) return null;

    // Retornar do cache se já existe
    if (urlCache[screenshotUrl]) {
      return urlCache[screenshotUrl];
    }

    // Evitar múltiplas requisições simultâneas
    if (loading[screenshotUrl]) {
      return null;
    }

    try {
      setLoading(prev => ({ ...prev, [screenshotUrl]: true }));

      const path = screenshotUrl.split('/screenshots/')[1];
      if (!path) return screenshotUrl;

      const { data, error } = await supabase.storage
        .from('screenshots')
        .createSignedUrl(path, 31536000); // 1 year

      if (error) {
        console.error('Erro ao gerar signed URL:', error);
        return screenshotUrl;
      }

      const signedUrl = data?.signedUrl || screenshotUrl;
      
      // Cachear resultado
      setUrlCache(prev => ({ ...prev, [screenshotUrl]: signedUrl }));
      
      return signedUrl;
    } catch (error) {
      console.error('Erro ao gerar signed URL:', error);
      return screenshotUrl;
    } finally {
      setLoading(prev => ({ ...prev, [screenshotUrl]: false }));
    }
  }, [urlCache, loading]);

  const preloadUrls = useCallback(async (urls: (string | null)[]) => {
    const validUrls = urls.filter((url): url is string => !!url && !urlCache[url]);
    
    if (validUrls.length === 0) return;

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
