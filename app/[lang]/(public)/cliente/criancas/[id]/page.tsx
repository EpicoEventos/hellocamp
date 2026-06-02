"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function EditarCrianca({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estado expandido para o perfil clínico e logístico completo
  const [formData, setFormData] = useState({ 
    nome: '', 
    nif: '', 
    data_nascimento: '', 
    sexo: '',
    // Perfil Clínico
    tipo_sanguineo: '',
    restricoes_alimentares: '',
    doencas_cronicas: '',
    medicacao_regular: '',
    limitacoes_fisicas: '',
    // Perfil Logístico
    sabe_nadar: '',
    sabe_andar_bicicleta: '',
    tamanho_tshirt: ''
  });

  useEffect(() => {
    const fetchCrianca = async () => {
      const { data } = await supabase.from('criancas').select('*').eq('id', id).single();
      if (data) {
        setFormData({ 
          nome: data.nome || '', 
          nif: data.nif || '', 
          data_nascimento: data.data_nascimento || '',
          sexo: data.sexo || '',
          tipo_sanguineo: data.tipo_sanguineo || '',
          restricoes_alimentares: data.restricoes_alimentares || '',
          doencas_cronicas: data.doencas_cronicas || '',
          medicacao_regular: data.medicacao_regular || '',
          limitacoes_fisicas: data.limitacoes_fisicas || '',
          sabe_nadar: data.sabe_nadar || '',
          sabe_andar_bicicleta: data.sabe_andar_bicicleta || '',
          tamanho_tshirt: data.tamanho_tshirt || ''
        });
      }
      setLoading(false);
    };
    fetchCrianca();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('criancas').update(formData).eq('id', id);
    if (!error) {
      alert(isEn ? 'Profile saved successfully!' : 'Perfil de segurança guardado com sucesso!');
      router.push(`/${lang}/cliente/criancas`);
    } else {
      alert('Erro: ' + error.message);
      setSaving(false);
    }
  };

  const handleApagar = async () => {
    if (!window.confirm(isEn ? 'Are you sure you want to delete this profile?' : 'Tem a certeza que deseja apagar o perfil do seu filho(a)?')) return;
    await supabase.from('criancas').delete().eq('id', id);
    router.push(`/${lang}/cliente/criancas`);
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>{isEn ? 'Loading profile...' : 'A carregar perfil...'}</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link href={`/${lang}/cliente/criancas`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px', backgroundColor: 'white', padding: '0.6rem 1.2rem', borderRadius: '999px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          &larr; {isEn ? 'Back to list' : 'Voltar à lista'}
        </Link>
        <button type="button" onClick={handleApagar} style={{ color: '#ef4444', backgroundColor: 'transparent', padding: '0.6rem 1.2rem', borderRadius: '999px', border: '1px solid #fecaca', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
          {isEn ? 'Delete Profile' : 'Apagar Perfil'}
        </button>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
          {isEn ? 'Participant Profile' : 'Perfil do Participante'}
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
          {isEn ? 'Keep this data updated to ensure maximum safety during the camps.' : 'Mantenha estes dados atualizados para garantir a máxima segurança durante os campos de férias.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* BLOCO 1: IDENTIFICAÇÃO BÁSICA */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>1. {isEn ? 'Basic Identification' : 'Identificação Básica'}</h2>
          
          <div style={gridStyle}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{isEn ? 'Full Name' : 'Nome Completo'} <span style={asteriskStyle}>*</span></label>
              <input type="text" required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>{isEn ? 'Date of Birth' : 'Data de Nascimento'} <span style={asteriskStyle}>*</span></label>
              <input type="date" required value={formData.data_nascimento} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>{isEn ? 'Gender' : 'Sexo'} <span style={asteriskStyle}>*</span></label>
              <select required value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})} style={selectStyle}>
                <option value="">Selecione...</option>
                <option value="Masculino">{isEn ? 'Male' : 'Masculino'}</option>
                <option value="Feminino">{isEn ? 'Female' : 'Feminino'}</option>
                <option value="Prefiro não dizer">{isEn ? 'Prefer not to say' : 'Prefiro não dizer'}</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>{isEn ? 'Tax ID (NIF)' : 'NIF da Criança'}</label>
              <input type="text" value={formData.nif} onChange={e => setFormData({...formData, nif: e.target.value})} style={inputStyle} placeholder={isEn ? "Optional (For invoices)" : "Opcional (Para faturas)"} />
            </div>
          </div>
        </div>

        {/* BLOCO 2: PERFIL CLÍNICO E DE SEGURANÇA */}
        <div style={{...sectionStyle, borderColor: '#fecaca'}}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '2px solid #fef2f2', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🏥</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#991b1b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              2. {isEn ? 'Medical & Safety Profile' : 'Perfil Clínico e Segurança'}
            </h2>
          </div>
          
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>{isEn ? 'Blood Type' : 'Tipo Sanguíneo'}</label>
              <select value={formData.tipo_sanguineo} onChange={e => setFormData({...formData, tipo_sanguineo: e.target.value})} style={selectStyle}>
                <option value="">{isEn ? 'Unknown / Not declared' : 'Desconhecido / Não declarado'}</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{isEn ? 'Food Allergies or Dietary Restrictions' : 'Alergias ou Restrições Alimentares'}</label>
              <input type="text" value={formData.restricoes_alimentares} onChange={e => setFormData({...formData, restricoes_alimentares: e.target.value})} placeholder={isEn ? 'E.g.: Peanuts, Lactose intolerant, Vegan...' : 'Ex: Amendoins, Intolerante à lactose, Celíaco...'} style={inputStyle} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{isEn ? 'Chronic Diseases or Conditions' : 'Doenças Crónicas ou Condições Médicas'}</label>
              <input type="text" value={formData.doencas_cronicas} onChange={e => setFormData({...formData, doencas_cronicas: e.target.value})} placeholder={isEn ? 'E.g.: Asthma, Diabetes, Heart condition...' : 'Ex: Asma, Diabetes, Problema cardíaco...'} style={inputStyle} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{isEn ? 'Regular Medication' : 'Medicação Regular'}</label>
              <input type="text" value={formData.medicacao_regular} onChange={e => setFormData({...formData, medicacao_regular: e.target.value})} placeholder={isEn ? 'E.g.: Needs inhaler during sports...' : 'Ex: Toma anti-histamínico de manhã, precisa de inalador...'} style={inputStyle} />
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{isEn ? 'Physical Limitations' : 'Limitações Físicas'}</label>
              <input type="text" value={formData.limitacoes_fisicas} onChange={e => setFormData({...formData, limitacoes_fisicas: e.target.value})} placeholder={isEn ? 'E.g.: Cannot do high-impact sports...' : 'Ex: Não pode fazer desportos de alto impacto, recente lesão no joelho...'} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* BLOCO 3: COMPETÊNCIAS E LOGÍSTICA */}
        <div style={{...sectionStyle, borderColor: '#bfdbfe'}}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '2px solid #eff6ff', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🎒</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1e40af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              3. {isEn ? 'Skills & Logistics' : 'Competências e Logística'}
            </h2>
          </div>
          
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>{isEn ? 'Knows how to swim?' : 'Sabe nadar?'}</label>
              <select value={formData.sabe_nadar} onChange={e => setFormData({...formData, sabe_nadar: e.target.value})} style={selectStyle}>
                <option value="">{isEn ? 'Not answered' : 'Não respondido'}</option>
                <option value="Sim, perfeitamente">{isEn ? 'Yes, perfectly' : 'Sim, perfeitamente'}</option>
                <option value="O básico (com pé)">{isEn ? 'Basics only' : 'O básico (precisa de pé)'}</option>
                <option value="Não">{isEn ? 'No' : 'Não'}</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>{isEn ? 'Rides a bicycle?' : 'Sabe andar de bicicleta?'}</label>
              <select value={formData.sabe_andar_bicicleta} onChange={e => setFormData({...formData, sabe_andar_bicicleta: e.target.value})} style={selectStyle}>
                <option value="">{isEn ? 'Not answered' : 'Não respondido'}</option>
                <option value="Sim">{isEn ? 'Yes' : 'Sim'}</option>
                <option value="Sim, mas com rodinhas">{isEn ? 'Yes, with training wheels' : 'Sim, mas com rodinhas'}</option>
                <option value="Não">{isEn ? 'No' : 'Não'}</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>{isEn ? 'T-Shirt Size (For gifts)' : 'Tamanho de T-Shirt (Para brindes)'}</label>
              <select value={formData.tamanho_tshirt} onChange={e => setFormData({...formData, tamanho_tshirt: e.target.value})} style={selectStyle}>
                <option value="">{isEn ? 'Not answered' : 'Não respondido'}</option>
                <option value="5-6 Anos">5-6 Anos</option>
                <option value="7-8 Anos">7-8 Anos</option>
                <option value="9-11 Anos">9-11 Anos</option>
                <option value="12-14 Anos">12-14 Anos</option>
                <option value="S Adulto">S (Adulto)</option>
                <option value="M Adulto">M (Adulto)</option>
                <option value="L Adulto">L (Adulto)</option>
              </select>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} style={{ marginTop: '1rem', width: '100%', padding: '1.25rem', backgroundColor: '#0f172a', color: 'white', fontWeight: '900', borderRadius: '1rem', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '1.125rem', transition: 'transform 0.1s', boxShadow: '0 10px 15px -3px rgba(15,23,42,0.3)' }}>
          {saving ? (isEn ? 'Saving profile...' : 'A guardar perfil...') : (isEn ? 'Save Security Profile' : 'Gravar Perfil de Segurança')}
        </button>
      </form>
    </div>
  );
}

// ESTILOS LIMPOS (MANTENDO A ESTÉTICA SILENT LUXURY)
const sectionStyle = { backgroundColor: 'white', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' };
const sectionTitleStyle = { fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '2rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' as const, marginBottom: '0.5rem', letterSpacing: '0.02em' };
const asteriskStyle = { color: '#ef4444' };
const inputBase = { width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.2s, box-shadow 0.2s' };
const inputStyle = { ...inputBase };
const selectStyle = { ...inputBase, cursor: 'pointer', appearance: 'none' as const, backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' };