"use client";

import { useEffect, useState, use, useRef } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function InboxParceiro({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [conversas, setConversas] = useState<any[]>([]);
  const [reservaAtiva, setReservaAtiva] = useState<any | null>(null);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const mensagensEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversas = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setPartnerId(session.user.id);
      const { data: camposData } = await supabase.from("campos").select("id").eq("organizador_id", session.user.id);
      if (!camposData || camposData.length === 0) return;
      const camposIds = camposData.map(c => c.id);
      const { data } = await supabase.from("reservas").select(`id, user_id, turno_nome, status_pagamento, extras_escolhidos, campos (nome, nome_en), criancas (nome, data_nascimento, sexo, restricoes_alimentares)`).in("campo_id", camposIds).order("created_at", { ascending: false });
      if (data) setConversas(data);
    };
    fetchConversas();
  }, []);

  useEffect(() => {
    if (!reservaAtiva || !partnerId) return;
    const fetchMensagens = async () => {
      const { data } = await supabase.from("mensagens").select("*").eq("reserva_id", reservaAtiva.id).order("created_at", { ascending: true });
      setMensagens(data || []);
      await supabase.from("mensagens").update({ lida: true }).eq("reserva_id", reservaAtiva.id).eq("receiver_id", partnerId).eq("lida", false);
    };
    fetchMensagens();
    const channel = supabase.channel(`admin_chat_reserva_${reservaAtiva.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `reserva_id=eq.${reservaAtiva.id}` }, (payload) => {
      setMensagens(prev => [...prev, payload.new]);
      setTimeout(() => mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [reservaAtiva, partnerId]);

  useEffect(() => { mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensagens]);

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !reservaAtiva || !partnerId) return;
    const parentId = reservaAtiva.user_id; 
    await supabase.from("mensagens").insert([{ reserva_id: reservaAtiva.id, sender_id: partnerId, receiver_id: parentId, texto: novaMensagem }]);
    setNovaMensagem(""); 
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-160px)] bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      
      {/* LISTA (Esconde no Mobile se um chat estiver ativo) */}
      <div className={`w-full md:w-[350px] border-r border-slate-200 flex-col bg-slate-50 ${reservaAtiva ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-black text-slate-900 m-0">{isEn ? 'Messages' : 'Mensagens'}</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">{conversas.length} {isEn ? 'Active Clients' : 'Clientes Ativos'}</p>
        </div>
        <div className="overflow-y-auto flex-1">
          {conversas.length === 0 ? (
            <p className="p-6 text-slate-500 text-sm text-center">{isEn ? 'No client messages available.' : 'Não existem mensagens.'}</p>
          ) : (
            conversas.map(conv => {
              const isActive = reservaAtiva?.id === conv.id;
              return (
                <div key={conv.id} onClick={() => setReservaAtiva(conv)} className={`p-5 border-b border-slate-100 cursor-pointer transition-colors ${isActive ? 'bg-emerald-50' : 'hover:bg-slate-100'}`}>
                  <h4 className={`m-0 text-sm font-bold truncate ${isActive ? 'text-emerald-700' : 'text-slate-900'}`}>{conv.criancas?.nome}</h4>
                  <p className="m-0 text-xs text-slate-500 font-medium truncate">{isEn && conv.campos?.nome_en ? conv.campos.nome_en : conv.campos?.nome}</p>
                  <p className="mt-1 mb-0 text-[10px] text-slate-400 font-bold uppercase">{conv.turno_nome}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CHAT (Esconde no Mobile se NENHUM chat estiver ativo) */}
      <div className={`flex-1 flex-col bg-white ${!reservaAtiva ? 'hidden md:flex' : 'flex'}`}>
        {!reservaAtiva ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 font-bold text-sm">
            💬 {isEn ? 'Select a booking to communicate.' : 'Selecione uma reserva para comunicar.'}
          </div>
        ) : (
          <>
            <div className="p-4 md:p-5 border-b border-slate-200 bg-white flex flex-col gap-3">
              <button onClick={() => setReservaAtiva(null)} className="md:hidden self-start text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                &larr; {isEn ? 'Back' : 'Voltar'}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-600 text-sm flex-shrink-0">
                  {reservaAtiva.criancas?.nome.charAt(0)}
                </div>
                <div className="truncate">
                  <h3 className="m-0 text-sm md:text-base font-black text-slate-900 truncate">{isEn ? 'Guardian of: ' : 'Encarregado de: '}{reservaAtiva.criancas?.nome}</h3>
                  <p className="m-0 text-xs text-slate-500 font-bold">{isEn ? 'Booking #' : 'Reserva #'}{reservaAtiva.id.toString().slice(0,6)}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 bg-slate-50">
              {mensagens.length === 0 ? (
                <div className="text-center p-6 bg-white rounded-xl border border-slate-200 m-auto max-w-sm">
                  <p className="text-slate-900 font-bold mb-2">{isEn ? 'Chat Opened' : 'Chat Aberto'}</p>
                </div>
              ) : (
                mensagens.map((msg) => {
                  const isMine = msg.sender_id === partnerId;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${isMine ? 'bg-slate-900 text-white rounded-br-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'}`}>
                        {msg.texto}
                        <div className={`text-[10px] mt-2 text-right font-bold ${isMine ? 'text-slate-400' : 'text-slate-400'}`}>
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
              <input type="text" value={novaMensagem} onChange={e => setNovaMensagem(e.target.value)} placeholder={isEn ? "Write your message..." : "Escreva a sua mensagem..."} className="flex-1 p-3 rounded-full border border-slate-300 bg-slate-50 outline-none text-sm focus:border-slate-900" />
              <button type="submit" disabled={!novaMensagem.trim()} className={`px-5 md:px-6 rounded-full font-bold text-sm transition-colors ${novaMensagem.trim() ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                {isEn ? 'Send' : 'Enviar'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}