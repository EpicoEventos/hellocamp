"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoFavorito from "../../../components/BotaoFavorito";
import React from "react";

export default function PesquisaPorPais({ params }: { params: Promise<{ lang: string; paisNome: string }> }) {
  const resolvedParams = use(params);
  const { lang, paisNome } = resolvedParams;
  const isEn = lang === 'en';

  const nomePaisFormatado = decodeURIComponent(paisNome);

  const [campos, setCampos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCamposPorPais = async () => {
      const { data, error } = await supabase
        .from("campos")
        .select("*")
        .not('contrato_parceiro_url', 'is', null)
        .or(`pais.ilike.${nomePaisFormatado},pais_en.ilike.${nomePaisFormatado}`)
        .order('id', { ascending: false });

      if (!error) {
        setCampos(data || []);
      }
      setLoading(false);
    };

    fetchCamposPorPais();
  }, [nomePaisFormatado]);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>{isEn ? 'Searching camps...' : 'A procurar colónias de férias...'}</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'sans-serif' }}>
      
      <div style={{ marginBottom: '3rem' }}>
        <span style={{ fontSize: '12px', fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {isEn ? 'Destination Search' : 'Destinos Disponíveis'}
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', margin: '0.25rem 0 0 0' }}>
          {isEn ? `Programs in ${nomePaisFormatado}` : `Programas em ${nomePaisFormatado}`}
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '15px' }}>
          {isEn ? `Explore active holiday solutions located in ${nomePaisFormatado}.` : `Explore as soluções de férias ativas localizadas em ${nomePaisFormatado}.`}
        </p>
      </div>

      {campos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '1.5rem' }}>
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: 'bold' }}>
            {isEn ? 'No camps found for this country yet.' : 'Ainda não existem programas registados para este país.'}
          </p>
          <Link href={`/${lang}`} style={{ display: 'inline-block', marginTop: '1.5rem', backgroundColor: '#0f172a', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px' }}>
            {isEn ? 'Return Home' : 'Voltar ao Início'}
          </Link>
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
    </div>
  );
}