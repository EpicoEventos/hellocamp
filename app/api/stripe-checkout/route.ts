import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return NextResponse.json({ error: "Chave não encontrada." }, { status: 500 });
  
  const stripe = new Stripe(stripeSecretKey);

  try {
    const body = await req.json();
    const { reservasIds, totalAmount, userEmail, lang, campoNome, stripeAccountId, tipoPagamento } = body;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hellocamp.pt';

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
      // NOTA: A linha setup_future_usage foi removida para garantir que o MB WAY é sempre suportado!
      success_url: `${siteUrl}/${lang}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/${lang}`,
      metadata: {
        reservasIds: JSON.stringify(reservasIds),
        valor_total_original: totalAmount.toString(),
        pagamento_tipo: isSinal ? '50_sinal' : '100_total'
      },
    };

    if (stripeAccountId) {
      // Usar `any` temporário para contornar tipagem estrita do Stripe Connect
      (sessionData as any).payment_intent_data = {
        application_fee_amount: Math.round((valorCobrarAgora * 0.15) * 100),
        transfer_data: { destination: stripeAccountId }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}