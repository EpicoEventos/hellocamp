import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Inicializa o Resend com a chave do seu ficheiro .env
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Captura exatamente os dados enviados pelo componente Superadmin
    const { parceiroEmail, nomeCampo, status, lang = 'pt' } = body;

    // Validação de segurança obrigatória
    if (!status || !parceiroEmail || !nomeCampo) {
      return NextResponse.json(
        { error: 'Dados insuficientes fornecidos (parceiroEmail, nomeCampo ou status em falta).' }, 
        { status: 400 }
      );
    }

    // CONFIGURAÇÃO DO REMETENTE:
    // Altere para o e-mail exato que validou no painel do Resend (ex: info@hellocamp.pt).
    // Se estiver em modo Sandbox/Testes iniciais do Resend, use obrigatoriamente: 'onboarding@resend.dev'
    const remetenteOficial = 'HelloCamp Parceiros <info@hellocamp.pt>';

    // ==========================================
    // FLUXO 1: CONTRATO REJEITADO
    // ==========================================
    if (status === 'Rejeitado') {
      await resend.emails.send({
        from: remetenteOficial,
        to: parceiroEmail,
        subject: `[HelloCamp] Revisão do Contrato: ${nomeCampo}`,
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
            <h2 style="color: #b91c1c;">Olá!</h2>
            <p>Revimos o contrato submetido para o seu programa <strong>${nomeCampo}</strong>, mas encontrámos algumas inconformidades nos dados preenchidos.</p>
            <p>Por favor, aceda ao seu Dashboard de Parceiro para verificar as informações da entidade (Nome, NIF, Anexos ou Assinatura Digital) e submeta novamente o documento corrigido para validação.</p>
            <br/>
            <p>Se tiver qualquer dúvida, responda diretamente a este e-mail.</p>
            <br/>
            <p>Melhores cumprimentos,<br/><strong>A Equipa HelloCamp</strong></p>
          </div>
        `
      });

      return NextResponse.json({ success: true, message: 'E-mail de rejeição enviado com sucesso via Resend.' });
    }

    // ==========================================
    // FLUXO 2: CONTRATO APROVADO
    // ==========================================
    if (status === 'Aprovado') {
      await resend.emails.send({
        from: remetenteOficial,
        to: parceiroEmail,
        subject: `[HelloCamp] Contrato Aprovado - O seu campo está online! 🎉`,
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
            <div style="background-color: #0f172a; padding: 25px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 22px; font-family: Arial, sans-serif;">Parabéns, o contrato foi validado!</h1>
            </div>
            <div style="padding: 25px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background-color: #ffffff;">
              <p>O acordo de intermediação para o programa <strong>${nomeCampo}</strong> foi revisto, assinado e validado com sucesso pela nossa equipa legal.</p>
              <p>O seu programa **já se encontra ativo e visível publicamente na plataforma**, ficando totalmente elegível para receber inscrições e pagamentos dos encarregados de educação.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.hellocamp.pt/${lang}/admin/login" style="display: inline-block; background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  Aceder ao Portal do Organizador
                </a>
              </div>
              
              <p>Poderá descarregar a cópia integral do seu contrato assinado a qualquer momento, diretamente na secção "Os Meus Campos" dentro do seu portal.</p>
              <br/>
              <p>Desejamos-lhe um excelente período de atividades e excelentes vendas!</p>
              <p>Boas reservas,<br/><strong>A Equipa HelloCamp</strong></p>
            </div>
          </div>
        `
      });

      return NextResponse.json({ success: true, message: 'E-mail de aprovação enviado com sucesso via Resend.' });
    }

    return NextResponse.json({ error: 'Status de processamento inválido.' }, { status: 400 });

  } catch (error: any) {
    console.error('🛑 [ERRO RESEND] Falha crítica no envio do e-mail:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}