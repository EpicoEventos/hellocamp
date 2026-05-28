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

      const { data, error } = await supabase
        .from("reservas")
        .select(`
          id, turno_nome, status_pagamento, valor_total,
          campos (id, nome, nome_en, organizador_id, local, local_en),
          criancas (nome, data_nascimento)
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (data && !error) setConversas(data);
    };
    fetchConversas();
  }, []);

  useEffect(() => {
    if (!reservaAtiva || !userId) return;

    const fetchMensagens = async () => {
      const { data } = await supabase
        .from("mensagens")
        .select("*")
        .eq("reserva_id", reservaAtiva.id)
        .order("created_at", { ascending: true });
      
      setMensagens(data || []);
      await supabase.from("mensagens").update({ lida: true }).eq("reserva_id", reservaAtiva.id).eq("receiver_id", userId).eq("lida", false);
    };

    fetchMensagens();

    const channel = supabase.channel(`chat_reserva_${reservaAtiva.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `reserva_id=eq.${reservaAtiva.id}` }, 
      (payload) => {
        setMensagens(prev => [...prev, payload.new]);
        setTimeout(() => mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [reservaAtiva, userId]);

  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !reservaAtiva || !userId) return;

    const partnerId = reservaAtiva.campos.organizador_id;
    const msgTexto = novaMensagem;
    setNovaMensagem(""); 

    await supabase.from("mensagens").insert([{
      reserva_id: reservaAtiva.id,
      sender_id: userId,
      receiver_id: partnerId,
      texto: msgTexto
    }]);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)', backgroundColor: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      
      {/* BARRA LATERAL */}
      <div style={{ width: '320px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>{isEn ? 'Messages' : 'Mensagens'}</h2>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {conversas.length === 0 ? (
            <p style={{ padding: '1.5rem', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>{isEn ? 'No reservations yet.' : 'Ainda não tem reservas.'}</p>
          ) : (
            conversas.map(conv => {
              const nomeCampo = isEn && conv.campos.nome_en ? conv.campos.nome_en : conv.campos.nome;
              const isActive = reservaAtiva?.id === conv.id;
              
              return (
                <div key={conv.id} onClick={() => setReservaAtiva(conv)} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', backgroundColor: isActive ? '#ecfdf5' : 'transparent', transition: 'background-color 0.2s' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: isActive ? '#059669' : '#0f172a' }}>{nomeCampo}</h4>
                  <p style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>👦 {conv.criancas?.nome}</p>
                  <span style={{ fontSize: '10px', backgroundColor: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: 'bold' }}>{conv.turno_nome}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* JANELA DE CHAT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
        {!reservaAtiva ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 'bold' }}>
            {isEn ? 'Select a reservation to start chatting' : 'Selecione uma reserva para abrir o chat'}
          </div>
        ) : (
          <>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>
                Organização: {isEn && reservaAtiva.campos.nome_en ? reservaAtiva.campos.nome_en : reservaAtiva.campos.nome}
              </h3>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
                <span>📍 {isEn && reservaAtiva.campos.local_en ? reservaAtiva.campos.local_en : reservaAtiva.campos.local}</span>
                <span>• Pagamento: <span style={{ color: reservaAtiva.status_pagamento === 'Pago' ? '#059669' : '#ea580c' }}>{reservaAtiva.status_pagamento}</span></span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#f8fafc' }}>
              {mensagens.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'white', borderRadius: '1rem', border: '1px dashed #cbd5e1', margin: 'auto' }}>
                  <p style={{ color: '#0f172a', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>{isEn ? 'Chat is open' : 'Canal Aberto'}</p>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>{isEn ? 'Send a message to the camp organizers.' : 'Envie a sua dúvida diretamente à organização do campo.'}</p>
                </div>
              ) : (
                mensagens.map((msg) => {
                  const isMine = msg.sender_id === userId;
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '75%', padding: '0.875rem 1.25rem', borderRadius: '1.25rem', backgroundColor: isMine ? '#059669' : '#ffffff', color: isMine ? 'white' : '#1e293b', border: isMine ? 'none' : '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '14px', lineHeight: '1.5', borderBottomRightRadius: isMine ? '0.25rem' : '1.25rem', borderBottomLeftRadius: !isMine ? '0.25rem' : '1.25rem' }}>
                        {msg.texto}
                        <div style={{ fontSize: '10px', marginTop: '0.5rem', textAlign: 'right', color: isMine ? '#a7f3d0' : '#94a3b8', fontWeight: 'bold' }}>
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
              <input type="text" value={novaMensagem} onChange={e => setNovaMensagem(e.target.value)} placeholder={isEn ? "Write a message..." : "Escreva uma mensagem..."} style={{ flex: 1, padding: '1rem 1.25rem', borderRadius: '999px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s' }} onFocus={e => e.target.style.borderColor = '#0f172a'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
              <button type="submit" disabled={!novaMensagem.trim()} style={{ backgroundColor: novaMensagem.trim() ? '#0f172a' : '#e2e8f0', color: novaMensagem.trim() ? 'white' : '#94a3b8', padding: '0 1.75rem', borderRadius: '999px', fontWeight: '900', border: 'none', cursor: novaMensagem.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                {isEn ? 'Send' : 'Enviar'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}