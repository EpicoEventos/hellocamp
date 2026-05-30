"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoFavorito from "../components/BotaoFavorito";
import { useSearchParams } from "next/navigation";
import React from "react";

export default function PaginaPesquisa({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  const searchParams = useSearchParams();

  // Capturar os filtros ativos no URL
  const catParam = searchParams.get("categoria") || "";
  const distParam = searchParams.get("distrito") || "";
  const idadeParam = searchParams.get("idade") || "";
  const paisParam = searchParams.get("pais") || "";

  // Estado para controlar o que o utilizador está a selecionar AGORA (antes de aplicar)
  const [paisUI, setPaisUI] = useState(paisParam);
  
  // Lógica de Ocultação: Só mostra distritos se o país for Portugal ou se estiver vazio (todos)
  const mostrarDistritos = paisUI === "" || paisUI === "Portugal";

  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const filtrosAtivos = catParam || distParam || idadeParam || paisParam;

  useEffect(() => {
    const fetchResultados = async () => {
      setLoading(true);
      let query = supabase.from("campos").select("*").not("contrato_parceiro_url", "is", null);

      if (catParam) query = query.eq("categoria", catParam);
      if (distParam && mostrarDistritos) query = query.ilike("Distrito", `%${distParam}%`);
      if (idadeParam) query = query.eq("idade", idadeParam);
      if (paisParam) query = query.or(`pais.ilike.%${paisParam}%,pais_en.ilike.%${paisParam}%`);

      const { data } = await query.order("nome");
      setResultados(data || []);
      setLoading(false);
    };
    fetchResultados();
  }, [catParam, distParam, idadeParam, paisParam, mostrarDistritos]);

  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#111827', paddingBottom: '5rem' }}>
      
      <section style={{ backgroundColor: 'white', borderBottom: '1px solid #f1f5f9', padding: '2.5rem 1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <Link href={`/${lang}`} style={{ display: 'inline-block', marginBottom: '1.5rem', fontSize: '13px', fontWeight: 'bold', color: '#64748b', textDecoration: 'none' }}>
            &larr; {isEn ? 'Back to Home' : 'Voltar ao Início'}
          </Link>

          <h1 style={{ fontSize: '1.875rem', fontWeight: '900', color: '#0f172a', marginBottom: '1.5rem' }}>
            {filtrosAtivos ? (isEn ? 'Search Results' : 'Resultados da Pesquisa') : (isEn ? 'All Camps' : 'Todos os Campos')}
          </h1>
          
          <form method="GET" action={`/${lang}/pesquisa`} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            
            <select 
              name="pais" 
              value={paisUI} 
              onChange={(e) => setPaisUI(e.target.value)} 
              style={selectStyle}
            >
              <option value="">{isEn ? 'All Countries' : 'Todos os Países'}</option>
              <option value="Portugal">Portugal</option>
              <option value="Espanha">{isEn ? 'Spain' : 'Espanha'}</option>
              <option value="Reino Unido">{isEn ? 'United Kingdom' : 'Reino Unido'}</option>
              <option value="França">{isEn ? 'France' : 'França'}</option>
              <option value="Suíça">{isEn ? 'Switzerland' : 'Suíça'}</option>
              <option value="Itália">{isEn ? 'Italy' : 'Itália'}</option>
            </select>

            <select name="categoria" defaultValue={catParam} style={selectStyle}>
              <option value="">{isEn ? 'All Categories' : 'Todas as Categorias'}</option>
              <option value="Desporto">{isEn ? 'Sports' : 'Desporto'}</option>
              <option value="Aventura & Natureza">{isEn ? 'Adventure & Nature' : 'Aventura & Natureza'}</option>
              <option value="Tecnologia & Ciência">{isEn ? 'Tech & Science' : 'Tecnologia & Ciência'}</option>
              <option value="Artes & Criatividade">{isEn ? 'Arts & Creativity' : 'Artes & Criatividade'}</option>
              <option value="Línguas">{isEn ? 'Languages' : 'Línguas'}</option>
            </select>

            {/* SE O PAÍS NÃO FOR PORTUGAL, ESTE DROPDOWN É REMOVIDO DO ECRÃ AUTOMATICAMENTE */}
            {mostrarDistritos && (
              <select name="distrito" defaultValue={distParam} style={selectStyle}>
                <option value="">{isEn ? 'All Districts' : 'Todos os Distritos'}</option>
                {distritosPT.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}

            <select name="idade" defaultValue={idadeParam} style={selectStyle}>
              <option value="">{isEn ? 'All Ages' : 'Todas as Idades'}</option>
              <option value="6-9 anos">{isEn ? '6-9 years' : '6-9 anos'}</option>
              <option value="10-13 anos">{isEn ? '10-13 years' : '10-13 anos'}</option>
              <option value="14-17 anos">{isEn ? '14-17 years' : '14-17 anos'}</option>
            </select>

            <button type="submit" style={btnFiltroStyle}>
              {isEn ? 'Update Results' : 'Atualizar Resultados'}
            </button>
            
            {filtrosAtivos && (
              <Link href={`/${lang}/pesquisa`} style={{ fontSize: '13px', fontWeight: 'bold', color: '#dc2626', textDecoration: 'none', marginLeft: '0.5rem' }}>
                {isEn ? 'Clear filters' : 'Limpar filtros'}
              </Link>
            )}
          </form>

        </div>
      </section>

      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        {loading ? (
           <div style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
              <p style={{ fontSize: '1.25rem', color: '#64748b', fontWeight: 'bold' }}>{isEn ? 'Loading...' : 'A carregar...'}</p>
           </div>
        ) : (!resultados || resultados.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '5rem 1.5rem', backgroundColor: 'white', borderRadius: '1.5rem', border: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '1.25rem', color: '#64748b', fontWeight: 'bold' }}>{isEn ? 'No results found.' : 'Sem resultados.'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {resultados.map((campo: any) => {
              const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
              const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
              const localCampo = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
              const idadeCampo = isEn && campo.idade_en ? campo.idade_en : campo.idade;

              return (
                <div key={campo.id} style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'white', overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '1.5rem', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}>
                  
                  <Link href={`/${lang}/campo/${campo.id}`} style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                    <span className="sr-only">{isEn ? 'Explore' : 'Explorar'} {nomeCampo}</span>
                  </Link>

                  <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 20 }}>
                    <BotaoFavorito campoId={campo.id} />
                  </div>

                  <div style={{ position: 'relative', height: '200px', width: '100%', overflow: 'hidden' }}>
                    <img src={campo.imagem} alt={nomeCampo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', backgroundColor: '#059669', padding: '0.3rem 0.8rem', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: 'white', borderRadius: '999px', zIndex: 5 }}>
                      {catCampo}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', flex: 1, pointerEvents: 'none' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#047857', textTransform: 'uppercase' }}>
                      📍 {localCampo}
                    </span>
                    <h3 style={{ marginTop: '0.5rem', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.3 }}>{nomeCampo}</h3>
                    
                    <p style={{ marginTop: '0.5rem', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                      {isEn ? 'Age' : 'Idade'}: <span style={{ color: '#0f172a' }}>{idadeCampo}</span>
                    </p>
                    
                    <div style={{ marginTop: 'auto', paddingTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9' }}>
                      <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#059669', margin: 0 }}>{campo.preco}€</p>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#f59e0b' }}>{isEn ? 'Explore' : 'Explorar'} &rarr;</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '0.875rem 2.5rem 0.875rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid #cbd5e1',
  backgroundColor: '#f8fafc',
  fontSize: '14px',
  fontWeight: '600',
  color: '#0f172a',
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 1rem center',
  backgroundSize: '1em'
};

const btnFiltroStyle: React.CSSProperties = {
  padding: '0.875rem 1.5rem',
  backgroundColor: '#0f172a',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '14px',
  borderRadius: '0.75rem',
  border: 'none',
  cursor: 'pointer'
};