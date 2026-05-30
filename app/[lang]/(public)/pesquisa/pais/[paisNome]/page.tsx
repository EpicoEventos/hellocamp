"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoFavorito from "../../../components/BotaoFavorito";
import React from "react";
import { useRouter } from "next/navigation";

export default function PesquisaPorPais({ params }: { params: Promise<{ lang: string; paisNome: string }> }) {
  const resolvedParams = use(params);
  const { lang, paisNome } = resolvedParams;
  const isEn = lang === 'en';
  const router = useRouter();

  const nomePaisInicial = decodeURIComponent(paisNome);

  // Estados dos Filtros
  const [paisSelecionado, setPaisSelecionado] = useState(nomePaisInicial);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [idadeSelecionada, setIdadeSelecionada] = useState("");

  const [campos, setCampos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampos = async () => {
      setLoading(true);
      let query = supabase
        .from("campos")
        .select("*")
        .not('contrato_parceiro_url', 'is', null);

      if (paisSelecionado) {
        query = query.or(`pais.ilike.%${paisSelecionado}%,pais_en.ilike.%${paisSelecionado}%`);
      }
      if (categoriaSelecionada) {
        query = query.eq("categoria", categoriaSelecionada);
      }
      if (idadeSelecionada) {
        query = query.eq("idade", idadeSelecionada);
      }

      const { data, error } = await query.order('id', { ascending: false });

      if (!error) {
        setCampos(data || []);
      }
      setLoading(false);
    };

    fetchCampos();
  }, [paisSelecionado, categoriaSelecionada, idadeSelecionada]);

  // Sincroniza a alteração de país com a barra de endereço (SEO e partilha)
  const handlePaisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novoPais = e.target.value;
    setPaisSelecionado(novoPais);
    router.replace(`/${lang}/pesquisa/${encodeURIComponent(novoPais)}`);
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#111827', paddingBottom: '5rem' }}>
      
      {/* HEADER DINÂMICO E FILTROS */}
      <section style={{ backgroundColor: 'white', borderBottom: '1px solid #f1f5f9', padding: '2.5rem 1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <Link href={`/${lang}`} style={{ display: 'inline-block', marginBottom: '1.5rem', fontSize: '13px', fontWeight: 'bold', color: '#64748b', textDecoration: 'none' }}>
            &larr; {isEn ? 'Back to Home' : 'Voltar ao Início'}
          </Link>

          <span style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isEn ? 'Destination Search' : 'Pesquisa por Destino'}
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', margin: '0.25rem 0 1.5rem 0' }}>
            {isEn ? `Programs in ${paisSelecionado}` : `Programas em ${paisSelecionado}`}
          </h1>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            
            <select value={paisSelecionado} onChange={handlePaisChange} style={selectStyle}>
              <option value="Portugal">Portugal</option>
              <option value="Espanha">{isEn ? 'Spain' : 'Espanha'}</option>
              <option value="Reino Unido">{isEn ? 'United Kingdom' : 'Reino Unido'}</option>
              <option value="França">{isEn ? 'France' : 'França'}</option>
              <option value="Suíça">{isEn ? 'Switzerland' : 'Suíça'}</option>
              <option value="Itália">{isEn ? 'Italy' : 'Itália'}</option>
            </select>

            <select value={categoriaSelecionada} onChange={(e) => setCategoriaSelecionada(e.target.value)} style={selectStyle}>
              <option value="">{isEn ? 'All Categories' : 'Todas as Categorias'}</option>
              <option value="Desporto">{isEn ? 'Sports' : 'Desporto'}</option>
              <option value="Aventura & Natureza">{isEn ? 'Adventure & Nature' : 'Aventura & Natureza'}</option>
              <option value="Tecnologia & Ciência">{isEn ? 'Tech & Science' : 'Tecnologia & Ciência'}</option>
              <option value="Artes & Criatividade">{isEn ? 'Arts & Creativity' : 'Artes & Criatividade'}</option>
              <option value="Línguas">{isEn ? 'Languages' : 'Línguas'}</option>
            </select>

            <select value={idadeSelecionada} onChange={(e) => setIdadeSelecionada(e.target.value)} style={selectStyle}>
              <option value="">{isEn ? 'All Ages' : 'Todas as Idades'}</option>
              <option value="6-9 anos">{isEn ? '6-9 years' : '6-9 anos'}</option>
              <option value="10-13 anos">{isEn ? '10-13 years' : '10-13 anos'}</option>
              <option value="14-17 anos">{isEn ? '14-17 years' : '14-17 anos'}</option>
            </select>

            {(categoriaSelecionada || idadeSelecionada) && (
              <button onClick={() => { setCategoriaSelecionada(''); setIdadeSelecionada(''); }} style={{ background: 'none', border: 'none', fontSize: '13px', fontWeight: 'bold', color: '#dc2626', cursor: 'pointer', marginLeft: '0.5rem' }}>
                {isEn ? 'Clear filters' : 'Limpar filtros'}
              </button>
            )}
          </div>

        </div>
      </section>

      {/* RESULTADOS */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>
            {isEn ? 'Searching camps...' : 'A atualizar resultados...'}
          </div>
        ) : campos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1.5rem' }}>
            <p style={{ color: '#64748b', fontSize: '16px', fontWeight: 'bold' }}>
              {isEn ? 'No camps found with these criteria.' : 'Não foram encontrados programas com estes critérios.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {campos.map((campo) => {
              const nomeVisivel = isEn && campo.nome_en ? campo.nome_en : campo.nome;
              const localVisivel = isEn && campo.local_en ? campo.local_en : campo.local;

              return (
                <div 
                  key={campo.id} 
                  style={{ backgroundColor: 'white', borderRadius: '1.25rem', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}
                >
                  <Link href={`/${lang}/campo/${campo.id}`} style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                    <span className="sr-only">{isEn ? `Explore ${nomeVisivel}` : `Explorar ${nomeVisivel}`}</span>
                  </Link>

                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 20 }}>
                    <BotaoFavorito campoId={campo.id} />
                  </div>

                  <div style={{ height: '180px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                    <img src={campo.imagem} alt={nomeVisivel} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, pointerEvents: 'none' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#059669', textTransform: 'uppercase' }}>{campo.categoria}</span>
                    <h3 style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>{nomeVisivel}</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>📍 {localVisivel}</p>
                    
                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>{campo.idade}</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a' }}>{campo.preco}€</span>
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