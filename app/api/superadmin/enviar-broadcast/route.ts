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

    // 1. ROTEAR DESTINATÁRIOS: CSV vs Base de Dados
    if (publico === 'csv') {
      if (!emailsManuais || emailsManuais.length === 0) {
        return NextResponse.json({ error: 'O ficheiro anexado não tem e-mails válidos.' }, { status: 400 });
      }
      destinatarios = emailsManuais.map((email: string) => ({
        email,
        nome: 'Amigo' // Nome genérico para CSVs sem colunas de nomes complexas
      }));

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

    // 2. CONSTRUIR O BATCH PARA O RESEND
    const BATCH_SIZE = 100;
    let totalEnviados = 0;

    for (let i = 0; i < destinatarios.length; i += BATCH_SIZE) {
      const lote = destinatarios.slice(i, i + BATCH_SIZE);
      
      const mensagensResend = lote.map(dest => {
        
        // TEMPLATE MESTRE HELLOCAMP - Estilo Newsletter
        const htmlContent = `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #0f172a; background-color: #f8fafc;">
            <div style="background-color: white; padding: 40px; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              
              <div style="font-size: 28px; font-weight: 900; letter-spacing: -1px; margin-bottom: 30px;">
                <span style="color: #0f172a;">Hello</span><span style="color: #EBA914;">Camp</span>
              </div>
              
              <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 24px; line-height: 1.3;">
                ${tituloDaMensagem || assunto}
              </h2>
              
              <div style="font-size: 16px; color: #475569; line-height: 1.7; text-align: left; margin-bottom: 35px; white-space: pre-wrap;">
                Olá ${dest.nome},<br/><br/>${mensagem}
              </div>
              
              ${textoBotao && linkBotao ? `
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center">
                      <a href="${linkBotao}" target="_blank" style="display: inline-block; background-color: #0f172a; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        ${textoBotao}
                      </a>
                    </td>
                  </tr>
                </table>
              ` : ''}
              
            </div>
            
            <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 24px; line-height: 1.5;">
              Este e-mail foi enviado pela HelloCamp.<br/>
              Se não deseja receber mais comunicações, contacte-nos através de info@hellocamp.pt.
            </p>
          </div>
        `;

        return {
          from: 'Equipa HelloCamp <info@hellocamp.pt>', // Deve corresponder ao email verificado no Resend
          to: dest.email,
          subject: assunto,
          html: htmlContent
        };
      });

      await resend.batch.send(mensagensResend);
      totalEnviados += lote.length;
    }

    return NextResponse.json({ success: true, totalEnviados });

  } catch (error: any) {
    console.error("Erro no broadcast:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}