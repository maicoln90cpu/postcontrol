import { useEffect, useState } from 'react';
import { sb } from '@/lib/supabaseSafe';

/**
 * Hook para carregar e injetar Google Tag Manager dinamicamente
 * Busca o GTM ID das configurações de admin e injeta o script no head
 * OTIMIZAÇÃO: Carrega GTM apenas após o primeiro paint para não bloquear LCP
 */
export const useGTM = () => {
  const [gtmLoaded, setGtmLoaded] = useState(false);

  useEffect(() => {
    const loadGTM = async () => {
      try {
        let gtmId: string | null = null;

        // 1. Tentar variável de ambiente primeiro (público, funciona para todos)
        gtmId = import.meta.env.VITE_GTM_ID?.trim() || null;
        
        if (!gtmId) {
          // 2. Fallback: tentar buscar do banco (apenas para admins autenticados)
          try {
            const { data: settings } = await sb
              .from('admin_settings')
              .select('setting_value')
              .eq('setting_key', 'gtm_id')
              .maybeSingle();
            
            gtmId = settings?.setting_value?.trim() || null;
          } catch (error) {
            // Silently fail - GTM is not critical
          }
        }

        if (!gtmId || gtmId === '') {
          return;
        }

        // Verificar se já foi injetado
        if (document.querySelector(`script[data-gtm-id="${gtmId}"]`)) {
          setGtmLoaded(true);
          return;
        }

        // Injetar script do GTM no head
        const script = document.createElement('script');
        script.setAttribute('data-gtm-id', gtmId);
        script.innerHTML = `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `;
        document.head.appendChild(script);

        // Injetar noscript no body
        const noscript = document.createElement('noscript');
        noscript.innerHTML = `
          <iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
          height="0" width="0" style="display:none;visibility:hidden"></iframe>
        `;
        document.body.insertBefore(noscript, document.body.firstChild);

        setGtmLoaded(true);
      } catch (error) {
        // Silently fail - GTM is not critical for app functionality
      }
    };

    // OTIMIZAÇÃO: Adiar carregamento do GTM para não bloquear First Paint
    const deferGTMLoad = () => {
      // Usar requestIdleCallback se disponível, senão setTimeout
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => loadGTM(), { timeout: 3000 });
      } else {
        setTimeout(loadGTM, 2000);
      }
    };

    // Aguardar página carregar antes de iniciar GTM
    if (document.readyState === 'complete') {
      deferGTMLoad();
    } else {
      window.addEventListener('load', deferGTMLoad, { once: true });
    }

    return () => {
      window.removeEventListener('load', deferGTMLoad);
    };
  }, []);

  return { gtmLoaded };
};
