"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AuthButton({ lang, dict }: { lang: string; dict: any }) {
  const isEn = lang === 'en';
  
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setRole(session.user.user_metadata?.role || 'cliente');
      }
      setLoading(false);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        setRole(session.user.user_metadata?.role || 'cliente');
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  // Enquanto o Supabase verifica a sessão no refresh, mostramos um bloco neutro
  // com a largura exata para "bloquear" o layout e evitar oscilações visuais
  if (loading) {
    return <div className="w-48 h-10 bg-gray-50 rounded-lg animate-pulse"></div>;
  }

  // 1. Se tem sessão e é ORGANIZADOR (Oculta o convite estático)
  if (user && role === 'organizador') {
    return (
      <Link href={`/${lang}/admin/dashboard`} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm no-underline transition whitespace-nowrap">
        {isEn ? 'Partner Dashboard' : 'Painel de Parceiro'}
      </Link>
    );
  }

  // 2. Se tem sessão e é CLIENTE / Pai (Oculta o convite estático)
  if (user) {
    return (
      <Link href={`/${lang}/cliente/dashboard`} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm no-underline transition whitespace-nowrap">
        {isEn ? 'Parent Portal' : 'Portal dos Pais'}
      </Link>
    );
  }

  // 3. Se NÃO tem sessão ativa (Mostra o fluxo completo para utilizadores anónimos)
  return (
    <div className="flex items-center gap-6">
      <Link href={`/${lang}/admin/registo`} className="text-sm font-bold text-gray-600 hover:text-emerald-700 transition whitespace-nowrap no-underline">
        {dict?.footer?.info_parceiro || (isEn ? 'Become a Partner' : 'Seja Parceiro')}
      </Link>
      
      <div className="h-5 w-px bg-gray-200"></div>
      
      <Link href={`/${lang}/login`} className="text-sm font-bold text-slate-600 hover:text-emerald-700 no-underline transition whitespace-nowrap">
        {isEn ? 'Log in' : 'Entrar'}
      </Link>
      
      <Link href={`/${lang}/registo`} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm no-underline transition whitespace-nowrap">
        {isEn ? 'Sign Up' : 'Registar'}
      </Link>
    </div>
  );
}