import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { submissionId, instagramUrl } = await req.json();

    if (!submissionId || !instagramUrl) {
      return new Response(
        JSON.stringify({ error: 'submissionId and instagramUrl are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Verifying Instagram post: ${instagramUrl}`);

    // Validar formato da URL do Instagram
    const instagramRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/;
    const match = instagramUrl.match(instagramRegex);

    if (!match) {
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: 'URL do Instagram inválida. Use o formato: https://instagram.com/p/CODIGO ou https://instagram.com/reel/CODIGO' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const postCode = match[1];
    console.log(`Post code extracted: ${postCode}`);

    // Tentar verificar usando oEmbed API do Instagram (pública, não requer autenticação)
    const oembedUrl = `https://graph.facebook.com/v12.0/instagram_oembed?url=${encodeURIComponent(instagramUrl)}&access_token=PLACEHOLDER`;
    
    // Método alternativo: verificar se a URL retorna 200
    let verified = false;
    let errorMessage = '';

    try {
      // Simples verificação de existência
      const response = await fetch(instagramUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        redirect: 'follow'
      });

      verified = response.ok;
      
      if (!verified) {
        errorMessage = `Post não encontrado ou privado (Status: ${response.status})`;
      }

      console.log(`Verification result: ${verified}, Status: ${response.status}`);

    } catch (error: any) {
      console.error('Error verifying Instagram post:', error);
      errorMessage = 'Erro ao verificar post. Verifique se a URL está correta e o post é público.';
      verified = false;
    }

    // Atualizar submission com resultado da verificação
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        instagram_verified: verified,
        instagram_verified_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error updating submission:', updateError);
    }

    return new Response(
      JSON.stringify({
        verified,
        postCode,
        error: errorMessage || undefined,
        message: verified 
          ? 'Post do Instagram verificado com sucesso!' 
          : errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Fatal error:', error);
    return new Response(
      JSON.stringify({
        verified: false,
        error: error.message || 'Erro ao verificar post do Instagram'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
