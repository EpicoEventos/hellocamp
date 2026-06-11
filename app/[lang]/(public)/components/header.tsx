"use client";

import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import AuthButton from "./AuthButton";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header({ dict, lang }: { dict: any, lang: string }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Verifica a sessão atual ao carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuta mudanças (ex: quando o utilizador faz login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${lang}`);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-100 font-sans box-border shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 py-3 md:py-4 md:px-8">
        <div className="flex flex-wrap items-center justify-between">

          {/* 1. LADO ESQUERDO: LOGOTIPO EM TEXTO PERSONALIZADO */}
          <Link href={`/${lang}`} className="text-2xl font-extrabold tracking-tight no-underline flex-shrink-0">
            <span className="text-slate-900">Hello</span>
            <span className="text-[#EBA914]">Camp</span>
          </Link>

          {/* 2. MOBILE: IDIOMA E LOGOUT */}
          <div className="ml-auto flex items-center gap-3 md:hidden">
            <LanguageSwitcher lang={lang} />
            {session && (
              <button 
                onClick={handleLogout} 
                className="text-[11px] font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 uppercase tracking-wider"
              >
                Sair
              </button>
            )}
          </div>

          {/* 3. ÁREA DE BOTÕES - 2ª linha no Mobile, Mesma linha no Desktop */}
          <div className="w-full flex items-center justify-end mt-3 md:w-auto md:mt-0 gap-3 md:gap-6">
            
            {/* IDIOMA (DESKTOP) */}
            <div className="hidden md:flex items-center">
              <LanguageSwitcher lang={lang} />
            </div>

            {/* SEPARADOR VERTICAL (DESKTOP) */}
            <div className="hidden md:block w-px h-5 bg-slate-200"></div>

            {/* BOTÕES DE AUTH & LOGOUT */}
            <div className="flex items-center gap-3">
              <AuthButton lang={lang} dict={dict} />
              
              {session && (
                <button 
                  onClick={handleLogout} 
                  className="hidden md:block text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors border border-red-100 cursor-pointer"
                >
                  Sair / Logout
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}