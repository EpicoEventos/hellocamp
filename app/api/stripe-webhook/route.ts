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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!stripeSecretKey || !webhookSecret || !resendApiKey) {
    return new NextResponse('Configuração de servidor incompleta.', { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const resend = new Resend(resendApiKey);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const body = await req.text(); 
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // O MB WAY dispara primeiro o completed (com status 'unpaid') e depois o async_payment_succeeded quando aprovado no telemóvel.
  // Por isso, agrupamos ambos para tratar as aprovações.
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // IMPORTANTE PARA MB WAY: Se a sessão for criada, mas o utilizador ainda não tiver ido à App aprovar, a Stripe diz que está "unpaid".
    // Só processamos a reserva e mandamos o email se o pagamento estiver garantido ("paid").
    if (session.payment_status !== 'paid') {
      return new NextResponse('A aguardar aprovação de pagamento assíncrono (ex: MB WAY).', { status: 200 });
    }

    if (session.metadata?.reservasIds) {
      const reservasIds = JSON.parse(session.metadata.reservasIds);
      
      const isSinal = session.metadata.pagamento_tipo === '50_sinal';
      const isPagamentoFinal = session.metadata.pagamento_tipo === 'pagamento_final';
      const valorOriginalTotal = Number(session.metadata.valor_total_original || 0);
      const valorCobradoAgora = (session.amount_total || 0) / 100;
      
      let novoStatus = 'Pago';
      let valorEmFalta = 0;
      let valorPagoBaseDeDados = valorCobradoAgora;

      if (isSinal) {
        novoStatus = 'Sinal Pago';
        valorEmFalta = valorOriginalTotal - valorCobradoAgora;
      } else if (isPagamentoFinal) {
        novoStatus = 'Pago';
        // Se for o pagamento final, o valor pago total na base de dados passa a ser o valor original (100%)
        valorPagoBaseDeDados = valorOriginalTotal; 
      }

      const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null;

      // 1. ATUALIZAR STATUS FINANCEIRO NA BASE DE DADOS
      const { error: updateError } = await supabase
        .from('reservas')
        .update({ 
          status_pagamento: novoStatus,
          valor_pago: valorPagoBaseDeDados,
          valor_em_falta: valorEmFalta,
          ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}) // Só atualiza se existir
        })
        .in('id', reservasIds);

      if (updateError) {
        console.error('Erro ao atualizar reservas:', updateError);
        return new NextResponse('Erro na Base de Dados', { status: 500 });
      }

      // 2. RECOLHER DADOS EXAUSTIVOS PARA EMAILS
      const { data: reservasData } = await supabase
        .from('reservas')
        .select(`
          id, valor_total, turno_nome, organizador_id, extras_escolhidos, respostas_customizadas,
          criancas ( nome, data_nascimento, sexo, restricoes_alimentares, doencas_cronicas, medicacao_regular ),
          campos ( nome, local ),
          perfis ( nome_completo, telefone, nif )
        `)
        .in('id', reservasIds);

      if (reservasData && reservasData.length > 0) {
        const campoObj: any = reservasData[0].campos;
        const campoNome = Array.isArray(campoObj) ? campoObj[0]?.nome : campoObj?.nome || 'Programa HelloCamp';
        const campoLocal = Array.isArray(campoObj) ? campoObj[0]?.local : campoObj?.local || 'Localização a designar';
        const turnoNome = reservasData[0].turno_nome || 'Programa Base';

        const paiObj: any = reservasData[0].perfis;
        const nomePai = Array.isArray(paiObj) ? paiObj[0]?.nome_completo : paiObj?.nome_completo || 'Encarregado de Educação';
        const telefonePai = Array.isArray(paiObj) ? paiObj[0]?.telefone : paiObj?.telefone || 'Não fornecido';
        const nifPai = Array.isArray(paiObj) ? paiObj[0]?.nif : paiObj?.nif || 'Não fornecido';
        const emailPai = session.customer_email || session.customer_details?.email || '';

        const { data: orgData } = await supabase.from('perfis').select('email, empresa_nome').eq('id', reservasData[0].organizador_id).single();
        const emailCampo = orgData?.email || 'info@hellocamp.pt'; 
        const nomeOrganizador = orgData?.empresa_nome || 'Organizador';

        let blocoParticipantesPai = '';
        let blocoParticipantesOrg = '';
        let nomesSimplesArray: string[] = [];

        reservasData.forEach((reserva: any, index: number) => {
          const c: any = Array.isArray(reserva.criancas) ? reserva.criancas[0] : reserva.criancas;
          if (!c) return;

          nomesSimplesArray.push(c.nome);
          const idade = calcularIdade(c.data_nascimento);

          const extras = reserva.extras_escolhidos || {};
          let extrasText = [];
          if (extras.extAlimentacao) extrasText.push('Alimentação Extra');
          if (extras.extAlojamento) extrasText.push('Alojamento Extra');
          if (extras.extProlongamento) extrasText.push('Prolongamento');
          if (extras.extTransporte) extrasText.push('Transporte');
          const extrasString = extrasText.length > 0 ? extrasText.join(', ') : 'Nenhum extra';

          const respostas = reserva.respostas_customizadas || {};
          let respostasHtml = Object.keys(respostas).length > 0 
            ? Object.entries(respostas).map(([p, r]) => `<tr><td style="padding: 4px 0; color: #64748b; font-size: 13px;">${p}</td><td style="padding: 4px 0; font-weight: bold; font-size: 13px;">${r as string}</td></tr>`).join('')
            : `<tr><td style="padding: 4px 0; color: #64748b; font-size: 13px;">Detalhes adicionais</td><td style="padding: 4px 0; font-weight: bold; font-size: 13px;">N/A</td></tr>`;

          blocoParticipantesPai += `
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 15px; background-color: #f8fafc;">
              <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Participante ${index + 1}: ${c.nome}</h3>
              <table width="100%" style="font-size: 14px; color: #334155; border-collapse: collapse;">
                <tr><td width="40%" style="padding: 4px 0; color: #64748b;">Turno:</td><td style="font-weight: bold;">${reserva.turno_nome}</td></tr>
                <tr><td style="padding: 4px 0; color: #64748b;">Extras:</td><td style="font-weight: bold;">${extrasString}</td></tr>
              </table>
            </div>
          `;

          const hasAlerta = (c.restricoes_alimentares?.length > 3) || (c.doencas_cronicas?.length > 3);
          blocoParticipantesOrg += `
            <div style="border: 1px solid ${hasAlerta ? '#fca5a5' : '#e2e8f0'}; border-radius: 8px; padding: 15px; margin-bottom: 15px; background-color: ${hasAlerta ? '#fef2f2' : '#f8fafc'};">
              <h3 style="margin: 0 0 10px 0; font-size: 16px; color: ${hasAlerta ? '#991b1b' : '#0f172a'}; border-bottom: 1px solid ${hasAlerta ? '#fecaca' : '#cbd5e1'}; padding-bottom: 8px;">
                ${c.nome} (Ref: ${reserva.id.split('-')[0]}) ${hasAlerta ? '<span style="color: #ef4444; font-size: 12px; float: right;">ALERTA MÉDICO</span>' : ''}
              </h3>
              <table width="100%" style="font-size: 14px; color: #334155; border-collapse: collapse;">
                <tr><td width="40%" style="padding: 4px 0; color: #64748b;">Idade / Género:</td><td style="font-weight: bold;">${idade} / ${c.sexo || 'N/D'}</td></tr>
                <tr><td style="padding: 4px 0; color: #64748b;">Alergias:</td><td style="font-weight: bold; color: ${c.restricoes_alimentares ? '#b91c1c' : '#334155'};">${c.restricoes_alimentares || 'Nenhuma'}</td></tr>
                <tr><td style="padding: 4px 0; color: #64748b;">Doenças / Medicação:</td><td style="font-weight: bold; color: ${c.doencas_cronicas || c.medicacao_regular ? '#b91c1c' : '#334155'};">${c.doencas_cronicas || 'Não'} | ${c.medicacao_regular || 'Nenhuma'}</td></tr>
                <tr><td colspan="2"><div style="height: 1px; background-color: ${hasAlerta ? '#fecaca' : '#cbd5e1'}; margin: 10px 0;"></div></td></tr>
                ${respostasHtml}
              </table>
            </div>
          `;
        });

        // Textos Dinâmicos para os Emails
        let tituloEmailPai = `Confirmação de Reserva - ${campoNome}`;
        let statusTextoPai = `<p style="font-size: 15px; line-height: 1.6; color: #475569;">A sua reserva para o programa <strong>${campoNome}</strong> encontra-se validada e totalmente paga.</p>`;
        
        if (isSinal) {
          statusTextoPai = `<p style="font-size: 15px; line-height: 1.6; color: #475569;">A sua vaga para o programa <strong>${campoNome}</strong> encontra-se garantida através do pagamento do sinal. <br/><br/><strong>Atenção:</strong> O valor remanescente (${valorEmFalta.toFixed(2)}€) deverá ser pago 1 semana antes do início do programa através do seu Portal de Cliente HelloCamp.</p>`;
        } else if (isPagamentoFinal) {
          tituloEmailPai = `Liquidação Final - ${campoNome}`;
          statusTextoPai = `<p style="font-size: 15px; line-height: 1.6; color: #475569;">O pagamento da segunda tranche da sua reserva para o programa <strong>${campoNome}</strong> foi liquidado com sucesso. A inscrição encontra-se totalmente paga.</p>`;
        }

        const financeiroOrg = isSinal
          ? `<tr><td style="padding: 4px 0; color: #64748b;">Sinal Recebido (50%):</td><td style="font-weight: bold; color: #059669;">${valorCobradoAgora.toFixed(2)}€</td></tr><tr><td style="padding: 4px 0; color: #64748b;">Valor Pendente:</td><td style="font-weight: bold; color: #eab308;">${valorEmFalta.toFixed(2)}€</td></tr>`
          : `<tr><td style="padding: 4px 0; color: #64748b;">Valor Pago Agora:</td><td style="font-weight: bold; color: #059669;">${valorCobradoAgora.toFixed(2)}€</td></tr><tr><td style="padding: 4px 0; color: #64748b;">Situação:</td><td style="font-weight: bold; color: #059669;">100% Pago</td></tr>`;

        // A. EMAIL PAI
        if (emailPai && !isPagamentoFinal) {
          await resend.emails.send({
            from: 'HelloCamp Reservas <info@hellocamp.pt>', 
            to: emailPai,
            subject: tituloEmailPai,
            html: `
              <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #0f172a;">
                <h1 style="font-size: 24px; font-weight: 900; text-align: center; margin-bottom: 30px; color: #0f172a;">HelloCamp</h1>
                <h2 style="font-size: 20px; font-weight: 700; margin-top: 0;">Inscrição Confirmada</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #475569;">Estimado(a) ${nomePai},</p>
                ${statusTextoPai}
                <div style="margin: 30px 0;">
                  <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Detalhes Financeiros</h3>
                  <table width="100%" style="font-size: 15px; color: #334155; margin-top: 10px;">
                    <tr><td style="padding: 5px 0;">Entidade Organizadora:</td><td style="text-align: right; font-weight: bold;">${nomeOrganizador}</td></tr>
                    <tr><td style="padding: 5px 0;">Valor Pago Agora:</td><td style="text-align: right; font-weight: bold; color: #059669; font-size: 18px;">${valorCobradoAgora.toFixed(2)}€</td></tr>
                    ${isSinal ? `<tr><td style="padding: 5px 0; color: #64748b;">Valor a Pagar (1 sem. antes):</td><td style="text-align: right; font-weight: bold; color: #64748b;">${valorEmFalta.toFixed(2)}€</td></tr>` : ''}
                  </table>
                </div>
                <div style="margin: 30px 0;">
                  <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Ficha de Participantes</h3>
                  <div style="margin-top: 15px;">${blocoParticipantesPai}</div>
                </div>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 30px;">
                  <h4 style="margin: 0 0 10px 0; color: #0f172a; font-size: 14px;">O que se segue?</h4>
                  <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #475569;">Os seus dados logísticos e clínicos foram transmitidos com segurança. O parceiro organizador entrará em contacto consigo brevemente com informações sobre o planeamento.</p>
                </div>
              </div>
            `,
          });
        }

        // B. EMAIL ORGANIZADOR
        // Se for só o pagamento final, o organizador recebe um aviso rápido, se for a inscrição original recebe a ficha completa
        if (isPagamentoFinal) {
           await resend.emails.send({
            from: 'HelloCamp Parceiros <info@hellocamp.pt>',
            to: emailCampo,
            subject: `Liquidação Recebida - ${campoNome}`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a;"><h2>Pagamento Final Recebido</h2><p>O encarregado de educação <strong>${nomePai}</strong> liquidou a segunda parcela de <strong>${valorCobradoAgora.toFixed(2)}€</strong> referente à inscrição no programa ${campoNome}. A reserva encontra-se agora 100% paga.</p></div>`,
          });
        } else {
          await resend.emails.send({
            from: 'HelloCamp Parceiros <info@hellocamp.pt>',
            to: emailCampo,
            subject: `Nova Inscrição Processada - ${campoNome}`,
            html: `
              <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 30px 20px; color: #0f172a;">
                <h2 style="font-size: 22px; font-weight: 700; border-bottom: 2px solid #0f172a; padding-bottom: 10px;">Nova Inscrição Processada</h2>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
                  <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Dados do Encarregado de Educação</h3>
                  <table width="100%" style="font-size: 14px; color: #334155; margin-top: 10px; border-collapse: collapse;">
                    <tr><td width="30%" style="padding: 4px 0; color: #64748b;">Nome Completo:</td><td style="font-weight: bold;">${nomePai}</td></tr>
                    <tr><td style="padding: 4px 0; color: #64748b;">Telefone:</td><td style="font-weight: bold;">${telefonePai}</td></tr>
                    <tr><td style="padding: 4px 0; color: #64748b;">Email:</td><td style="font-weight: bold;"><a href="mailto:${emailPai}" style="color: #2563eb;">${emailPai}</a></td></tr>
                    ${financeiroOrg}
                  </table>
                </div>
                <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 30px;">Detalhes e Ficha Clínica dos Participantes</h3>
                ${blocoParticipantesOrg}
              </div>
            `,
          });
        }

        // C. EMAIL ADMIN (Controlo HelloCamp)
        await resend.emails.send({
          from: 'HelloCamp Control <info@hellocamp.pt>',
          to: 'info@hellocamp.pt', // Fixo para controlo
          subject: `[VENDA] ${valorCobradoAgora.toFixed(2)}€ ${isSinal ? '(SINAL)' : isPagamentoFinal ? '(SEGUNDA TRANCHE)' : '(100%)'} - ${campoNome}`,
          html: `<div style="font-family: monospace; font-size: 14px; padding: 20px;"><h2>Transação HelloCamp</h2><p>Recebido Agora: ${valorCobradoAgora}€ | Falta Pagar: ${valorEmFalta}€</p><p>Cliente: ${nomePai}</p></div>`,
        });
      }
    }
  }

  return new NextResponse('Webhook processado com sucesso.', { status: 200 });
}