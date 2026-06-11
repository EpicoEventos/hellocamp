"use client";

import { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function LoginAdmin({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const router = useRouter();
  const isEn = lang === 'en';

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Tenta autenticar
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(isEn ? 'Invalid email or password.' : 'Email ou password incorretos.');
      setLoading(false);
      return;
    }

    if (authData?.user) {
      // 2. Procura imediatamente o nível de acesso do utilizador
      const { data: perfil } = await supabase
        .from('perfis')
        .select('admin')
        .eq('id', authData.user.id)
        .single();

      // 3. Redirecionamento Dinâmico Inteligente
      if (perfil?.admin === true) {
        // Vai para a visão global da HelloCamp
        router.push(`/${lang}/superadmin`);
      } else {
        // Vai para a gestão normal de um Campo (Parceiro B2B)
        router.push(`/${lang}/admin/campos`);
      }
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', padding: '3rem', borderRadius: '1.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '900', color: '#0f172a' }}>HelloCamp <span style={{ color: '#059669' }}>Partner</span></h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '0.5rem' }}>
            {isEn ? 'Welcome back' : 'Bem-vindo de volta'}
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}>{error}</div>}

          <div>
            <label style={labelStyle}>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
              <Link href={`/${lang}/recuperar-password`} style={{ fontSize: '12px', color: '#059669', fontWeight: 'bold', textDecoration: 'none' }}>
                {isEn ? 'Forgot password?' : 'Esqueceu-se da password?'}
              </Link>
            </div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
          </div>

          <button type="submit" disabled={loading} style={{ marginTop: '1rem', width: '100%', padding: '1rem', backgroundColor: '#059669', color: 'white', fontWeight: 'bold', borderRadius: '0.75rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}>
            {loading ? (isEn ? 'Authenticating...' : 'A autenticar...') : (isEn ? 'Login' : 'Entrar')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '14px', color: '#64748b' }}>
          {isEn ? 'New partner?' : 'Novo parceiro?'} <Link href={`/${lang}/admin/registo`} style={{ color: '#0f172a', fontWeight: 'bold', textDecoration: 'none' }}>{isEn ? 'Create an account' : 'Criar uma conta'}</Link>
        </div>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' };