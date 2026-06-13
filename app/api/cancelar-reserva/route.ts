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

  // CORREÇÃO DO ERRO TYPESCRIPT AQUI: 
  // Usamos 'as any' para contornar a limitação de tipos da biblioteca
  const stripe = new Stripe(stripeSecretKey, { 
    apiVersion: '2023-10-16' as any 
  });
  
  const resend = new Resend(resendApiKey);
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { reservaId } = await req.json();

    // 1. Busca da Reserva
    const { data: reserva, error: fetchError } = await supabase
      .from('reservas')
      .select('*')
      .eq('id', reservaId)
      .single();

    if (fetchError || !reserva) throw new Error("Reserva não encontrada na Base de Dados.");
    if (reserva.status_pagamento === 'Reembolsado' || reserva.status_reembolso === 'Reembolsado') {
      throw new Error("Esta reserva já se encontra cancelada e tratada.");
    }

    // 2. Busca de Dados Complementares
    const { data: campoData } = await supabase.from('campos').select('nome, local, politica_cancelamento').eq('id', reserva.campo_id).single();
    const { data: criancaData } = await supabase.from('criancas').select('nome').eq('id', reserva.crianca_id).single();
    const { data: clienteData } = await supabase.from('perfis').select('nome_completo, email').eq('id', reserva.cliente_id).single();
    const { data: orgData } = await supabase.from('perfis').select('email, empresa_nome, stripe_account_id').eq('id', reserva.organizador_id).single();

    // 3. MATEMÁTICA: Calcular Dias até ao Início do Campo
    let dataInicioTurno: Date | null = null;
    try {
      const turnoObj = typeof reserva.turno === 'string' ? JSON.parse(reserva.turno) : reserva.turno;
      if (turnoObj && turnoObj.data_inicio) dataInicioTurno = new Date(turnoObj.data_inicio);
    } catch (e) { console.error(e); }

    if (!dataInicioTurno) throw new Error("A data de início do turno não foi encontrada na reserva.");

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const inicio = new Date(dataInicioTurno);
    inicio.setHours(0, 0, 0, 0);
    const diffDias = Math.ceil((inicio.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    // 4. LÓGICA DE CANCELAMENTO (Flexível, Moderada, Estrita)
    const politica = campoData?.politica_cancelamento || '';
    const valorPagoGeral = Number(reserva.valor_pago) || Number(reserva.valor_total) || 0; 
    let valorAReembolsar = 0;
    let descricaoPolitica = 'Estrita (Sem Reembolso)';

    if (politica.includes('Flexível')) {
      if (diffDias >= 7) { valorAReembolsar = valorPagoGeral; descricaoPolitica = 'Flexível (100% devolvido)'; }
    } else if (politica.includes('Moderada')) {
      if (diffDias >= 15) { valorAReembolsar = valorPagoGeral * 0.5; descricaoPolitica = 'Moderada (50% devolvido)'; }
    } else if (politica.includes('Estrita')) {
      valorAReembolsar = 0; descricaoPolitica = 'Estrita (0% devolvido)';
    }

    // 5. EXECUTAR REEMBOLSO NA STRIPE (Apenas se houver valor a devolver)
    let paymentIntentId = reserva.stripe_payment_intent_id; 

    if (valorAReembolsar > 0) {
      if (!paymentIntentId && reserva.stripe_session_id) {
        const session = await stripe.checkout.sessions.retrieve(reserva.stripe_session_id);
        paymentIntentId = session.payment_intent as string;
      }
      if (!paymentIntentId) {
        const sessions = await stripe.checkout.sessions.list({ limit: 100 });
        const matchSession = sessions.data.find(s => {
          if (s.metadata && s.metadata.reservasIds) {
            try { return JSON.parse(s.metadata.reservasIds).includes(reservaId); } catch(e) { return false; }
          }
          return false;
        });
        paymentIntentId = matchSession?.payment_intent as string;
      }

      if (!paymentIntentId) {
        throw new Error("Transação Stripe não encontrada. O reembolso financeiro terá de ser manual.");
      }

      const quantiaReembolsoCentimos = Math.round(valorAReembolsar * 100);
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        amount: quantiaReembolsoCentimos,
        reason: 'requested_by_customer'
      };

      if (orgData?.stripe_account_id) {
        refundParams.reverse_transfer = true;
        if (valorAReembolsar === valorPagoGeral) {
          refundParams.refund_application_fee = true;
        }
      }

      await stripe.refunds.create(refundParams);
    }

    // 6. ATUALIZAR A BASE DE DADOS
    await supabase.from('reservas').update({
      status_pagamento: 'Reembolsado',
      status_reembolso: 'Reembolsado',
      status: 'Reembolsado',
      dados_reembolso: { 
        data_estorno: new Date().toISOString(), 
        processado_por: 'Automático via Cliente',
        politica_aplicada: descricaoPolitica,
        valor_devolvido: valorAReembolsar
      }
    }).eq('id', reservaId);

    // 7. ENVIO DOS EMAILS
    const campoNome = campoData?.nome || 'Programa HelloCamp';
    const nomeCrianca = criancaData?.nome || 'Participante';
    const turnoNome = reserva.turno_nome || 'Programa Base';
    const valorStr = valorAReembolsar.toFixed(2);
    
    const emailPai = clienteData?.email || reserva.email_encarregado;
    const emailCampo = orgData?.email || 'info@hellocamp.pt';
    const nomeOrganizador = orgData?.empresa_nome || 'Organizador';
    const nomePai = clienteData?.nome_completo || reserva.nome_encarregado || 'Encarregado de Educação';

    // A. EMAIL PREMIUM PARA O PAI
    if (emailPai) {
      await resend.emails.send({
        from: 'HelloCamp Finanças <info@hellocamp.pt>',
        to: emailPai,
        subject: `Confirmação de Cancelamento - ${campoNome}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #0f172a;">
            <h1 style="font-size: 24px; font-weight: 900; text-align: center; margin-bottom: 30px; color: #0f172a;">HelloCamp</h1>
            <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 12px; padding: 25px; text-align: center;">
              <h2 style="font-size: 18px; font-weight: 700; margin-top: 0; color: #991b1b;">Inscrição Cancelada com Sucesso</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #991b1b; margin-bottom: 0;">Olá <strong>${nomePai}</strong>, confirmamos o cancelamento da sua reserva.</p>
            </div>
            
            <div style="margin: 30px 0;">
              <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Resumo do Cancelamento</h3>
              <table width="100%" style="font-size: 14px; color: #334155; margin-top: 12px; line-height: 2;">
                <tr><td><strong>Programa:</strong></td><td style="text-align: right;">${campoNome}</td></tr>
                <tr><td><strong>Turno / Semana:</strong></td><td style="text-align: right;">${turnoNome}</td></tr>
                <tr><td><strong>Participante:</strong></td><td style="text-align: right;">${nomeCrianca}</td></tr>
                <tr><td><strong>Política Aplicada:</strong></td><td style="text-align: right;">${descricaoPolitica}</td></tr>
                <tr><td style="padding-top: 10px; border-top: 1px dashed #e2e8f0;"><strong>Valor Estornado:</strong></td><td style="text-align: right; font-weight: bold; color: #dc2626; font-size: 16px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">${valorStr}€</td></tr>
              </table>
            </div>
            ${valorAReembolsar > 0 
              ? `<p style="font-size: 12px; color: #64748b; line-height: 1.5;">O montante de ${valorStr}€ foi creditado na mesma via de pagamento original. Dependendo do seu banco, o saldo estará visível no extrato num prazo estimado de 5 a 10 dias úteis.</p>` 
              : `<p style="font-size: 12px; color: #64748b; line-height: 1.5;">De acordo com os termos contratuais e a data de cancelamento face ao início do campo, esta reserva não reuniu os critérios para reembolso financeiro.</p>`}
          </div>
        `
      });
    }

    // B. EMAIL PARA O ORGANIZADOR
    await resend.emails.send({
      from: 'HelloCamp Parceiros <info@hellocamp.pt>',
      to: emailCampo,
      subject: `Atualização de Ocupação: Cancelamento - ${campoNome}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #b91c1c; border-bottom: 2px solid #b91c1c; padding-bottom: 10px; font-size: 20px;">Vaga Libertada - Cancelamento</h2>
          <p>Caro parceiro da entidade <strong>${nomeOrganizador}</strong>,</p>
          <p>Informamos que uma vaga para o seu programa foi cancelada por iniciativa do cliente.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0; line-height: 1.8;">
            <p style="margin: 0;"><strong>Programa de Férias:</strong> ${campoNome}</p>
            <p style="margin: 0;"><strong>Turno Afetado:</strong> ${turnoNome}</p>
            <p style="margin: 0;"><strong>Participante removido:</strong> ${nomeCrianca}</p>
            <p style="margin: 0; color: #dc2626;"><strong>Valor Reembolsado ao Cliente:</strong> ${valorStr}€ (${descricaoPolitica})</p>
          </div>
          <p style="font-size: 13px; color: #64748b;">A vaga foi automaticamente recolocada disponível para venda no site. Os ajustes financeiros (caso se apliquem) refletir-se-ão no seu Stripe Connect.</p>
        </div>
      `
    });

    // C. EMAIL INTERNO MACRO (HELLOCAMP)
    await resend.emails.send({
      from: 'HelloCamp Control <info@hellocamp.pt>',
      to: 'info@hellocamp.pt',
      subject: `[Cancelamento Auto] ${valorStr}€ Devolvidos - ${campoNome}`,
      html: `
        <div style="font-family: monospace; font-size: 13px; color: #1e293b; padding: 30px; background-color: #fdfdfd; border: 1px solid #cbd5e1; border-radius: 8px; max-width: 650px; margin: 0 auto;">
          <h2 style="color: #0f172a; margin-top: 0; border-bottom: 2px solid #0f172a; padding-bottom: 10px; font-family: sans-serif;">🚨 RELATÓRIO DE CANCELAMENTO</h2>
          <p style="font-size: 14px; font-weight: bold; color: #dc2626;">Operação executada via Dashboard do Pai.</p>
          <table width="100%" style="margin-top: 20px; font-family: monospace; line-height: 2;">
            <tr style="background-color: #f1f5f9;"><td width="40%"><strong>ID da Reserva:</strong></td><td>${reservaId}</td></tr>
            <tr><td><strong>Programa:</strong></td><td>${campoNome}</td></tr>
            <tr style="background-color: #f1f5f9;"><td><strong>Nome do Pai:</strong></td><td>${nomePai}</td></tr>
            <tr><td><strong>Entidade Parceira:</strong></td><td>${nomeOrganizador}</td></tr>
            <tr style="background-color: #f1f5f9;"><td><strong>Regra Aplicada:</strong></td><td>${descricaoPolitica} (${diffDias} dias p/ início)</td></tr>
            <tr><td><strong>Valor Devolvido (Stripe):</strong></td><td style="color: #b91c1c; font-weight: bold;">${valorStr}€</td></tr>
          </table>
        </div>
      `
    });

    return NextResponse.json({ success: true, estorno: valorAReembolsar });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}