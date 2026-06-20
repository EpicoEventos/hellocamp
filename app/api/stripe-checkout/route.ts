import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return NextResponse.json({ error: "Chave não encontrada." }, { status: 500 });
  
  const stripe = new Stripe(stripeSecretKey);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const { reservasIds, totalAmount, userEmail, lang, campoNome, stripeAccountId, tipoPagamento, campoId } = body;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hellocamp.pt';

    // 1. Obter a comissão e o organizador_id do campo na base de dados
    let taxaComissao = 0.12; 
    let organizadorId = null;
    
    if (campoId) {
      const { data: campoData } = await supabase
        .from('campos')
        .select('comissao, organizador_id')
        .eq('id', campoId)
        .single();
        
      if (campoData) {
        organizadorId = campoData.organizador_id;
        if (campoData.comissao) {
          taxaComissao = campoData.comissao / 100;
        }
      }
    }

    // 👉 NOVA PARTE: DISPARO AUTOMÁTICO DE MENSAGEM LOGÍSTICA NA INBOX
    try {
      if (reservasIds && reservasIds.length > 0 && campoId && organizadorId) {
        // Puxamos o cliente_id de uma das reservas criadas
        const { data: resData } = await supabase
          .from('reservas')
          .select('cliente_id')
          .eq('id', reservasIds[0])
          .single();

        if (resData?.cliente_id) {
          const isSinal = tipoPagamento === '50_sinal';
          const msgTexto = isSinal 
            ? `📢 Nova intenção de inscrição iniciada! O cliente escolheu pagar sinal de 50%. A aguardar conclusão na Stripe. (Ref Reservas: ${reservasIds.join(', ')})`
            : `📢 Nova intenção de inscrição iniciada! O cliente escolheu pagar 100% da totalidade. A aguardar conclusão na Stripe. (Ref Reservas: ${reservasIds.join(', ')})`;

          // Grava a mensagem do sistema na tabela unificada de mensagens
          await supabase.from('mensagens').insert([{
            campo_id: campoId,
            sender_id: resData.cliente_id, // Atribuído ao pai para abrir a thread dele
            receiver_id: organizadorId,
            texto: msgTexto,
            lida: false
          }]);
        }
      }
    } catch (chatErr) {
      // Falha de chat não deve bloquear o checkout financeiro, apenas registamos na consola
      console.error("Erro em background ao inicializar chat no checkout:", chatErr);
    }

    // Continuar com a lógica financeira da Stripe
    const isSinal = tipoPagamento === '50_sinal';
    const valorCobrarAgora = isSinal ? (totalAmount / 2) : totalAmount;
    const nomeProdutoStripe = isSinal ? `Sinal (50%) - ${campoNome}` : `Inscrição - ${campoNome}`;

    const sessionData: Stripe.Checkout.SessionCreateParams = {
      customer_email: userEmail,
      customer_creation: 'always', 
      line_items: [{
        price_data: { 
          currency: 'eur', 
          product_data: { name: nomeProdutoStripe }, 
          unit_amount: Math.round(valorCobrarAgora * 100) 
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${siteUrl}/${lang}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/${lang}`,
      metadata: {
        reservasIds: JSON.stringify(reservasIds),
        valor_total_original: totalAmount.toString(),
        pagamento_tipo: isSinal ? '50_sinal' : '100_total'
      },
    };

    if (stripeAccountId) {
      (sessionData as any).payment_intent_data = {
        application_fee_amount: Math.round((valorCobrarAgora * taxaComissao) * 100),
        transfer_data: { destination: stripeAccountId }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}