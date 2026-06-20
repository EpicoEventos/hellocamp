"use client";

import { useEffect, useState, use, useRef } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function InboxParceiro({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [threadAtiva, setThreadAtiva] = useState<any | null>(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [loading, setLoading] = useState(true);
  const mensagensEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCaixaDeEntrada();
    const channel = supabase.channel('chat_parceiro_geral').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, () => fetchCaixaDeEntrada()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchCaixaDeEntrada = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uid = session.user.id;
    setPartnerId(uid);

    const { data: camposData } = await supabase.from("campos").select("id").eq("organizador_id", uid);
    if (!camposData || camposData.length === 0) { setLoading(false); return; }
    const camposIds = camposData.map(c => c.id);

    const { data: reservasData } = await supabase
      .from("reservas")
      .select(`*, criancas(*)`)
      .in("campo_id", camposIds);

    const { data: msgs } = await supabase
      .from('mensagens')
      .select('*, campos(id, nome, nome_en), perfis!mensagens_sender_id_fkey(id, nome_completo, email, telefone, contacto_emergencia), perfis2:perfis!mensagens_receiver_id_fkey(id, nome_completo, email, telefone, contacto_emergencia)')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order('created_at', { ascending: true });

    if (!msgs) { setLoading(false); return; }

    const threadsMap: any = {};
    msgs.forEach((m: any) => {
      if (!m.campo_id) return; 
      
      const clientId = m.sender_id === uid ? m.receiver_id : m.sender_id;
      const clientProfile = m.sender_id === uid ? m.perfis2 : m.perfis;
      const key = `${clientId}_${m.campo_id}`;

      if (!threadsMap[key]) {
        const inscricoesDestePai = reservasData?.filter(r => r.cliente_id === clientId && r.campo_id === m.campo_id) || [];

        threadsMap[key] = {
          chave: key,
          campo: m.campos,
          cliente_id: clientId,
          cliente: clientProfile,
          reservas: inscricoesDestePai,
          mensagens: [],
          unread: 0,
          lastMsg: null
        };
      }
      threadsMap[key].mensagens.push(m);
      threadsMap[key].lastMsg = m;
      if (!m.lida && m.receiver_id === uid) threadsMap[key].unread++;
    });

    const threadsArray = Object.values(threadsMap).sort((a: any, b: any) => 
      new Date(b.lastMsg.created_at).getTime() - new Date(a.lastMsg.created_at).getTime()
    );

    setThreads(threadsArray);
    if (threadAtiva) setThreadAtiva(threadsMap[threadAtiva.chave]);
    setLoading(false);
  };

  useEffect(() => { mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [threadAtiva]);

  // AQUI ESTÁ A FUNÇÃO QUE FALTAVA!
  const abrirConversa = async (thread: any) => {
    setThreadAtiva(thread);
    if (thread.unread > 0) {
      // Marca as mensagens como lidas na base de dados
      await supabase.from("mensagens").update({ lida: true })
        .eq("campo_id", thread.campo.id)
        .eq("sender_id", thread.cliente_id)
        .eq("receiver_id", partnerId)
        .eq("lida", false);
      fetchCaixaDeEntrada();
    }
  };

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !threadAtiva || !partnerId) return;
    
    const msgTexto = novaMensagem;
    setNovaMensagem(""); 
    
    const novaMsgVisual = { id: Date.now(), sender_id: partnerId, texto: msgTexto, created_at: new Date().toISOString() };
    setThreadAtiva((prev: any) => ({ ...prev, mensagens: [...prev.mensagens, novaMsgVisual] }));

    await supabase.from("mensagens").insert([{ 
      campo_id: threadAtiva.campo.id, 
      sender_id: partnerId, 
      receiver_id: threadAtiva.cliente_id, 
      texto: msgTexto 
    }]);
  };

  if (loading) return <div className="p-10 text-center text-slate-500 font-bold animate-pulse">A preparar Caixa de Entrada...</div>;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm font-sans max-w-[1500px] mx-auto mt-4">
      
      {/* BARRA ESQUERDA: LISTA */}
      <div className={`w-full md:w-[320px] border-r border-slate-200 flex-col bg-slate-50/50 ${threadAtiva ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-slate-200 bg-white">
          <h2 className="text-2xl font-black text-slate-900 m-0">{isEn ? 'Inbox' : 'Caixa de Entrada'}</h2>
          <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">{threads.length} {isEn ? 'Active Chats' : 'Conversas Ativas'}</p>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {threads.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm font-medium">
              <div className="text-4xl mb-3">📭</div>
              {isEn ? 'No client messages available.' : 'A sua caixa de entrada está limpa.'}
            </div>
          ) : (
            threads.map(t => {
              const isActive = threadAtiva?.chave === t.chave;
              return (
                <div key={t.chave} onClick={() => abrirConversa(t)} className={`p-4 border-b border-slate-100 cursor-pointer transition-colors relative flex gap-4 ${isActive ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black uppercase flex-shrink-0 shadow-inner ${isActive ? 'bg-slate-800 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                    {t.cliente_nome?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className={`m-0 text-sm font-bold truncate pr-2 ${isActive ? 'text-white' : (t.unread > 0 ? 'text-slate-900' : 'text-slate-700')}`}>
                        {t.cliente_nome}
                      </h4>
                      <span className={`text-[10px] whitespace-nowrap ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                        {new Date(t.lastMsg.created_at).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                      </span>
                    </div>
                    <p className={`m-0 text-xs truncate ${isActive ? 'text-slate-300' : (t.unread > 0 ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium')}`}>
                      {t.lastMsg.sender_id === partnerId ? 'Tu: ' : ''}{t.lastMsg.texto}
                    </p>
                    <p className={`mt-1 mb-0 text-[9px] font-bold uppercase tracking-widest truncate ${isActive ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      🏕️ {isEn && t.campo.nome_en ? t.campo.nome_en : t.campo.nome}
                    </p>
                  </div>
                  {t.unread > 0 && !isActive && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full shadow-sm ring-2 ring-white"></div>}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* JANELA CENTRAL: CHAT */}
      <div className={`flex-1 flex-col bg-slate-50/30 ${!threadAtiva ? 'hidden md:flex' : 'flex'}`}>
        {!threadAtiva ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 font-bold text-sm">
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner">💬</div>
             {isEn ? 'Select a conversation to reply.' : 'Selecione uma conversa para responder.'}
          </div>
        ) : (
          <>
            <div className="p-4 md:px-6 md:py-5 border-b border-slate-200 bg-white shadow-sm z-10 flex items-center gap-3">
              <button onClick={() => setThreadAtiva(null)} className="md:hidden text-slate-500">&larr;</button>
              <div className="w-10 h-10 bg-emerald-100 text-emerald-800 font-black uppercase rounded-full flex items-center justify-center text-lg shadow-inner">
                {threadAtiva.cliente_nome?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="m-0 text-base md:text-lg font-black text-slate-900 truncate">{threadAtiva.cliente_nome}</h3>
                <p className="m-0 text-xs text-slate-500 font-bold truncate">Interessado(a) em: {isEn && threadAtiva.campo.nome_en ? threadAtiva.campo.nome_en : threadAtiva.campo.nome}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
              <div className="text-center mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">
                  Chat Iniciado
                </span>
              </div>

              {threadAtiva.mensagens.map((msg: any, i: number) => {
                const isMine = msg.sender_id === partnerId;
                // Formatação Especial para Mensagens Automáticas de Sistema (Ex: Alertas de Stripe)
                const isSystemMessage = msg.texto.startsWith("📢");

                if (isSystemMessage) {
                  return (
                    <div key={msg.id || i} className="flex justify-center my-2">
                      <div className="bg-slate-100 text-slate-500 text-xs font-bold px-4 py-2 rounded-xl text-center shadow-inner max-w-sm">
                        {msg.texto}
                        <div className="text-[9px] mt-1 text-slate-400">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[85%] md:max-w-[70%] p-3.5 md:p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${isMine ? 'bg-slate-900 text-white rounded-br-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'}`}>
                      {msg.texto}
                      <div className={`text-[10px] mt-1.5 text-right font-bold ${isMine ? 'text-slate-400' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={mensagensEndRef} />
            </div>

            <form onSubmit={enviarMensagem} className="p-4 bg-white border-t border-slate-200 flex gap-3">
              <div className="flex-1 bg-slate-100 rounded-2xl flex items-center px-4 py-1 border border-slate-200 focus-within:border-slate-900 focus-within:bg-white transition-colors shadow-inner">
                <input 
                  type="text" 
                  value={novaMensagem} 
                  onChange={e => setNovaMensagem(e.target.value)} 
                  placeholder="Escreva a resposta..." 
                  className="flex-1 py-3 bg-transparent outline-none text-[15px] text-slate-800" 
                />
              </div>
              <button type="submit" disabled={!novaMensagem.trim()} className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-sm ${novaMensagem.trim() ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:-translate-y-0.5' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </form>
          </>
        )}
      </div>

      {/* ABA DIREITA: HISTÓRICO CLÍNICO E LOGÍSTICO (Apenas Visível no Desktop para o Organizador) */}
      {threadAtiva && (
        <div className="hidden lg:flex w-[360px] border-l border-slate-200 flex-col bg-slate-50 p-5 overflow-y-auto">
          {/* Contactos do Encarregado */}
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{isEn ? 'Guardian Contact' : 'Contacto Encarregado'}</h3>
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-xs space-y-2 mb-6">
            <p><strong>Nome:</strong> {threadAtiva.cliente?.nome_completo || 'N/D'}</p>
            <p><strong>E-mail:</strong> {threadAtiva.cliente?.email}</p>
            <p><strong>Telemóvel:</strong> {threadAtiva.cliente?.telefone || 'N/D'}</p>
            <p className="text-red-600 font-bold"><strong>Urgência:</strong> {threadAtiva.cliente?.contacto_emergencia || 'N/D'}</p>
          </div>

          {/* Lista de Inscrições do Encarregado */}
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
            {isEn ? 'Active Participants' : 'Participantes Registados'} ({threadAtiva.reservas.length})
          </h3>
          
          <div className="space-y-4 flex-1">
            {threadAtiva.reservas.length === 0 ? (
              <p className="text-xs italic text-slate-400 font-semibold">{isEn ? 'No bookings found.' : 'Ainda não existem inscrições formais deste pai.'}</p>
            ) : (
              threadAtiva.reservas.map((res: any) => (
                <div key={res.id} className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm text-xs">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                    <span className="font-black text-sm text-slate-900">👦 {res.criancas?.nome}</span>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{res.status_pagamento}</span>
                  </div>
                  <p className="mb-1"><strong>Turno:</strong> {res.turno_nome}</p>
                  
                  {/* Bloco Clínico de Alta Importância */}
                  <div className="mt-3 bg-red-50 border border-red-200 p-2.5 rounded-lg text-[11px] text-red-950 font-medium">
                    <p className="m-0 mb-1"><strong>⚠️ Alergias/Restrições:</strong> {res.criancas?.restricoes_alimentares || 'Nenhuma declarada'}</p>
                    <p className="m-0"><strong>🩺 Perfil Médico:</strong> {res.criancas?.doencas_cronicas || 'Sem observações'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}