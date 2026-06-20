"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function FormContactoCampo({ 
  campoId, 
  organizadorId, 
  nomeCampo, 
  dict, 
  isEn, 
  lang 
}: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const [form, setForm] = useState({
    nome: "", apelido: "", email: "", telefone: "", idade: "", mensagem: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const nomeCompleto = `${form.nome} ${form.apelido}`.trim();
      let userIdFinal = null;

      // 1. Verificar se o Pai/Cliente já existe na Plataforma
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        userIdFinal = session.user.id;
      } else {
        // Tentar encontrar/criar o user em background
        const { data: existingUser } = await supabase.from('perfis').select('id').eq('email', form.email).single();
        
        if (existingUser) {
          userIdFinal = existingUser.id;
        } else {
          // Geração de conta "silenciosa" (Pai vai receber email de boas-vindas)
          const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
          const { data: newUser } = await supabase.auth.signUp({
            email: form.email,
            password: randomPassword,
            options: { data: { nome_completo: nomeCompleto, role: 'cliente' } }
          });
          
          if (newUser.user) {
            userIdFinal = newUser.user.id;
            await supabase.from('perfis').upsert({
              id: userIdFinal, email: form.email, nome_completo: nomeCompleto, telefone: form.telefone, role: 'cliente'
            });

            // Dispara email de boas-vindas da conta criada passivamente
            fetch('/api/notificacoes/boas-vindas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: form.email, nome: nomeCompleto, role: 'cliente', lang })
            }).catch(() => {});
          }
        }
      }

      if (!userIdFinal) throw new Error("Erro ao identificar o utilizador.");

      // 2. Injetar a mensagem na Inbox Universal
      const prefixoIdade = form.idade ? `(Interessado para ${form.idade} anos) ` : '';
      const textoFinal = `📢 [Nova Questão] ${prefixoIdade}\n\n${form.mensagem}`;

      await supabase.from('mensagens').insert([{
        campo_id: campoId,
        sender_id: userIdFinal,
        receiver_id: organizadorId,
        texto: textoFinal
      }]);

      // 3. (Opcional) Poderia disparar aqui um email direto via API para o parceiro 
      // a avisar "Tem uma nova mensagem na HelloCamp", mas a notificação visual na Inbox já funciona.

      setSucesso(true);
      
      // Se ele já estiver autenticado, reencaminha diretamente para a Inbox dele!
      if (session) {
        setTimeout(() => router.push(`/${lang}/chat`), 2000);
      }

    } catch (err) {
      console.error(err);
      alert("Houve um erro técnico. Tente novamente mais tarde.");
    }
    setLoading(false);
  };

  if (sucesso) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
        <span className="text-5xl mb-4 block">✅</span>
        <h4 className="text-xl font-black text-emerald-800 mb-2">{isEn ? 'Message Sent Successfully!' : 'Mensagem Enviada com Sucesso!'}</h4>
        <p className="text-emerald-700 font-medium">{isEn ? 'The camp organizer will review your question. You can follow the conversation in your Dashboard.' : 'A sua mensagem foi diretamente para a Caixa de Entrada do Organizador. Se já tem sessão iniciada, será reencaminhado para o Chat.'}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.nome}</label>
          <input type="text" required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-colors" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.apelido}</label>
          <input type="text" required value={form.apelido} onChange={e => setForm({...form, apelido: e.target.value})} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-colors" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.email_encarregado}</label>
          <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-colors" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.contacto_telefonico}</label>
          <input type="tel" required value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-colors" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.idade_participante}</label>
        <input type="number" min="1" required value={form.idade} onChange={e => setForm({...form, idade: e.target.value})} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-colors" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.mensagem}</label>
        <textarea rows={4} required value={form.mensagem} onChange={e => setForm({...form, mensagem: e.target.value})} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-colors resize-none"></textarea>
      </div>
      
      <button type="submit" disabled={loading} className="self-start px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm transition-colors shadow-sm cursor-pointer">
        {loading ? (isEn ? 'Sending...' : 'A enviar...') : dict.detalhe.enviar_mensagem}
      </button>
    </form>
  );
}