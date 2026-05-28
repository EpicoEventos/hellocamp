"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

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

  if (loading) return <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }} />;

  if (isAuthPage) return <>{children}</>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      <aside style={{ width: '260px', backgroundColor: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #1e293b' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0 }}>
            HelloCamp <span style={{ color: '#059669' }}>Parceiros</span>
          </h2>
        </div>
        
        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href={`/${lang}/admin/dashboard`} style={navStyle(pathname.includes('/dashboard'))}>
            📊 {isEn ? 'Dashboard' : 'Resumo'}
          </Link>
          <Link href={`/${lang}/admin/inbox`} style={navStyle(pathname.includes('/inbox'))}>
            💬 {isEn ? 'Inbox' : 'Mensagens'}
          </Link>
          <Link href={`/${lang}/admin/campos`} style={navStyle(pathname.includes('/campos'))}>
            🏕️ {isEn ? 'My Camps' : 'Os Meus Campos'}
          </Link>
          <Link href={`/${lang}/admin/reservas`} style={navStyle(pathname.includes('/reservas'))}>
            📝 {isEn ? 'Bookings' : 'Reservas'}
          </Link>
          <Link href={`/${lang}/admin/faturacao`} style={navStyle(pathname.includes('/faturacao'))}>
            💰 {isEn ? 'Billing' : 'Faturação'}
          </Link>
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid #1e293b' }}>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '1rem', wordBreak: 'break-all' }}>
            {user?.email}
          </p>
          <button onClick={handleLogout} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid #334155', color: '#f8fafc', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
            {isEn ? 'Logout' : 'Terminar Sessão'}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto' }}>
        <header style={{ backgroundColor: 'white', padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '13px', fontWeight: 'bold' }}>
            <Link href={getLangUrl('pt')} style={{ color: lang === 'pt' ? '#0f172a' : '#94a3b8', textDecoration: 'none' }}>PT</Link>
            <span style={{ color: '#e2e8f0' }}>|</span>
            <Link href={getLangUrl('en')} style={{ color: lang === 'en' ? '#0f172a' : '#94a3b8', textDecoration: 'none' }}>EN</Link>
          </div>
          <Link href={`/${lang}`} target="_blank" style={{ fontSize: '13px', fontWeight: 'bold', color: '#059669', textDecoration: 'none' }}>
            {isEn ? 'View Live Site ↗' : 'Ver Site ↗'}
          </Link>
        </header>
        
        <div style={{ padding: '2rem' }}>
          {children}
        </div>
      </main>

    </div>
  );
}

const navStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'block',
  padding: '0.875rem 1rem',
  borderRadius: '0.5rem',
  backgroundColor: isActive ? '#1e293b' : 'transparent',
  color: isActive ? 'white' : '#cbd5e1',
  fontWeight: isActive ? 'bold' : 'normal',
  textDecoration: 'none',
  fontSize: '14px',
  transition: 'background-color 0.2s'
});