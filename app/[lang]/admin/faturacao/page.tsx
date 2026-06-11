"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function FaturacaoPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);
  
  const [camposParceiro, setCamposParceiro] = useState<any[]>([]);
  const [reservasFull, setReservasFull] = useState<any[]>([]);
  const [filtroCampoId, setFiltroCampoId] = useState<string>('todos');

  useEffect(() => {
    const carregarDados = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: perfilData } = await supabase.from('perfis').select('*').eq('id', session.user.id).single();
      setPerfil(perfilData || {});

      // Extração plana e à prova de falhas (Ignora os Joins nativos)
      const { data: camposData } = await supabase.from('campos').select('id, nome, preco, taxa_comissao, base_comissao, contrato_parceiro_url').eq('organizador_id', session.user.id);
      const { data: reservasData } = await supabase.from('reservas').select('*').eq('organizador_id', session.user.id).order('created_at', { ascending: false });
      const { data: criancasData } = await supabase.from('criancas').select('id, nome');
      const { data: perfisPaisData } = await supabase.from('perfis').select('id, nome_completo, nif');
      
      setCamposParceiro(camposData || []);

      if (reservasData) {
        const reservasConstruidas = reservasData.map(res => {
          const campoEncontrado = camposData?.find(c => c.id === res.campo_id) || {};
          const criancaEncontrada = criancasData?.find(cr => cr.id === res.crianca_id) || {};
          const paiEncontrado = perfisPaisData?.find(p => p.id === res.cliente_id) || {};

          // Controlo do Abandono de Compra
          const dataReserva = new Date(res.created_at).getTime();
          const minutosPassados = (new Date().getTime() - dataReserva) / (1000 * 60);
          
          let estadoReal = res.status_pagamento || 'Pendente';
          if (estadoReal === 'Pendente' && minutosPassados > 15) estadoReal = 'Abandonada';

          return {
            ...res,
            status_pagamento_real: estadoReal,
            campos: campoEncontrado,
            criancas: criancaEncontrada,
            perfis: paiEncontrado
          };
        });
        setReservasFull(reservasConstruidas);
      }
      
      setLoading(false);
    };
    carregarDados();
  }, []);

  const handleStripeConnect = async () => {
    setConnectLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/stripe-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, email: session.user.email, lang: lang })
      });

      const data = await response.json();
      if (data.url) window.location.href = data.url; 
      else alert((isEn ? "Stripe connection error: " : "Erro ao conectar com a Stripe: ") + data.error);
    } catch (err: any) {
      alert((isEn ? "Technical error: " : "Erro técnico: ") + err.message);
    }
    setConnectLoading(false);
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session && perfil) {
      const { error } = await supabase.from('perfis').update({
        empresa_nome: perfil.empresa_nome,
        nif_empresa: perfil.nif_empresa
      }).eq('id', session.user.id);
      
      if (error) alert((isEn ? "Save error: " : "Erro ao guardar: ") + error.message);
      else alert(isEn ? "Company details saved." : "Dados da empresa guardados com sucesso.");
    }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{isEn ? 'Loading financial data...' : 'A carregar dados financeiros e faturas...'}</div>;

  const reservasAtivas = filtroCampoId === 'todos' ? reservasFull : reservasFull.filter(r => r.campo_id === filtroCampoId);

  const taxaComissaoGeral = perfil?.taxa_comissao || 12;
  const baseIncidenciaGeral = perfil?.base_comissao || 'total'; 

  let totalVolume = 0;
  let totalComissoesGeradas = 0;
  let saldoParceiroSeraTransferido = 0;

  const historicoCalculado = reservasAtivas.map(res => {
    const valorReserva = Number(res.valor_total) || 0;
    const isInativa = res.status_pagamento_real === 'Reembolsado' || res.status_pagamento_real === 'Abandonada';

    // Apenas reservas válidas acumulam no total de transacionado
    if (!isInativa) {
      totalVolume += valorReserva;
    }

    const campoAssociado = res.campos;
    const taxaLinha = (campoAssociado?.taxa_comissao !== null && campoAssociado?.taxa_comissao !== undefined) ? Number(campoAssociado.taxa_comissao) : Number(taxaComissaoGeral);
    const baseLinha = campoAssociado?.base_comissao || baseIncidenciaGeral;

    let valorIncidencia = valorReserva;
    if (baseLinha === 'apenas_programa') {
      const precoBase = Number(campoAssociado?.preco) || valorReserva;
      valorIncidencia = Math.min(valorReserva, precoBase);
    } else if (baseLinha === 'sem_comissao') {
      valorIncidencia = 0;
    }

    const valorComissao = isInativa ? 0 : valorIncidencia * (taxaLinha / 100);
    
    if (!isInativa) {
      totalComissoesGeradas += valorComissao;
      saldoParceiroSeraTransferido += (valorReserva - valorComissao);
    }

    return { 
      ...res, 
      valorIncidencia, 
      valorComissao, 
      taxaAplicada: taxaLinha, 
      baseAplicada: baseLinha,
      campoFormatado: campoAssociado,
      paiFormatado: res.perfis,
      criancaFormatado: res.criancas
    };
  });

  const campoFiltradoData = filtroCampoId !== 'todos' ? camposParceiro.find(c => c.id === filtroCampoId) : null;
  const taxaExibida = campoFiltradoData && campoFiltradoData.taxa_comissao !== null ? campoFiltradoData.taxa_comissao : taxaComissaoGeral;
  const baseExibida = campoFiltradoData && campoFiltradoData.base_comissao ? campoFiltradoData.base_comissao : baseIncidenciaGeral;
  const contratoExibido = campoFiltradoData?.contrato_parceiro_url || null;

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif', padding: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
            {isEn ? 'Billing & Automated Payouts' : 'Faturação e Pagamentos'}
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '15px' }}>
            {isEn ? 'Track splits, manage company info and connect your bank account via Stripe.' : 'Controle a divisão de valores e sincronize o seu banco para receber o dinheiro.'}
          </p>
        </div>

        <div style={{ minWidth: '280px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {isEn ? 'Filter by Camp' : 'Filtrar Finanças por Campo'}
          </label>
          <select 
            value={filtroCampoId} 
            onChange={(e) => setFiltroCampoId(e.target.value)} 
            style={{ ...selectStyle, borderColor: '#059669', backgroundColor: '#f0fdf4', color: '#064e3b', fontWeight: '800' }}
          >
            <option value="todos">{isEn ? 'All Active Camps (Global)' : 'Visão Global (Todos os Campos)'}</option>
            {camposParceiro.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '2.5rem', padding: '2rem', borderRadius: '1rem', backgroundColor: perfil?.stripe_account_id ? '#f0fdf4' : '#f8fafc', border: `1px solid ${perfil?.stripe_account_id ? '#bbf7d0' : '#e2e8f0'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
              {perfil?.stripe_account_id 
                ? (isEn ? '✓ Bank Configuration Completed' : '✓ Configuração Bancária Concluída') 
                : (isEn ? '⚠️ Enable Automated Payouts' : '⚠️ Ative os Recebimentos Automáticos')}
            </h3>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '14px', color: '#475569', lineHeight: 1.4 }}>
              {perfil?.stripe_account_id 
                ? (isEn ? 'Your bank account is securely linked via Stripe. Booking funds (minus commission) will be transferred directly to your account.' : 'A sua conta bancária está vinculada de forma segura através da Stripe. O valor das inscrições (deduzido da comissão) será transferido diretamente para a sua conta.') 
                : (isEn ? 'To receive booking payments from parents, you need to link your payment details to our partner platform Stripe.' : 'Para poder receber os pagamentos das inscrições feitas pelos pais, necessita de associar os seus dados de pagamento à nossa plataforma parceira Stripe.')}
            </p>
          </div>
          <button 
            onClick={handleStripeConnect} 
            disabled={connectLoading}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: perfil?.stripe_account_id ? '#059669' : '#0f172a',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {connectLoading ? (isEn ? 'Processing...' : 'A processar...') : (perfil?.stripe_account_id ? (isEn ? 'Manage Stripe Account' : 'Gerir Conta Stripe') : (isEn ? 'Connect to Stripe' : 'Ligar à Stripe'))}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{isEn ? 'Gross Volume' : 'Volume Bruto Processado'}</p>
          <p style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>{totalVolume.toFixed(2)}€</p>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{isEn ? 'Retained Commission' : 'Comissão HelloCamp'}</p>
          <p style={{ fontSize: '2rem', fontWeight: '900', color: '#ef4444', margin: 0 }}>{totalComissoesGeradas.toFixed(2)}€</p>
        </div>

        <div style={{ backgroundColor: '#ecfdf5', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #10b981' }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#065f46', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {isEn ? 'Your Net Balance' : 'O Seu Ganho Líquido'}
          </p>
          <p style={{ fontSize: '2rem', fontWeight: '900', color: '#059669', margin: 0 }}>
            {saldoParceiroSeraTransferido.toFixed(2)}€
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', marginBottom: '2.5rem', alignItems: 'start' }}>
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>{isEn ? 'Company Details' : 'Dados Fiscais da Empresa'}</h2>
          <form onSubmit={handleSaveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>{isEn ? 'Company Name' : 'Nome da Empresa / Entidade'}</label>
              <input type="text" value={perfil.empresa_nome || ''} onChange={e => setPerfil({...perfil, empresa_nome: e.target.value})} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>{isEn ? 'NIF / Tax ID' : 'NIF'}</label>
              <input type="text" value={perfil.nif_empresa || ''} onChange={e => setPerfil({...perfil, nif_empresa: e.target.value})} style={inputStyle} required />
            </div>
            <button type="submit" disabled={saving} style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#0f172a', color: 'white', fontWeight: '900', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
              {saving ? (isEn ? 'Saving...' : 'A guardar...') : (isEn ? 'Save Details' : 'Gravar Dados Fiscais')}
            </button>
          </form>
        </div>

        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>
            {filtroCampoId === 'todos' ? (isEn ? 'Your Global Agreement' : 'Acordo de Comissionamento Geral') : (isEn ? 'Camp Agreement' : 'Contrato Deste Campo')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', minWidth: '120px' }}>
                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{filtroCampoId === 'todos' ? (isEn ? 'Base Rate' : 'Taxa Base') : (isEn ? 'Camp Rate' : 'Taxa do Campo')}</p>
                <span style={{ fontSize: '2rem', fontWeight: '900', color: '#059669' }}>{taxaExibida}%</span>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{isEn ? 'Incidence Base' : 'Base de Incidência'}</p>
                <p style={{ fontSize: '14px', color: '#0f172a', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                  {baseExibida === 'apenas_programa' ? (isEn ? 'Base program only (Extras excluded)' : 'Apenas sobre o Programa Base') : (isEn ? 'Total value (Program + Extras)' : 'Sobre Valor Total da Reserva')}
                </p>
              </div>
            </div>

            {filtroCampoId !== 'todos' && contratoExibido && (
              <a href={contratoExibido} target="_blank" rel="noopener noreferrer" style={{ padding: '1rem', backgroundColor: '#fffbeb', color: '#b45309', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', border: '1px solid #fde68a', textAlign: 'center', display: 'block' }}>
                📥 {isEn ? 'Download Verified Contract' : 'Descarregar Contrato Validado'}
              </a>
            )}
            
            <div style={{ backgroundColor: '#fefce8', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fef08a', marginTop: 'auto' }}>
              <p style={{ fontSize: '12px', color: '#854d0e', margin: 0, fontWeight: 'bold', lineHeight: 1.4 }}>
                💡 {isEn ? 'Commission fees are auto-deducted directly at checkout transaction.' : 'As comissões da plataforma são deduzidas e divididas automaticamente no ato do pagamento.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h2 style={cardTitleStyle}>{isEn ? 'Transaction History' : 'Histórico de Transações'}</h2>
        
        {historicoCalculado.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #cbd5e1' }}>
            {isEn ? 'No financial history available yet.' : 'Ainda não existem transações para a seleção efetuada.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '1rem', fontWeight: 'bold' }}>{isEn ? 'Date' : 'Data'}</th>
                  <th style={{ padding: '1rem', fontWeight: 'bold' }}>{isEn ? 'Program / Child' : 'Programa / Criança'}</th>
                  <th style={{ padding: '1rem', fontWeight: 'bold' }}>{isEn ? 'Parent / Contact' : 'Encarregado / NIF'}</th>
                  <th style={{ padding: '1rem', fontWeight: 'bold' }}>{isEn ? 'Gross Value' : 'Valor Total'}</th>
                  <th style={{ padding: '1rem', fontWeight: 'bold', color: '#ef4444' }}>{isEn ? 'HQ Commission' : 'Comissão'}</th>
                  <th style={{ padding: '1rem', fontWeight: 'bold' }}>{isEn ? 'Status' : 'Estado'}</th>
                </tr>
              </thead>
              <tbody>
                {historicoCalculado.map((res) => {
                  const eReembolsado = res.status_pagamento_real === 'Reembolsado';
                  const eAbandonada = res.status_pagamento_real === 'Abandonada';
                  const isInativa = eReembolsado || eAbandonada;

                  const nomePai = res.nome_encarregado || res.paiFormatado?.nome_completo || 'N/D';
                  const nifPai = res.nif_encarregado || res.paiFormatado?.nif || 'S/ NIF';

                  return (
                    <tr key={res.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: isInativa ? 0.6 : 1 }}>
                      <td style={{ padding: '1rem', color: '#475569' }}>
                        {new Date(res.created_at).toLocaleDateString()}
                        <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '4px' }}>{res.metodo_pagamento || (eAbandonada ? 'Abortado' : 'N/A')}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{res.campoFormatado?.nome || 'N/D'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>👦 {res.criancaFormatado?.nome || 'N/D'} ({res.turno_nome})</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 'bold', color: '#334155' }}>{nomePai}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>NIF: {nifPai}</div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{res.valor_total}€</td>
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: isInativa ? '#94a3b8' : '#ef4444' }}>
                        {isInativa ? 'Anulada' : `${res.valorComissao.toFixed(2)}€`}
                        {!isInativa && <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: 'normal' }}>({res.taxaAplicada}%)</span>}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase',
                          backgroundColor: res.status_pagamento_real === 'Pago' || res.status_pagamento_real === 'Sinal Pago' ? '#ecfdf5' : (eReembolsado ? '#fef2f2' : '#f1f5f9'),
                          color: res.status_pagamento_real === 'Pago' || res.status_pagamento_real === 'Sinal Pago' ? '#059669' : (eReembolsado ? '#dc2626' : '#64748b')
                        }}>
                          {res.status_pagamento_real}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </main>
  );
}

const cardStyle = { display: 'flex', flexDirection: 'column' as const, backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
const cardTitleStyle = { fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const inputBase = { width: '100%', padding: '0.875rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' as const };
const inputStyle = { ...inputBase };
const selectStyle = { ...inputBase, cursor: 'pointer', appearance: 'none' as const, backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' };