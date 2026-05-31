"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const isEn = lang === 'en';
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const isAuthPage = pathname.includes('/login') || pathname.includes('/registo');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !isAuthPage) {
        router.push(`/${lang}/admin/login`);
      } else {
        setUser(session?.user || null);
      }
      setLoading(false);
    };
    checkUser();
  }, [router, lang, isAuthPage]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${lang}/admin/login`);
  };

  const getLangUrl = (targetLang: string) => {
    return pathname.replace(`/${lang}`, `/${targetLang}`);
  };

  if (loading) return <div className="min-h-screen bg-slate-50" />;

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans">
      
      {/* SIDEBAR PARCEIROS (Tema Escuro) */}
      <aside className="w-full md:w-[260px] bg-slate-900 text-white flex flex-col flex-shrink-0 shadow-md md:shadow-none z-10">
        
        {/* Título: Oculto no mobile para poupar espaço */}
        <div className="p-5 md:p-6 border-b border-slate-800 hidden md:block">
          <h2 className="text-xl font-black m-0">
            HelloCamp <span className="text-emerald-500">Parceiros</span>
          </h2>
        </div>
        
        {/* Navegação: Scroll horizontal no mobile, vertical no PC */}
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 p-3 md:p-6 no-scrollbar scroll-smooth">
          <NavLink href={`/${lang}/admin/dashboard`} active={pathname.includes('/dashboard')} text={isEn ? 'Dashboard' : 'Resumo'} />
          <NavLink href={`/${lang}/admin/inbox`} active={pathname.includes('/inbox')} text={isEn ? 'Inbox' : 'Mensagens'} />
          <NavLink href={`/${lang}/admin/campos`} active={pathname.includes('/campos')} text={isEn ? 'My Camps' : 'Os Meus Campos'} />
          <NavLink href={`/${lang}/admin/reservas`} active={pathname.includes('/reservas')} text={isEn ? 'Bookings' : 'Reservas'} />
          <NavLink href={`/${lang}/admin/faturacao`} active={pathname.includes('/faturacao')} text={isEn ? 'Billing' : 'Faturação'} />
          
          {/* Botão de Sair no Mobile */}
          <button onClick={handleLogout} className="md:hidden flex-shrink-0 flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-bold text-white border border-slate-700 bg-slate-800 ml-2">
            {isEn ? 'Logout' : 'Sair'}
          </button>
        </nav>

        {/* Rodapé da Sidebar: Email e Logout no PC */}
        <div className="p-6 border-t border-slate-800 hidden md:block mt-auto">
          <p className="text-xs text-slate-400 mb-4 break-all">
            {user?.email}
          </p>
          <button onClick={handleLogout} className="w-full p-3 bg-transparent border border-slate-700 text-white rounded-lg cursor-pointer font-bold text-sm hover:bg-slate-800 transition-colors">
            {isEn ? 'Logout' : 'Terminar Sessão'}
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DO PARCEIRO */}
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        
        {/* Header Superior (Língua e Atalho para Site) */}
        <header className="bg-white px-4 md:px-8 py-3 md:py-4 border-b border-slate-200 flex justify-end items-center gap-6 flex-shrink-0">
          <div className="flex gap-2 text-sm font-bold">
            <Link href={getLangUrl('pt')} className={`${lang === 'pt' ? 'text-slate-900' : 'text-slate-400'} no-underline`}>PT</Link>
            <span className="text-slate-200">|</span>
            <Link href={getLangUrl('en')} className={`${lang === 'en' ? 'text-slate-900' : 'text-slate-400'} no-underline`}>EN</Link>
          </div>
          <Link href={`/${lang}`} target="_blank" className="text-sm font-bold text-emerald-600 no-underline hover:text-emerald-700">
            {isEn ? 'View Live Site ↗' : 'Ver Site ↗'}
          </Link>
        </header>
        
        {/* Conteúdo da Página */}
        <div className="p-4 md:p-8 overflow-y-auto w-full box-border">
          {children}
        </div>
      </main>

    </div>
  );
}

// Subcomponente de navegação do Admin
function NavLink({ href, active, text }: { href: string, active: boolean, text: string }) {
  return (
    <Link 
      href={href} 
      className={`
        px-5 py-2.5 md:py-3 rounded-full md:rounded-lg text-sm whitespace-nowrap transition-colors flex-shrink-0
        ${active ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 font-medium hover:bg-slate-800 hover:text-white'}
      `}
    >
      {text}
    </Link>
  );
}