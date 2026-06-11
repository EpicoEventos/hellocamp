"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function GestaoParceirosHQ({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  
  const [parceiros, setParceiros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Criação de Parceiro
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [novoParceiro, setNovoParceiro] = useState({ email: '', password: '', empresa_nome: '' });
  const [savingNovo, setSavingNovo] = useState(false);

  // Estados para Edição de Comissão
  const [showComissaoModal, setShowComissaoModal] = useState(false);
  const [parceiroEmEdicao, setParceiroEmEdicao] = useState<any>(null);

  // Novo Estado para a Ficha Detalhada Corporativa
  const [parceiroAuditoria, setParceiroAuditoria] = useState<any>(null);

  const fetchParceiros = async () => {
    // Busca todos os perfis que não são superadmins. 
    // Em B2B, interessa ver todos os dados de faturação e contacto
    const { data } = await supabase
      .from('perfis')
      .select('*')
      .eq('is_superadmin', false)
      // Como o seu sistema de parceiros e pais usa a mesma tabela, 
      // filtra por quem tem 'empresa_nome' para focar no B2B
      .not('empresa_nome', 'is', null)
      .not('empresa_nome', 'eq', '')
      .order('created_at', { ascending: false });
      
    setParceiros(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchParceiros(); }, []);

  // GERAR PARCEIRO VIA API SEGURA
  const handleCriarParceiro = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNovo(true);
    
    try {
      const res = await fetch('/api/admin/criar-parceiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoParceiro)
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(`Conta B2B criada com sucesso!\n\nEmail: ${novoParceiro.email}\nPassword temporária: ${novoParceiro.password}`);
        setShowNovoModal(false);
        setNovoParceiro({ email: '', password: '', empresa_nome: '' });
        fetchParceiros(); 
      } else {
        alert("Erro no registo: " + data.error);
      }
    } catch (err) {
      alert("Falha na comunicação com o servidor.");
    }
    setSavingNovo(false);
  };

  // ATUALIZAR COMISSÕES DO PARCEIRO
  const handleSalvarComissao = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('perfis').update({
      taxa_comissao: parceiroEmEdicao.taxa_comissao,
      base_comissao: parceiroEmEdicao.base_comissao
    }).eq('id', parceiroEmEdicao.id);

    if (!error) {
      alert("Contrato comercial atualizado com sucesso!");
      setShowComissaoModal(false);
      fetchParceiros();
    } else {
      alert("Erro na Base de Dados: " + error.message);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>A auditar entidades parceiras...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif', paddingBottom: '3rem' }}>
      
      {/* CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>Gestão de Parceiros B2B</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '15px' }}>Diretório corporativo, comissionamento e integração financeira Stripe Connect.</p>
        </div>
        
        <button onClick={() => setShowNovoModal(true)} style={{ backgroundColor: '#fbbf24', color: '#0f172a', padding: '1rem 2rem', borderRadius: '0.75rem', fontWeight: '900', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(251, 191, 36, 0.3)', transition: 'transform 0.2s' }}>
          + Gerar Conta Corporativa
        </button>
      </div>

      {/* MODAL: CRIAR NOVO PARCEIRO */}
      {showNovoModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontWeight: '900' }}>Emissão de Conta B2B</h2>
              <button onClick={() => setShowNovoModal(false)} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer' }}>×</button>
            </div>
            
            <form onSubmit={handleCriarParceiro} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '13px', color: '#b45309', margin: 0, fontWeight: 'bold' }}>Nota Logística: Esta ação gera as credenciais seguras na Supabase Auth. Após a criação, envie estas credenciais ao parceiro para que ele possa preencher a ficha completa da entidade.</p>
              </div>
              <div>
                <label style={labelStyle}>Nome da Entidade / Empresa</label>
                <input type="text" required value={novoParceiro.empresa_nome} onChange={e => setNovoParceiro({...novoParceiro, empresa_nome: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email Oficial (Login)</label>
                <input type="email" required value={novoParceiro.email} onChange={e => setNovoParceiro({...novoParceiro, email: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Password Temporária Padrão</label>
                <input type="text" required value={novoParceiro.password} onChange={e => setNovoParceiro({...novoParceiro, password: e.target.value})} style={inputStyle} />
              </div>
              <button type="submit" disabled={savingNovo} style={btnSubmitStyle}>
                {savingNovo ? 'A comunicar com o Servidor...' : 'Criar e Conceder Acesso B2B'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR COMISSÃO */}
      {showComissaoModal && parceiroEmEdicao && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontWeight: '900', fontSize: '20px' }}>Contrato: {parceiroEmEdicao.empresa_nome}</h2>
              <button onClick={() => setShowComissaoModal(false)} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer' }}>×</button>
            </div>
            
            <form onSubmit={handleSalvarComissao} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Taxa de Margem HQ (%)</label>
                <input type="number" step="0.1" required value={parceiroEmEdicao.taxa_comissao} onChange={e => setParceiroEmEdicao({...parceiroEmEdicao, taxa_comissao: Number(e.target.value)})} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Base de Incidência Comercial</label>
                <select value={parceiroEmEdicao.base_comissao} onChange={e => setParceiroEmEdicao({...parceiroEmEdicao, base_comissao: e.target.value})} style={selectStyle}>
                  <option value="total">Sobre Valor Total (Programa + Extras)</option>
                  <option value="apenas_programa">Apenas sobre o valor do Programa Base</option>
                  <option value="sem_comissao">Isenção de Comissão (0%)</option>
                </select>
              </div>
              <button type="submit" style={btnSubmitStyle}>Atualizar Regra Financeira</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FICHA CORPORATIVA COMPLETA (AUDITORIA) */}
      {parceiroAuditoria && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '800px', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            <div style={{ padding: '1.5rem 2rem', backgroundColor: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900' }}>Auditoria B2B: {parceiroAuditoria.empresa_nome}</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#cbd5e1', fontSize: '12px', fontFamily: 'monospace' }}>Entity ID: {parceiroAuditoria.id}</p>
              </div>
              <button onClick={() => setParceiroAuditoria(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>

            <div style={{ padding: '2rem', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
              
              {/* ALERTA STRIPE CONNECT */}
              {!parceiroAuditoria.stripe_account_id && (
                 <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                   <p style={{ margin: 0, color: '#b91c1c', fontWeight: 'bold', fontSize: '13px' }}>🚨 Aviso de Integração: Este parceiro ainda não concluiu o Onboarding bancário na Stripe. A plataforma HelloCamp não conseguirá fazer split payment para esta entidade até que ela insira o seu IBAN no portal de parceiros.</p>
                 </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                
                <div style={modalCardStyle}>
                  <h3 style={modalTitleStyle}>🏢 Dados de Empresa / Fiscalidade</h3>
                  <DetailRow label="Nome Legal (Empresa)" value={parceiroAuditoria.empresa_nome} />
                  <DetailRow label="NIF da Empresa" value={parceiroAuditoria.nif_empresa} />
                  <DetailRow label="Ano de Fundação" value={parceiroAuditoria.ano_fundacao} />
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0' }}>
                     <DetailRow label="Parceiro Verificado (Badge)" value={parceiroAuditoria.parceiro_verificado ? '✅ Sim' : '❌ Não'} />
                  </div>
                </div>

                <div style={modalCardStyle}>
                  <h3 style={modalTitleStyle}>📞 Dados de Contacto / Gestor</h3>
                  <DetailRow label="Responsável" value={parceiroAuditoria.nome_completo} />
                  <DetailRow label="Email B2B" value={parceiroAuditoria.email} />
                  <DetailRow label="Telefone Direto" value={parceiroAuditoria.telefone} />
                </div>

                <div style={{...modalCardStyle, gridColumn: '1 / -1', borderLeft: '4px solid #10b981'}}>
                  <h3 style={modalTitleStyle}>💰 Tesouraria (Liquidação Externa)</h3>
                  <DetailRow label="Modelo Pagamento HelloCamp" value={parceiroAuditoria.modelo_pagamento || 'Plataforma Recebe'} />
                  <DetailRow label="IBAN Pessoal/Empresa" value={parceiroAuditoria.iban || 'Não preenchido'} />
                  <DetailRow label="Stripe Connect ID" value={parceiroAuditoria.stripe_account_id || 'Não integrado'} />
                </div>

                {parceiroAuditoria.biografia_empresa && (
                  <div style={{...modalCardStyle, gridColumn: '1 / -1'}}>
                    <h3 style={modalTitleStyle}>📝 Biografia Pública (Apresentação na HelloCamp)</h3>
                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{parceiroAuditoria.biografia_empresa}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABELA PRINCIPAL DE PARCEIROS */}
      <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={thStyle}>ENTIDADE CORPORATIVA</th>
              <th style={thStyle}>ESTATUTO CONNECT</th>
              <th style={thStyle}>CONTRATO (MARGEM HQ)</th>
              <th style={thStyle}>AÇÕES DE GESTÃO</th>
            </tr>
          </thead>
          <tbody>
            {parceiros.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: '900', color: '#0f172a', fontSize: '15px' }}>{p.empresa_nome || 'A Aguardar Registo Completo'}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginTop: '0.25rem' }}>{p.email}</div>
                </td>
                
                <td style={tdStyle}>
                  {p.stripe_account_id ? (
                    <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '11px', fontWeight: '900', border: '1px solid #a7f3d0' }}>
                      ✓ Integrado (Stripe)
                    </span>
                  ) : (
                    <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '11px', fontWeight: '900', border: '1px solid #fecaca' }}>
                      ⚠ Em Falta (Manual)
                    </span>
                  )}
                </td>
                
                <td style={tdStyle}>
                  <div style={{ color: '#0f172a', fontWeight: '900', fontSize: '1.125rem' }}>{p.taxa_comissao || 12}%</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>{p.base_comissao || 'Total'}</div>
                </td>
                
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setParceiroAuditoria(p)} style={btnActionStyle('#f1f5f9', '#0f172a')}>
                      👁️ Ver Ficha B2B
                    </button>
                    <button onClick={() => { setParceiroEmEdicao(p); setShowComissaoModal(true); }} style={btnActionStyle('#fefce8', '#854d0e')}>
                      ⚙️ Editar Contrato
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {parceiros.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Nenhuma entidade comercial registada no sistema.</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// ESTILOS COMPONENTIZADOS
const modalOverlayStyle = { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', width: '100%', maxWidth: '500px', borderRadius: '1.5rem', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase' as const, marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '14px', color: '#0f172a', outline: 'none' };
const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' as const };
const btnSubmitStyle = { width: '100%', padding: '1.25rem', backgroundColor: '#0f172a', color: 'white', fontWeight: '900', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '1.125rem' };
const thStyle = { padding: '1rem 1.5rem', fontSize: '11px', fontWeight: '800', color: '#475569', letterSpacing: '0.05em' };
const tdStyle = { padding: '1.25rem 1.5rem', color: '#334155', verticalAlign: 'middle' };
const btnActionStyle = (bg: string, color: string) => ({ padding: '0.5rem 0.75rem', backgroundColor: bg, color: color, borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center' });
const modalCardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' };
const modalTitleStyle = { margin: '0 0 1.25rem 0', fontSize: '1.125rem', fontWeight: '900', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' };

const DetailRow = ({ label, value }: { label: string, value: any }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingBottom: '0.25rem' }}>
    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>{label}:</span>
    <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '800', textAlign: 'right', marginLeft: '1rem', wordBreak: 'break-word' }}>{value || 'N/D'}</span>
  </div>
);