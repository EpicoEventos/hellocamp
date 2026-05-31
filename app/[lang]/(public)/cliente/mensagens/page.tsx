"use client";

import { useEffect, useState, use, useRef } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function ChatCliente({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [userId, setUserId] = useState<string | null>(null);
  const [conversas, setConversas] = useState<any[]>([]);
  const [reservaAtiva, setReservaAtiva] = useState<any | null>(null);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const mensagensEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversas = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);
      const { data } = await supabase.from("reservas").select(`id, turno_nome, status_pagamento, valor_total, campos (id, nome, nome_en, organizador_id, local, local_en), criancas (nome, data_nascimento)`).eq("user_id", session.user.id).order("created_at", { ascending: false });
      if (data) setConversas(data);
    };
    fetchConversas();
  }, []);

  useEffect(() => {
    if (!reservaAtiva || !userId) return;
    const fetchMensagens = async () => {
      const { data } = await supabase.from("mensagens").select("*").eq("reserva_id", reservaAtiva.id).order("created_at", { ascending: true });
      setMensagens(data || []);
      await supabase.from("mensagens").update({ lida: true }).eq("reserva_id", reservaAtiva.id).eq("receiver_id", userId).eq("lida", false);
    };
    fetchMensagens();

    const channel = supabase.channel(`chat_reserva_${reservaAtiva.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `reserva_id=eq.${reservaAtiva.id}` }, (payload) => {
      setMensagens(prev => [...prev, payload.new]);
      setTimeout(() => mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [reservaAtiva, userId]);

  useEffect(() => { mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensagens]);

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !reservaAtiva || !userId) return;
    const partnerId = reservaAtiva.campos.organizador_id;
    const msgTexto = novaMensagem;
    setNovaMensagem(""); 
    await supabase.from("mensagens").insert([{ reserva_id: reservaAtiva.id, sender_id: userId, receiver_id: partnerId, texto: msgTexto }]);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-160px)] bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      
      {/* BARRA LATERAL (Esconde no Mobile se um chat estiver aberto) */}
      <div className={`w-full md:w-[320px] border-r border-slate-200 flex-col bg-slate-50 ${reservaAtiva ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-black text-slate-900 m-0">{isEn ? 'Messages' : 'Mensagens'}</h2>
        </div>
        <div className="overflow-y-auto flex-1">
          {conversas.length === 0 ? (
            <p className="p-6 text-slate-500 text-sm text-center">{isEn ? 'No reservations yet.' : 'Ainda não tem reservas.'}</p>
          ) : (
            conversas.map(conv => {
              const nomeCampo = isEn && conv.campos.nome_en ? conv.campos.nome_en : conv.campos.nome;
              const isActive = reservaAtiva?.id === conv.id;
              return (
                <div key={conv.id} onClick={() => setReservaAtiva(conv)} className={`p-5 border-b border-slate-100 cursor-pointer transition-colors ${isActive ? 'bg-emerald-50' : 'hover:bg-slate-100'}`}>
                  <h4 className={`m-0 text-sm font-bold truncate ${isActive ? 'text-emerald-700' : 'text-slate-900'}`}>{nomeCampo}</h4>
                  <p className="my-1 text-xs text-slate-500 font-medium">👦 {conv.criancas?.nome}</p>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase font-bold">{conv.turno_nome}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* JANELA DE CHAT (Esconde no Mobile se NENHUM chat estiver aberto) */}
      <div className={`flex-1 flex-col bg-white ${!reservaAtiva ? 'hidden md:flex' : 'flex'}`}>
        {!reservaAtiva ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 font-bold text-sm">
            {isEn ? 'Select a reservation to start chatting' : 'Selecione uma reserva para abrir o chat'}
          </div>
        ) : (
          <>
            <div className="p-4 md:p-5 border-b border-slate-200 bg-white flex flex-col gap-2 relative">
              <button onClick={() => setReservaAtiva(null)} className="md:hidden self-start mb-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                &larr; {isEn ? 'Back' : 'Voltar'}
              </button>
              <h3 className="m-0 text-base md:text-lg font-black text-slate-900 truncate">
                {isEn && reservaAtiva.campos.nome_en ? reservaAtiva.campos.nome_en : reservaAtiva.campos.nome}
              </h3>
              <div className="flex gap-4 text-xs text-slate-500 font-bold">
                <span className="truncate">📍 {isEn && reservaAtiva.campos.local_en ? reservaAtiva.campos.local_en : reservaAtiva.campos.local}</span>
                <span>{isEn ? 'Status:' : 'Pagamento:'} <span className={reservaAtiva.status_pagamento === 'Pago' ? 'text-emerald-600' : 'text-amber-600'}>{reservaAtiva.status_pagamento}</span></span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 bg-slate-50">
              {mensagens.length === 0 ? (
                <div className="text-center p-6 bg-white rounded-xl border border-slate-200 m-auto max-w-sm">
                  <p className="text-slate-900 font-bold mb-2">{isEn ? 'Chat is open' : 'Canal Aberto'}</p>
                  <p className="text-slate-500 text-sm m-0">{isEn ? 'Send a message to the camp organizers.' : 'Envie a sua dúvida diretamente à organização.'}</p>
                </div>
              ) : (
                mensagens.map((msg) => {
                  const isMine = msg.sender_id === userId;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${isMine ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'}`}>
                        {msg.texto}
                        <div className={`text-[10px] mt-2 text-right font-bold ${isMine ? 'text-emerald-200' : 'text-slate-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={mensagensEndRef} />
            </div>

            <form onSubmit={enviarMensagem} className="p-3 md:p-5 bg-white border-t border-slate-200 flex gap-2 md:gap-4">
              <input type="text" value={novaMensagem} onChange={e => setNovaMensagem(e.target.value)} placeholder={isEn ? "Write a message..." : "Escreva uma mensagem..."} className="flex-1 p-3 rounded-full border border-slate-300 bg-slate-50 outline-none text-sm focus:border-emerald-500" />
              <button type="submit" disabled={!novaMensagem.trim()} className={`px-5 md:px-6 rounded-full font-bold text-sm transition-colors ${novaMensagem.trim() ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                {isEn ? 'Send' : 'Enviar'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}