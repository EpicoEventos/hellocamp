import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

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
        return NextResponse.json({ error: 'Nenhum utilizador encontrado para este público.' }, { status: 404 });
      }

      destinatarios = utilizadores.filter(u => u.email).map(u => ({
        email: u.email,
        nome: u.nome_completo?.split(' ')[0] || 'Utilizador'
      }));
    }

    // O Outlook ignora CSS de parágrafos. Temos de converter quebras de linha reais em <br/> de forma forçada.
    const mensagemFormatada = mensagem.replace(/\n/g, '<br/>');

    const BATCH_SIZE = 100;
    let totalEnviados = 0;

    for (let i = 0; i < destinatarios.length; i += BATCH_SIZE) {
      const lote = destinatarios.slice(i, i + BATCH_SIZE);
      
      const mensagensResend = lote.map(dest => {
        
        // TEMPLATE MESTRE OTIMIZADO PARA OUTLOOK (Totalmente em Tables)
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <tr>
                      <td align="center" style="padding: 40px;">
                        
                        <!-- LOGO -->
                        <div style="font-size: 28px; font-weight: 900; letter-spacing: -1px; margin-bottom: 30px;">
                          <span style="color: #0f172a;">Hello</span><span style="color: #EBA914;">Camp</span>
                        </div>
                        
                        <!-- TÍTULO -->
                        <h2 style="font-size: 22px; font-weight: bold; color: #0f172a; margin: 0 0 24px 0; line-height: 1.3;">
                          ${tituloDaMensagem || assunto}
                        </h2>
                        
                        <!-- MENSAGEM -->
                        <p style="font-size: 16px; color: #475569; line-height: 1.6; text-align: left; margin: 0 0 30px 0;">
                          Olá ${dest.nome},<br/><br/>
                          ${mensagemFormatada}
                        </p>
                        
                        <!-- BOTÃO (Com Tabela Fantasma para Outlook) -->
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
                        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
                          Este e-mail foi enviado pela HelloCamp.<br/>
                          Se não deseja receber mais comunicações, contacte-nos através de info@hellocamp.pt.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;

        return {
          from: 'Equipa HelloCamp <info@hellocamp.pt>', // Mude para o seu email aprovado
          to: dest.email,
          subject: assunto,
          html: htmlContent
        };
      });

      await resend.batch.send(mensagensResend);
      totalEnviados += lote.length;
    }

    // REGISTAR O ENVIO NO HISTÓRICO DA BASE DE DADOS
    await supabaseAdmin.from('email_broadcasts').insert([{
      assunto,
      titulo: tituloDaMensagem,
      mensagem,
      texto_botao: textoBotao,
      link_botao: linkBotao,
      publico,
      total_enviados: totalEnviados
    }]);

    return NextResponse.json({ success: true, totalEnviados });

  } catch (error: any) {
    console.error("Erro no broadcast:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}