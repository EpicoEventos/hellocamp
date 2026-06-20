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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

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
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 font-sans box-border shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 py-3 md:py-4 md:px-8">
        <div className="flex items-center justify-between">

          {/* 1. LOGOTIPO */}
          <Link href={`/${lang}`} className="text-2xl font-extrabold tracking-tight no-underline flex-shrink-0">
            <span className="text-gray-900">Hello</span>
            <span className="text-[#EBA914]">Camp</span>
          </Link>

          {/* 2. NAVEGAÇÃO CENTRALIZADA (DESKTOP) */}
          <nav className="hidden md:flex items-center justify-center gap-8 flex-1">
            
            {/* HOVER DROPDOWN: CAMPOS POR TEMA */}
            <div className="relative group py-2">
              <button className="flex items-center gap-1 text-[15px] font-bold text-gray-700 hover:text-emerald-600 bg-transparent border-none cursor-pointer">
                {lang === 'en' ? 'Camps' : 'Campos'}
                <span className="text-[9px] text-gray-400 transition-transform duration-200 group-hover:rotate-180">▼</span>
              </button>
              
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl p-2 hidden flex-col z-50 group-hover:flex animate-in fade-in duration-150">
                <Link href={`/${lang}/pesquisa?categoria=Aventura %26 Natureza`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline flex items-center gap-2">
                  <span>🌲</span> {lang === 'en' ? 'Adventure & Nature' : 'Aventura & Natureza'}
                </Link>
                <Link href={`/${lang}/pesquisa?categoria=Desporto`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline flex items-center gap-2">
                  <span>⚽</span> {lang === 'en' ? 'Sports' : 'Desporto'}
                </Link>
                <Link href={`/${lang}/pesquisa?categoria=Desportos Náuticos`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline flex items-center gap-2">
                  <span>🏄‍♂️</span> {lang === 'en' ? 'Water Sports' : 'Desportos Náuticos'}
                </Link>
                <Link href={`/${lang}/pesquisa?categoria=Artes %26 Criatividade`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline flex items-center gap-2">
                  <span>🎨</span> {lang === 'en' ? 'Arts & Creativity' : 'Artes & Criatividade'}
                </Link>
                <Link href={`/${lang}/pesquisa?categoria=Tecnologia %26 Robótica`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline flex items-center gap-2">
                  <span>💻</span> {lang === 'en' ? 'Tech & Robotics' : 'Tecnologia & Robótica'}
                </Link>
                <Link href={`/${lang}/pesquisa?categoria=Línguas`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline flex items-center gap-2">
                  <span>🗣️</span> {lang === 'en' ? 'Languages' : 'Línguas'}
                </Link>
                <Link href={`/${lang}/pesquisa?categoria=Multiatividades`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline flex items-center gap-2">
                  <span>🤹</span> {lang === 'en' ? 'Multi-activities' : 'Multiatividades'}
                </Link>
              </div>
            </div>

            {/* HOVER DROPDOWN: LOCAIS / DISTRITOS */}
            <div className="relative group py-2">
              <button className="flex items-center gap-1 text-[15px] font-bold text-gray-700 hover:text-emerald-600 bg-transparent border-none cursor-pointer">
                {lang === 'en' ? 'Locations' : 'Locais'}
                <span className="text-[9px] text-gray-400 transition-transform duration-200 group-hover:rotate-180">▼</span>
              </button>
              
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl p-2 hidden flex-col z-50 group-hover:flex animate-in fade-in duration-150">
                <Link href={`/${lang}/distrito/Lisboa`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline">Lisboa</Link>
                <Link href={`/${lang}/distrito/Porto`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline">Porto</Link>
                <Link href={`/${lang}/distrito/Faro`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline">Faro</Link>
                <Link href={`/${lang}/distrito/Aveiro`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline">Aveiro</Link>
              </div>
            </div>

            {/* LINKS DIRETOS */}
            <Link href={`/${lang}/como_reservar`} className="text-[15px] font-bold text-gray-700 hover:text-emerald-600 no-underline py-2">
              {lang === 'en' ? 'Parents Guide' : 'Guia Pais'}
            </Link>

            <Link href={`/${lang}/parceiro`} className="text-[15px] font-bold text-gray-700 hover:text-emerald-600 no-underline py-2">
              {lang === 'en' ? 'Become a Partner' : 'Ser Parceiro'}
            </Link>

          </nav>

          {/* 3. SISTEMA DE AUTENTICAÇÃO (DESKTOP) */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            <LanguageSwitcher lang={lang} />
            <div className="w-px h-5 bg-gray-200"></div>
            <div className="flex items-center gap-3">
              <AuthButton lang={lang} dict={dict} />
              {session && (
                <button 
                  onClick={handleLogout} 
                  className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors border border-red-100 cursor-pointer"
                >
                  Sair
                </button>
              )}
            </div>
          </div>

          {/* 4. BOTÃO HAMBURGER INTERATIVO (MOBILE) */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher lang={lang} />
            {session && (
              <button onClick={handleLogout} className="text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100 uppercase">
                Sair
              </button>
            )}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xl font-bold ml-1 cursor-pointer"
            >
              {isMobileMenuOpen ? '✕' : '≡'}
            </button>
          </div>

        </div>

        {/* MENU LATERAL EXPANSÍVEL (MOBILE) */}
        {isMobileMenuOpen && (
          <div className="w-full flex flex-col bg-white border-t border-slate-100 mt-3 pt-3 pb-2 gap-2 md:hidden">
            <div className="px-2 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Categories' : 'Categorias'}</div>
            <Link href={`/${lang}/pesquisa?categoria=Aventura %26 Natureza`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">🌲 Aventura & Natureza</Link>
            <Link href={`/${lang}/pesquisa?categoria=Desporto`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">⚽ Desporto</Link>
            <Link href={`/${lang}/pesquisa?categoria=Desportos Náuticos`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">🏄‍♂️ Desportos Náuticos</Link>
            <Link href={`/${lang}/pesquisa?categoria=Artes %26 Criatividade`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">🎨 Artes & Criatividade</Link>
            <Link href={`/${lang}/pesquisa?categoria=Tecnologia %26 Robótica`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">💻 Tecnologia & Robótica</Link>
            <Link href={`/${lang}/pesquisa?categoria=Línguas`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">🗣️ Línguas</Link>
            <Link href={`/${lang}/pesquisa?categoria=Multiatividades`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">🤹 Multiatividades</Link>
            
            <div className="px-2 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider mt-2">{lang === 'en' ? 'Locations' : 'Destinos'}</div>
            <Link href={`/${lang}/distrito/Lisboa`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">Lisboa</Link>
            <Link href={`/${lang}/distrito/Porto`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">Porto</Link>
            <Link href={`/${lang}/distrito/Faro`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">Faro</Link>
            
            <div className="h-px bg-slate-100 my-2"></div>
            
            <Link href={`/${lang}/como_reservar`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">Guia Pais</Link>
            <Link href={`/${lang}/parceiro`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">Ser Parceiro</Link>
            
            <div className="px-4 pt-2">
              <AuthButton lang={lang} dict={dict} />
            </div>
          </div>
        )}

      </div>
    </header>
  );
}