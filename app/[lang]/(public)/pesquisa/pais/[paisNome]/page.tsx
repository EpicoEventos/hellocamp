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
  const [paisSelecionado, setPaisSelecionado] = useState(nomePaisInicial);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [distritoSelecionado, setDistritoSelecionado] = useState("");
  const [idadeSelecionada, setIdadeSelecionada] = useState("");

  const [campos, setCampos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const mostrarDistritos = paisSelecionado === "Portugal" || paisSelecionado === "";

  useEffect(() => {
    const fetchCampos = async () => {
      setLoading(true);
      let query = supabase.from("campos").select("*").not('contrato_parceiro_url', 'is', null);

      if (paisSelecionado) query = query.or(`pais.ilike.%${paisSelecionado}%,pais_en.ilike.%${paisSelecionado}%`);
      if (categoriaSelecionada) query = query.eq("categoria", categoriaSelecionada);
      if (distritoSelecionado && mostrarDistritos) query = query.ilike("Distrito", `%${distritoSelecionado}%`);
      if (idadeSelecionada) query = query.eq("idade", idadeSelecionada);

      const { data, error } = await query.order('id', { ascending: false });
      if (!error) setCampos(data || []);
      setLoading(false);
    };
    fetchCampos();
  }, [paisSelecionado, categoriaSelecionada, distritoSelecionado, idadeSelecionada, mostrarDistritos]);

  const handlePaisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novoPais = e.target.value;
    setPaisSelecionado(novoPais);
    if (novoPais !== "Portugal" && novoPais !== "") setDistritoSelecionado(""); 
    router.replace(`/${lang}/pesquisa/${encodeURIComponent(novoPais)}`);
  };

  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      
      <section className="bg-white border-b border-slate-100 py-6 px-4 md:px-6 shadow-sm">
        <div className="max-w-[1100px] mx-auto">
          
          <Link href={`/${lang}`} className="inline-block mb-4 text-xs font-bold text-slate-500 no-underline hover:text-emerald-600 transition-colors">
            &larr; {isEn ? 'Back to Home' : 'Voltar ao Início'}
          </Link>

          <span className="block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            {isEn ? 'Destination Search' : 'Pesquisa por Destino'}
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 mb-6">
            {isEn ? `Programs in ${paisSelecionado}` : `Programas em ${paisSelecionado}`}
          </h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-center">
            
            <select value={paisSelecionado} onChange={handlePaisChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-emerald-500">
              <option value="Portugal">Portugal</option>
              <option value="Espanha">{isEn ? 'Spain' : 'Espanha'}</option>
              <option value="Reino Unido">{isEn ? 'UK' : 'Reino Unido'}</option>
              <option value="França">{isEn ? 'France' : 'França'}</option>
              <option value="Suíça">{isEn ? 'Switzerland' : 'Suíça'}</option>
              <option value="Itália">{isEn ? 'Italy' : 'Itália'}</option>
            </select>

            <select value={categoriaSelecionada} onChange={(e) => setCategoriaSelecionada(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-emerald-500">
              <option value="">{isEn ? 'All Categories' : 'Todas as Categorias'}</option>
              <option value="Desporto">{isEn ? 'Sports' : 'Desporto'}</option>
              <option value="Aventura & Natureza">{isEn ? 'Adventure' : 'Aventura & Natureza'}</option>
              <option value="Tecnologia & Ciência">{isEn ? 'Tech' : 'Tecnologia & Ciência'}</option>
              <option value="Artes & Criatividade">{isEn ? 'Arts' : 'Artes & Criatividade'}</option>
              <option value="Línguas">{isEn ? 'Languages' : 'Línguas'}</option>
            </select>

            {mostrarDistritos && (
              <select value={distritoSelecionado} onChange={(e) => setDistritoSelecionado(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-emerald-500">
                <option value="">{isEn ? 'All Districts' : 'Todos os Distritos'}</option>
                {distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}

            <select value={idadeSelecionada} onChange={(e) => setIdadeSelecionada(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-emerald-500">
              <option value="">{isEn ? 'All Ages' : 'Todas as Idades'}</option>
              <option value="6-9 anos">6-9 {isEn ? 'years' : 'anos'}</option>
              <option value="10-13 anos">10-13 {isEn ? 'years' : 'anos'}</option>
              <option value="14-17 anos">14-17 {isEn ? 'years' : 'anos'}</option>
            </select>

            {(categoriaSelecionada || distritoSelecionado || idadeSelecionada) && (
              <button onClick={() => { setCategoriaSelecionada(''); setDistritoSelecionado(''); setIdadeSelecionada(''); }} className="text-sm font-bold text-red-600 hover:text-red-700 text-center sm:text-left">
                {isEn ? 'Clear filters' : 'Limpar filtros'}
              </button>
            )}
          </div>

        </div>
      </section>

      <section className="max-w-[1100px] mx-auto px-4 py-8 md:py-12">
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-bold text-lg">{isEn ? 'Searching...' : 'A atualizar resultados...'}</div>
        ) : campos.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-lg text-slate-500 font-bold">{isEn ? 'No camps found.' : 'Não foram encontrados programas.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {campos.map((campo) => {
              const nomeVisivel = isEn && campo.nome_en ? campo.nome_en : campo.nome;
              const localVisivel = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);

              return (
                <div key={campo.id} className="flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 relative shadow-sm hover:shadow-md transition-shadow">
                  <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10"><span className="sr-only">Explorar</span></Link>
                  <div className="absolute top-3 right-3 z-20"><BotaoFavorito campoId={campo.id} /></div>

                  <div className="relative h-48 w-full overflow-hidden">
                    <img src={campo.imagem} alt={nomeVisivel} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-emerald-600 px-3 py-1 text-xs font-bold uppercase text-white rounded-full z-0">
                      {campo.categoria}
                    </div>
                  </div>

                  <div className="flex flex-col p-5 flex-1 pointer-events-none">
                    <span className="text-xs font-bold text-emerald-700 uppercase mb-1">📍 {localVisivel}</span>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-2">{nomeVisivel}</h3>
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                      <p className="text-xl font-black text-emerald-600 m-0">{campo.preco}€</p>
                      <span className="text-sm font-bold text-amber-500">{isEn ? 'Explore' : 'Explorar'} &rarr;</span>
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