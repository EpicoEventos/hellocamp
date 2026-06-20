import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Recebemos o role (cliente ou organizador) e as variáveis de nome
    const { email, nomeEmpresa, nome, role, lang = 'pt' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email em falta.' }, { status: 400 });
    }

    const isEn = lang === 'en';
    const remetenteOficial = 'HelloCamp <info@hellocamp.pt>';
    
    let subject = "";
    let htmlContent = "";

    // ==============================================
    // 📩 EMAIL PARA ENCARREGADOS DE EDUCAÇÃO (PAIS)
    // ==============================================
    if (role === 'cliente') {
      const nomeUser = nome || 'Encarregado(a) de Educação';
      subject = isEn ? `Welcome to HelloCamp, ${nomeUser}! 🏕️` : `Bem-vindo(a) à HelloCamp, ${nomeUser}! 🏕️`;
      
      htmlContent = `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <div style="background-color: #0f172a; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-family: Arial, sans-serif;">HelloCamp</h1>
          </div>
          <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background-color: #ffffff;">
            <h2 style="color: #059669; margin-top: 0;">${isEn ? 'Account Created Successfully!' : 'Conta Criada com Sucesso!'}</h2>
            <p>${isEn ? 'Hello' : 'Olá'} <strong>${nomeUser}</strong>,</p>
            <p>${isEn 
              ? 'Welcome to HelloCamp! Your parent account is now ready.' 
              : 'Bem-vindo(a) à HelloCamp! A sua conta de encarregado de educação está pronta a ser utilizada.'}</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e2e8f0;">
              <h3 style="margin-top: 0; font-size: 16px;">${isEn ? 'What you can do now:' : 'O que pode fazer agora:'}</h3>
              <ul style="margin: 0; padding-left: 20px; color: #475569;">
                <li style="margin-bottom: 10px;"><strong>${isEn ? 'Explore Camps:' : 'Explorar Campos:'}</strong> ${isEn ? 'Find the perfect summer camp for your children.' : 'Encontre o programa de férias ideal para os seus educandos.'}</li>
                <li style="margin-bottom: 10px;"><strong>${isEn ? 'Add Participants:' : 'Adicionar Participantes:'}</strong> ${isEn ? 'Fill in your children\'s profiles to book faster.' : 'Preencha as fichas das crianças para realizar reservas mais rapidamente.'}</li>
                <li><strong>${isEn ? 'Manage Bookings:' : 'Gerir Reservas:'}</strong> ${isEn ? 'Track your active bookings and payments.' : 'Acompanhe as suas reservas ativas e pagamentos de forma segura.'}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://www.hellocamp.pt/${lang}/login" style="display: inline-block; background-color: #0f172a; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                ${isEn ? 'Access My Account' : 'Aceder à Minha Conta'}
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="font-size: 13px; color: #64748b; margin: 0;">${isEn ? 'Need help? Reply to this email.' : 'Precisa de ajuda? Basta responder a este e-mail.'}</p>
          </div>
        </div>
      `;
    } 
    // ==============================================
    // 📩 EMAIL PARA PARCEIROS B2B (ORGANIZADORES)
    // ==============================================
    else {
      const nomeUser = nomeEmpresa || 'Parceiro';
      subject = isEn ? `Welcome to HelloCamp, ${nomeUser}! 🏕️` : `Bem-vindo à HelloCamp, ${nomeUser}! 🏕️`;
      
      htmlContent = `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <div style="background-color: #0f172a; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-family: Arial, sans-serif;">HelloCamp Partner</h1>
          </div>
          <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background-color: #ffffff;">
            <h2 style="color: #059669; margin-top: 0;">${isEn ? 'Account Created Successfully!' : 'Conta Criada com Sucesso!'}</h2>
            <p>${isEn ? 'Hello' : 'Olá'} <strong>${nomeUser}</strong>,</p>
            <p>${isEn 
              ? 'Welcome to the HelloCamp partner network. Your organizer account is now ready.' 
              : 'Bem-vindo à rede de parceiros da HelloCamp. A sua conta de organizador está pronta a ser utilizada.'}</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e2e8f0;">
              <h3 style="margin-top: 0; font-size: 16px;">${isEn ? 'Next Steps:' : 'Próximos Passos:'}</h3>
              <ol style="margin: 0; padding-left: 20px; color: #475569;">
                <li style="margin-bottom: 10px;"><strong>${isEn ? 'Create your first Camp:' : 'Crie o seu primeiro Campo:'}</strong> ${isEn ? 'Add photos, dates, and prices.' : 'Adicione fotos, datas e preços.'}</li>
                <li style="margin-bottom: 10px;"><strong>${isEn ? 'Connect Stripe:' : 'Ligar a conta Stripe:'}</strong> ${isEn ? 'Go to the billing tab to receive automatic payouts.' : 'Vá ao separador de faturação para receber pagamentos automáticos.'}</li>
                <li><strong>${isEn ? 'Submit for Review:' : 'Submeter para Revisão:'}</strong> ${isEn ? 'Once ready, we will review and publish your camp.' : 'Assim que estiver pronto, iremos rever e publicar o seu campo.'}</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://www.hellocamp.pt/${lang}/admin/login" style="display: inline-block; background-color: #0f172a; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                ${isEn ? 'Access Dashboard' : 'Aceder ao Dashboard'}
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="font-size: 13px; color: #64748b; margin: 0;">${isEn ? 'Need help? Reply to this email.' : 'Precisa de ajuda? Basta responder a este e-mail.'}</p>
          </div>
        </div>
      `;
    }

    await resend.emails.send({
      from: remetenteOficial,
      to: email,
      subject: subject,
      html: htmlContent
    });

    return NextResponse.json({ success: true, message: 'Email de boas-vindas enviado.' });
  } catch (error: any) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}