"use client";

import { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function RegistoCliente({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleRegisto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email, 
      password,
      options: {
        data: { 
          nome_completo: nome, 
          role: 'cliente' // <--- Crucial para a BD saber que é o Pai
        },
        emailRedirectTo: `${window.location.origin}/${lang}/login`
      }
    });

    if (error) alert(error.message);
    else setSucesso(true);
    
    setLoading(false);
  };

  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', padding: '2.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '900', textAlign: 'center', marginBottom: '2rem', color: '#0f172a' }}>
          {isEn ? 'Create Parent Account' : 'Criar Conta de Encarregado'}
        </h1>

        {sucesso ? (
          <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
            {isEn ? 'Check your email to verify your account.' : 'Verifique o seu email para ativar a conta.'}
          </div>
        ) : (
          <form onSubmit={handleRegisto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="text" placeholder={isEn ? 'Full Name' : 'Nome Completo'} required onChange={e => setNome(e.target.value)} style={inputStyle} />
            <input type="email" placeholder="E-mail" required onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Password" minLength={6} required onChange={e => setPassword(e.target.value)} style={inputStyle} />
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? '...' : (isEn ? 'Register' : 'Registar')}
            </button>
          </form>
        )}
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '14px', color: '#64748b' }}>
          {isEn ? 'Already have an account?' : 'Já tem conta?'} <Link href={`/${lang}/login`} style={{ color: '#059669', fontWeight: 'bold', textDecoration: 'none' }}>Login</Link>
        </p>
      </div>
    </main>
  );
}

const inputStyle = { width: '100%', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', boxSizing: 'border-box' as const, outline: 'none', color: '#0f172a' };
const btnStyle = { width: '100%', padding: '1rem', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' };