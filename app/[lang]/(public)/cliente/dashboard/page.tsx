"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import React from "react";
import SugestoesMagicas from "../../components/SugestoesMagicas";

export default function DashboardCliente({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [reservas, setReservas] = useState<any[]>([]);
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [primeiraCriancaId, setPrimeiraCriancaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStripe, setLoadingStripe] = useState<string | null>(null);

  // Estados para o Modal de Partilha (Lightbox Airbnb style)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareTitle, setShareTitle] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Buscar Reservas usando cliente_id
      const { data: reservasData } = await supabase
        .from('reservas')
        .select(`*, campos ( id, nome, nome_en, imagem, local, local_en, organizador_id ), criancas ( nome )`)
        .eq('cliente_id', session.user.id) 
        .order('created_at', { ascending: false });
      setReservas(reservasData || []);

      // 2. Buscar Wishlists e contar os campos
      const { data: wishData } = await supabase
        .from('wishlists')
        .select(`id, nome, token_partilha, wishlist_campos(count)`)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      setWishlists(wishData || []);

      // 3. Buscar uma Criança para as Sugestões Mágicas
      const { data: criancasData } = await supabase.from('criancas').select('id').eq('cliente_id', session.user.id).limit(1);
      if (criancasData && criancasData.length > 0) {
        setPrimeiraCriancaId(criancasData[0].id);
      }

      setLoading(false);
    };

    fetchData();
  }, [lang]);

  // Função para pagar a segunda parcela
  const handlePagarRestante = async (reserva: any) => {
    setLoadingStripe(reserva.id);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: orgData } = await supabase
        .from('perfis')
        .select('stripe_account_id')
        .eq('id', reserva.campos.organizador_id)
        .single();

      const res = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservasIds: [reserva.id],
          totalAmount: reserva.valor_em_falta, 
          userEmail: user?.email,
          lang: lang,
          campoNome: isEn && reserva.campos.nome_en ? reserva.campos.nome_en : reserva.campos.nome,
          stripeAccountId: orgData?.stripe_account_id,
          tipoPagamento: 'pagamento_final'
        })
      });

      if (!res.ok) throw new Error("Erro de servidor ao processar pagamento.");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      alert("Erro ao iniciar pagamento: " + err.message);
      setLoadingStripe(null);
    }
  };

  const abrirModalPartilha = (token: string, nomeLista: string) => {
    const url = `${window.location.origin}/${lang}/lista/${token}`;
    setShareUrl(url);
    setShareTitle(nomeLista);
    setCopied(false);
    setIsShareModalOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-bold">{isEn ? 'Loading your dashboard...' : 'A carregar o seu resumo...'}</div>;

  return (
    <div className="max-w-[1000px] mx-auto p-4 font-sans relative">
      
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 m-0 tracking-tight">
          {isEn ? 'Upcoming Camps' : 'Próximos Campos'}
        </h1>
        <p className="text-slate-500 mt-2 text-base font-medium">
          {isEn ? 'View your active programs and child schedules.' : 'Consulte os programas ativos e as inscrições dos seus filhos.'}
        </p>
      </div>

      {primeiraCriancaId && (
        <SugestoesMagicas criancaId={primeiraCriancaId} lang={lang} />
      )}

      {/* SECÇÃO 1: RESERVAS */}
      {reservas.length === 0 ? (
        <div className="text-center p-12 sm:p-20 bg-white border-2 border-dashed border-slate-300 rounded-3xl mb-12">
          <p className="text-slate-500 text-lg mb-6 font-medium">
            {isEn ? 'No camp enrollments found yet.' : 'Ainda não inscreveu nenhum participante em programas de férias.'}
          </p>
          <Link href={`/${lang}/pesquisa`} className="inline-block bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold shadow-sm hover:bg-slate-800 transition-colors">
            {isEn ? 'Browse Camps' : 'Encontrar Programas'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {reservas.map((reserva) => {
            const campo = reserva.campos;
            const nomeCampo = isEn && campo?.nome_en ? campo.nome_en : campo?.nome;
            const localCampo = isEn && campo?.local_en ? campo.local_en : campo?.local;
            
            const isSinalPago = reserva.status_pagamento === 'Sinal Pago';
            const isPago = reserva.status_pagamento === 'Pago';
            const valorPago = Number(reserva.valor_pago) || (isPago ? reserva.valor_total : 0);
            const valorFalta = Number(reserva.valor_em_falta) || 0;

            return (
              <div key={reserva.id} className="group flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm relative">
                <Link href={`/${lang}/campo/${campo?.id}`} className="absolute inset-0 z-0"><span className="sr-only">Ver Campo</span></Link>
                
                <div className="h-48 w-full relative overflow-hidden bg-slate-100 z-10 pointer-events-none">
                  <img src={campo?.imagem || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=600'} alt={nomeCampo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-[10px] font-black tracking-widest uppercase shadow-sm">
                    {reserva.turno_nome || 'Turno'}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1 z-10 pointer-events-none">
                  <h3 className="text-xl font-black text-slate-900 m-0 leading-tight">{nomeCampo}</h3>
                  <p className="text-sm font-bold text-slate-500 mt-2 mb-6">📍 {localCampo}</p>
                  
                  <div className="border-t border-slate-100 pt-5 mt-auto flex justify-between items-end mb-4">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{isEn ? 'PARTICIPANT' : 'PARTICIPANTE'}</span>
                      <span className="text-sm font-bold text-slate-700">👦 {reserva.criancas?.nome}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">TOTAL</span>
                      <span className="text-lg font-black text-emerald-600 leading-none">{reserva.valor_total}€</span>
                    </div>
                  </div>
                </div>

                {/* PAINEL FINANCEIRO DE AÇÃO NO DASHBOARD */}
                <div className="px-6 pb-6 z-20">
                  {isSinalPago && valorFalta > 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-inner">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 m-0">Falta Pagar</p>
                        <p className="text-lg font-black text-amber-600 m-0">{valorFalta.toFixed(2)}€</p>
                      </div>
                      <button 
                        onClick={() => handlePagarRestante(reserva)}
                        disabled={loadingStripe === reserva.id}
                        className="bg-amber-600 text-white font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {loadingStripe === reserva.id ? 'A processar...' : 'Pagar Restante'}
                      </button>
                    </div>
                  ) : isPago ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                      <span className="text-xs font-black uppercase tracking-widest text-emerald-600">✓ Vaga Confirmada (100% Pago)</span>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">⏳ Pagamento Pendente</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* SECÇÃO 2: WISHLISTS */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-6">{isEn ? 'Your Wishlists' : 'As Suas Listas de Férias'}</h2>
        
        {wishlists.length === 0 ? (
          <p className="text-slate-500 font-medium text-sm">{isEn ? 'You have no saved lists yet. Tap the heart on any camp to create one!' : 'Ainda não tem listas. Clique no coração em qualquer campo para começar!'}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {wishlists.map((lista) => {
              const totalCampos = lista.wishlist_campos?.[0]?.count || 0;
              
              return (
                <div key={lista.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-40 relative group">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg mb-1">{lista.nome}</h3>
                    <p className="text-sm font-bold text-slate-500">{totalCampos} {isEn ? 'saved camps' : 'campos guardados'}</p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <Link href={`/${lang}/lista/${lista.token_partilha}`} className="text-sm font-bold text-emerald-600 hover:text-emerald-700">
                      {isEn ? 'View list' : 'Ver lista'} &rarr;
                    </Link>
                    
                    <button 
                      onClick={() => abrirModalPartilha(lista.token_partilha, lista.nome)}
                      title={isEn ? "Share List" : "Partilhar Lista"}
                      className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE PARTILHA (LIGHTBOX ESTILO AIRBNB) */}
      {isShareModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col transform transition-transform" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-xl">{isEn ? 'Share this list' : 'Partilhar esta lista'}</h3>
              <button 
                onClick={() => setIsShareModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl border border-emerald-100">
                  🏕️
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">HelloCamp Wishlist</p>
                  <p className="text-base font-black text-slate-900 leading-tight">{shareTitle}</p>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={handleCopyLink}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-900 transition-colors group text-left"
              >
                <div className="text-slate-700 group-hover:text-slate-900">
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  )}
                </div>
                <span className={`text-sm font-bold ${copied ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {copied ? (isEn ? 'Copied!' : 'Copiado!') : (isEn ? 'Copy link' : 'Copiar ligação')}
                </span>
              </button>

              <a 
                href={`mailto:?subject=${encodeURIComponent(isEn ? `HelloCamp: ${shareTitle}` : `HelloCamp: ${shareTitle}`)}&body=${encodeURIComponent(isEn ? `Check out these holiday camps I found on HelloCamp:\n\n${shareUrl}` : `Vê estes campos de férias que encontrei na HelloCamp:\n\n${shareUrl}`)}`}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-900 transition-colors group no-underline"
              >
                <div className="text-slate-700 group-hover:text-slate-900">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <span className="text-sm font-bold text-slate-800">{isEn ? 'Email' : 'Enviar e-mail'}</span>
              </a>

              <a 
                href={`https://wa.me/?text=${encodeURIComponent(isEn ? `Check out these holiday camps: ${shareUrl}` : `Vê estes campos de férias: ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-emerald-500 transition-colors group no-underline"
              >
                <div className="text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                </div>
                <span className="text-sm font-bold text-slate-800">WhatsApp</span>
              </a>

              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-600 transition-colors group no-underline"
              >
                <div className="text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </div>
                <span className="text-sm font-bold text-slate-800">Facebook</span>
              </a>

              <a 
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(isEn ? 'Check out this list on HelloCamp!' : 'Vê esta lista na HelloCamp!')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-900 transition-colors group no-underline"
              >
                <div className="text-slate-900">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.73 15H20L8.27 4H4zm14 0L10.27 15H4l7.73-15H18z"></path></svg>
                </div>
                <span className="text-sm font-bold text-slate-800">X (Twitter)</span>
              </a>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}