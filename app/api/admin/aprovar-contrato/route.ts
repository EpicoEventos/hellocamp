import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Nomes exatos que vamos enviar do Superadmin
    const { parceiroEmail, nomeCampo, status, lang = 'pt' } = body;

    // Validação básica
    if (!status || !parceiroEmail) {
      return NextResponse.json({ error: 'Dados insuficientes fornecidos (status ou parceiroEmail em falta).' }, { status: 400 });
    }

    // ==========================================
    // FLUXO 1: CONTRATO REJEITADO
    // ==========================================
    if (status === 'Rejeitado') {
      await resend.emails.send({
        // IMPORTANTE: Garanta que este email está verificado na sua conta Resend!
        from: 'HelloCamp Parceiros <info@hellocamp.pt>', 
        to: parceiroEmail,
        subject: `[HelloCamp] Revisão do Contrato: ${nomeCampo}`,
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
            <h2>Olá!</h2>
            <p>Revimos o contrato submetido para o programa <strong>${nomeCampo}</strong>, mas encontrámos algumas inconformidades.</p>
            <p>Por favor, aceda ao seu Dashboard de Parceiro para verificar os dados (nome da empresa, NIF ou assinatura) e submeta novamente o documento corrigido.</p>
            <br/>
            <p>A Equipa HelloCamp</p>
          </div>
        `
      });

      return NextResponse.json({ success: true, message: 'Email de rejeição enviado.' });
    }

    // ==========================================
    // FLUXO 2: CONTRATO APROVADO
    // ==========================================
    if (status === 'Aprovado') {
      await resend.emails.send({
        from: 'HelloCamp Parceiros <info@hellocamp.pt>',
        to: parceiroEmail,
        subject: `[HelloCamp] Contrato Aprovado - O seu campo está online! 🎉`,
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
            <div style="background-color: #0f172a; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">Bem-vindo à HelloCamp!</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <p>O contrato para o programa <strong>${nomeCampo}</strong> foi revisto e validado com sucesso pela nossa equipa legal.</p>
              <p>O seu campo já se encontra ativo na plataforma e pronto a receber inscrições de encarregados de educação.</p>
              <br/>
              <a href="https://hellocamp.pt/${lang}/admin/dashboard" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Aceder ao Dashboard
              </a>
              <br/><br/>
              <p>Boas reservas,<br/>A Equipa HelloCamp</p>
            </div>
          </div>
        `
      });

      return NextResponse.json({ success: true, message: 'Email de aprovação enviado.' });
    }

    return NextResponse.json({ error: 'Status de aprovação inválido.' }, { status: 400 });

  } catch (error: any) {
    console.error('Erro na API de emails:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}