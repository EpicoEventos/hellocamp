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

  const catParam = searchParams.get("categoria") || "";
  const distParam = searchParams.get("distrito") || "";
  const idadeParam = searchParams.get("idade") || "";
  const paisParam = searchParams.get("pais") || "";

  const [paisUI, setPaisUI] = useState(paisParam);
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

  // SCHEMA MARKUP PARA BREADCRUMBS
  const baseUrl = "https://www.hellocamp.pt";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": isEn ? "Home" : "Início", "item": `${baseUrl}/${lang}` },
      { "@type": "ListItem", "position": 2, "name": isEn ? "Search" : "Pesquisa", "item": `${baseUrl}/${lang}/pesquisa` }
    ]
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      
      {/* SCRIPT SEO INVISÍVEL */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <section className="bg-white border-b border-slate-100 py-6 px-4 md:px-6 shadow-sm">
        <div className="max-w-[1100px] mx-auto">
          
          {/* BREADCRUMBS VISUAIS */}
          <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-4 tracking-wider uppercase">
            <Link href={`/${lang}`} className="hover:text-emerald-600 transition-colors">{isEn ? 'Home' : 'Início'}</Link>
            <span>/</span>
            <span className="text-slate-600">{isEn ? 'Search' : 'Pesquisa'}</span>
          </nav>

          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 tracking-tight">
            {filtrosAtivos ? (isEn ? 'Search Results' : 'Resultados da Pesquisa') : (isEn ? 'All Camps' : 'Todos os Campos')}
          </h1>
          
          <form method="GET" action={`/${lang}/pesquisa`} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-center">
            
            <select name="pais" value={paisUI} onChange={(e) => setPaisUI(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-emerald-500">
              <option value="">{isEn ? 'All Countries' : 'Todos os Países'}</option>
              <option value="Portugal">Portugal</option>
              <option value="Espanha">{isEn ? 'Spain' : 'Espanha'}</option>
              <option value="Reino Unido">{isEn ? 'UK' : 'Reino Unido'}</option>
              <option value="França">{isEn ? 'France' : 'França'}</option>
              <option value="Suíça">{isEn ? 'Switzerland' : 'Suíça'}</option>
              <option value="Itália">{isEn ? 'Italy' : 'Itália'}</option>
            </select>

            <select name="categoria" defaultValue={catParam} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-emerald-500">
              <option value="">{isEn ? 'All Categories' : 'Todas as Categorias'}</option>
              <option value="Desporto">{isEn ? 'Sports' : 'Desporto'}</option>
              <option value="Aventura & Natureza">{isEn ? 'Adventure' : 'Aventura & Natureza'}</option>
              <option value="Tecnologia & Ciência">{isEn ? 'Tech' : 'Tecnologia & Ciência'}</option>
              <option value="Artes & Criatividade">{isEn ? 'Arts' : 'Artes & Criatividade'}</option>
              <option value="Línguas">{isEn ? 'Languages' : 'Línguas'}</option>
            </select>

            {mostrarDistritos && (
              <select name="distrito" defaultValue={distParam} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-emerald-500">
                <option value="">{isEn ? 'All Districts' : 'Todos os Distritos'}</option>
                {distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}

            <select name="idade" defaultValue={idadeParam} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-emerald-500">
              <option value="">{isEn ? 'All Ages' : 'Todas as Idades'}</option>
              <option value="6-9 anos">6-9 {isEn ? 'years' : 'anos'}</option>
              <option value="10-13 anos">10-13 {isEn ? 'years' : 'anos'}</option>
              <option value="14-17 anos">14-17 {isEn ? 'years' : 'anos'}</option>
            </select>

            <button type="submit" className="w-full py-2.5 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
              {isEn ? 'Update' : 'Atualizar'}
            </button>
            
            {filtrosAtivos && (
              <Link href={`/${lang}/pesquisa`} className="text-sm font-bold text-red-600 hover:text-red-700 text-center sm:text-left transition-colors">
                {isEn ? 'Clear filters' : 'Limpar filtros'}
              </Link>
            )}
          </form>

        </div>
      </section>

      <section className="max-w-[1100px] mx-auto px-4 py-8 md:py-12">
        {loading ? (
           <div className="text-center py-20 text-slate-500 font-bold text-lg">{isEn ? 'Loading...' : 'A carregar...'}</div>
        ) : (!resultados || resultados.length === 0) ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-lg text-slate-500 font-bold">{isEn ? 'No results found.' : 'Sem resultados.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {resultados.map((campo: any) => {
              const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
              const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
              const localCampo = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
              const idadeCampo = isEn && campo.idade_en ? campo.idade_en : campo.idade;

              return (
                <div key={campo.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 relative shadow-sm hover:shadow-xl transition-all duration-300">
                  <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10"><span className="sr-only">Explorar {nomeCampo}</span></Link>
                  <div className="absolute top-3 right-3 z-20"><BotaoFavorito campoId={campo.id} /></div>

                  <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                    <img src={campo.imagem} alt={nomeCampo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute top-3 left-3 bg-emerald-600 px-3 py-1 text-xs font-bold uppercase text-white rounded-full z-0">
                      {catCampo}
                    </div>
                  </div>

                  <div className="flex flex-col p-5 flex-1 pointer-events-none">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">📍 {localCampo}</span>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-2">{nomeCampo}</h3>
                    <p className="text-sm text-slate-500 font-medium mb-6">{isEn ? 'Age Group:' : 'Faixa Etária:'} <span className="text-slate-900">{idadeCampo}</span></p>
                    
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                      <p className="text-xl font-black text-emerald-600 m-0">{campo.preco}€</p>
                      <span className="text-sm font-bold text-[#EBA914] transition-transform group-hover:translate-x-1">{isEn ? 'Explore' : 'Explorar'} &rarr;</span>
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