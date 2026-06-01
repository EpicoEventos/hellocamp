import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoFavorito from "../../../components/BotaoFavorito"; // Importe ajustado de acordo com as suas pastas

// 1. O CHEF DO SEO
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ lang: string; paisNome: string }> 
}): Promise<Metadata> {
  const { lang, paisNome } = await params;
  const isEn = lang === 'en';
  const nomeLimpo = decodeURIComponent(paisNome);

  const { data: pais } = await supabase
    .from('paises')
    .select('seo_titulo, seo_descricao, seo_titulo_en, seo_descricao_en, nome, nome_en')
    .ilike('nome', nomeLimpo)
    .single();

  if (!pais) {
    return { title: isEn ? `Camps in ${nomeLimpo} | HelloCamp` : `Campos em ${nomeLimpo} | HelloCamp` };
  }

  const title = isEn 
    ? (pais.seo_titulo_en || `Summer Camps in ${pais.nome_en || pais.nome} | HelloCamp`) 
    : (pais.seo_titulo || `Campos de Férias em ${pais.nome} | HelloCamp`);
    
  const description = isEn ? pais.seo_descricao_en : pais.seo_descricao;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description || '',
    }
  };
}

// 2. O COMPONENTE PRINCIPAL DA PÁGINA
export default async function PesquisaPorPais({ 
  params,
  searchParams
}: { 
  params: Promise<{ lang: string; paisNome: string }>;
  searchParams?: Promise<{ [key: string]: string | undefined }> 
}) {
  const { lang, paisNome } = await params;
  const sp = await searchParams;
  const isEn = lang === 'en';
  
  const nomePaisInicial = decodeURIComponent(paisNome);

  // Captura os filtros do URL
  const categoriaParam = sp?.categoria || "";
  const distritoParam = sp?.distrito || "";
  const idadeParam = sp?.idade || "";

  const mostrarDistritos = nomePaisInicial === "Portugal";

  // Busca os dados editoriais
  const { data: dadosPais } = await supabase
    .from('paises')
    .select('*')
    .ilike('nome', nomePaisInicial)
    .single();

  // Busca os campos de férias
  let query = supabase.from("campos").select("*").not('contrato_parceiro_url', 'is', null);

  query = query.or(`pais.ilike.%${nomePaisInicial}%,pais_en.ilike.%${nomePaisInicial}%`);
  
  if (categoriaParam) query = query.eq("categoria", categoriaParam);
  if (distritoParam && mostrarDistritos) query = query.ilike("Distrito", `%${distritoParam}%`);
  if (idadeParam) query = query.eq("idade", idadeParam);

  const { data: campos } = await query.order('id', { ascending: false });

  // Preparação dos textos
  const nomePaisApresentar = isEn && dadosPais?.nome_en ? dadosPais.nome_en : nomePaisInicial;
  
  const descricaoPadrao = isEn 
    ? `Explore premium holiday camps in ${nomePaisApresentar}. From thrilling outdoor adventures and intensive sports clubs to creative arts and language classes, discover handpicked programs.` 
    : `Explore os melhores campos de férias em ${nomePaisApresentar}. Desde aventuras ao ar livre e atividades desportivas até programas de artes e línguas, descubra opções premium desenhadas para experiências inesquecíveis.`;
    
  const descPaisFinal = isEn 
    ? (dadosPais?.seo_descricao_en || descricaoPadrao) 
    : (dadosPais?.seo_descricao || descricaoPadrao);

  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];

  // SCHEMA MARKUP PARA BREADCRUMBS
  const baseUrl = "https://www.hellocamp.pt";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": isEn ? "Home" : "Início", "item": `${baseUrl}/${lang}` },
      { "@type": "ListItem", "position": 2, "name": isEn ? "Countries" : "Países", "item": `${baseUrl}/${lang}/pesquisa` },
      { "@type": "ListItem", "position": 3, "name": nomePaisApresentar, "item": `${baseUrl}/${lang}/pesquisa/pais/${encodeURIComponent(nomePaisInicial)}` }
    ]
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      
      {/* SCRIPT SEO INVISÍVEL */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* 1. CABEÇALHO EDITORIAL */}
      <section className="bg-white pt-8 pb-8 px-4 md:px-6">
        <div className="max-w-[1100px] mx-auto">
          
          {/* BREADCRUMBS VISUAIS */}
          <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-4 tracking-wider uppercase">
            <Link href={`/${lang}`} className="hover:text-emerald-600 transition-colors">{isEn ? 'Home' : 'Início'}</Link>
            <span>/</span>
            <Link href={`/${lang}/pesquisa`} className="hover:text-emerald-600 transition-colors">{isEn ? 'Countries' : 'Países'}</Link>
            <span>/</span>
            <span className="text-slate-600">{nomePaisApresentar}</span>
          </nav>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="max-w-3xl">
              <span className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">
                {isEn ? 'Destination Guide' : 'Guia de Destino'}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 tracking-tight capitalize">
                {isEn ? `Holiday Camps in ${nomePaisApresentar}` : `Campos de Férias em ${nomePaisApresentar}`}
              </h1>
              <p className="text-sm md:text-base text-slate-500 leading-relaxed font-medium">
                {descPaisFinal}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BARRA DE FILTROS */}
      <section className="bg-white border-y border-slate-200 py-4 px-4 md:px-6 sticky top-[72px] md:top-[80px] z-30 shadow-sm">
        <div className="max-w-[1100px] mx-auto">
          <form action={`/${lang}/pesquisa/pais/${encodeURIComponent(nomePaisInicial)}`} method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-center">
            
            <select name="categoria" defaultValue={categoriaParam} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-emerald-500 focus:bg-white transition-colors" style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}>
              <option value="">{isEn ? 'All Categories' : 'Todas as Categorias'}</option>
              <option value="Desporto">{isEn ? 'Sports' : 'Desporto'}</option>
              <option value="Aventura & Natureza">{isEn ? 'Adventure' : 'Aventura & Natureza'}</option>
              <option value="Tecnologia & Ciência">{isEn ? 'Tech' : 'Tecnologia & Ciência'}</option>
              <option value="Artes & Criatividade">{isEn ? 'Arts' : 'Artes & Criatividade'}</option>
              <option value="Línguas">{isEn ? 'Languages' : 'Línguas'}</option>
            </select>

            {mostrarDistritos && (
              <select name="distrito" defaultValue={distritoParam} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-emerald-500 focus:bg-white transition-colors" style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}>
                <option value="">{isEn ? 'All Districts' : 'Todos os Distritos'}</option>
                {distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}

            <select name="idade" defaultValue={idadeParam} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-emerald-500 focus:bg-white transition-colors" style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}>
              <option value="">{isEn ? 'All Ages' : 'Todas as Idades'}</option>
              <option value="6-9 anos">6-9 {isEn ? 'years' : 'anos'}</option>
              <option value="10-13 anos">10-13 {isEn ? 'years' : 'anos'}</option>
              <option value="14-17 anos">14-17 {isEn ? 'years' : 'anos'}</option>
            </select>

            <button type="submit" className="w-full p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition-colors shadow-sm">
              {isEn ? 'Update' : 'Atualizar'}
            </button>

            {(categoriaParam || distritoParam || idadeParam) && (
              <Link href={`/${lang}/pesquisa/pais/${encodeURIComponent(nomePaisInicial)}`} className="text-sm font-bold text-red-500 hover:text-red-600 text-center sm:text-left transition-colors">
                {isEn ? 'Clear filters' : 'Limpar filtros'}
              </Link>
            )}
          </form>
        </div>
      </section>

      {/* 3. RESULTADOS DA PESQUISA */}
      <section className="max-w-[1100px] mx-auto px-4 py-8 md:py-12">
        {!campos || campos.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg text-slate-500 font-bold">{isEn ? 'No camps found in this destination.' : 'Não foram encontrados programas neste destino.'}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-bold text-slate-500">{campos.length} {isEn ? 'experiences found' : 'experiências encontradas'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {campos.map((campo) => {
                const nomeVisivel = isEn && campo.nome_en ? campo.nome_en : campo.nome;
                const localVisivel = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
                const precoVisivel = campo.preco || (campo.turnos && campo.turnos.length > 0 ? campo.turnos[0].preco : 0);

                return (
                  <div key={campo.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 relative shadow-sm hover:shadow-xl transition-all duration-300">
                    <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10"><span className="sr-only">Explorar</span></Link>
                    <div className="absolute top-3 right-3 z-20"><BotaoFavorito campoId={campo.id} /></div>

                    <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                      <img src={campo.imagem} alt={nomeVisivel} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute top-3 left-3 bg-emerald-600 px-3 py-1 text-xs font-bold uppercase text-white rounded-full z-0">
                        {campo.categoria}
                      </div>
                    </div>

                    <div className="flex flex-col p-5 flex-1 pointer-events-none">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">📍 {localVisivel}</span>
                      <h3 className="text-lg font-black text-slate-900 leading-tight mb-2">{nomeVisivel}</h3>
                      <p className="text-sm text-slate-500 font-medium mb-6">
                        {isEn ? 'Age Group:' : 'Faixa Etária:'} <span className="text-slate-900">{campo.idade}</span>
                      </p>

                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                        <p className="text-xl font-black text-emerald-600 m-0">{precoVisivel}€</p>
                        <span className="text-sm font-bold text-[#EBA914] transition-transform group-hover:translate-x-1">{isEn ? 'Explore' : 'Explorar'} &rarr;</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* 4. CROSS-LINKING (REDE DE LINKS SEO) */}
      <section className="bg-white border-t border-slate-200 py-16 px-4 md:px-6">
         <div className="max-w-[1100px] mx-auto">
            <h3 className="text-xl font-black text-slate-900 mb-6">{isEn ? `Explore more in ${nomePaisApresentar}` : `Explore mais em ${nomePaisApresentar}`}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href={`/${lang}/pesquisa/pais/${encodeURIComponent(nomePaisInicial)}?categoria=Desporto`} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-500 transition-colors text-sm font-bold text-slate-700 no-underline flex items-center gap-2 shadow-sm hover:shadow-md">
                ⚽ {isEn ? `Sports Camps in ${nomePaisApresentar}` : `Campos de Desporto em ${nomePaisApresentar}`}
              </Link>
              <Link href={`/${lang}/pesquisa/pais/${encodeURIComponent(nomePaisInicial)}?categoria=Línguas`} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-500 transition-colors text-sm font-bold text-slate-700 no-underline flex items-center gap-2 shadow-sm hover:shadow-md">
                🗣️ {isEn ? `Language Camps in ${nomePaisApresentar}` : `Campos de Línguas em ${nomePaisApresentar}`}
              </Link>
              <Link href={`/${lang}/pesquisa/pais/${encodeURIComponent(nomePaisInicial)}?categoria=Aventura & Natureza`} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-500 transition-colors text-sm font-bold text-slate-700 no-underline flex items-center gap-2 shadow-sm hover:shadow-md">
                🏕️ {isEn ? `Adventure Camps in ${nomePaisApresentar}` : `Campos de Aventura em ${nomePaisApresentar}`}
              </Link>
            </div>
         </div>
      </section>

    </main>
  );
}