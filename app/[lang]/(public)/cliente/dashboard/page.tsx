"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import React from "react";

export default function DashboardCliente({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [loadingStripe, setLoadingStripe] = useState<string | null>(null);

  // Dados do Pai e Avisos
  const [perfilPai, setPerfilPai] = useState<any>(null);
  const [dadosEmFalta, setDadosEmFalta] = useState<string[]>([]);

  // Estado para controlar a Lightbox de Completar Perfil
  const [isPerfilModalOpen, setIsPerfilModalOpen] = useState(false);
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [perfilForm, setPerfilForm] = useState({
    nome_completo: "",
    nif: "",
    telefone: "",
    contacto_emergencia: ""
  });

  // Listas de Dados Planos
  const [reservas, setReservas] = useState<any[]>([]);
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [sugestoesVerdes, setSugestoesVerdes] = useState<any[]>([]);

  // Estado para o Modal Detalhado da Reserva
  const [reservaModal, setReservaModal] = useState<any>(null);
  
  // Estado para gerir o fluxo de Cancelamento dentro da Lightbox
  const [cancelState, setCancelState] = useState({ loading: false, confirm: false });

  // Estados para o Modal de Partilha (Lightbox)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareTitle, setShareTitle] = useState("");
  const [copied, setCopied] = useState(false);

  const verificarFaltas = (dados: any) => {
    const faltas = [];
    if (!dados.nome_completo || dados.nome_completo.trim() === "") faltas.push(isEn ? 'Full Name' : 'Nome do Encarregado de Educação');
    if (!dados.nif || dados.nif.trim() === "") faltas.push('NIF (Para Faturação)');
    if (!dados.telefone || dados.telefone.trim() === "") faltas.push(isEn ? 'Phone Number' : 'Número de Telemóvel');
    if (!dados.contacto_emergencia || dados.contacto_emergencia.trim() === "") faltas.push(isEn ? 'Emergency Contact' : 'Contacto de Emergência Alternativo');
    return faltas;
  };

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;

    // Busca Plana e Segura de tabelas paralelas
    const { data: perfilData } = await supabase.from('perfis').select('*').eq('id', userId).single();
    const { data: reservasData } = await supabase.from('reservas').select('*').eq('cliente_id', userId).order('created_at', { ascending: false });
    
    // CRÍTICO: Buscar APENAS campos visíveis e com contrato aprovado para gerar sugestões seguras
    const { data: camposData } = await supabase
      .from('campos')
      .select('id, nome, nome_en, imagem, local, local_en, organizador_id, preco, politica_cancelamento')
      .eq('status_aprovacao', 'Aprovado')
      .eq('ativo', true);

    const { data: criancasData } = await supabase.from('criancas').select('*').eq('cliente_id', userId);
    const { data: wishData } = await supabase.from('wishlists').select('id, nome, token_partilha').eq('user_id', userId).order('created_at', { ascending: false });

    if (perfilData) {
      setPerfilPai(perfilData);
      setPerfilForm({
        nome_completo: perfilData.nome_completo || "",
        nif: perfilData.nif || "",
        telefone: perfilData.telefone || "",
        contacto_emergencia: perfilData.contacto_emergencia || ""
      });
      setDadosEmFalta(verificarFaltas(perfilData));
    }

    // Cruzamento Manual de Reservas
    const camposCompradosIds: string[] = [];
    if (reservasData) {
      // Como o camposData agora só tem aprovados, para o cruzamento de reservas (histórico) 
      // precisamos de buscar os dados do campo específico, mesmo se entretanto tiver sido desativado
      // É mais seguro fazer um fetch isolado dos IDs da reserva
      const idsDeCamposReservados = Array.from(new Set(reservasData.map(r => r.campo_id)));
      
      const { data: todosCamposHistorico } = await supabase
        .from('campos')
        .select('id, nome, nome_en, imagem, local, local_en, organizador_id, preco, politica_cancelamento')
        .in('id', idsDeCamposReservados);

      const reservasCruzadas = reservasData.map(res => {
        const campo = todosCamposHistorico?.find(c => c.id === res.campo_id) || {};
        const crianca = criancasData?.find(cr => cr.id === res.crianca_id) || {};
        camposCompradosIds.push(res.campo_id);

        return { ...res, campos: campo, criancas: crianca };
      });
      setReservas(reservasCruzadas);
    }

    // Gerar Sugestões de Conversão (Apenas sobre campos válidos, não comprados)
    if (camposData) {
      const recomendacoes = camposData
        .filter(c => !camposCompradosIds.includes(c.id))
        .slice(0, 3);
      setSugestoesVerdes(recomendacoes);
    }

    setWishlists(wishData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [lang, isEn]);

  const handleSavePerfil = async () => {
    if (!perfilForm.nome_completo || !perfilForm.nif || !perfilForm.telefone || !perfilForm.contacto_emergencia) {
      alert(isEn ? "Please fill in all required fields." : "Por favor preencha todos os campos obrigatórios.");
      return;
    }

    setSavingPerfil(true);

    const { error } = await supabase
      .from('perfis')
      .update({
        nome_completo: perfilForm.nome_completo,
        nif: perfilForm.nif,
        telefone: perfilForm.telefone,
        contacto_emergencia: perfilForm.contacto_emergencia
      })
      .eq('id', perfilPai.id);

    if (error) {
      alert((isEn ? "Error updating profile: " : "Erro ao atualizar perfil: ") + error.message);
    } else {
      setPerfilPai((prev: any) => ({ ...prev, ...perfilForm }));
      setDadosEmFalta(verificarFaltas(perfilForm));
      setIsPerfilModalOpen(false);
      alert(isEn ? "Profile details saved successfully." : "Dados guardados com sucesso.");
    }
    setSavingPerfil(false);
  };

  const handlePagarRestante = async (reserva: any) => {
    setLoadingStripe(reserva.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: orgData } = await supabase.from('perfis').select('stripe_account_id').eq('id', reserva.campos.organizador_id).single();

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

      if (!res.ok) throw new Error("Erro no processamento.");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      alert("Erro ao iniciar pagamento: " + err.message);
      setLoadingStripe(null);
    }
  };

  const handleCancelarReserva = async (reserva: any) => {
    setCancelState({ ...cancelState, loading: true });
    try {
      const res = await fetch('/api/cancelar-reserva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservaId: reserva.id })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cancelar a inscrição.");

      alert(isEn ? "Booking successfully cancelled. The refund logic was applied." : "Inscrição cancelada com sucesso. A regra de reembolso foi aplicada.");
      
      setReservaModal(null);
      setCancelState({ loading: false, confirm: false });
      fetchData(); // Atualiza o Dashboard com a reserva no estado 'Reembolsado'
    } catch (err: any) {
      alert(err.message);
      setCancelState({ loading: false, confirm: false });
    }
  };

  const abrirModalPartilha = (token: string, nomeLista: string) => {
    const url = `${window.location.origin}/${lang}/lista/${token}`;
    setShareUrl(url); setShareTitle(nomeLista); setCopied(false); setIsShareModalOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  const fecharReservaModal = () => {
    setReservaModal(null);
    setCancelState({ loading: false, confirm: false });
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-bold">{isEn ? 'Loading your dashboard...' : 'A organizar a sua área pessoal...'}</div>;

  return (
    <div className="max-w-[1000px] mx-auto p-4 font-sans relative pb-20">
      
      {/* CABEÇALHO */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900 m-0 tracking-tight">
          {isEn ? 'Upcoming Camps' : 'Próximos Campos'}
        </h1>
        <p className="text-slate-500 mt-2 text-base font-medium">
          {isEn ? 'View your active programs and child schedules.' : 'Acompanhe as inscrições e a logística das próximas férias.'}
        </p>
      </div>

      {/* ALERTA DE DADOS EM FALTA NO PERFIL */}
      {dadosEmFalta.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="text-amber-500 text-2xl mt-1">⚠️</div>
            <div>
              <h3 className="text-amber-800 font-bold text-lg mb-1">{isEn ? 'Missing Important Information' : 'Dados do Encarregado Incompletos'}</h3>
              <p className="text-amber-700 text-sm mb-3">
                {isEn ? 'To ensure safety and proper invoicing, please add the following data to your profile:' : 'Para garantir o contacto do organizador em caso de emergência e a emissão correta da sua fatura, preencha os seguintes dados:'}
              </p>
              <ul className="list-disc pl-5 text-amber-700 text-sm font-semibold mb-4">
                {dadosEmFalta.map((falta, idx) => <li key={idx}>{falta}</li>)}
              </ul>
              <button 
                onClick={() => setIsPerfilModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm cursor-pointer"
              >
                {isEn ? 'Complete Profile Now' : 'Completar Perfil Agora'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MÓDULO DE SUGESTÕES LIMPO E SEGURO (Apenas campos públicos e aprovados) */}
      {sugestoesVerdes.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
          <h2 className="text-2xl font-black text-emerald-900 mb-2 relative z-10">{isEn ? 'Suggested for You' : 'Sugestões de Verão'}</h2>
          <p className="text-emerald-700 font-medium text-sm mb-6 relative z-10 max-w-xl">
            {isEn ? 'Explore these highly-rated programs that you haven\'t booked yet.' : 'Explore estes programas altamente recomendados. Excluímos automaticamente as suas reservas atuais.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
            {sugestoesVerdes.map(sug => (
              <Link key={sug.id} href={`/${lang}/campo/${sug.id}`} className="bg-white rounded-2xl p-3 border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all group flex items-center gap-3">
                <img src={sug.imagem || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=200'} alt={sug.nome} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-emerald-600 transition-colors">{isEn && sug.nome_en ? sug.nome_en : sug.nome}</h4>
                  <p className="text-xs text-slate-500 mt-1">{isEn && sug.local_en ? sug.local_en : sug.local}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* SECÇÃO 1: RESERVAS */}
      {reservas.length === 0 ? (
        <div className="text-center p-12 sm:p-20 bg-white border-2 border-dashed border-slate-300 rounded-3xl mb-12">
          <p className="text-slate-500 text-lg mb-6 font-medium">{isEn ? 'No camp enrollments found yet.' : 'Ainda não inscreveu nenhum participante em programas de férias.'}</p>
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
            
            const isReembolsada = reserva.status_pagamento === 'Reembolsado' || reserva.status_reembolso === 'Reembolsado';
            const isSinalPago = !isReembolsada && reserva.status_pagamento === 'Sinal Pago';
            const isPago = !isReembolsada && reserva.status_pagamento === 'Pago';
            const isPendente = !isReembolsada && !isSinalPago && !isPago;
            
            const valorFalta = Number(reserva.valor_em_falta) || 0;

            return (
              <div key={reserva.id} className="group flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm relative transition-all duration-300 hover:shadow-xl">
                
                <button 
                  onClick={() => setReservaModal(reserva)} 
                  className="absolute inset-0 z-10 w-full h-full cursor-pointer focus:outline-none"
                  aria-label="Ver Detalhes"
                />
                
                <div className={`h-48 w-full relative overflow-hidden bg-slate-100 ${isReembolsada ? 'grayscale' : ''}`}>
                  <img src={campo?.imagem || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=600'} alt={nomeCampo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-[10px] font-black tracking-widest uppercase shadow-sm">
                    {reserva.turno_nome || 'Turno'}
                  </div>
                  {isReembolsada && (
                    <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center">
                      <span className="bg-red-600 text-white font-black uppercase tracking-widest px-4 py-2 rounded-xl text-sm transform -rotate-12 shadow-lg border-2 border-red-400">
                        {isEn ? 'Cancelled' : 'Cancelada'}
                      </span>
                    </div>
                  )}
                </div>

                <div className={`p-6 flex flex-col flex-1 relative z-20 ${isReembolsada ? 'opacity-60' : ''}`}>
                  <h3 className="text-xl font-black text-slate-900 m-0 leading-tight group-hover:text-emerald-700 transition-colors pointer-events-none">{nomeCampo}</h3>
                  <p className="text-sm font-bold text-slate-500 mt-2 mb-6 pointer-events-none">📍 {localCampo}</p>
                  
                  <div className="border-t border-slate-100 pt-5 mt-auto flex justify-between items-end mb-4 pointer-events-none">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{isEn ? 'PARTICIPANT' : 'PARTICIPANTE'}</span>
                      <span className="text-sm font-bold text-slate-700">👦 {reserva.criancas?.nome || 'N/D'}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">TOTAL</span>
                      <span className={`text-lg font-black leading-none ${isReembolsada ? 'text-slate-400 line-through' : 'text-emerald-600'}`}>
                        {reserva.valor_total}€
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 relative z-30">
                  {isReembolsada ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                      <span className="text-xs font-black uppercase tracking-widest text-red-600">❌ Inscrição e Pagamento Anulados</span>
                    </div>
                  ) : isSinalPago && valorFalta > 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-inner">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 m-0">Falta Pagar</p>
                        <p className="text-lg font-black text-amber-600 m-0">{valorFalta.toFixed(2)}€</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePagarRestante(reserva); }}
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
                  ) : isPendente ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">⏳ Pagamento Pendente</span>
                    </div>
                  ) : null}
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
            {wishlists.map((lista) => (
              <div key={lista.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-40 relative group">
                <div>
                  <h3 className="font-black text-slate-900 text-lg mb-1">{lista.nome}</h3>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <Link href={`/${lang}/lista/${lista.token_partilha}`} className="text-sm font-bold text-emerald-600 hover:text-emerald-700">{isEn ? 'View list' : 'Ver lista'} &rarr;</Link>
                  <button onClick={() => abrirModalPartilha(lista.token_partilha, lista.nome)} className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-900 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LIGHTBOX: COMPLETAR PERFIL (DADOS EN ENCARREGADO / FATURAÇÃO) */}
      {isPerfilModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={() => setIsPerfilModalOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col transform transition-transform" onClick={e => e.stopPropagation()}>
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 text-xl m-0">{isEn ? 'Complete Profile' : 'Dados do Encarregado'}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-0">{isEn ? 'Fill in missing details for camps logistical security.' : 'Preencha as informações obrigatórias exigidas.'}</p>
              </div>
              <button onClick={() => setIsPerfilModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-900 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{isEn ? 'Full Name' : 'Nome Completo Encarregado'}</label>
                <input type="text" required value={perfilForm.nome_completo} onChange={e => setPerfilForm({...perfilForm, nome_completo: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-emerald-500 bg-slate-50" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{isEn ? 'Tax ID / NIF' : 'NIF (Para Emissão de Faturas)'}</label>
                <input type="text" required value={perfilForm.nif} onChange={e => setPerfilForm({...perfilForm, nif: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-emerald-500 bg-slate-50" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{isEn ? 'Phone Number' : 'Telemóvel Contacto Direto'}</label>
                <input type="tel" required value={perfilForm.telefone} onChange={e => setPerfilForm({...perfilForm, telefone: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-emerald-500 bg-slate-50" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{isEn ? 'Emergency Contact' : 'Contacto de Emergência Alternativo'}</label>
                <input type="tel" required value={perfilForm.contacto_emergencia} onChange={e => setPerfilForm({...perfilForm, contacto_emergencia: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-emerald-500 bg-slate-50" placeholder="Ex: Contacto dos Avós / Cônjuge" />
              </div>

              <button onClick={handleSavePerfil} disabled={savingPerfil} className="w-full p-3.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors mt-2 disabled:opacity-50 cursor-pointer">
                {savingPerfil ? (isEn ? 'Saving data...' : 'A gravar dados...') : (isEn ? 'Save and Update Profile' : 'Gravar e Atualizar Perfil')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHADO DA RESERVA E CANCELAMENTO */}
      {reservaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={fecharReservaModal}>
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 text-xl m-0">{isEn ? 'Booking Summary' : 'Resumo da Inscrição'}</h3>
                <p className="text-xs text-slate-500 font-mono mt-1 mb-0">Ref: {reservaModal.id}</p>
              </div>
              <button onClick={fecharReservaModal} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-900 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-white flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">{isEn ? 'Program Details' : 'O Programa'}</h4>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-lg font-black text-slate-900 mb-1 leading-tight">{isEn && reservaModal.campos?.nome_en ? reservaModal.campos?.nome_en : reservaModal.campos?.nome}</p>
                    <p className="text-sm font-bold text-slate-500 mb-4">📍 {isEn && reservaModal.campos?.local_en ? reservaModal.campos?.local_en : reservaModal.campos?.local}</p>
                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">{isEn ? 'Shift/Dates' : 'Turno Selecionado'}</p>
                      <p className="text-sm font-bold text-slate-900">{reservaModal.turno_nome}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">{isEn ? 'Participant Info' : 'O Participante'}</h4>
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">👦</div>
                      <div>
                        <p className="text-base font-black text-emerald-950 leading-none mb-1">{reservaModal.criancas?.nome || 'N/D'}</p>
                        <p className="text-xs font-bold text-emerald-700">NIF: {reservaModal.criancas?.nif || 'Não preenchido'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm border-t border-emerald-200/50 pt-3">
                      <div>
                        <span className="block text-[10px] font-bold text-emerald-600/70 uppercase">{isEn ? 'Allergies' : 'Alergias'}</span>
                        <span className="font-bold text-emerald-900">{reservaModal.criancas?.restricoes_alimentares || 'Nenhuma'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-emerald-600/70 uppercase">{isEn ? 'Chronic Diseases' : 'Doenças Crónicas'}</span>
                        <span className="font-bold text-emerald-900">{reservaModal.criancas?.doencas_cronicas || 'Não'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reservaModal.extras_escolhidos && Object.keys(reservaModal.extras_escolhidos).length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">{isEn ? 'Selected Extras' : 'Extras Subscritos'}</h4>
                    <ul className="list-disc pl-5 text-sm font-bold text-slate-700 space-y-1">
                      {reservaModal.extras_escolhidos.extAlimentacao && <li>Alimentação Extra</li>}
                      {reservaModal.extras_escolhidos.extAlojamento && <li>Alojamento Extra</li>}
                      {reservaModal.extras_escolhidos.extTransporte && <li>Transporte</li>}
                      {reservaModal.extras_escolhidos.extProlongamento && <li>Prolongamento de Horário</li>}
                    </ul>
                  </div>
                )}
                
                {reservaModal.respostas_customizadas && Object.keys(reservaModal.respostas_customizadas).length > 0 && (
                  <div className={!reservaModal.extras_escolhidos ? "md:col-span-2" : ""}>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">{isEn ? 'Custom Answers' : 'Formulário do Organizador'}</h4>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                      {Object.entries(reservaModal.respostas_customizadas).map(([pergunta, resposta]: any, i) => (
                        <div key={i}>
                          <p className="text-xs font-bold text-slate-500 mb-0.5">{pergunta}</p>
                          <p className="text-sm font-bold text-slate-900 m-0">{resposta}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 text-white mt-auto">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{isEn ? 'Financial Status' : 'Situação Financeira'}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${reservaModal.status_pagamento === 'Reembolsado' || reservaModal.status_reembolso === 'Reembolsado' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {reservaModal.status_pagamento === 'Reembolsado' || reservaModal.status_reembolso === 'Reembolsado' ? 'Cancelada' : reservaModal.status_pagamento || 'Pendente'}
                  </span>
                </div>
                <div className="flex justify-between items-end border-t border-slate-700 pt-4">
                  <div>
                    <p className="text-xs text-slate-400 font-bold mb-1">{isEn ? 'Amount Paid' : 'Valor já liquidado'}</p>
                    <p className="text-lg font-black m-0">{reservaModal.valor_pago || 0}€</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold mb-1">{isEn ? 'Total Cost' : 'Custo Total'}</p>
                    <p className={`text-2xl font-black m-0 ${reservaModal.status_pagamento === 'Reembolsado' || reservaModal.status_reembolso === 'Reembolsado' ? 'line-through text-slate-600' : ''}`}>
                      {reservaModal.valor_total}€
                    </p>
                  </div>
                </div>
              </div>

              {/* LÓGICA E AVISO DE CANCELAMENTO */}
              {reservaModal.status_pagamento !== 'Reembolsado' && reservaModal.status_reembolso !== 'Reembolsado' && (
                <div className="border-t border-slate-200 pt-6">
                  {(() => {
                    const politica = reservaModal.campos?.politica_cancelamento || '';
                    let avisoCancelamento = '';
                    if (politica.includes('Flexível')) avisoCancelamento = isEn ? 'Flexible Policy: 100% refund up to 7 days before start.' : 'Política Flexível: Reembolso integral a 100% se estiver a mais de 7 dias do início do campo.';
                    else if (politica.includes('Moderada')) avisoCancelamento = isEn ? 'Moderate Policy: 50% refund up to 15 days before start.' : 'Política Moderada: Reembolso a 50% se estiver a mais de 15 dias do início do campo.';
                    else if (politica.includes('Estrita')) avisoCancelamento = isEn ? 'Strict Policy: No refunds allowed.' : 'Política Estrita: Sem direito a reembolso de acordo com as regras da entidade.';

                    return !cancelState.confirm ? (
                      <button
                        onClick={() => setCancelState({ loading: false, confirm: true })}
                        className="w-full py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors"
                      >
                        {isEn ? 'Cancel Booking' : 'Cancelar Inscrição'}
                      </button>
                    ) : (
                      <div className="bg-red-50 p-5 rounded-xl border border-red-200 animate-in fade-in zoom-in duration-200">
                        <h4 className="font-black text-red-800 text-sm mb-2 uppercase tracking-widest flex items-center gap-2">
                          <span>⚠️</span> {isEn ? 'Confirm Cancellation?' : 'Confirmar Cancelamento?'}
                        </h4>
                        <p className="text-red-700 text-sm mb-5 leading-relaxed">
                          <strong>{isEn ? 'Policy applied: ' : 'Regra Aplicada: '}</strong> {avisoCancelamento} <br/><br/>
                          {isEn ? 'The final refund will be calculated automatically by Stripe based on today\'s date. This action cannot be undone.' : 'O reembolso final será processado automaticamente pelo sistema com base na data de hoje e nos dias úteis em falta para o início. Esta ação é irreversível.'}
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setCancelState({ loading: false, confirm: false })}
                            disabled={cancelState.loading}
                            className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                          >
                            {isEn ? 'Keep Booking' : 'Manter Inscrição'}
                          </button>
                          <button
                            onClick={() => handleCancelarReserva(reservaModal)}
                            disabled={cancelState.loading}
                            className="flex-1 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            {cancelState.loading ? (isEn ? 'Processing...' : 'A processar...') : (isEn ? 'Confirm Cancel' : 'Confirmar Cancelamento')}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PARTILHA */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsShareModalOpen(false)}>
           <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-black text-slate-900 text-xl mb-6">Partilhar Ligação</h3>
              <div className="flex gap-4">
                <input type="text" readOnly value={shareUrl} className="flex-1 bg-slate-100 p-3 rounded-xl text-sm text-slate-500 border border-slate-200 outline-none" />
                <button onClick={handleCopyLink} className="bg-slate-900 text-white font-bold px-6 py-3 rounded-xl whitespace-nowrap">{copied ? 'Copiado!' : 'Copiar'}</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}