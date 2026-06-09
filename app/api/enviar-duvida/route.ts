import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    return NextResponse.json({ error: "Falta a chave do Resend no .env.local" }, { status: 500 });
  }

  const resend = new Resend(resendApiKey);

  try {
    const formData = await req.formData();
    const nome = formData.get('First_Name');
    const apelido = formData.get('Last_Name');
    const email = formData.get('Email');
    const telefone = formData.get('Phone');
    const idade = formData.get('Age');
    const mensagem = formData.get('Message');
    const subject = formData.get('_subject');

    await resend.emails.send({
      from: 'HelloCamp Notificações <info@hellocamp.pt>', // Certifique-se que este domínio está validado no Resend
      to: 'info@hellocamp.pt', // Para onde quer receber as dúvidas
      replyTo: email as string, // Para poder responder diretamente ao encarregado de educação
      subject: (subject as string) || 'Nova Dúvida sobre Campo - HelloCamp',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #0f172a;">Nova Mensagem de Pai/Encarregado</h2>
          <p><strong>Nome:</strong> ${nome} ${apelido}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${telefone}</p>
          <p><strong>Idade do Participante:</strong> ${idade}</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #334155; white-space: pre-wrap;">${mensagem}</p>
          </div>
        </div>
      `,
    });

    // Redireciona o utilizador de volta para a página de onde veio, com um alerta de sucesso
    const referer = req.headers.get('referer');
    if (referer) {
      const url = new URL(referer);
      url.searchParams.set('sucesso_duvida', 'true');
      url.hash = 'duvidas'; // Faz scroll direto para a zona das dúvidas
      return NextResponse.redirect(url, 303);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao enviar a mensagem: " + error.message }, { status: 500 });
  }
}