import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!stripeSecretKey || !resendApiKey || !supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Configurações de servidor em falta." }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const resend = new Resend(resendApiKey);
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { reservaId } = await req.json();

    // 1. Busca direta da reserva para evitar ambiguidades de Joins no Supabase
    const { data: reserva, error: fetchError } = await supabase
      .from('reservas')
      .select('*')
      .eq('id', reservaId)
      .single();

    if (fetchError || !reserva) {
      throw new Error("Reserva não encontrada na Base de Dados.");
    }

    if (reserva.status_pagamento === 'Reembolsado') {
      throw new Error("Esta reserva já se encontra reembolsada.");
    }

    // 2. Busca plana dos dados complementares nas tabelas paralelas
    const { data: campoData } = await supabase.from('campos').select('nome, local').eq('id', reserva.campo_id).single();
    const { data: criancaData } = await supabase.from('criancas').select('nome').eq('id', reserva.crianca_id).single();
    const { data: clienteData } = await supabase.from('perfis').select('nome_completo, email').eq('id', reserva.cliente_id).single();
    const { data: orgData } = await supabase.from('perfis').select('email, empresa_nome, stripe_account_id').eq('id', reserva.organizador_id).single();

    // 3. Localizar a transação correspondente na Stripe
    const sessions = await stripe.checkout.sessions.list({ limit: 100 });
    const matchSession = sessions.data.find(s => {
      if (s.metadata && s.metadata.reservasIds) {
        try {
          const ids = JSON.parse(s.metadata.reservasIds);
          return ids.includes(reservaId);
        } catch(e) { return false; }
      }
      return false;
    });

    if (!matchSession || !matchSession.payment_intent) {
      throw new Error("Transação Stripe não encontrada para emitir reembolso automático. Terá de reembolsar manualmente.");
    }

    // 4. EXECUTAR REEMBOLSO REAL NA STRIPE (Reembolso Connect Protegido)
    const quantiaReembolsoCentimos = Math.round(Number(reserva.valor_total) * 100);
    
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: matchSession.payment_intent as string,
      amount: quantiaReembolsoCentimos,
      reason: 'requested_by_customer'
    };

    // Puxa o dinheiro da conta do organizador de volta se houver Stripe Connect configurado
    if (orgData?.stripe_account_id) {
      refundParams.reverse_transfer = true;
      refundParams.refund_application_fee = true;
    }

    await stripe.refunds.create(refundParams);

    // 5. ATUALIZAR A BASE DE DADOS PARA REFLETIR O SUCESSO DO REEMBOLSO
    await supabase.from('reservas').update({
      status_pagamento: 'Reembolsado',
      status_reembolso: 'Reembolsado',
      status: 'Reembolsado',
      dados_reembolso: { data_estorno: new Date().toISOString(), processado_por: 'SuperAdmin HQ' }
    }).eq('id', reservaId);

    // 6. IDENTIFICAÇÃO DINÂMICA INTELIGENTE (Contorna campos vazios no perfil de teste)
    const campoNome = campoData?.nome || 'Programa HelloCamp';
    const nomeCrianca = criancaData?.nome || 'Participante';
    const turnoNome = reserva.turno_nome || 'Programa Base';
    const valorReembolsado = Number(reserva.valor_total).toFixed(2);
    
    const emailPai = clienteData?.email || reserva.email_encarregado || matchSession.customer_email || matchSession.customer_details?.email;
    const emailCampo = orgData?.email || 'info@hellocamp.pt';
    const nomeOrganizador = orgData?.empresa_nome || 'Organizador';

    // Hierarquia de nomes para o Pai (Garante que se o perfil falhar, tenta o preenchimento da reserva ou o email)
    const nomePai = clienteData?.nome_completo || reserva.nome_encarregado || matchSession.customer_details?.name || emailPai?.split('@')[0] || 'Encarregado de Educação';

    // A. EMAIL PREMIUM PARA O PAI
    if (emailPai) {
      await resend.emails.send({
        from: 'HelloCamp Finanças <info@hellocamp.pt>',
        to: emailPai,
        subject: `Confirmação de Reembolso - ${campoNome}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #0f172a;">
            <h1 style="font-size: 24px; font-weight: 900; text-align: center; margin-bottom: 30px; color: #0f172a;">HelloCamp</h1>
            <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 12px; padding: 25px; text-align: center;">
              <h2 style="font-size: 18px; font-weight: 700; margin-top: 0; color: #991b1b;">Reembolso Processado com Sucesso</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #991b1b; margin-bottom: 0;">Olá <strong>${nomePai}</strong>, confirmamos que o cancelamento da sua reserva e a devolução dos capitais foram concluídos pelo nosso departamento financeiro.</p>
            </div>
            
            <div style="margin: 30px 0;">
              <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Resumo do Cancelamento</h3>
              <table width="100%" style="font-size: 14px; color: #334155; margin-top: 12px; line-height: 2;">
                <tr><td><strong>Programa:</strong></td><td style="text-align: right;">${campoNome}</td></tr>
                <tr><td><strong>Turno / Semana:</strong></td><td style="text-align: right;">${turnoNome}</td></tr>
                <tr><td><strong>Participante:</strong></td><td style="text-align: right;">${nomeCrianca}</td></tr>
                <tr><td style="padding-top: 10px; border-top: 1px dashed #e2e8f0;"><strong>Valor Devolvido:</strong></td><td style="text-align: right; font-weight: bold; color: #dc2626; font-size: 16px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">${valorReembolsado}€</td></tr>
              </table>
            </div>
            <p style="font-size: 12px; color: #64748b; line-height: 1.5;">O montante foi creditado na mesma via de pagamento original. Dependendo do seu banco ou operadora MB WAY, o saldo estará visível no extrato num prazo estimado de 5 a 10 dias úteis.</p>
          </div>
        `
      });
    }

    // B. EMAIL DE ATUALIZAÇÃO PARA O ORGANIZADOR DO CAMPO
    await resend.emails.send({
      from: 'HelloCamp Parceiros <info@hellocamp.pt>',
      to: emailCampo,
      subject: `Atualização de Ocupação: Cancelamento - ${campoNome}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #b91c1c; border-bottom: 2px solid #b91c1c; padding-bottom: 10px; font-size: 20px;">Vaga Libertada - Cancelamento</h2>
          <p>Caro parceiro da entidade <strong>${nomeOrganizador}</strong>,</p>
          <p>Informamos que uma vaga para o seu programa foi cancelada e o respetivo valor foi integralmente estornado ao cliente através da nossa central de atendimento.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0; line-height: 1.8;">
            <p style="margin: 0;"><strong>Programa de Férias:</strong> ${campoNome}</p>
            <p style="margin: 0;"><strong>Turno Afetado:</strong> ${turnoNome}</p>
            <p style="margin: 0;"><strong>Participante removido:</strong> ${nomeCrianca}</p>
            <p style="margin: 0;"><strong>Encarregado de Educação:</strong> ${nomePai}</p>
            <p style="margin: 0; color: #dc2626;"><strong>Valor Reversível:</strong> ${valorReembolsado}€</p>
          </div>
          <p style="font-size: 13px; color: #64748b;">A vaga foi automaticamente recolocada disponível para venda no site. Os ajustes de comissionamento associados a esta vaga serão liquidados no seu relatório mensal.</p>
        </div>
      `
    });

    // C. EMAIL DETALHADO MACRO PARA A HELLOCAMP (CONTROLO INTERNO EXAUSTIVO)
    await resend.emails.send({
      from: 'HelloCamp Control <info@hellocamp.pt>',
      to: 'info@hellocamp.pt',
      subject: `[Reemboslo Efetuado] ${valorReembolsado}€ - ${campoNome}`,
      html: `
        <div style="font-family: monospace; font-size: 13px; color: #1e293b; padding: 30px; background-color: #fdfdfd; border: 1px solid #cbd5e1; border-radius: 8px; max-width: 650px; margin: 0 auto;">
          <h2 style="color: #0f172a; margin-top: 0; border-bottom: 2px solid #0f172a; padding-bottom: 10px; font-family: sans-serif;">🚨 RELATÓRIO DE MOVIMENTAÇÃO DE CAPITAL</h2>
          <p style="font-size: 14px; font-weight: bold; color: #dc2626;">Reembolso efetuado com sucesso via Stripe API Connect.</p>
          
          <table width="100%" style="margin-top: 20px; font-family: monospace; line-height: 2;">
            <tr style="background-color: #f1f5f9;"><td width="40%"><strong>ID da Reserva:</strong></td><td>${reservaId}</td></tr>
            <tr><td><strong>Programa:</strong></td><td>${campoNome}</td></tr>
            <tr style="background-color: #f1f5f9;"><td><strong>Turno / Semana:</strong></td><td>${turnoNome}</td></tr>
            <tr><td><strong>Nome do Pai:</strong></td><td>${nomePai}</td></tr>
            <tr style="background-color: #f1f5f9;"><td><strong>Email do Pai:</strong></td><td>${emailPai}</td></tr>
            <tr><td><strong>Participante (Criança):</strong></td><td>${nomeCrianca}</td></tr>
            <tr style="background-color: #f1f5f9;"><td><strong>Entidade Parceira:</strong></td><td>${nomeOrganizador}</td></tr>
            <tr><td><strong>Valor Devolvido:</strong></td><td style="color: #b91c1c; font-weight: bold;">${valorReembolsado}€</td></tr>
            <tr style="background-color: #fef2f2;"><td><strong>Reverse Transfer Connect:</strong></td><td style="color: #991b1b; font-weight: bold;">${orgData?.stripe_account_id ? 'ATIVADO (Débito efetuado ao Parceiro)' : 'NÃO REQUERIDO'}</td></tr>
          </table>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
          <p style="font-size: 11px; color: #64748b; margin: 0;">Processado por: SuperAdmin HQ via API Router Secure Connection.<br/>Data da Transação: ${new Date().toLocaleString('pt-PT')}</p>
        </div>
      `
    });

    return NextResponse.json({ success: true, message: 'Reembolso efetuado e comunicados enviados.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}