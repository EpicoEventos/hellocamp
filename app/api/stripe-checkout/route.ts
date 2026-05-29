import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Voltamos a ler a chave em segurança a partir da Vercel
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  // Validação obrigatória para o servidor e para o TypeScript
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "A chave da Stripe não foi encontrada no servidor." }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);

  try {
    const body = await req.json();
    const { reservasIds, totalAmount, userEmail, lang, campoNome, stripeAccountId } = body;
    
    // Usamos o link do ambiente ou o link principal por segurança
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