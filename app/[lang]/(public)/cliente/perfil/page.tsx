"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function PerfilPaiPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);

  useEffect(() => {
    const carregarPerfil = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase.from('perfis').select('*').eq('id', session.user.id).single();
      if (data) setPerfil(data);
      setLoading(false);
    };
    carregarPerfil();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session && perfil) {
      const { error } = await supabase.from('perfis').update({
        nome_completo: perfil.nome_completo,
        telefone: perfil.telefone,
        nif: perfil.nif,
        contacto_emergencia: perfil.contacto_emergencia,
        pessoas_autorizadas_recolha: perfil.pessoas_autorizadas_recolha
      }).eq('id', session.user.id);
      
      if (error) alert((isEn ? "Save error: " : "Erro ao guardar: ") + error.message);
      else alert(isEn ? "Profile updated successfully!" : "Os seus dados foram atualizados com sucesso!");
    }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>{isEn ? 'Loading profile...' : 'A carregar o seu perfil...'}</div>;

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', padding: '3rem 1.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
          {isEn ? 'My Profile & Security' : 'O Meu Perfil e Segurança'}
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '15px' }}>
          {isEn ? 'Manage your contact details and authorized pickup persons.' : 'Gira os seus contactos e defina quem está autorizado a recolher as suas crianças.'}
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>👤 {isEn ? 'Personal Details' : 'Os Seus Dados (Encarregado de Educação)'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{isEn ? 'Full Name' : 'Nome Completo'}</label>
              <input type="text" value={perfil?.nome_completo || ''} onChange={e => setPerfil({...perfil, nome_completo: e.target.value})} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{isEn ? 'Email (Login)' : 'Email (Login)'}</label>
              <input type="email" value={perfil?.email || ''} disabled style={{...inputStyle, backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#94a3b8'}} />
            </div>
            <div>
              <label style={labelStyle}>{isEn ? 'Phone Number' : 'Telefone / Telemóvel'}</label>
              <input type="tel" value={perfil?.telefone || ''} onChange={e => setPerfil({...perfil, telefone: e.target.value})} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{isEn ? 'Tax ID (Billing)' : 'NIF (Faturação)'}</label>
              <input type="text" value={perfil?.nif || ''} onChange={e => setPerfil({...perfil, nif: e.target.value})} style={inputStyle} placeholder={isEn ? "For receipt issuance" : "Para emissão de recibos"} />
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle, border: '1px solid #fecdd3' }}>
          <h2 style={{ ...cardTitleStyle, color: '#e11d48', borderBottomColor: '#ffe4e6' }}>🛡️ {isEn ? 'Security & Emergency' : 'Segurança e Recolha'}</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ ...labelStyle, color: '#e11d48' }}>{isEn ? 'Emergency Contact (Name & Phone)' : 'Contacto de Emergência Alternativo (Nome e Telemóvel)'} *</label>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 0.5rem 0' }}>{isEn ? 'Who should we call if we cannot reach you?' : 'A quem deve o campo ligar caso não consiga contactar o encarregado principal?'}</p>
              <input type="text" value={perfil?.contacto_emergencia || ''} onChange={e => setPerfil({...perfil, contacto_emergencia: e.target.value})} required style={inputStyle} placeholder={isEn ? "E.g.: Grandma Mary - 912 345 678" : "Ex: Avó Maria - 912 345 678"} />
            </div>

            <div>
              <label style={labelStyle}>{isEn ? 'Authorized Pickup Persons' : 'Pessoas Autorizadas a Levantar as Crianças'} *</label>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 0.5rem 0' }}>{isEn ? 'List names and ID numbers. For security reasons, camps may require identification on site.' : 'Liste os Nomes e números de Cartão de Cidadão das pessoas autorizadas. Por motivos de segurança, os campos podem exigir identificação no local.'}</p>
              <textarea 
                rows={3} 
                value={perfil?.pessoas_autorizadas_recolha || ''} 
                onChange={e => setPerfil({...perfil, pessoas_autorizadas_recolha: e.target.value})} 
                required 
                style={{ ...inputStyle, resize: 'vertical' }} 
                placeholder={isEn ? "E.g.: John Doe (Father) - ID: 12345678, Grandma Mary - ID: 87654321" : "Ex: João Silva (Pai) - CC: 12345678, Avó Margarida - CC: 87654321"} 
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} style={{ padding: '1.25rem', backgroundColor: '#0f172a', color: 'white', fontWeight: '900', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '16px', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)' }}>
          {saving ? (isEn ? 'Saving...' : 'A guardar...') : (isEn ? 'Save Profile' : 'Guardar Alterações')}
        </button>
      </form>
    </main>
  );
}

const cardStyle = { backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
const cardTitleStyle = { fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase' as const };
const inputStyle = { width: '100%', padding: '0.875rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' as const };