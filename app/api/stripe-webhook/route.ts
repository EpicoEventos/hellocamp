import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

// Função auxiliar para calcular a idade
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
    console.error("Faltam variáveis de ambiente da Stripe ou Resend na Vercel.");
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
    console.error("Erro na assinatura do Webhook:", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (session.metadata?.reservasIds) {
      const reservasIds = JSON.parse(session.metadata.reservasIds);

      // 1. ATUALIZAR STATUS PARA PAGO
      const { error: updateError } = await supabase
        .from('reservas')
        .update({ status_pagamento: 'Pago' })
        .in('id', reservasIds);

      if (updateError) {
        console.error('Erro ao atualizar reservas no Supabase:', updateError);
        return new NextResponse('Erro na Base de Dados', { status: 500 });
      }

      // 2. RECOLHER DADOS EXAUSTIVOS PARA OS EMAILS (Incluindo Perfil do Pai e Dados Médicos)
      const { data: reservasData } = await supabase
        .from('reservas')
        .select(`
          id,
          valor_total,
          turno_nome,
          organizador_id,
          extras_escolhidos,
          respostas_customizadas,
          criancas ( nome, data_nascimento, sexo, restricoes_alimentares, doencas_cronicas, medicacao_regular ),
          campos ( nome, local ),
          perfis ( nome_completo, telefone, nif )
        `)
        .in('id', reservasIds);

      if (reservasData && reservasData.length > 0) {
        
        // Extração Segura de Dados do Campo e do Pai (Tratamento de Arrays do Supabase Joins)
        const campoObj: any = reservasData[0].campos;
        const campoNome = Array.isArray(campoObj) ? campoObj[0]?.nome : campoObj?.nome || 'Programa HelloCamp';
        const campoLocal = Array.isArray(campoObj) ? campoObj[0]?.local : campoObj?.local || 'Localização a designar';
        
        const turnoNome = reservasData[0].turno_nome || 'Programa Base';
        const valorTotal = (session.amount_total || 0) / 100;

        const paiObj: any = reservasData[0].perfis;
        const nomePai = Array.isArray(paiObj) ? paiObj[0]?.nome_completo : paiObj?.nome_completo || 'Encarregado de Educação';
        const telefonePai = Array.isArray(paiObj) ? paiObj[0]?.telefone : paiObj?.telefone || 'Não fornecido';
        const nifPai = Array.isArray(paiObj) ? paiObj[0]?.nif : paiObj?.nif || 'Não fornecido';
        const emailPai = session.customer_email || session.customer_details?.email || '';

        const { data: organizadorData } = await supabase
          .from('perfis')
          .select('email, empresa_nome')
          .eq('id', reservasData[0].organizador_id)
          .single();
        
        const emailCampo = organizadorData?.email || 'info@hellocamp.pt'; 
        const nomeOrganizador = organizadorData?.empresa_nome || 'Organizador';
        const emailHelloCamp = 'rcruz1010@hotmail.com'; // O seu email de controlo

        // CONSTRUÇÃO DINÂMICA DOS BLOCOS DE PARTICIPANTES (Porque podem ser múltiplos irmãos)
        let blocoParticipantesPai = '';
        let blocoParticipantesOrg = '';
        let blocoParticipantesAdmin = '';
        let nomesSimplesArray: string[] = [];

        reservasData.forEach((reserva: any, index: number) => {
          const c: any = Array.isArray(reserva.criancas) ? reserva.criancas[0] : reserva.criancas;
          if (!c) return;

          nomesSimplesArray.push(c.nome);
          const idade = calcularIdade(c.data_nascimento);

          // Tratamento de Extras
          const extras = reserva.extras_escolhidos || {};
          let extrasText = [];
          if (extras.extAlimentacao) extrasText.push('Alimentação Extra');
          if (extras.extAlojamento) extrasText.push('Alojamento Extra');
          if (extras.extProlongamento) extrasText.push('Prolongamento de Horário');
          if (extras.extTransporte) extrasText.push('Transporte');
          const extrasString = extrasText.length > 0 ? extrasText.join(', ') : 'Nenhum extra selecionado';

          // Tratamento de Respostas Customizadas
          const respostas = reserva.respostas_customizadas || {};
          let respostasHtml = '';
          if (Object.keys(respostas).length > 0) {
            respostasHtml = Object.entries(respostas).map(([pergunta, resposta]) => 
              `<tr><td style="padding: 4px 0; color: #64748b; font-size: 13px;">${pergunta}</td><td style="padding: 4px 0; font-weight: bold; font-size: 13px;">${resposta as string}</td></tr>`
            ).join('');
          } else {
            respostasHtml = `<tr><td style="padding: 4px 0; color: #64748b; font-size: 13px;">Perguntas adicionais</td><td style="padding: 4px 0; font-weight: bold; font-size: 13px;">Sem perguntas/respostas</td></tr>`;
          }

          // Bloco do Pai (Focado em confirmação e logistica básica)
          blocoParticipantesPai += `
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 15px; background-color: #f8fafc;">
              <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Participante ${index + 1}: ${c.nome}</h3>
              <table width="100%" style="font-size: 14px; color: #334155; border-collapse: collapse;">
                <tr><td width="40%" style="padding: 4px 0; color: #64748b;">Turno:</td><td style="font-weight: bold;">${reserva.turno_nome}</td></tr>
                <tr><td style="padding: 4px 0; color: #64748b;">Idade:</td><td style="font-weight: bold;">${idade}</td></tr>
                <tr><td style="padding: 4px 0; color: #64748b;">Extras Associados:</td><td style="font-weight: bold;">${extrasString}</td></tr>
              </table>
            </div>
          `;

          // Bloco do Organizador (Focado em logística total, alergias e saúde em vermelho)
          const hasAlerta = (c.restricoes_alimentares && c.restricoes_alimentares.length > 3) || (c.doencas_cronicas && c.doencas_cronicas.length > 3);
          
          blocoParticipantesOrg += `
            <div style="border: 1px solid ${hasAlerta ? '#fca5a5' : '#e2e8f0'}; border-radius: 8px; padding: 15px; margin-bottom: 15px; background-color: ${hasAlerta ? '#fef2f2' : '#f8fafc'};">
              <h3 style="margin: 0 0 10px 0; font-size: 16px; color: ${hasAlerta ? '#991b1b' : '#0f172a'}; border-bottom: 1px solid ${hasAlerta ? '#fecaca' : '#cbd5e1'}; padding-bottom: 8px;">
                ${c.nome} (Ref: ${reserva.id.split('-')[0]}) ${hasAlerta ? '<span style="color: #ef4444; font-size: 12px; float: right;">ALERTA MÉDICO</span>' : ''}
              </h3>
              <table width="100%" style="font-size: 14px; color: #334155; border-collapse: collapse;">
                <tr><td width="40%" style="padding: 4px 0; color: #64748b;">Turno Selecionado:</td><td style="font-weight: bold;">${reserva.turno_nome}</td></tr>
                <tr><td style="padding: 4px 0; color: #64748b;">Idade / Género:</td><td style="font-weight: bold;">${idade} / ${c.sexo || 'N/D'}</td></tr>
                <tr><td style="padding: 4px 0; color: #64748b;">Extras Requisitados:</td><td style="font-weight: bold;">${extrasString}</td></tr>
                
                <tr><td colspan="2"><div style="height: 1px; background-color: ${hasAlerta ? '#fecaca' : '#cbd5e1'}; margin: 10px 0;"></div></td></tr>
                
                <tr><td style="padding: 4px 0; color: #64748b;">Alergias / Restrições:</td><td style="font-weight: bold; color: ${c.restricoes_alimentares ? '#b91c1c' : '#334155'};">${c.restricoes_alimentares || 'Nenhuma declarada'}</td></tr>
                <tr><td style="padding: 4px 0; color: #64748b;">Doenças / Medicação:</td><td style="font-weight: bold; color: ${c.doencas_cronicas || c.medicacao_regular ? '#b91c1c' : '#334155'};">${c.doencas_cronicas || 'Não'} | ${c.medicacao_regular || 'Sem medicação'}</td></tr>
                
                <tr><td colspan="2"><div style="height: 1px; background-color: ${hasAlerta ? '#fecaca' : '#cbd5e1'}; margin: 10px 0;"></div></td></tr>
                <tr><td colspan="2" style="font-size: 12px; font-weight: bold; color: #0f172a; padding-bottom: 4px;">Respostas ao Formulário Customizado:</td></tr>
                ${respostasHtml}
              </table>
            </div>
          `;

          // Bloco Simples Admin
          blocoParticipantesAdmin += `<li style="margin-bottom: 5px;"><strong>${c.nome}</strong> (${idade}) - ${reserva.turno_nome}</li>`;
        });

        const nomesCriancasResumo = nomesSimplesArray.join(', ');

        // 3. DISPARAR OS EMAILS SIMULTANEAMENTE COM OS NOVOS TEMPLATES

        // A. EMAIL PARA O PAI
        if (emailPai) {
          await resend.emails.send({
            from: 'HelloCamp Reservas <info@hellocamp.pt>', 
            to: emailPai,
            subject: `Confirmação de Reserva - ${campoNome}`,
            html: `
              <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #0f172a;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="font-size: 24px; font-weight: 900; margin: 0; color: #0f172a;">HelloCamp</h1>
                </div>
                
                <h2 style="font-size: 20px; font-weight: 700; margin-top: 0;">Inscrição Confirmada</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #475569;">Estimado(a) ${nomePai},</p>
                <p style="font-size: 15px; line-height: 1.6; color: #475569;">A sua reserva para o programa <strong>${campoNome}</strong> encontra-se validada. O pagamento foi processado com sucesso de forma segura.</p>
                
                <div style="margin: 30px 0;">
                  <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Detalhes Financeiros</h3>
                  <table width="100%" style="font-size: 15px; color: #334155; margin-top: 10px;">
                    <tr><td style="padding: 5px 0;">Entidade Organizadora:</td><td style="text-align: right; font-weight: bold;">${nomeOrganizador}</td></tr>
                    <tr><td style="padding: 5px 0;">Localização:</td><td style="text-align: right; font-weight: bold;">${campoLocal}</td></tr>
                    <tr><td style="padding: 5px 0;">Valor Total Pago:</td><td style="text-align: right; font-weight: bold; color: #059669; font-size: 18px;">${valorTotal.toFixed(2)}€</td></tr>
                  </table>
                </div>

                <div style="margin: 30px 0;">
                  <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Ficha de Participantes</h3>
                  <div style="margin-top: 15px;">
                    ${blocoParticipantesPai}
                  </div>
                </div>

                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-top: 30px;">
                  <h4 style="margin: 0 0 10px 0; color: #064e3b; font-size: 14px;">O que se segue?</h4>
                  <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #064e3b;">Os seus dados logísticos e clínicos foram transmitidos com segurança à equipa do campo. O parceiro organizador entrará em contacto consigo brevemente com informações detalhadas sobre o planeamento (o que levar, horários e pontos de encontro exatos).</p>
                </div>

                <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
                  <p>Este é um email gerado automaticamente pela HelloCamp.<br/>Plataforma de gestão e reservas de campos de férias.</p>
                </div>
              </div>
            `,
          });
        }

        // B. EMAIL PARA O ORGANIZADOR DO CAMPO
        await resend.emails.send({
          from: 'HelloCamp Parceiros <info@hellocamp.pt>',
          to: emailCampo,
          subject: `Nova Inscrição Confirmada - ${campoNome}`,
          html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 30px 20px; color: #0f172a;">
              <h2 style="font-size: 22px; font-weight: 700; border-bottom: 2px solid #0f172a; padding-bottom: 10px;">Nova Inscrição Processada</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #475569;">Caro Parceiro (${nomeOrganizador}),<br/>A plataforma HelloCamp processou com sucesso uma nova inscrição e o respetivo pagamento (retido via Stripe para o seu repasse acordado).</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Dados do Encarregado de Educação</h3>
                <table width="100%" style="font-size: 14px; color: #334155; margin-top: 10px; border-collapse: collapse;">
                  <tr><td width="30%" style="padding: 4px 0; color: #64748b;">Nome Completo:</td><td style="font-weight: bold;">${nomePai}</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Contacto:</td><td style="font-weight: bold;">${telefonePai}</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Email:</td><td style="font-weight: bold;"><a href="mailto:${emailPai}" style="color: #2563eb;">${emailPai}</a></td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">NIF Faturação:</td><td style="font-weight: bold;">${nifPai}</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Valor Bruto Pago:</td><td style="font-weight: bold; color: #059669;">${valorTotal.toFixed(2)}€</td></tr>
                </table>
              </div>

              <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 30px;">Detalhes e Ficha Clínica dos Participantes</h3>
              ${blocoParticipantesOrg}

              <div style="margin-top: 30px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #1e40af; font-weight: 500;">Pode consultar todas as inscrições, gerir lotações e exportar relatórios de campo diretamente no seu painel administrativo.</p>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/pt/admin/reservas" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #1e40af; color: #white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">Aceder ao Dashboard</a>
              </div>
            </div>
          `,
        });

        // C. EMAIL PARA ADMIN HELLOCAMP (Controlo Interno)
        await resend.emails.send({
          from: 'HelloCamp Control <info@hellocamp.pt>',
          to: emailHelloCamp,
          subject: `[VENDA] ${valorTotal.toFixed(2)}€ - ${campoNome}`,
          html: `
            <div style="font-family: monospace; font-size: 14px; padding: 20px;">
              <h2>Registo de Nova Venda</h2>
              <p><strong>Valor Total (Bruto):</strong> ${valorTotal.toFixed(2)}€</p>
              <p><strong>Organizador:</strong> ${nomeOrganizador}</p>
              <p><strong>Programa:</strong> ${campoNome} (${turnoNome})</p>
              <hr />
              <p><strong>Cliente:</strong> ${nomePai} (${emailPai})</p>
              <p><strong>Participantes:</strong></p>
              <ul>${blocoParticipantesAdmin}</ul>
              <p style="color: gray; font-size: 12px; margin-top: 30px;">O comissionamento já foi processado internamente na Stripe (Stripe Connect Split Payment). Os emails institucionais foram entregues ao Pai e ao Organizador com os detalhes logísticos.</p>
            </div>
          `,
        });

        console.log(`Webhooks e 3 Emails processados para as reservas ${reservasIds.join(', ')}`);
      }
    }
  }

  return new NextResponse('Webhook processado com sucesso.', { status: 200 });
}