import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Omitimos a apiVersion para o sistema usar automaticamente a mais recente sem dar erro de TypeScript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_sua_chave_aqui');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reservasIds, totalAmount, userEmail, lang, campoNome, stripeAccountId } = body;

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
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${lang}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${lang}`,
      metadata: {
        reservasIds: JSON.stringify(reservasIds), // Guardamos aqui para o Webhook usar a seguir!
      },
    };

    if (stripeAccountId) {
      sessionData.payment_intent_data = {
        application_fee_amount: Math.round((totalAmount * 0.15) * 100), // Ex: HelloCamp retém 15%
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