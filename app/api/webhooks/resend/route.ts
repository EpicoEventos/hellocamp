import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Webhook } from 'svix';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. LEITURA DOS HEADERS DE SEGURANÇA DA RESEND
    const payload = await req.text();
    const svix_id = req.headers.get("webhook-id");
    const svix_timestamp = req.headers.get("webhook-timestamp");
    const svix_signature = req.headers.get("webhook-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json({ error: "Headers de segurança ausentes." }, { status: 400 });
    }

    // 2. VALIDAÇÃO DA ASSINATURA JURÍDICA/TECNOLÓGICA
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Configuração do Signing Secret em falta no servidor." }, { status: 500 });
    }

    const wh = new Webhook(secret);
    let evt: any;

    try {
      evt = wh.verify(payload, {
        "webhook-id": svix_id,
        "webhook-timestamp": svix_timestamp,
        "webhook-signature": svix_signature,
      });
    } catch (err) {
      console.error("Assinatura de Webhook inválida.");
      return NextResponse.json({ error: "Assinatura digital inválida." }, { status: 400 });
    }

    // 3. PROCESSAMENTO DO EVENTO VALIDADO
    const eventType = evt.type; 
    const broadcastId = evt.data?.tags?.broadcast_id;

    if (!broadcastId) {
      return NextResponse.json({ message: "Evento ignorado: Não pertence a uma campanha registada." }, { status: 200 });
    }

    // Mapeamento do campo a incrementar
    let updateField = '';
    if (eventType === 'email.delivered') updateField = 'total_entregues';
    else if (eventType === 'email.opened') updateField = 'total_abertos';
    else if (eventType === 'email.clicked') updateField = 'total_cliques';
    else if (eventType === 'email.bounced' || eventType === 'email.complained') updateField = 'total_falhas';

    if (updateField) {
      // ABORDAGEM PURE JAVASCRIPT: Evita o erro do SQL Editor do Supabase
      // Procura o valor atual da métrica
      const { data: campanha } = await supabaseAdmin
        .from('email_broadcasts')
        .select(updateField)
        .eq('id', broadcastId)
        .single();

      const valorAtual = (campanha as Record<string, any>)?.[updateField] || 0;

      // Executa a atualização incremental
      await supabaseAdmin
        .from('email_broadcasts')
        .update({ [updateField]: valorAtual + 1 })
        .eq('id', broadcastId);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err: any) {
    console.error("Erro interno no processador de eventos:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}