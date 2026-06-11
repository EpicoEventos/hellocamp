"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import React from "react";

export default function GestaoCamposHQ({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  
  const [campos, setCampos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para o Modal de Comissão
  const [showModal, setShowModal] = useState(false);
  const [campoEmEdicao, setCampoEmEdicao] = useState<any>(null);

  const fetchCamposGerais = async () => {
    const { data: camposData, error: errCampos } = await supabase
      .from('campos')
      .select('*')
      .order('id', { ascending: false });

    if (errCampos) {
      console.error(errCampos);
      setLoading(false);
      return;
    }

    const { data: perfisData } = await supabase.from('perfis').select('id, empresa_nome, email, taxa_comissao, base_comissao');

    const camposComPerfis = (camposData || []).map(campo => {
      const organizador = perfisData?.find(p => p.id === campo.organizador_id);
      return {
        ...campo,
        perfis: organizador || { empresa_nome: 'Sem Registo Associado', email: '' }
      };
    });

    setCampos(camposComPerfis);
    setLoading(false);
  };

  useEffect(() => {
    fetchCamposGerais();
  }, []);

  const handleApagarCampo = async (id: string, nomeCampo: string) => {
    if (!window.confirm(`ACÃO SUPERADMIN: Tem a certeza ABSOLUTA que deseja apagar o campo "${nomeCampo}" permanentemente de toda a plataforma?`)) return;
    const { error } = await supabase.from('campos').delete().eq('id', id);
    if (!error) {
      alert("Campo removido com sucesso.");
      fetchCamposGerais();
    } else alert("Erro ao apagar: " + error.message);
  };

  const handleSalvarComissao = async (e: React.FormEvent) => {
    e.preventDefault();
    const taxa = campoEmEdicao.taxa_comissao === '' ? null : Number(campoEmEdicao.taxa_comissao);
    const base = campoEmEdicao.base_comissao === '' ? null : campoEmEdicao.base_comissao;

    const { error } = await supabase.from('campos').update({
      taxa_comissao: taxa,
      base_comissao: base
    }).eq('id', campoEmEdicao.id);

    if (!error) {
      alert("Comissão específica deste programa atualizada com sucesso!");
      setShowModal(false);
      fetchCamposGerais();
    } else alert("Erro: " + error.message);
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>A carregar base de dados global de programas...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif', paddingBottom: '3rem' }}>
      
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
          Diretório Global de Campos
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '15px' }}>
          Monitorização anti-fraude, moderação e override de comissões.
        </p>
      </div>

      {/* MODAL DE COMISSÃO ESPECÍFICA */}
      {showModal && campoEmEdicao && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontWeight: '900', fontSize: '1.25rem' }}>Ajuste de Margem: {campoEmEdicao.nome}</h2>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer' }}>×</button>
            </div>
            
            <form onSubmit={handleSalvarComissao} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1rem' }}>
                Se deixar em branco, este campo usará a comissão geral acordada com o parceiro ({campoEmEdicao.perfis?.taxa_comissao || 12}% - {campoEmEdicao.perfis?.base_comissao || 'total'}).
              </p>
              <div>
                <label style={labelStyle}>Taxa de Comissão Específica (%)</label>
                <input type="number" step="0.1" value={campoEmEdicao.taxa_comissao || ''} onChange={e => setCampoEmEdicao({...campoEmEdicao, taxa_comissao: e.target.value})} style={inputStyle} placeholder="Ex: 15" />
              </div>
              <div>
                <label style={labelStyle}>Base de Incidência Específica</label>
                <select value={campoEmEdicao.base_comissao || ''} onChange={e => setCampoEmEdicao({...campoEmEdicao, base_comissao: e.target.value})} style={selectStyle}>
                  <option value="">-- Usar regra geral do Parceiro --</option>
                  <option value="total">Sobre Valor Total (Programa + Extras)</option>
                  <option value="apenas_programa">Apenas sobre Programa (Extras isentos)</option>
                  <option value="apenas_alimentacao">Apenas sobre Alimentação</option>
                  <option value="sem_comissao">Isento de Comissão (0%)</option>
                </select>
              </div>
              <button type="submit" style={btnSubmitStyle}>Aplicar Override Financeiro</button>
            </form>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={thStyle}>NOME DO PROGRAMA</th>
              <th style={thStyle}>ENTIDADE EXPLORADORA</th>
              <th style={thStyle}>MARGEM HELLOCAMP</th>
              <th style={thStyle}>TICKET BASE</th>
              <th style={thStyle}>AÇÕES DE AUDITORIA</th>
            </tr>
          </thead>
          <tbody>
            {campos.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Não existem programas registados no sistema.</td></tr>
            ) : (
              campos.map((campo) => {
                const isCustom = campo.taxa_comissao !== null && campo.taxa_comissao !== undefined;
                const taxaVisual = isCustom ? campo.taxa_comissao : (campo.perfis?.taxa_comissao || 12);
                
                return (
                  <tr key={campo.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ ...tdStyle, fontWeight: '900', color: '#0f172a' }}>
                      {campo.nome}
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginTop: '0.25rem', textTransform: 'uppercase' }}>📍 {campo.local}</div>
                    </td>
                    
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 'bold', color: '#334155' }}>{campo.perfis?.empresa_nome}</span>
                    </td>
                    
                    <td style={tdStyle}>
                      <span style={{ backgroundColor: isCustom ? '#fefce8' : '#f1f5f9', color: isCustom ? '#854d0e' : '#475569', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '12px', fontWeight: 'bold', border: `1px solid ${isCustom ? '#fef08a' : '#e2e8f0'}` }}>
                        {taxaVisual}% {isCustom ? '⭐ (Override)' : '(Global)'}
                      </span>
                    </td>
                    
                    <td style={{ ...tdStyle, fontWeight: 'bold' }}>{campo.preco}€</td>
                    
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Link href={`/${lang}/campo/${campo.id}`} target="_blank" style={btnActionStyle('#f1f5f9', '#334155')}>
                          👁️ Front-end
                        </Link>
                        <Link href={`/${lang}/superadmin/campos/editar/${campo.id}`} target="_blank" style={btnActionStyle('#e0f2fe', '#0369a1')}>
                          ✏️ Moderação
                        </Link>
                        <button onClick={() => { setCampoEmEdicao(campo); setShowModal(true); }} style={btnActionStyle('#fefce8', '#854d0e')}>
                          ⚙️ Margem HQ
                        </button>
                        <button onClick={() => handleApagarCampo(campo.id, campo.nome)} style={btnActionStyle('#fef2f2', '#dc2626')}>
                          🗑️ Banir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const modalOverlayStyle = { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', width: '100%', maxWidth: '500px', borderRadius: '1.5rem', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase' as const, marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '14px', color: '#0f172a', outline: 'none' };
const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' as const };
const btnSubmitStyle = { width: '100%', padding: '1.25rem', backgroundColor: '#0f172a', color: 'white', fontWeight: '900', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '1.125rem' };
const thStyle = { padding: '1.25rem 1.5rem', fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em' };
const tdStyle = { padding: '1rem 1.5rem', color: '#334155', verticalAlign: 'middle' };
const btnActionStyle = (bg: string, color: string) => ({ padding: '0.5rem 0.75rem', backgroundColor: bg, color: color, borderRadius: '0.5rem', textDecoration: 'none' as const, fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center' });