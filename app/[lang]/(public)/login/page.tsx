"use client";

import { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginCliente({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // FORÇAR LIMPEZA DE SESSÕES (Prevenção de Loop de Redirecionamento)
    await supabase.auth.signOut();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(isEn ? "Invalid email or password." : "E-mail ou password incorretos.");
      setLoading(false);
      return;
    }

    const redirectUrl = sessionStorage.getItem('redirect_after_login');
    if (redirectUrl) {
      sessionStorage.removeItem('redirect_after_login');
      router.push(redirectUrl);
    } else {
      router.push(`/${lang}/cliente/dashboard`);
    }
  };

  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#f8fafc' }}>
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: 'white', padding: '3rem 2.5rem', borderRadius: '1.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
            {isEn ? 'Parent Portal' : 'Portal dos Pais'}
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            {isEn ? 'Welcome back! Log in to manage your bookings.' : 'Bem-vindo! Entre para gerir as reservas dos seus filhos.'}
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {error && (
            <div style={{ padding: '0.875rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '0.5rem', fontSize: '13px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <div>
            <label style={labelStyle}>E-mail</label>
            <input type="email" required onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="exemplo@email.com" />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
              <Link href={`/${lang}/recuperar-password`} style={{ fontSize: '12px', color: '#059669', fontWeight: 'bold', textDecoration: 'none' }}>
                {isEn ? 'Forgot password?' : 'Esqueceu-se da password?'}
              </Link>
            </div>
            <input type="password" required onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? '...' : (isEn ? 'Log In' : 'Entrar na Conta')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '14px', color: '#64748b' }}>
          {isEn ? 'Don\'t have an account?' : 'Ainda não tem conta?'} <Link href={`/${lang}/registo`} style={{ color: '#059669', fontWeight: 'bold', textDecoration: 'none' }}>{isEn ? 'Register here' : 'Registe-se aqui'}</Link>
        </p>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link href={`/${lang}/admin/login`} style={{ fontSize: '12px', color: '#cbd5e1', textDecoration: 'none' }}>
            {isEn ? 'I am a Camp Organizer' : 'Sou Organizador de Campos'}
          </Link>
        </div>
      </div>
    </main>
  );
}

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const inputStyle = { width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.2s' };
const btnStyle = { width: '100%', padding: '1rem', backgroundColor: '#0f172a', color: 'white', fontSize: '1rem', fontWeight: '900', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', transition: 'transform 0.1s', marginTop: '0.5rem' };