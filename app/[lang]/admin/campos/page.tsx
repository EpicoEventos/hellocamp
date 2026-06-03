"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; 
import Link from "next/link";
import React from "react";

export default function MeusCampos({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = React.use(params);
  const isEn = lang === 'en';

  const [campos, setCampos] = useState<any[]>([]);
  const [perfilBase, setPerfilBase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampos = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setLoading(false);

      const { data: perfilData } = await supabase.from('perfis').select('taxa_comissao, base_comissao').eq('id', session.user.id).single();
      setPerfilBase(perfilData || { taxa_comissao: 12 });

      const { data } = await supabase.from('campos').select('*').eq('organizador_id', session.user.id).order('id', { ascending: false }); 
      setCampos(data || []);
      setLoading(false);
    };
    fetchCampos();
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto pb-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 m-0">
            {isEn ? 'My Camps' : 'Os Meus Campos'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            {isEn ? 'Manage your holiday programs and availability.' : 'Gira os seus programas de férias e disponibilidade.'}
          </p>
        </div>
        
        <Link href={`/${lang}/admin/campos/novo`} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold text-sm text-center transition-colors shadow-sm no-underline">
          + {isEn ? 'Add New Camp' : 'Adicionar Novo'}
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-bold">{isEn ? 'Loading your camps...' : 'A carregar os seus campos...'}</div>
      ) : campos.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl">
          <p className="text-slate-500 mb-4 text-base md:text-lg">{isEn ? 'You haven\'t added any camps yet.' : 'Ainda não tem nenhum campo registado.'}</p>
          <Link href={`/${lang}/admin/campos/novo`} className="text-emerald-600 font-bold no-underline text-base hover:text-emerald-700">
            {isEn ? 'Create your first camp →' : 'Crie o seu primeiro campo →'}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {campos.map((campo) => {
            const nomeVisivel = isEn && campo.nome_en ? campo.nome_en : campo.nome;
            const localVisivel = isEn && campo.local_en ? campo.local_en : campo.local;
            const vagasVisivel = campo.vagas_totais || 0;
            const textoVagas = isEn ? 'spots' : 'vagas';
            let precoVisivel = campo.preco || (campo.turnos && campo.turnos.length > 0 ? campo.turnos[0].preco : 0);
            const isComissaoEspecifica = campo.taxa_comissao !== null && campo.taxa_comissao !== undefined;
            const taxaVisual = isComissaoEspecifica ? campo.taxa_comissao : (perfilBase?.taxa_comissao || 12);

            return (
              <div key={campo.id} className="flex flex-col lg:flex-row justify-between lg:items-center gap-5 p-5 md:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                
                <div className="flex-1">
                  <h3 className="m-0 text-lg md:text-xl font-black text-slate-900 mb-3">{nomeVisivel}</h3>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <span className="text-xs md:text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">📍 {localVisivel}</span>
                    <span className="text-xs md:text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">👥 {vagasVisivel} {textoVagas}</span>
                    <span className="text-xs md:text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">💰 {precoVisivel}€</span>
                    
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isComissaoEspecifica ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {taxaVisual}% {isEn ? 'Fee' : 'Comissão'}
                    </span>
                    
                    {campo.contrato_parceiro_url && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                        ✅ {isEn ? 'Verified' : 'Validado'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap justify-end gap-3 mt-4 lg:mt-0 w-full lg:w-auto">
                  
                  {/* NOVO BOTÃO: Preview (Ver Campo Online) */}
                  <a href={`/${lang}/campo/${campo.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm no-underline transition-colors">
                      {isEn ? 'Preview' : 'Ver Online'}
                  </a>

                  {campo.contrato_parceiro_url && (
                    <a href={campo.contrato_parceiro_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-4 py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg font-bold text-sm no-underline transition-colors">
                      {isEn ? 'Download Contract' : '📥 Contrato'}
                    </a>
                  )}
                  
                  <Link href={`/${lang}/admin/campos/editar/${campo.id}`} className="flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-bold text-sm no-underline transition-colors">
                    {isEn ? 'Edit Camp' : 'Editar Campo'}
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}