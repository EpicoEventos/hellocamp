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

      const { data: reservasData, error } = await supabase
        .from("reservas")
        .select(`
          id, user_id, turno_nome, status_pagamento, extras_escolhidos,
          campos (nome, nome_en),
          criancas (nome, data_nascimento, sexo, restricoes_alimentares)
        `)
        .in("campo_id", camposIds)
        .order("created_at", { ascending: false });

      if (reservasData && !error) setConversas(reservasData);
    };
    fetchConversas();
  }, []);

  useEffect(() => {
    if (!reservaAtiva || !partnerId) return;

    const fetchMensagens = async () => {
      const { data } = await supabase
        .from("mensagens")
        .select("*")
        .eq("reserva_id", reservaAtiva.id)
        .order("created_at", { ascending: true });
      
      setMensagens(data || []);
      await supabase.from("mensagens").update({ lida: true }).eq("reserva_id", reservaAtiva.id).eq("receiver_id", partnerId).eq("lida", false);
    };

    fetchMensagens();

    const channel = supabase.channel(`admin_chat_reserva_${reservaAtiva.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `reserva_id=eq.${reservaAtiva.id}` }, 
      (payload) => {
        setMensagens(prev => [...prev, payload.new]);
        setTimeout(() => mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [reservaAtiva, partnerId]);

  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !reservaAtiva || !partnerId) return;

    const parentId = reservaAtiva.user_id; 
    const msgTexto = novaMensagem;
    setNovaMensagem(""); 

    await supabase.from("mensagens").insert([{
      reserva_id: reservaAtiva.id,
      sender_id: partnerId,
      receiver_id: parentId,
      texto: msgTexto
    }]);
  };

  const obterIdade = (dataNasc: string) => {
    if (!dataNasc) return 0;
    const diff = Date.now() - new Date(dataNasc).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 180px)', backgroundColor: 'white', borderRadius: '1.25rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      
      {/* BARRA LATERAL (INBOX) */}
      <div style={{ width: '350px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>Mensagens</h2>
          <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', marginTop: '0.25rem' }}>{conversas.length} Clientes Ativos</p>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {conversas.length === 0 ? (
            <p style={{ padding: '2rem', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>Não existem mensagens de clientes.</p>
          ) : (
            conversas.map(conv => {
              const isActive = reservaAtiva?.id === conv.id;
              return (
                <div key={conv.id} onClick={() => setReservaAtiva(conv)} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', backgroundColor: isActive ? '#f0fdf4' : 'transparent', transition: 'background-color 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{conv.criancas?.nome}</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{conv.campos?.nome}</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>{conv.turno_nome}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* JANELA DE CHAT (REPLICA WHATSAPP/AIRBNB) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
        {!reservaAtiva ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 'bold', flexDirection: 'column', gap: '1rem' }}>
            <span style={{ fontSize: '3rem' }}>💬</span>
            Selecione uma reserva para comunicar com o cliente.
          </div>
        ) : (
          <>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#0369a1', fontSize: '14px' }}>
                  {reservaAtiva.criancas?.nome.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>Encarregado de: {reservaAtiva.criancas?.nome}</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>Reserva #{reservaAtiva.id.toString().slice(0,6)}</p>
                </div>
              </div>

              {/* BARRA DE CONTEXTO DO PARTICIPANTE */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '11px', fontWeight: 'bold', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0' }}>
                <span style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>{obterIdade(reservaAtiva.criancas?.data_nascimento)} anos ({reservaAtiva.criancas?.sexo})</span>
                {reservaAtiva.criancas?.restricoes_alimentares && reservaAtiva.criancas.restricoes_alimentares.toLowerCase() !== 'nenhuma' && (
                  <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>⚠️ {reservaAtiva.criancas.restricoes_alimentares}</span>
                )}
                {reservaAtiva.extras_escolhidos && reservaAtiva.extras_escolhidos.length > 0 && (
                  <span style={{ backgroundColor: '#fefce8', color: '#854d0e', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>➕ {reservaAtiva.extras_escolhidos.join(', ')}</span>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#f8fafc' }}>
              {mensagens.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'white', borderRadius: '1rem', border: '1px dashed #cbd5e1', margin: 'auto' }}>
                  <p style={{ color: '#0f172a', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Chat Aberto</p>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Dê as boas vindas ao encarregado de educação.</p>
                </div>
              ) : (
                mensagens.map((msg) => {
                  const isMine = msg.sender_id === partnerId;
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '70%', padding: '0.875rem 1.25rem', borderRadius: '1.25rem', backgroundColor: isMine ? '#0f172a' : '#ffffff', color: isMine ? 'white' : '#1e293b', border: isMine ? 'none' : '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '14px', lineHeight: '1.5', borderBottomRightRadius: isMine ? '0.25rem' : '1.25rem', borderBottomLeftRadius: !isMine ? '0.25rem' : '1.25rem' }}>
                        {msg.texto}
                        <div style={{ fontSize: '10px', marginTop: '0.5rem', textAlign: 'right', color: isMine ? '#94a3b8' : '#94a3b8', fontWeight: 'bold' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={mensagensEndRef} />
            </div>

            <form onSubmit={enviarMensagem} style={{ padding: '1.25rem 1.5rem', backgroundColor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '1rem' }}>
              <input type="text" value={novaMensagem} onChange={e => setNovaMensagem(e.target.value)} placeholder="Escreva a sua mensagem para o cliente..." style={{ flex: 1, padding: '1rem 1.25rem', borderRadius: '999px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s' }} onFocus={e => e.target.style.borderColor = '#0f172a'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
              <button type="submit" disabled={!novaMensagem.trim()} style={{ backgroundColor: novaMensagem.trim() ? '#059669' : '#e2e8f0', color: novaMensagem.trim() ? 'white' : '#94a3b8', padding: '0 1.75rem', borderRadius: '999px', fontWeight: '900', border: 'none', cursor: novaMensagem.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                Enviar
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}