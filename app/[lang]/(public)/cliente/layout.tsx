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

  if (loading) return <div style={{ minHeight: '80vh', backgroundColor: '#f8fafc' }} />;

  return (
    <div style={{ display: 'flex', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', minHeight: 'calc(100vh - 80px)' }}>
      
      <aside style={{ width: '260px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '900', margin: 0, color: '#0f172a' }}>
            {isEn ? 'Parent Portal' : 'Portal dos Pais'}
          </h2>
          <p style={{ fontSize: '12px', color: '#059669', fontWeight: 'bold', marginTop: '0.25rem' }}>
            {isEn ? 'Private Area' : 'Área Reservada'}
          </p>
        </div>
        
        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href={`/${lang}/cliente/dashboard`} style={navStyle(pathname.includes('/dashboard'))}>
            📅 {isEn ? 'Upcoming Camps' : 'Próximos Campos'}
          </Link>
          <Link href={`/${lang}/cliente/mensagens`} style={navStyle(pathname.includes('/mensagens'))}>
            💬 {isEn ? 'Messages' : 'Mensagens'}
          </Link>
          <Link href={`/${lang}/cliente/criancas`} style={navStyle(pathname.includes('/criancas'))}>
            👦 {isEn ? 'My Children' : 'Os Meus Filhos'}
          </Link>
          <Link href={`/${lang}/cliente/favoritos`} style={navStyle(pathname.includes('/favoritos'))}>
            ❤️ {isEn ? 'Wishlist' : 'Os Meus Favoritos'}
          </Link>
          <Link href={`/${lang}/cliente/perfil`} style={navStyle(pathname.includes('/perfil'))}>
            🛡️ {isEn ? 'Profile & Security' : 'Perfil e Segurança'}
          </Link>
          <Link href={`/${lang}/pesquisa`} style={{ ...navStyle(false), color: '#0f172a', borderTop: '1px solid #f1f5f9', marginTop: '0.5rem', paddingTop: '1rem' }}>
            🔍 {isEn ? 'Explore Camps' : 'Explorar Campos'}
          </Link>
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '1rem', wordBreak: 'break-all' }}>
            {user?.email}
          </p>
          <button onClick={handleLogout} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#f1f5f9', border: 'none', color: '#dc2626', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
            {isEn ? 'Logout' : 'Terminar Sessão'}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {children}
      </main>

    </div>
  );
}

const navStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'block',
  padding: '0.875rem 1rem',
  borderRadius: '0.5rem',
  backgroundColor: isActive ? '#f1f5f9' : 'transparent',
  color: isActive ? '#0f172a' : '#475569',
  fontWeight: isActive ? 'bold' : '500',
  textDecoration: 'none',
  fontSize: '14px',
  transition: 'background-color 0.2s'
});