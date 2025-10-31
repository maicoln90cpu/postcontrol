import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Resend API wrapper
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendEmail(options: {
  from: string;
  to: string[];
  subject: string;
  html: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return response.json();
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendGuestInviteRequest {
  guestId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { guestId }: SendGuestInviteRequest = await req.json();

    console.log("Sending guest invite for:", guestId);

    // Buscar dados do convite
    const { data: guest, error: guestError } = await supabase
      .from("agency_guests")
      .select(`
        *,
        agencies(name, logo_url),
        guest_event_permissions(
          event_id,
          permission_level,
          events(title)
        )
      `)
      .eq("id", guestId)
      .single();

    if (guestError) {
      console.error("Error fetching guest:", guestError);
      throw new Error("Guest not found");
    }

    if (!guest) {
      throw new Error("Guest not found");
    }

    // Gerar URL do convite
    const inviteUrl = `${Deno.env.get("SITE_URL") || "https://yourapp.lovable.app"}/accept-invite?token=${guest.invite_token}`;

    // Preparar lista de eventos
    const eventsList = guest.guest_event_permissions
      .map((perm: any) => `• ${perm.events.title} (${perm.permission_level})`)
      .join("\n");

    // Enviar email
    const emailResponse = await sendEmail({
      from: "Sua Agência <onboarding@resend.dev>", // TODO: Customizar com domínio verificado
      to: [guest.guest_email],
      subject: `Convite: Acesso aos Eventos - ${guest.agencies.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
            .logo { max-width: 150px; height: auto; }
            .content { padding: 30px 0; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white !important; 
              text-decoration: none; 
              border-radius: 5px; 
              font-weight: bold;
              margin: 20px 0;
            }
            .events-list { 
              background: #f9f9f9; 
              padding: 15px; 
              border-radius: 5px; 
              margin: 15px 0;
              white-space: pre-line;
            }
            .footer { 
              text-align: center; 
              padding-top: 20px; 
              border-top: 2px solid #f0f0f0; 
              color: #666; 
              font-size: 12px; 
            }
            .info-box { 
              background: #e3f2fd; 
              padding: 15px; 
              border-left: 4px solid #2196f3; 
              margin: 15px 0; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${guest.agencies.logo_url ? `<img src="${guest.agencies.logo_url}" alt="${guest.agencies.name}" class="logo">` : ''}
              <h1>Você foi convidado!</h1>
            </div>
            
            <div class="content">
              <p>Olá,</p>
              
              <p>Você foi convidado por <strong>${guest.agencies.name}</strong> para ter acesso a eventos específicos em nossa plataforma.</p>
              
              <div class="info-box">
                <strong>📅 Acesso válido até:</strong> ${new Date(guest.access_end_date).toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </div>
              
              <h3>Eventos com Acesso:</h3>
              <div class="events-list">${eventsList}</div>
              
              <p>Clique no botão abaixo para aceitar o convite e começar a gerenciar seus eventos:</p>
              
              <center>
                <a href="${inviteUrl}" class="button">Aceitar Convite</a>
              </center>
              
              <p style="color: #666; font-size: 14px;">
                Ou copie e cole este link no seu navegador:<br>
                <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px; display: inline-block; margin-top: 5px;">${inviteUrl}</code>
              </p>
              
              <p><strong>Importante:</strong> Você precisa fazer login com o email <strong>${guest.guest_email}</strong> para aceitar este convite.</p>
            </div>
            
            <div class="footer">
              <p>Este convite foi enviado por ${guest.agencies.name}</p>
              <p>Se você não solicitou este convite, pode ignorar este email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Atualizar última tentativa de envio
    await supabase
      .from("agency_guests")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", guestId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.id,
        inviteUrl 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-guest-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
