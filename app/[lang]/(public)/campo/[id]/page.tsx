import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import CaixaReserva from "./CaixaReserva";
import BotaoFavorito from "../../components/BotaoFavorito";
import BotaoPartilha from "../../components/BotaoPartilha";
import { getDictionary } from "@/lib/getDictionary";

// 1. CHEF DO SEO PARA A PÁGINA DO CAMPO
export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { lang, id } = await params;
  const isEn = lang === 'en';

  const { data: campo } = await supabase.from('campos').select('nome, nome_en, descricao, descricao_en, imagem').eq('id', id).single();

  if (!campo) return { title: 'Camp | HelloCamp' };

  const title = (isEn && campo.nome_en ? campo.nome_en : campo.nome) + ' | HelloCamp';
  const descRaw = isEn && campo.descricao_en ? campo.descricao_en : campo.descricao;
  const description = descRaw ? descRaw.substring(0, 155) + '...' : '';

  return {
    title, description,
    openGraph: { title, description, images: [{ url: campo.imagem || '/og-image.jpg', width: 1200, height: 630 }] }
  };
}

export default async function DetalhesDoCampo({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  const dict = await getDictionary(lang as "pt" | "en");
  const isEn = lang === 'en';

  // 2. Busca do Campo e Reviews
  const { data: campo } = await supabase.from("campos").select("*").eq("id", id).single();
  const { data: reviews } = await supabase.from("reviews").select("*").eq("campo_id", id).order('created_at', { ascending: false });

  if (!campo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans">
        <h1 className="text-3xl font-black text-slate-900">{isEn ? 'Camp not found' : 'Campo não encontrado'} 🕵️‍♂️</h1>
        <Link href={`/${lang}`} className="mt-6 font-bold text-emerald-600 hover:text-emerald-700">&larr; {dict.detalhe.voltar_pesquisa}</Link>
      </div>
    );
  }

  // 3. Busca Informação do Organizador
  let parceiroInfo = null;
  if (campo.organizador_id) {
    const { data: organizador } = await supabase.from("perfis").select("nome_empresa, logotipo_url, parceiro_verificado").eq("id", campo.organizador_id).single();
    parceiroInfo = organizador;
  }

  // Gatilho de Prova Social Dinâmico
  const viewsHoje = Math.floor(Math.random() * (campo.vagas_totais > 50 ? 25 : 8)) + 2; 

  const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
  const descCampo = isEn && campo.descricao_en ? campo.descricao_en : campo.descricao;
  const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
  const localCampo = isEn && campo.local_en ? campo.local_en : (isEn && campo.Distrito_en ? campo.Distrito_en : (campo.Distrito || campo.distrito || campo.local));
  const racioCampo = isEn && campo.racio_monitores_en ? campo.racio_monitores_en : campo.racio_monitores;
  const alimentacaoCampo = isEn && campo.alimentacao_en ? campo.alimentacao_en : campo.alimentacao;
  const alojamentoCampo = isEn && campo.alojamento_en ? campo.alojamento_en : campo.alojamento;
  const seguroCampo = isEn && campo.seguro_en ? campo.seguro_en : campo.seguro;
  const regrasCampo = isEn && campo.regras_termos_en ? campo.regras_termos_en : campo.regras_termos;
  
  const paisReal = campo.pais || "Portugal"; 
  const paisVisivel = isEn && campo.pais_en ? campo.pais_en : paisReal;

  const scoreAvaliacoes = campo.rating_score || 0;
  const totalAvaliacoes = campo.total_reviews || 0;

  const formatarDataExtenso = (dStr: string) => {
    if (!dStr) return '';
    return new Date(dStr).toLocaleDateString(isEn ? 'en-US' : 'pt-PT', { day: 'numeric', month: 'long' });
  };

  const baseUrl = "https://www.hellocamp.pt";
  const campoUrlCompleto = `${baseUrl}/${lang}/campo/${campo.id}`;

  // SCHEMA MARKUP AVANÇADO (EVENTO + REVIEWS) PARA RICH SNIPPETS NO GOOGLE
  const dataMaisCedo = campo.turnos && campo.turnos.length > 0 ? campo.turnos[0].data_inicio : "2026-07-01";
  
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": nomeCampo,
    "description": descCampo ? descCampo.substring(0, 155) : '',
    "image": campo.imagem,
    "startDate": dataMaisCedo,
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled",
    "location": {
      "@type": "Place",
      "name": localCampo,
      "address": { "@type": "PostalAddress", "addressLocality": localCampo, "addressCountry": paisReal }
    },
    "offers": {
      "@type": "Offer",
      "price": campo.preco,
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString().split('T')[0]
    },
    ...(totalAvaliacoes > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": scoreAvaliacoes,
        "reviewCount": totalAvaliacoes
      }
    }),
    "organizer": {
      "@type": "Organization",
      "name": parceiroInfo?.nome_empresa || "HelloCamp Partner"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": isEn ? "Home" : "Início", "item": `${baseUrl}/${lang}` },
      { "@type": "ListItem", "position": 2, "name": paisVisivel, "item": `${baseUrl}/${lang}/pesquisa/pais/${encodeURIComponent(paisReal)}` },
      { "@type": "ListItem", "position": 3, "name": localCampo, "item": `${baseUrl}/${lang}/distrito/${encodeURIComponent(campo.Distrito || localCampo)}` },
      { "@type": "ListItem", "position": 4, "name": nomeCampo, "item": campoUrlCompleto }
    ]
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* SCRIPTS INVISÍVEIS PARA SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }} />

      {/* HERO SECTION */}
      <div className="relative w-full h-[580px] bg-slate-900 overflow-hidden">
        <img src={campo.imagem} alt={nomeCampo} className="w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent"></div>

        {/* BREADCRUMBS VISUAIS */}
        <div className="absolute top-6 left-6 z-30 hidden sm:block">
          <nav className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-700 bg-white/95 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-md border border-white/20 tracking-wider uppercase">
            <Link href={`/${lang}`} className="hover:text-emerald-600 transition-colors">{isEn ? 'Home' : 'Início'}</Link>
            <span className="text-slate-400">/</span>
            <Link href={`/${lang}/pesquisa/pais/${encodeURIComponent(paisReal)}`} className="hover:text-emerald-600 transition-colors">{paisVisivel}</Link>
            <span className="text-slate-400">/</span>
            <Link href={`/${lang}/distrito/${encodeURIComponent(campo.Distrito || localCampo)}`} className="hover:text-emerald-600 transition-colors">{localCampo}</Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-400 max-w-[120px] sm:max-w-[200px] truncate" title={nomeCampo}>{nomeCampo}</span>
          </nav>
        </div>

        <div className="absolute top-6 left-4 z-30 sm:hidden">
           <Link href={`/${lang}/distrito/${encodeURIComponent(campo.Distrito || localCampo)}`} className="inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-sm px-4 py-2.5 text-xs font-bold text-slate-700 shadow-md border border-white/20 uppercase tracking-wider">
            &larr; {localCampo}
          </Link>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto pt-10 pb-10 px-4 md:px-6">
        <div className="flex flex-col lg:flex-row gap-10 items-start w-full">
          
          <div className="flex-1 w-full flex flex-col gap-6">
            
            {/* CABEÇALHO DO CAMPO (z-40 para isolamento de contexto do modal) */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 relative z-40">
              <div className="absolute top-8 right-8 z-50 flex items-center gap-3">
                <BotaoPartilha url={campoUrlCompleto} titulo={nomeCampo} isEn={isEn} />
                <BotaoFavorito campoId={campo.id} />
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mb-5 pr-24">
                <span className="rounded-full bg-emerald-50 border border-emerald-100 px-4 py-1.5 text-xs font-bold text-emerald-700 uppercase tracking-widest">{catCampo}</span>
                <span className="text-sm font-bold text-slate-500">📍 {localCampo}</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">{nomeCampo}</h1>
              
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[#EBA914] text-lg font-black">★ {scoreAvaliacoes > 0 ? scoreAvaliacoes.toFixed(1) : 'Novo'}</span>
                  <span className="text-slate-400 text-sm font-bold underline decoration-slate-300 underline-offset-4">
                    ({totalAvaliacoes} {isEn ? 'reviews' : 'avaliações'})
                  </span>
                </div>
                <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
                  🔥 {viewsHoje} {isEn ? 'parents viewing right now' : 'pais a ver agora'}
                </div>
              </div>
            </div>

            {/* DESCRIÇÃO E PERFIL DO ORGANIZADOR */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 relative z-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-50 pb-3">{dict.detalhe.sobre_programa}</h2>
              <p className="leading-relaxed text-slate-600 text-base whitespace-pre-wrap font-medium mb-0">{descCampo}</p>
              
              {campo.organizador_id && parceiroInfo && (
                <Link href={`/${lang}/admin/${campo.organizador_id}`} className="mt-8 flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors no-underline group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                      {parceiroInfo.logotipo_url ? (
                         <img src={parceiroInfo.logotipo_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                         <span className="text-slate-400 text-lg">🏢</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest m-0">{isEn ? 'Organized by' : 'Organizado por'}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-900 m-0 group-hover:text-emerald-600 transition-colors">
                          {parceiroInfo.nome_empresa || 'Parceiro HelloCamp'}
                        </p>
                        {parceiroInfo.parceiro_verificado && (
                          <span className="text-emerald-500 text-xs" title="Parceiro Verificado">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-slate-400 font-bold">&rarr;</span>
                </Link>
              )}
            </div>

            {/* DATAS E DISPONIBILIDADE */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 relative z-10">
              <h2 className="text-xl font-bold text-slate-900 mb-5">{dict.detalhe.datas_disponibilidade}</h2>
              <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100">
                {campo.turnos && campo.turnos.length > 0 ? (
                  <ul className="flex flex-col m-0 p-0 list-none gap-4">
                    {campo.turnos.map((t: any, idx: number) => {
                      const vagasDisponiveis = Number(t.vagas);
                      const isEsgotado = vagasDisponiveis <= 0;

                      return (
                        <li key={idx} className={`pb-4 ${idx !== campo.turnos.length - 1 ? 'border-b border-emerald-100' : ''}`}>
                          <div className="flex items-center gap-2 text-slate-700 text-sm md:text-base font-bold">
                            <span className="text-emerald-500 text-xl leading-none">•</span>
                            <span className={isEsgotado ? 'line-through text-slate-400' : ''}>{t.nome}: <span className="font-medium text-slate-600">{formatarDataExtenso(t.data_inicio)} {isEn ? 'to' : 'a'} {formatarDataExtenso(t.data_fim)}</span></span>
                          </div>
                          <div className="ml-7 mt-2 flex flex-wrap gap-4 items-center">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm ${isEsgotado ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-white border border-slate-200 text-slate-600'}`}>
                              {isEsgotado ? (isEn ? 'SOLD OUT' : 'ESGOTADO') : `👥 Vagas: ${vagasDisponiveis}`}
                            </span>
                            {t.permite_dias && !isEsgotado && (
                              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                                ↳ {isEn ? 'Available per day' : 'Disponível dias soltos'} ({t.preco_dia}€)
                              </span>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-slate-600 font-medium text-sm m-0">{campo.datas_disponiveis || dict.detalhe.definir_atualizacoes}</p>
                )}
              </div>
            </div>

            {/* REGRAS E TERMOS ESPECÍFICOS */}
            {regrasCampo && (
              <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 relative z-10">
                <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-50 pb-3">{isEn ? 'Specific Rules & Terms' : 'Regras e Termos'}</h2>
                <p className="leading-relaxed text-slate-500 text-sm whitespace-pre-wrap font-medium mb-0">{regrasCampo}</p>
              </div>
            )}

            {/* INFORMAÇÕES LOGÍSTICAS IMPORTANTES */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 relative z-10">
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

            {/* SECÇÃO DE AVALIAÇÕES */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 relative z-10">
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

            {/* FORMULÁRIO DE CONTACTO COMPLETO */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 relative z-10">
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

          {/* SIDEBAR COM CAIXA DE RESERVA */}
          <div className="w-full lg:w-[400px] flex-shrink-0 lg:sticky lg:top-8 relative z-30">
            <CaixaReserva campo={campo} lang={lang} dict={dict} />
          </div>
        </div>
      </div>
    </main>
  );
}