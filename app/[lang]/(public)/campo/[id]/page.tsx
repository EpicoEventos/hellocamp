import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import CaixaReserva from "./CaixaReserva";
import BotaoFavorito from "../../components/BotaoFavorito";
import { getDictionary } from "@/lib/getDictionary";

// 1. CHEF DO SEO PARA A PÁGINA DO CAMPO
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ lang: string; id: string }> 
}): Promise<Metadata> {
  const { lang, id } = await params;
  const isEn = lang === 'en';

  const { data: campo } = await supabase.from('campos').select('nome, nome_en, descricao, descricao_en, imagem').eq('id', id).single();

  if (!campo) return { title: 'Camp | HelloCamp' };

  const title = (isEn && campo.nome_en ? campo.nome_en : campo.nome) + ' | HelloCamp';
  const descRaw = isEn && campo.descricao_en ? campo.descricao_en : campo.descricao;
  const description = descRaw ? descRaw.substring(0, 155) + '...' : '';

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [{ url: campo.imagem || '/og-image.jpg', width: 1200, height: 630 }]
    }
  };
}

export default async function DetalhesDoCampo({ 
  params 
}: { 
  params: Promise<{ lang: string; id: string }> 
}) {
  const { lang, id } = await params;
  const dict = await getDictionary(lang as "pt" | "en");
  const isEn = lang === 'en';

  // 2. Busca do Campo e das Reviews
  const { data: campo } = await supabase.from("campos").select("*").eq("id", id).single();
  const { data: reviews } = await supabase.from("reviews").select("*").eq("campo_id", id).order('created_at', { ascending: false });

  if (!campo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans">
        <h1 className="text-3xl font-black text-slate-900">
          {isEn ? 'Camp not found' : 'Campo não encontrado'} 🕵️‍♂️
        </h1>
        <Link href={`/${lang}`} className="mt-6 font-bold text-emerald-600 hover:text-emerald-700">
          &larr; {dict.detalhe.voltar_pesquisa}
        </Link>
      </div>
    );
  }

  const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
  const descCampo = isEn && campo.descricao_en ? campo.descricao_en : campo.descricao;
  const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
  const localCampo = isEn && campo.local_en ? campo.local_en : (isEn && campo.Distrito_en ? campo.Distrito_en : (campo.Distrito || campo.distrito || campo.local));
  const racioCampo = isEn && campo.racio_monitores_en ? campo.racio_monitores_en : campo.racio_monitores;
  const alimentacaoCampo = isEn && campo.alimentacao_en ? campo.alimentacao_en : campo.alimentacao;
  const alojamentoCampo = isEn && campo.alojamento_en ? campo.alojamento_en : campo.alojamento;
  const seguroCampo = isEn && campo.seguro_en ? campo.seguro_en : campo.seguro;
  const regrasCampo = isEn && campo.regras_termos_en ? campo.regras_termos_en : campo.regras_termos;

  const scoreAvaliacoes = campo.rating_score || 0;
  const totalAvaliacoes = campo.total_reviews || 0;

  const formatarDataExtenso = (dStr: string) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    return d.toLocaleDateString(isEn ? 'en-US' : 'pt-PT', { day: 'numeric', month: 'long' });
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">

      {/* HERO SECTION DA PÁGINA */}
      <div className="relative w-full h-[580px] bg-slate-900 overflow-hidden">
        <img src={campo.imagem} alt={nomeCampo} className="w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent"></div>

        <div className="absolute top-6 left-6 z-30">
          <Link href={`/${lang}`} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-md border border-slate-100 hover:bg-slate-50 transition-colors">
            &larr; {dict.detalhe.voltar_pesquisa}
          </Link>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto pt-10 pb-10 px-4 md:px-6">
        <div className="flex flex-col lg:flex-row gap-10 items-start w-full">
          
          <div className="flex-1 w-full flex flex-col gap-6">
            
            {/* CABEÇALHO DO CAMPO E REVIEWS */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 relative">
              <div className="absolute top-8 right-8 z-20">
                <BotaoFavorito campoId={campo.id} />
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mb-5 pr-12">
                <span className="rounded-full bg-emerald-50 border border-emerald-100 px-4 py-1.5 text-xs font-bold text-emerald-700 uppercase tracking-widest">{catCampo}</span>
                <span className="text-sm font-bold text-slate-500">📍 {localCampo}</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">{nomeCampo}</h1>
              
              {/* ESTRELAS E SCORE */}
              <div className="flex items-center gap-2">
                <span className="text-[#EBA914] text-lg font-black">★ {scoreAvaliacoes > 0 ? scoreAvaliacoes.toFixed(1) : 'Novo'}</span>
                <span className="text-slate-400 text-sm font-bold underline decoration-slate-300 underline-offset-4">
                  ({totalAvaliacoes} {isEn ? 'reviews' : 'avaliações'})
                </span>
              </div>
            </div>

            {/* DESCRIÇÃO */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-50 pb-3">{dict.detalhe.sobre_programa}</h2>
              <p className="leading-relaxed text-slate-600 text-base whitespace-pre-wrap font-medium">{descCampo}</p>
            </div>

            {/* REGRAS */}
            {regrasCampo && (
              <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-50 pb-3">{isEn ? 'Specific Rules & Terms' : 'Regras e Termos'}</h2>
                <p className="leading-relaxed text-slate-500 text-sm whitespace-pre-wrap font-medium">{regrasCampo}</p>
              </div>
            )}

            {/* DATAS */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-5">{dict.detalhe.datas_disponibilidade}</h2>
              <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100">
                {campo.turnos && campo.turnos.length > 0 ? (
                  <ul className="flex flex-col m-0 p-0 list-none gap-4">
                    {campo.turnos.map((t: any, idx: number) => (
                      <li key={idx} className={`pb-4 ${idx !== campo.turnos.length - 1 ? 'border-b border-emerald-100' : ''}`}>
                        <div className="flex items-center gap-2 text-slate-700 text-sm md:text-base font-bold">
                          <span className="text-emerald-500 text-xl leading-none">•</span>
                          <span>{t.nome}: <span className="font-medium text-slate-600">{formatarDataExtenso(t.data_inicio)} {isEn ? 'to' : 'a'} {formatarDataExtenso(t.data_fim)}</span></span>
                        </div>
                        <div className="ml-7 mt-2 flex flex-wrap gap-4 items-center">
                          <span className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-full shadow-sm">
                            👥 Vagas: {t.vagas || 'N/A'}
                          </span>
                          {t.permite_dias && (
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                              ↳ {isEn ? 'Available per day' : 'Disponível dias soltos'} ({t.preco_dia}€ / {isEn ? 'day' : 'dia'})
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-600 font-medium text-sm m-0">{campo.datas_disponiveis || dict.detalhe.definir_atualizacoes}</p>
                )}
              </div>
            </div>

            {/* INFORMAÇÕES IMPORTANTES */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-6">{dict.detalhe.informacoes_importantes}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-2xl">👥</span>
                  <div><h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">{dict.detalhe.racio_monitores}</h4><p className="text-sm font-bold text-slate-700 m-0">{racioCampo || dict.detalhe.sob_consulta}</p></div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-2xl">🍎</span>
                  <div><h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">{dict.detalhe.alimentacao}</h4><p className="text-sm font-bold text-slate-700 m-0">{alimentacaoCampo || dict.detalhe.sob_consulta}</p></div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-2xl">🏕️</span>
                  <div><h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">{dict.detalhe.alojamento}</h4><p className="text-sm font-bold text-slate-700 m-0">{alojamentoCampo || dict.detalhe.nao_inclui_dormida}</p></div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-2xl">🛡️</span>
                  <div><h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">{dict.detalhe.seguros}</h4><p className="text-sm font-bold text-slate-700 m-0">{seguroCampo || dict.detalhe.sob_consulta}</p></div>
                </div>
              </div>
            </div>

            {/* ZONA DE AVALIAÇÕES (MÓDULO NOVO) */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
                <h2 className="text-xl font-bold text-slate-900 m-0">{isEn ? 'Reviews' : 'Avaliações'}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[#EBA914] text-xl font-black">★ {scoreAvaliacoes > 0 ? scoreAvaliacoes.toFixed(1) : 'Novo'}</span>
                </div>
              </div>
              
              {!reviews || reviews.length === 0 ? (
                <div className="text-center py-6 text-slate-400 font-bold text-sm">
                  {isEn ? 'No reviews for this camp yet. Be the first!' : 'Ainda não há avaliações. Seja o primeiro a deixar opinião após o campo!'}
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="flex flex-col gap-2 pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-600 text-sm flex-shrink-0">
                          {rev.nome_pai ? rev.nome_pai.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 m-0">{rev.nome_pai || 'Anónimo'}</p>
                          <p className="text-xs font-bold text-slate-400 m-0">{new Date(rev.created_at).toLocaleDateString(isEn ? 'en-US' : 'pt-PT')}</p>
                        </div>
                      </div>
                      <div className="text-[#EBA914] text-xs">{'★'.repeat(rev.rating)}{'☆'.repeat(5-rev.rating)}</div>
                      <p className="text-sm text-slate-600 m-0 font-medium">{rev.comentario}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FORMULÁRIO DE CONTACTO */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{dict.detalhe.duvidas_titulo}</h3>
              <p className="text-sm text-slate-500 font-medium mb-8">{dict.detalhe.duvidas_sub}</p>
              
              <form action="https://formsubmit.co/info@hellocamp.com" method="POST" className="flex flex-col gap-6">
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_subject" value={`${isEn ? 'Question regarding HelloCamp:' : 'Dúvida sobre o campo HelloCamp:'} ${nomeCampo}`} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.nome}</label>
                    <input type="text" name={isEn ? 'First_Name' : 'Nome'} required className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-slate-400" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.apelido}</label>
                    <input type="text" name={isEn ? 'Last_Name' : 'Apelido'} required className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-slate-400" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.email_encarregado}</label>
                    <input type="email" name="Email" required className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-slate-400" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.contacto_telefonico}</label>
                    <input type="tel" name={isEn ? 'Phone' : 'Telefone'} required className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-slate-400" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.idade_participante}</label>
                  <input type="number" name={isEn ? 'Age' : 'Idade'} min="1" required className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-slate-400" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.mensagem}</label>
                  <textarea name={isEn ? 'Message' : 'Mensagem'} rows={4} required className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-slate-400 resize-none"></textarea>
                </div>
                
                <button type="submit" className="self-start px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors shadow-sm">
                  {dict.detalhe.enviar_mensagem}
                </button>
              </form>
            </div>
          </div>

          <div className="w-full lg:w-[400px] flex-shrink-0 lg:sticky lg:top-8">
            <CaixaReserva campo={campo} lang={lang} dict={dict} />
          </div>
        </div>
      </div>
    </main>
  );
}