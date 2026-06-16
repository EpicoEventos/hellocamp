import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. VERIFICAÇÃO DE SEGURANÇA (Estilo Brevo)
    // Vamos procurar um Header secreto chamado 'auth-token' que configuraremos no painel da Brevo
    const tokenHeader = req.headers.get("auth-token");
    const secret = process.env.BREVO_WEBHOOK_SECRET;

    // Se tivermos um segredo configurado no servidor, validamos se a Brevo nos enviou o mesmo segredo
    if (secret && tokenHeader !== secret) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
    }

    const payload = await req.json();

    // 2. EXTRAIR DADOS DA BREVO
    const eventType = payload.event; 
    // A Brevo envia as tags como um array de strings. A nossa é a primeira (e única).
    const broadcastId = payload.tags && payload.tags.length > 0 ? payload.tags[0] : null;

    if (!broadcastId) {
      return NextResponse.json({ message: "Evento ignorado: Não pertence a uma campanha da HelloCamp." }, { status: 200 });
    }

    // 3. MAPEAR EVENTOS DA BREVO PARA A BASE DE DADOS
    let updateField = '';
    if (eventType === 'delivered') updateField = 'total_entregues';
    else if (eventType === 'opened' || eventType === 'unique_opened') updateField = 'total_abertos';
    else if (eventType === 'click') updateField = 'total_cliques';
    else if (eventType === 'bounced' || eventType === 'hardBounced' || eventType === 'softBounced' || eventType === 'spam' || eventType === 'invalid') updateField = 'total_falhas';

    // 4. INCREMENTAR AS ESTATÍSTICAS
    if (updateField) {
      const { data: campanha } = await supabaseAdmin
        .from('email_broadcasts')
        .select(updateField)
        .eq('id', broadcastId)
        .single();

      // Sem erros de TypeScript
      const valorAtual = (campanha as Record<string, any>)?.[updateField] || 0;

      await supabaseAdmin
        .from('email_broadcasts')
        .update({ [updateField]: valorAtual + 1 })
        .eq('id', broadcastId);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err: any) {
    console.error("Erro no Webhook da Brevo:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}