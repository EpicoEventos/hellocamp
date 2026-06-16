import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { publico, assunto, tituloDaMensagem, mensagem, textoBotao, linkBotao, emailsManuais } = body;

    if (!publico || !assunto || !mensagem) {
      return NextResponse.json({ error: 'Faltam campos obrigatórios.' }, { status: 400 });
    }

    let destinatarios: { email: string, nome: string }[] = [];

    // 1. ROTEAR DESTINATÁRIOS
    if (publico === 'csv') {
      if (!emailsManuais || emailsManuais.length === 0) {
        return NextResponse.json({ error: 'O ficheiro anexado não tem e-mails válidos.' }, { status: 400 });
      }
      destinatarios = emailsManuais.map((email: string) => ({ email, nome: 'Amigo' }));
    } else {
      let query = supabaseAdmin.from('perfis').select('email, nome_completo');
      if (publico === 'organizadores') query = query.eq('role', 'organizador');
      else if (publico === 'clientes') query = query.eq('role', 'cliente');
      
      const { data: utilizadores, error } = await query;
      if (error) throw error;
      if (!utilizadores || utilizadores.length === 0) {
        return NextResponse.json({ error: 'Nenhum utilizador encontrado.' }, { status: 404 });
      }

      destinatarios = utilizadores.filter(u => u.email).map(u => ({
        email: u.email,
        nome: u.nome_completo?.split(' ')[0] || 'Utilizador'
      }));
    }

    // 1.5 FILTRAR UNSUBSCRIBES
    const { data: listaNegraData } = await supabaseAdmin.from('unsubscribes').select('email');
    if (listaNegraData && listaNegraData.length > 0) {
      const listaNegraEmails = listaNegraData.map(u => u.email.toLowerCase());
      destinatarios = destinatarios.filter(d => !listaNegraEmails.includes(d.email.toLowerCase()));
    }
    
    if (destinatarios.length === 0) {
      return NextResponse.json({ error: 'Nenhum destinatário válido após aplicação da lista de remoções (Unsubscribe).' }, { status: 400 });
    }

    const mensagemFormatada = mensagem.replace(/\n/g, '<br/>');

    // 2. REGISTAR CAMPANHA NA BASE DE DADOS
    const { data: novaCampanha, error: dbError } = await supabaseAdmin
      .from('email_broadcasts')
      .insert([{
        assunto,
        titulo: tituloDaMensagem,
        mensagem,
        texto_botao: textoBotao,
        link_botao: linkBotao,
        publico,
        total_enviados: destinatarios.length
      }])
      .select('id')
      .single();

    if (dbError || !novaCampanha) throw new Error("Falha ao registar campanha na Base de Dados.");

    const broadcastId = novaCampanha.id;
    const BATCH_SIZE = 50; 
    let totalEnviados = 0;

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) throw new Error("A chave API da Brevo não está configurada no servidor.");

    // 3. ENVIAR EM BATCH VIA BREVO REST API
    for (let i = 0; i < destinatarios.length; i += BATCH_SIZE) {
      const lote = destinatarios.slice(i, i + BATCH_SIZE);
      
      const promessasEnvio = lote.map(async (dest) => {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <tr>
                      <td align="center" style="padding: 40px;">
                        <div style="font-size: 28px; font-weight: 900; letter-spacing: -1px; margin-bottom: 30px;">
                          <span style="color: #0f172a;">Hello</span><span style="color: #EBA914;">Camp</span>
                        </div>
                        <h2 style="font-size: 22px; font-weight: bold; color: #0f172a; margin: 0 0 24px 0; line-height: 1.3;">
                          ${tituloDaMensagem || assunto}
                        </h2>
                        <p style="font-size: 16px; color: #475569; line-height: 1.6; text-align: left; margin: 0 0 30px 0;">
                          ${mensagemFormatada}
                        </p>
                        ${textoBotao && linkBotao ? `
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td align="center">
                                <table border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td align="center" bgcolor="#0f172a" style="border-radius: 6px;">
                                      <a href="${linkBotao}" target="_blank" style="display: inline-block; padding: 16px 32px; font-family: Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 6px;">
                                        ${textoBotao}
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        ` : ''}
                      </td>
                    </tr>
                  </table>
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                    <tr>
                      <td align="center" style="padding-top: 20px;">
                        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0 0 15px 0;">Este e-mail foi enviado pela HelloCamp.</p>
                        <table border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" bgcolor="#f1f5f9" style="border-radius: 4px; border: 1px solid #e2e8f0;">
                              <a href="https://www.hellocamp.pt/unsubscribe?email=${encodeURIComponent(dest.email)}" target="_blank" style="display: inline-block; padding: 8px 16px; font-family: Arial, sans-serif; font-size: 11px; color: #64748b; text-decoration: none; font-weight: bold; border-radius: 4px;">
                                Unsubscribe
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': apiKey,
            'content-type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'Equipa HelloCamp', email: 'info@hellocamp.pt' },
            to: [{ email: dest.email, name: dest.nome }],
            subject: assunto,
            htmlContent: htmlContent,
            tags: [broadcastId]
          })
        });

        // AQUI ESTÁ A CORREÇÃO: Capturamos o erro real da Brevo
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Brevo rejeitou o envio: ${errorData.message || JSON.stringify(errorData)}`);
        }

        return response.json();
      });

      await Promise.all(promessasEnvio);
      totalEnviados += lote.length;
    }

    return NextResponse.json({ success: true, totalEnviados });

  } catch (error: any) {
    console.error("Erro no broadcast (Brevo):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}