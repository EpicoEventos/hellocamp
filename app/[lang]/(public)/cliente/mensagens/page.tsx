"use client";

import { useEffect, useState, use, useRef } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";
import Link from "next/link";

export default function ChatCliente({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [userId, setUserId] = useState<string | null>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [threadAtiva, setThreadAtiva] = useState<any | null>(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [loading, setLoading] = useState(true);
  const mensagensEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCaixaDeEntrada();
    const channel = supabase.channel('chat_cliente_geral')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, () => fetchCaixaDeEntrada())
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchCaixaDeEntrada = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uid = session.user.id;
    setUserId(uid);

    // 1. Puxar todas as reservas e filhos deste pai para cruzar na barra lateral
    const { data: reservasData } = await supabase
      .from('reservas')
      .select('*, criancas(*)')
      .eq('cliente_id', uid);

    // 2. Puxar as mensagens do utilizador
    const { data: msgs } = await supabase
      .from('mensagens')
      .select('*, campos(id, nome, nome_en, organizador_id, local, imagem, preco)')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order('created_at', { ascending: true });

    if (!msgs) { setLoading(false); return; }

    const threadsMap: any = {};
    msgs.forEach(m => {
      const campId = m.campo_id;
      if (!campId) return;

      if (!threadsMap[campId]) {
        // Filtra todas as reservas que este pai tem neste campo específico
        const reservasDoCampo = reservasData?.filter(r => r.campo_id === campId) || [];

        threadsMap[campId] = {
          campo: m.campos,
          partner_id: m.campos.organizador_id,
          mensagens: [],
          reservas: reservasDoCampo, // Injetado para a aba direita
          unread: 0,
          lastMsg: null
        };
      }
      threadsMap[campId].mensagens.push(m);
      threadsMap[campId].lastMsg = m;
      if (!m.lida && m.receiver_id === uid) threadsMap[campId].unread++;
    });

    const threadsArray = Object.values(threadsMap).sort((a: any, b: any) => 
      new Date(b.lastMsg.created_at).getTime() - new Date(a.lastMsg.created_at).getTime()
    );

    setThreads(threadsArray);
    setThreadAtiva((prev: any) => prev ? threadsMap[prev.campo.id] : null);
    setLoading(false);
  };

  useEffect(() => { mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [threadAtiva]);

  const abrirConversa = async (thread: any) => {
    setThreadAtiva(thread);
    if (thread.unread > 0) {
      await supabase.from("mensagens").update({ lida: true })
        .eq("campo_id", thread.campo.id)
        .eq("receiver_id", userId)
        .eq("lida", false);
      fetchCaixaDeEntrada();
    }
  };

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !threadAtiva || !userId) return;
    
    const msgTexto = novaMensagem;
    setNovaMensagem(""); 
    
    const novaMsgVisual = { id: Date.now(), sender_id: userId, texto: msgTexto, created_at: new Date().toISOString() };
    setThreadAtiva((prev: any) => ({ ...prev, mensagens: [...prev.mensagens, novaMsgVisual] }));

    await supabase.from("mensagens").insert([{ 
      campo_id: threadAtiva.campo.id, 
      sender_id: userId, 
      receiver_id: threadAtiva.partner_id, 
      texto: msgTexto 
    }]);
  };

  if (loading) return <div className="p-10 text-center text-slate-500 font-bold animate-pulse">A carregar mensagens...</div>;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm font-sans max-w-[1400px] mx-auto mt-4">
      
      {/* BARRA LATERAL ESQUERDA: LISTA DE CHATS */}
      <div className={`w-full md:w-[320px] border-r border-slate-200 flex-col bg-slate-50/50 ${threadAtiva ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-black text-slate-900 m-0">{isEn ? 'Inbox' : 'Mensagens'}</h2>
        </div>
        <div className="overflow-y-auto flex-1">
          {threads.map(t => {
            const nomeCampo = isEn && t.campo.nome_en ? t.campo.nome_en : t.campo.nome;
            const isActive = threadAtiva?.campo.id === t.campo.id;
            return (
              <div key={t.campo.id} onClick={() => abrirConversa(t)} className={`p-4 border-b border-slate-100 cursor-pointer transition-colors relative flex gap-3 ${isActive ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}>
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-md flex-shrink-0">⛺</div>
                <div className="flex-1 min-w-0">
                  <h4 className="m-0 text-sm font-bold truncate text-slate-900 mb-0.5">{nomeCampo}</h4>
                  <p className="m-0 text-xs truncate text-slate-500 font-medium">{t.lastMsg.texto}</p>
                </div>
                {t.unread > 0 && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2.5 h-3 bg-emerald-500 rounded-full"></div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* JANELA CENTRAL: CHAT */}
      <div className={`flex-1 flex-col bg-slate-50/30 ${!threadAtiva ? 'hidden md:flex' : 'flex'}`}>
        {!threadAtiva ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 font-bold text-sm">
            📬 {isEn ? 'Select a conversation' : 'Selecione uma conversa ao lado'}
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-4 shadow-sm z-10">
              <button onClick={() => setThreadAtiva(null)} className="md:hidden text-slate-500 font-bold">&larr;</button>
              <h3 className="m-0 text-base font-black text-slate-900 truncate">
                {isEn && threadAtiva.campo.nome_en ? threadAtiva.campo.nome_en : threadAtiva.campo.nome}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {threadAtiva.mensagens.map((msg: any, i: number) => {
                const isMine = msg.sender_id === userId;
                return (
                  <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${isMine ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'}`}>
                      {msg.texto}
                    </div>
                  </div>
                );
              })}
              <div ref={mensagensEndRef} />
            </div>

            <form onSubmit={enviarMensagem} className="p-4 bg-white border-t border-slate-200 flex gap-3">
              <input type="text" value={novaMensagem} onChange={e => setNovaMensagem(e.target.value)} placeholder={isEn ? "Type a message..." : "Escreva uma mensagem..."} className="flex-1 p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm focus:border-emerald-500 focus:bg-white" />
              <button type="submit" disabled={!novaMensagem.trim()} className="p-3 bg-slate-900 text-white font-bold rounded-xl text-sm">Enviar</button>
            </form>
          </>
        )}
      </div>

      {/* ABA DIREITA: LOGÍSTICA DAS RESERVAS (Apenas Visível no Desktop se houver chat aberto) */}
      {threadAtiva && (
        <div className="hidden xl:flex w-[320px] border-l border-slate-200 flex-col bg-slate-50 p-5 overflow-y-auto">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{isEn ? 'Camp Details' : 'O Programa'}</h3>
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-6">
            <img src={threadAtiva.campo.imagem || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=300'} className="w-full h-24 object-cover rounded-lg mb-3" />
            <h4 className="font-bold text-slate-900 text-sm m-0 leading-tight">{isEn && threadAtiva.campo.nome_en ? threadAtiva.campo.nome_en : threadAtiva.campo.nome}</h4>
            <p className="text-xs text-slate-500 font-bold mt-1 mb-0">📍 {threadAtiva.campo.local}</p>
          </div>

          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
            {isEn ? 'My Enrollments' : 'Inscrições Efetuadas'} ({threadAtiva.reservas.length})
          </h3>
          
          <div className="space-y-3 flex-1">
            {threadAtiva.reservas.length === 0 ? (
              <p className="text-xs italic text-slate-400 font-semibold">{isEn ? 'No active bookings yet.' : 'Nenhuma inscrição ativa neste campo.'}</p>
            ) : (
              threadAtiva.reservas.map((res: any) => (
                <div key={res.id} className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black text-slate-900">👦 {res.criancas?.nome}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${res.status_pagamento === 'Pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{res.status_pagamento}</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 m-0">🗓️ {res.turno_nome}</p>
                  <p className="text-xs font-black text-emerald-600 mt-2 mb-0 text-right">{res.valor_total}€</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}