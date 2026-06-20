import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { form, emailAcesso, lang } = await req.json();
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      throw new Error("A chave API da Brevo não está configurada.");
    }

    const isEn = lang === 'en';

    // ==========================================
    // 1. E-MAIL PARA A EQUIPA HELLOCAMP (Admin)
    // ==========================================
    const adminHtml = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #0f172a;">Novo Contrato Assinado!</h2>
        <p>Um novo parceiro acabou de assinar o contrato B2B e criou conta na plataforma.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Empresa:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${form.nomeEmpresa}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>NIF:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${form.nif}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Programa:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${form.nomePrograma}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Pessoa Contacto:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${form.pessoaContacto} (${form.telefone})</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email de Login:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${emailAcesso}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Pagamento:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${form.tipo_pagamento}</td></tr>
          <tr><td style="padding: 8px;"><strong>Cancelamento:</strong></td><td style="padding: 8px;">${form.politica_cancelamento}</td></tr>
        </table>
        
        <p style="margin-top: 30px; font-size: 14px;"><strong>Ação necessária:</strong> Aceda ao SuperAdmin para rever os dados e aprovar o campo para publicação.</p>
      </div>
    `;

    // ==========================================
    // 2. E-MAIL PARA O PARCEIRO (Comprovativo)
    // ==========================================
    const parceiroSubject = isEn ? 'Welcome to HelloCamp! ⛺️ Contract Received' : 'Bem-vindo à HelloCamp! ⛺️ Contrato Recebido';
    
    const parceiroHtml = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 900; letter-spacing: -1px; margin-bottom: 20px; text-align: center;">
          <span style="color: #0f172a;">Hello</span><span style="color: #EBA914;">Camp</span>
        </div>
        
        <p>${isEn ? 'Hello' : 'Olá'} <strong>${form.pessoaContacto}</strong>,</p>
        <p>${isEn ? 'We successfully received your partnership contract for the program' : 'Recebemos com sucesso o seu contrato de parceria referente ao programa'} <strong>${form.nomePrograma}</strong>.</p>
        <p>${isEn ? 'Your organizer account has been created. You can now access your dashboard using this email address.' : 'A sua conta de organizador foi criada com sucesso. Pode agora aceder ao seu portal de gestão utilizando este endereço de e-mail.'}</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>${isEn ? 'Contract Summary:' : 'Resumo do Acordo:'}</strong></p>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
            <li><strong>${isEn ? 'Company:' : 'Empresa:'}</strong> ${form.nomeEmpresa} (NIF: ${form.nif})</li>
            <li><strong>${isEn ? 'Booking Model:' : 'Modelo de Reserva:'}</strong> ${form.modalidadeReserva}</li>
            <li><strong>${isEn ? 'Payment Rule:' : 'Regra de Pagamento:'}</strong> ${form.tipo_pagamento}</li>
            <li><strong>${isEn ? 'Cancellation Policy:' : 'Política de Cancelamento:'}</strong> ${form.politica_cancelamento}</li>
          </ul>
        </div>
        
        <p>${isEn ? 'Our team will review your submission shortly. If you have any questions, reply directly to this email.' : 'A nossa equipa irá rever a sua submissão em breve. Se tiver alguma dúvida, basta responder diretamente a este e-mail.'}</p>
        
        <p style="margin-top: 30px;">${isEn ? 'Best regards,' : 'Com os melhores cumprimentos,'}<br><strong>Equipa HelloCamp</strong></p>
      </div>
    `;

    // Disparar os dois e-mails ao mesmo tempo para não atrasar a resposta
    await Promise.all([
      // Email para a HelloCamp
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': apiKey, 'content-type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Sistema HelloCamp', email: 'info@hellocamp.pt' },
          to: [{ email: 'info@hellocamp.pt', name: 'Equipa HelloCamp' }],
          subject: `Novo Parceiro: ${form.nomeEmpresa}`,
          htmlContent: adminHtml,
        })
      }),
      // Email para o Parceiro
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': apiKey, 'content-type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Equipa HelloCamp', email: 'info@hellocamp.pt' },
          to: [{ email: emailAcesso, name: form.pessoaContacto }],
          subject: parceiroSubject,
          htmlContent: parceiroHtml,
        })
      })
    ]);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro ao enviar emails de novo contrato:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}