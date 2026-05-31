"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export default function ListaCriancas({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  const [criancas, setCriancas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCriancas = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('criancas').select('*').eq('cliente_id', session.user.id).order('created_at', { ascending: false });
      setCriancas(data || []);
      setLoading(false);
    };
    fetchCriancas();
  }, []);

  const handleCriarNovaCrianca = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from('criancas').insert({ cliente_id: session.user.id, nome: 'Novo Participante' }).select().single();
    if (data) router.push(`/${lang}/cliente/criancas/${data.id}`);
  };

  const calcularIdade = (dataNasc: string) => {
    if (!dataNasc) return null;
    const diff = Date.now() - new Date(dataNasc).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  return (
    <div className="max-w-[1000px] mx-auto pb-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 m-0">
            {isEn ? 'My Children' : 'Os Meus Filhos'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            {isEn ? 'Manage participant profiles for faster bookings.' : 'Gira os perfis dos participantes para reservas mais rápidas.'}
          </p>
        </div>
        
        <button onClick={handleCriarNovaCrianca} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm">
          + {isEn ? 'Add Child' : 'Adicionar Filho(a)'}
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500 font-bold text-center py-12">{isEn ? 'Loading...' : 'A carregar perfis...'}</p>
      ) : criancas.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl">
          <p className="text-slate-500 mb-4 text-base md:text-lg">{isEn ? 'No children profiles found.' : 'Ainda não adicionou nenhum filho(a).'}</p>
          <button onClick={handleCriarNovaCrianca} className="text-emerald-600 font-bold bg-transparent text-base hover:text-emerald-700">
            {isEn ? 'Create profile now →' : 'Criar perfil agora →'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {criancas.map(c => {
            const idade = calcularIdade(c.data_nascimento);
            return (
              <Link key={c.id} href={`/${lang}/cliente/criancas/${c.id}`} className="bg-white p-6 rounded-2xl border border-slate-200 no-underline text-inherit flex flex-col shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                <h3 className="m-0 text-xl font-black text-slate-900 leading-tight mb-4 truncate">{c.nome}</h3>

                <div className="flex gap-2 flex-wrap mb-6">
                  {idade !== null && (
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">🎂 {idade} {isEn ? 'years' : 'anos'}</span>
                  )}
                  {c.sexo && (
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">👤 {c.sexo}</span>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100">
                  {c.restricoes_alimentares ? (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                      ⚠️ <span className="font-normal truncate">{isEn ? 'Restrictions:' : 'Alergias:'} {c.restricoes_alimentares}</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
                      ✅ <span className="font-normal">{isEn ? 'No health restrictions' : 'Sem restrições de saúde'}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}