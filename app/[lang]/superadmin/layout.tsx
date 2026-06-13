"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function SuperAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${lang}/login`);
        return;
      }

      const { data: perfil } = await supabase
        .from('perfis')
        .select('is_superadmin')
        .eq('id', session.user.id)
        .single();
      
      if (!perfil?.is_superadmin) {
        alert("Acesso Negado. Esta área é restrita à administração da HelloCamp.");
        router.push(`/${lang}`);
        return;
      }
      
      setLoading(false);
    };
    checkSuperAdmin();
  }, [router, lang]);

  if (loading) return <div style={{ minHeight: '100vh', backgroundColor: '#111827' }} />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      <aside style={{ width: '280px', backgroundColor: '#111827', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #1f2937' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>
            HelloCamp <span style={{ color: '#fbbf24' }}>HQ</span>
          </h2>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '0.5rem', fontWeight: 'bold' }}>Direção & Gestão Geral</p>
        </div>
        
        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href={`/${lang}/superadmin/parceiros`} style={navStyle(pathname.includes('/parceiros'))}>
            🤝 Gestão de Parceiros
          </Link>
          <Link href={`/${lang}/superadmin/campos`} style={navStyle(pathname.includes('/campos'))}>
            🏕️ Todos os Campos (Global)
          </Link>
          <Link href={`/${lang}/superadmin/faturacao`} style={navStyle(pathname.includes('/faturacao'))}>
            💰 Faturação Global
          </Link>
          <Link href={`/${lang}/superadmin/emails`} style={navStyle(pathname.includes('/emails'))}>
            📧 Email Marketing
          </Link>
        </nav>
      </aside>

      <main style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

const navStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'block', padding: '1rem', borderRadius: '0.75rem',
  backgroundColor: isActive ? '#1f2937' : 'transparent', color: isActive ? 'white' : '#9ca3af',
  fontWeight: isActive ? 'bold' : '600', textDecoration: 'none', fontSize: '14px', transition: 'all 0.2s'
});