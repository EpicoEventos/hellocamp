"use client";

import { useState, use } from "react";
import { supabase } from "@/lib/supabase"; // Ajuste o caminho se necessário
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function RegistoAdmin({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const router = useRouter();
  const isEn = lang === 'en';

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const handleRegisto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          empresa_nome: nomeEmpresa, // Variável que a Faturação e os Emails procuram
          role: 'organizador'        // <--- Crucial para a BD saber que é Parceiro B2B
        },
        emailRedirectTo: `${window.location.origin}/${lang}/admin/login`
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSucesso(true);
    setLoading(false);
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '450px', backgroundColor: 'white', padding: '3rem', borderRadius: '1.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '900', color: '#0f172a' }}>HelloCamp <span style={{ color: '#059669' }}>Partner</span></h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '0.5rem' }}>
            {isEn ? 'Create your organizer account' : 'Crie a sua conta de organizador'}
          </p>
        </div>

        {sucesso ? (
          <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '1.5rem', borderRadius: '1rem', textAlign: 'center' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{isEn ? 'Check your email!' : 'Verifique o seu email!'}</h3>
            <p style={{ fontSize: '14px', margin: 0 }}>{isEn ? 'We sent a confirmation link to activate your account.' : 'Enviámos um link de confirmação para ativar a sua conta.'}</p>
          </div>
        ) : (
          <form onSubmit={handleRegisto} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '13px', fontWeight: 'bold' }}>{error}</div>}
            
            <div>
              <label style={labelStyle}>{isEn ? 'Company / Camp Name' : 'Nome da Empresa / Campo'}</label>
              <input type="text" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} required style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
            </div>

            <button type="submit" disabled={loading} style={{ marginTop: '1rem', width: '100%', padding: '1rem', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold', borderRadius: '0.75rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? (isEn ? 'Creating account...' : 'A criar conta...') : (isEn ? 'Register' : 'Registar')}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '14px', color: '#64748b' }}>
          {isEn ? 'Already have an account?' : 'Já tem uma conta?'} <Link href={`/${lang}/admin/login`} style={{ color: '#059669', fontWeight: 'bold', textDecoration: 'none' }}>{isEn ? 'Log in' : 'Entrar'}</Link>
        </div>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' };