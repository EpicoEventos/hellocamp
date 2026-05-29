import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// NOTA: Para um webhook atualizar a BD "por trás do pano" (sem o utilizador estar com sessão iniciada neste ficheiro), 
// precisamos de usar a "Service Role Key" do Supabase, que tem super-poderes para ignorar as regras de segurança normais.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  const body = await req.text(); // A Stripe exige o texto "cru" para verificar assinaturas de segurança
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    // 1. Verificar se a mensagem vem mesmo da Stripe e não de um hacker
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error: any) {
    console.error("Erro na assinatura do Webhook:", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // 2. Se o pagamento foi concluído com sucesso
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // 3. Vamos buscar aqueles IDs de reserva que guardámos nos metadados
    if (session.metadata?.reservasIds) {
      const reservasIds = JSON.parse(session.metadata.reservasIds);

      // 4. Dizemos ao Supabase para atualizar todas as reservas deste carrinho para "Pago"
      const { error } = await supabase
        .from('reservas')
        .update({ status_pagamento: 'Pago' })
        .in('id', reservasIds);

      if (error) {
        console.error('Erro ao atualizar reservas no Supabase:', error);
        return new NextResponse('Erro na Base de Dados', { status: 500 });
      }
      
      console.log(`Reservas ${reservasIds.join(', ')} marcadas como Pago!`);
    }
  }

  // Retornamos 200 para a Stripe saber que recebemos a mensagem em segurança
  return new NextResponse('Webhook recebido e processado', { status: 200 });
}