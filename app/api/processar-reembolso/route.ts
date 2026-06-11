import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const calcularIdade = (dataNasc: string) => {
  if (!dataNasc) return 'N/A';
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return `${idade} anos`;
};

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

    // CORREÇÃO LOGÍSTICA: Busca direta e linear para evitar falhas de ambiguidade nas Foreign Keys do Supabase
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

    // Procura os dados complementares em consultas planas e seguras
    const { data: campoData } = await supabase.from('campos').select('nome, local').eq('id', reserva.campo_id).single();
    const { data: criancaData } = await supabase.from('criancas').select('nome').eq('id', reserva.crianca_id).single();
    const { data: clienteData } = await supabase.from('perfis').select('nome_completo, email').eq('id', reserva.cliente_id).single();

    // 2. Procurar o organizador para saber se houve Split Payment (Stripe Connect)
    const { data: orgData } = await supabase
      .from('perfis')
      .select('email, empresa_nome, stripe_account_id')
      .eq('id', reserva.organizador_id)
      .single();

    // 3. Procurar na Stripe a transação correspondente
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

    // 4. EXECUTAR REEMBOLSO NA STRIPE WITH CONNECT PROTECTION
    const quantiaReembolsoCentimos = Math.round(Number(reserva.valor_total) * 100);
    
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: matchSession.payment_intent as string,
      amount: quantiaReembolsoCentimos,
      reason: 'requested_by_customer'
    };

    if (orgData?.stripe_account_id) {
      refundParams.reverse_transfer = true;
      refundParams.refund_application_fee = true;
    }

    await stripe.refunds.create(refundParams);

    // 5. ATUALIZAR A BASE DE DADOS PARA REFLETIR O REEMBOLSO
    await supabase.from('reservas').update({
      status_pagamento: 'Reembolsado',
      status_reembolso: 'Reembolsado',
      status: 'Reembolsado',
      dados_reembolso: { data_estorno: new Date().toISOString(), processado_por: 'SuperAdmin HQ' }
    }).eq('id', reservaId);

    // 6. DISPARAR OS EMAILS DE NOTIFICAÇÃO COMPLETA
    const campoNome = campoData?.nome || 'Programa HelloCamp';
    const nomePai = clienteData?.nome_completo || 'Encarregado de Educação';
    const emailPai = clienteData?.email || matchSession.customer_email || matchSession.customer_details?.email;
    const nomeCrianca = criancaData?.nome || 'Participante';
    const valorReembolsado = Number(reserva.valor_total).toFixed(2);
    
    const emailCampo = orgData?.email || 'info@hellocamp.pt';

    // A. Email para o Pai
    if (emailPai) {
      await resend.emails.send({
        from: 'HelloCamp Finanças <info@hellocamp.pt>',
        to: emailPai,
        subject: `Aviso de Reembolso - ${campoNome}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #0f172a;">
            <h1 style="font-size: 24px; font-weight: 900; text-align: center; margin-bottom: 30px; color: #0f172a;">HelloCamp</h1>
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; text-align: center;">
              <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #b91c1c;">Reembolso Processado</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #991b1b; margin-bottom: 0;">Estimado(a) ${nomePai}, informamos que procedemos ao cancelamento e reembolso da sua inscrição.</p>
            </div>
            <div style="margin: 30px 0;">
              <table width="100%" style="font-size: 15px; color: #334155; margin-top: 10px;">
                <tr><td style="padding: 5px 0;">Participante:</td><td style="text-align: right; font-weight: bold;">${nomeCrianca}</td></tr>
                <tr><td style="padding: 5px 0;">Programa afetado:</td><td style="text-align: right; font-weight: bold;">${campoNome}</td></tr>
                <tr><td style="padding: 5px 0; border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 10px;">Valor Estornado:</td><td style="text-align: right; font-weight: bold; color: #059669; font-size: 18px; border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 10px;">${valorReembolsado}€</td></tr>
              </table>
            </div>
            <p style="font-size: 13px; color: #64748b;">O valor será devolvido através da mesma via utilizada para pagamento. O processamento bancário pode demorar entre 5 a 10 dias úteis.</p>
          </div>
        `
      });
    }

    // B. Email para o Organizador
    await resend.emails.send({
      from: 'HelloCamp Parceiros <info@hellocamp.pt>',
      to: emailCampo,
      subject: `Cancelamento de Inscrição - ${campoNome}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #b91c1c; border-bottom: 2px solid #b91c1c; padding-bottom: 10px;">Cancelamento de Participante</h2>
          <p>A seguinte reserva foi cancelada e o valor estornado ao cliente pela administração da HelloCamp:</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p><strong>Programa:</strong> ${campoNome} (${reserva.turno_nome})</p>
            <p><strong>Criança:</strong> ${nomeCrianca}</p>
            <p><strong>Encarregado:</strong> ${nomePai}</p>
            <p style="color: #b91c1c;"><strong>Valor Devolvido:</strong> ${valorReembolsado}€</p>
          </div>
        </div>
      `
    });

    // C. Email para a Direção HelloCamp
    await resend.emails.send({
      from: 'HelloCamp Control <info@hellocamp.pt>',
      to: 'info@hellocamp.pt',
      subject: `[REEMBOLSO BANCÁRIO] - ${valorReembolsado}€ devolvidos`,
      html: `<div style="font-family: monospace; padding: 20px;"><h2>Alerta de Tesouraria</h2><p>Reembolso automático concluído via Stripe API.</p><p><strong>Valor Reembolsado:</strong> ${valorReembolsado}€</p><p><strong>Ref Reserva:</strong> ${reservaId}</p><p><strong>Cliente:</strong> ${nomePai}</p></div>`
    });

    return NextResponse.json({ success: true, message: 'Reembolso efetuado e comunicados enviados.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}