import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileSize, fileType, fileName } = await req.json();

    console.log('🔍 Validando imagem:', { fileName, fileSize, fileType });

    // Validação de tamanho (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (fileSize > MAX_SIZE) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Arquivo muito grande. Máximo permitido: 10MB',
          details: `Tamanho: ${(fileSize / 1024 / 1024).toFixed(2)}MB`
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validação de tipo
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!ALLOWED_TYPES.includes(fileType)) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Tipo de arquivo não permitido',
          details: 'Use apenas: JPG, PNG ou WEBP'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validação de nome
    const DANGEROUS_CHARS = /[<>:"\/\\|?*\x00-\x1f]/g;
    if (DANGEROUS_CHARS.test(fileName)) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Nome de arquivo inválido',
          details: 'O nome contém caracteres não permitidos'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Imagem validada com sucesso');

    return new Response(
      JSON.stringify({
        valid: true,
        message: 'Imagem validada com sucesso'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('❌ Erro na validação:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({
        valid: false,
        error: 'Erro ao validar imagem',
        details: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
