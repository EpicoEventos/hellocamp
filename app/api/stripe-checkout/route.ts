import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    // DETETOR DE PROBLEMAS: Vai procurar todas as chaves que a Vercel deixou passar
    const todasAsChaves = Object.keys(process.env);
    const chavesDaStripeQueOServidorVe = todasAsChaves.filter(k => k.toLowerCase().includes('stripe'));
    
    return NextResponse.json({ 
      error: "Servidor mal configurado.", 
      motivo: "A Vercel bloqueou a leitura da chave STRIPE_SECRET_KEY ao servidor.",
      o_que_o_servidor_consegue_ver: chavesDaStripeQueOServidorVe.length > 0 ? chavesDaStripeQueOServidorVe : "Nenhuma chave com o nome STRIPE foi encontrada pela Vercel!"
    }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);

  try {
    const body = await req.json();
    const { reservasIds, totalAmount, userEmail, lang, campoNome, stripeAccountId } = body;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hellocamp.pt';

    const sessionData: any = {
      payment_method_types: ['card', 'mbway'],
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Inscrição - ${campoNome}`,
              description: `IDs de Reserva: ${reservasIds.join(', ')}`,
            },
            unit_amount: Math.round(totalAmount * 100), 
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${siteUrl}/${lang}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/${lang}`,
      metadata: {
        reservasIds: JSON.stringify(reservasIds), 
      },
    };

    if (stripeAccountId) {
      sessionData.payment_intent_data = {
        application_fee_amount: Math.round((totalAmount * 0.15) * 100),
        transfer_data: {
          destination: stripeAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}