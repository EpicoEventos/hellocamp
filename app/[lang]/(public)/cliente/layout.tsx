"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function ClienteLayout({
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

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${lang}/login`);
      } else {
        setUser(session?.user || null);
      }
      setLoading(false);
    };
    checkUser();
  }, [router, lang]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${lang}`);
  };

  if (loading) return <div className="min-h-[80vh] bg-slate-50" />;

  return (
    <div className="flex flex-col md:flex-row bg-slate-50 font-sans min-h-[calc(100vh-80px)]">
      
      {/* MENU DE NAVEGAÇÃO: Topo com scroll no mobile, Lateral fixa no Desktop */}
      <aside className="w-full md:w-[260px] bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col flex-shrink-0">
        
        {/* Título: Visível apenas no Desktop para poupar espaço no mobile */}
        <div className="p-6 border-b border-slate-200 hidden md:block">
          <h2 className="text-lg font-black m-0 text-slate-900">
            {isEn ? 'Parent Portal' : 'Portal dos Pais'}
          </h2>
          <p className="text-xs text-emerald-600 font-bold mt-1">
            {isEn ? 'Private Area' : 'Área Reservada'}
          </p>
        </div>
        
        {/* Links: Scroll horizontal no mobile (flex-row), Vertical no desktop (md:flex-col) */}
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 p-3 md:p-6 no-scrollbar scroll-smooth">
          <NavLink href={`/${lang}/cliente/dashboard`} active={pathname.includes('/dashboard')} icon="📅" text={isEn ? 'Upcoming Camps' : 'Próximos Campos'} />
          <NavLink href={`/${lang}/cliente/mensagens`} active={pathname.includes('/mensagens')} icon="💬" text={isEn ? 'Messages' : 'Mensagens'} />
          <NavLink href={`/${lang}/cliente/criancas`} active={pathname.includes('/criancas')} icon="👦" text={isEn ? 'My Children' : 'Os Meus Filhos'} />
          <NavLink href={`/${lang}/cliente/favoritos`} active={pathname.includes('/favoritos')} icon="❤️" text={isEn ? 'Wishlist' : 'Os Meus Favoritos'} />
          <NavLink href={`/${lang}/cliente/perfil`} active={pathname.includes('/perfil')} icon="🛡️" text={isEn ? 'Profile & Security' : 'Perfil e Segurança'} />
          
          <div className="hidden md:block border-t border-slate-100 my-2 pt-4" />
          
          <NavLink href={`/${lang}/pesquisa`} active={false} icon="🔍" text={isEn ? 'Explore Camps' : 'Explorar Campos'} className="md:mt-auto" />
          
          {/* Botão de Logout versão Mobile (escondido no PC) */}
          <button onClick={handleLogout} className="md:hidden flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 whitespace-nowrap ml-2">
            {isEn ? 'Logout' : 'Sair'}
          </button>
        </nav>

        {/* Info Utilizador & Logout versão Desktop (escondido no Mobile) */}
        <div className="p-6 border-t border-slate-200 hidden md:block">
          <p className="text-xs text-slate-500 mb-4 break-all">
            {user?.email}
          </p>
          <button onClick={handleLogout} className="w-full p-3 bg-slate-100 border-none text-red-600 rounded-lg cursor-pointer font-bold text-sm hover:bg-red-50 transition-colors">
            {isEn ? 'Logout' : 'Terminar Sessão'}
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        {children}
      </main>

    </div>
  );
}

// Componente auxiliar para os botões ficarem limpos e responsivos
function NavLink({ href, active, icon, text, className = "" }: { href: string, active: boolean, icon: string, text: string, className?: string }) {
  return (
    <Link 
      href={href} 
      className={`
        flex items-center gap-2 px-4 py-2.5 md:py-3 rounded-full md:rounded-lg text-sm whitespace-nowrap transition-colors flex-shrink-0
        ${active ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'}
        ${className}
      `}
    >
      <span>{icon}</span>
      <span>{text}</span>
    </Link>
  );
}