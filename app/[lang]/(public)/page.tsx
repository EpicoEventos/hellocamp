"use client";

import { supabase } from "../../../lib/supabase";
import Link from "next/link";
import { getDictionary } from "../../../lib/getDictionary";
import BotaoFavorito from "./components/BotaoFavorito";

// ARRAY DE PAÍSES (Com imagens novas de alta qualidade)
const PAISES_DESTAQUE = [
  { nome: "Portugal", nome_en: "Portugal", imagem: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&q=80&w=1000", desc: "Aventura e Sol", desc_en: "Adventure and Sun" },
  { nome: "Espanha", nome_en: "Spain", imagem: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&q=80&w=1000", desc: "Cultura e Diversão", desc_en: "Culture and Fun" },
  { nome: "Reino Unido", nome_en: "United Kingdom", imagem: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=1000", desc: "Inglês Nativo", desc_en: "Native English" },
  { nome: "França", nome_en: "France", imagem: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=1000", desc: "Arte e História", desc_en: "Art and History" },
  { nome: "Alemanha", nome_en: "Germany", imagem: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&q=80&w=1000", desc: "Inovação e Natureza", desc_en: "Innovation & Nature" },
  { nome: "Itália", nome_en: "Italy", imagem: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=1000", desc: "Gastronomia e Cultura", desc_en: "Food and Culture" },
  { nome: "Estados Unidos", nome_en: "United States", imagem: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&q=80&w=1000", desc: "A Grande Aventura", desc_en: "The Great Adventure" },
  { nome: "Irlanda", nome_en: "Ireland", imagem: "https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?auto=format&fit=crop&q=80&w=1000", desc: "Verdes e Lendas", desc_en: "Greens and Legends" },
  { nome: "Suíça", nome_en: "Switzerland", imagem: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&q=80&w=1000", desc: "Montanhas e Lagos", desc_en: "Mountains and Lakes" }
];

// ARRAY DE DISTRITOS
const DISTRITOS_DESTAQUE = [
  { nome: "Lisboa", nome_en: "Lisbon", imagem: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&q=80&w=1000", desc: "Capital Vibrante", desc_en: "Vibrant Capital" },
  { nome: "Porto", nome_en: "Porto", imagem: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&q=80&w=1000", desc: "A Magia do Norte", desc_en: "Northern Magic" },
  { nome: "Faro", nome_en: "Faro", imagem: "https://images.unsplash.com/photo-1533556019545-21d7b322a46c?auto=format&fit=crop&q=80&w=1000", desc: "Praias do Algarve", desc_en: "Algarve Beaches" },
  { nome: "Braga", nome_en: "Braga", imagem: "https://images.unsplash.com/photo-1563806229-37330eb02d33?auto=format&fit=crop&q=80&w=1000", desc: "Cidade Jovem", desc_en: "Youth City" },
  { nome: "Setúbal", nome_en: "Setúbal", imagem: "https://images.unsplash.com/photo-1590500139707-1b0dff17be6c?auto=format&fit=crop&q=80&w=1000", desc: "Serra e Mar", desc_en: "Mountains & Sea" },
  { nome: "Aveiro", nome_en: "Aveiro", imagem: "https://images.unsplash.com/photo-1627392683050-8b63e9f4eb8d?auto=format&fit=crop&q=80&w=1000", desc: "A Veneza de Portugal", desc_en: "The Venice of Portugal" },
  { nome: "Coimbra", nome_en: "Coimbra", imagem: "https://images.unsplash.com/photo-1562947230-0eb5343d9229?auto=format&fit=crop&q=80&w=1000", desc: "História e Saber", desc_en: "History and Knowledge" },
  { nome: "Leiria", nome_en: "Leiria", imagem: "https://images.unsplash.com/photo-1551221156-f56f2f9c572a?auto=format&fit=crop&q=80&w=1000", desc: "Ondas e Litoral", desc_en: "Waves and Coastline" }
];

const TRADUCOES_PAISES: Record<string, string> = {
  "Portugal": "Portugal", "Espanha": "Spain", "França": "France", "Reino Unido": "United Kingdom",
  "Alemanha": "Germany", "Itália": "Italy", "Estados Unidos": "United States", "Irlanda": "Ireland",
  "Suíça": "Switzerland", "Brasil": "Brazil"
};

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "pt" | "en");
  const isEn = lang === 'en';

  const { data: camposDeFerias } = await supabase.from('campos').select('*').not('contrato_parceiro_url', 'is', null).limit(3).order('created_at', { ascending: false });
  
  const { data: camposFiltros } = await supabase.from('campos').select('categoria, categoria_en, idade, idade_en, Distrito, Distrito_en, pais, pais_en').not('contrato_parceiro_url', 'is', null);
  
  const categoriasMap = new Map();
  const idadesMap = new Map();
  const distritosMap = new Map();
  const paisesMap = new Map();

  if (camposFiltros) {
    camposFiltros.forEach(c => {
      if (c.categoria && c.categoria.trim()) categoriasMap.set(c.categoria.trim(), c.categoria_en?.trim() || c.categoria.trim());
      if (c.idade && c.idade.trim()) idadesMap.set(c.idade.trim(), c.idade_en?.trim() || c.idade.trim());
      if (c.Distrito && c.Distrito.trim()) distritosMap.set(c.Distrito.trim(), c.Distrito_en?.trim() || c.Distrito.trim());
      if (c.pais && c.pais.trim()) paisesMap.set(c.pais.trim(), c.pais_en?.trim() || c.pais.trim());
    });
  }

  const categoriasOpcoes = Array.from(categoriasMap.entries()).map(([pt, en]) => ({ valor: pt, label: isEn ? en : pt }));
  const idadesOpcoes = Array.from(idadesMap.entries()).map(([pt, en]) => ({ valor: pt, label: isEn ? en : pt }));
  const distritosOpcoes = Array.from(distritosMap.entries()).map(([pt, en]) => ({ valor: pt, label: isEn ? en : pt }));
  const paisesOpcoes = Array.from(paisesMap.entries()).map(([pt, en]) => ({ valor: pt, label: isEn ? (en || TRADUCOES_PAISES[pt] || pt) : pt }));

  const distritosAtivosCards = DISTRITOS_DESTAQUE.filter(distrito => distritosMap.has(distrito.nome));
  const paisesAtivosCards = PAISES_DESTAQUE.filter(pais => paisesMap.has(pais.nome));

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* HERO SECTION */}
      <section className="relative h-[75vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=2000" alt="Crianças no campo" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight">{dict.home.titulo}</h1>
          <p className="mt-6 text-lg md:text-2xl font-medium text-white/90 tracking-wide leading-relaxed max-w-3xl">
            {dict.home.subtitulo}
          </p>
        </div>
      </section>

      {/* SEARCH FILTERS BOX */}
      <section id="pesquisa" className="relative py-20 bg-slate-50 border-b border-slate-200 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3">{dict.home.filtros_inteligentes}</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{dict.home.encontre_campo}</h2>
            <p className="mt-4 text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">{dict.home.descricao_filtros}</p>
          </div>

          <div className="relative bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 p-6 md:p-8 border border-slate-100 max-w-4xl mx-auto mb-8">
            
            <div className="absolute -top-4 right-8 z-20 hidden md:block">
              <Link href={`/${lang}/mapa`} className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 hover:-translate-y-1 transition-transform">
                📍 {dict.home.ver_mapa}
              </Link>
            </div>

            <form action={`/${lang}/pesquisa`} method="GET" className="mt-4 flex flex-col gap-6">
              
              {/* MAIN SEARCH BAR + SUBMIT BUTTON ALIGNED */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-xl">🔍</span>
                  </div>
                  <input 
                    type="text" 
                    name="q" 
                    placeholder={isEn ? "Search by camp name, sport, or city..." : "O que procura? Ex: Ténis no Porto, Campo Aventura..."} 
                    className="w-full pl-14 pr-4 py-4 md:py-5 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-900 text-lg md:text-xl font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-medium"
                  />
                </div>
                
                <button type="submit" className="w-full md:w-auto px-10 py-4 md:py-5 bg-[#EBA914] hover:bg-amber-500 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-transform hover:-translate-y-1">
                  <span className="text-white text-base md:text-lg font-black uppercase tracking-wider">{dict.home.pesquisar}</span>
                </button>
              </div>

              {/* DIVIDER */}
              <div className="flex items-center gap-4 w-full px-2">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isEn ? 'Advanced Filters' : 'Busca Avançada'}</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              {/* 4 DROPDOWNS CLÁSSICOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{isEn ? 'Country' : 'País'}</label>
                  <select name="pais" className="w-full appearance-none rounded-xl bg-white px-4 py-3 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:border-emerald-500 cursor-pointer shadow-sm">
                    <option value="">{isEn ? 'All Countries' : 'Todos os Países'}</option>
                    {paisesOpcoes.map((p: any) => <option key={p.valor} value={p.valor}>{p.label}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-[28px] text-slate-400 text-xs">▼</div>
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{dict.home.distrito}</label>
                  <select name="distrito" className="w-full appearance-none rounded-xl bg-white px-4 py-3 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:border-emerald-500 cursor-pointer shadow-sm">
                    <option value="">{dict.home.todos_distritos}</option>
                    {distritosOpcoes.map((d: any) => <option key={d.valor} value={d.valor}>{d.label}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-[28px] text-slate-400 text-xs">▼</div>
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{dict.home.categoria}</label>
                  <select name="categoria" className="w-full appearance-none rounded-xl bg-white px-4 py-3 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:border-emerald-500 cursor-pointer shadow-sm">
                    <option value="">{dict.home.todas_categorias}</option>
                    {categoriasOpcoes.map((cat: any) => <option key={cat.valor} value={cat.valor}>{cat.label}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-[28px] text-slate-400 text-xs">▼</div>
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{dict.home.faixa_etaria}</label>
                  <select name="idade" className="w-full appearance-none rounded-xl bg-white px-4 py-3 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:border-emerald-500 cursor-pointer shadow-sm">
                    <option value="">{dict.home.todas_idades}</option>
                    {idadesOpcoes.map((faixa: any) => <option key={faixa.valor} value={faixa.valor}>{faixa.label}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-[28px] text-slate-400 text-xs">▼</div>
                </div>
              </div>

            </form>
          </div>
        </div>
      </section>

      {/* SECÇÃO DISTRITOS */}
      {distritosAtivosCards.length > 0 && (
        <section className="max-w-7xl mx-auto py-20 px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{dict.home.descubra_regiao_titulo}</h2>
            <p className="mt-4 text-base text-slate-500">{dict.home.descubra_regiao_sub}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {distritosAtivosCards.map((distrito) => {
              const nomeDistrito = isEn ? distrito.nome_en : distrito.nome;
              const descDistrito = isEn ? distrito.desc_en : distrito.desc;

              return (
                <Link href={`/${lang}/distrito/${encodeURIComponent(distrito.nome)}`} key={distrito.nome} className="group relative block h-[280px] w-full overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-slate-900">
                  <img src={distrito.imagem} alt={nomeDistrito} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-6">
                    <h3 className="text-2xl font-black text-white tracking-tight">{nomeDistrito}</h3>
                    <p className="mt-1 text-sm font-bold text-[#EBA914]">{descDistrito}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* SECÇÃO PAÍSES */}
      {paisesAtivosCards.length > 0 && (
        <section className="bg-slate-50 py-20 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{isEn ? 'Discover by Country' : 'Descubra por País'}</h2>
              <p className="mt-4 text-base text-slate-500">{isEn ? 'International camps and global experiences' : 'Campos internacionais e experiências globais'}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {paisesAtivosCards.map((pais) => {
                const nomePais = isEn ? pais.nome_en : pais.nome;
                const descPais = isEn ? pais.desc_en : pais.desc;
                
                return (
                  <Link href={`/${lang}/pesquisa/pais/${encodeURIComponent(pais.nome)}`} key={pais.nome} className="group relative block h-[280px] w-full overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-slate-900">
                    <img src={pais.imagem} alt={nomePais} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-6">
                      <h3 className="text-2xl font-black text-white tracking-tight">{nomePais}</h3>
                      <p className="mt-1 text-sm font-bold text-[#EBA914]">{descPais}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* DESTAQUES GERAIS */}
      {camposDeFerias && camposDeFerias.length > 0 && (
        <section className="bg-white py-20 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{dict.home.destaques_titulo}</h2>
              <p className="mt-4 text-base text-slate-500">{dict.home.destaques_subtitulo}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {camposDeFerias.map((campo: any, index: number) => {
                const campoId = campo.id !== undefined && campo.id !== null ? campo.id : index + 1;
                const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
                const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
                const localCampo = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
                const idadeCampo = isEn && campo.idade_en ? campo.idade_en : campo.idade;
                const precoVisivel = campo.preco || (campo.turnos && campo.turnos.length > 0 ? campo.turnos[0].preco : 0);

                return (
                  <div key={campoId} className="group relative flex flex-col bg-white overflow-hidden border border-slate-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    
                    <Link href={`/${lang}/campo/${campoId}`} className="absolute inset-0 z-10">
                      <span className="sr-only">{dict.home.explorar} {nomeCampo}</span>
                    </Link>

                    <div className="absolute top-4 right-4 z-20">
                      <BotaoFavorito campoId={campoId} />
                    </div>

                    <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                      <img src={campo.imagem} alt={nomeCampo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute top-4 left-4 bg-emerald-600 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white rounded-full z-0">
                        {catCampo}
                      </div>
                    </div>
                    
                    <div className="flex flex-col p-6 flex-1 pointer-events-none">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2">📍 {localCampo}</span>
                      <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">{nomeCampo}</h3>
                      <p className="text-sm text-slate-500 font-medium mb-6">{dict.home.faixa_etaria_label} {idadeCampo}</p>
                      
                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                        <p className="text-2xl font-black text-emerald-600 m-0">{precoVisivel}€</p>
                        <span className="text-sm font-black uppercase tracking-wider text-[#EBA914] transition-transform group-hover:translate-x-1">
                          {dict.home.explorar} &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

    </main>
  );
}