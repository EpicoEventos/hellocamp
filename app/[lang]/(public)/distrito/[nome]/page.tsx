import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { getDictionary } from "@/lib/getDictionary";
import BotaoFavorito from "../../components/BotaoFavorito";

// ARRAY DE IMAGENS DE FALLBACK (Para garantir que nunca aparecem imagens quebradas)
const IMAGENS_DISTRITOS: Record<string, string> = {
  "Lisboa": "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&q=80&w=1000",
  "Porto": "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&q=80&w=1000",
  "Faro": "https://images.unsplash.com/photo-1533556019545-21d7b322a46c?auto=format&fit=crop&q=80&w=1000",
  "Braga": "https://images.unsplash.com/photo-1563806229-37330eb02d33?auto=format&fit=crop&q=80&w=1000",
  "Setúbal": "https://images.unsplash.com/photo-1590500139707-1b0dff17be6c?auto=format&fit=crop&q=80&w=1000",
  "Aveiro": "https://images.unsplash.com/photo-1627392683050-8b63e9f4eb8d?auto=format&fit=crop&q=80&w=1000",
  "Coimbra": "https://images.unsplash.com/photo-1562947230-0eb5343d9229?auto=format&fit=crop&q=80&w=1000",
  "Leiria": "https://images.unsplash.com/photo-1551221156-f56f2f9c572a?auto=format&fit=crop&q=80&w=1000",
};

// Imagem premium genérica caso seja um distrito sem foto mapeada
const IMAGEM_GENERICA = "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=1000";

// 1. O CHEF DO SEO: Injeta os títulos e descrições dinâmicos para o Google
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ lang: string; nome: string }> 
}): Promise<Metadata> {
  const { lang, nome } = await params;
  const isEn = lang === 'en';
  const nomeLimpo = decodeURIComponent(nome);

  const { data: distrito } = await supabase
    .from('distritos')
    .select('seo_titulo, seo_descricao, seo_titulo_en, seo_descricao_en, nome, nome_en')
    .ilike('nome', nomeLimpo)
    .single();

  if (!distrito) {
    return { title: isEn ? 'District Not Found | HelloCamp' : 'Distrito Não Encontrado | HelloCamp' };
  }

  const title = isEn 
    ? (distrito.seo_titulo_en || `Summer Camps in ${distrito.nome_en || distrito.nome} | HelloCamp`) 
    : (distrito.seo_titulo || `Campos de Férias em ${distrito.nome} | HelloCamp`);
    
  const description = isEn ? distrito.seo_descricao_en : distrito.seo_descricao;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description || '',
    }
  };
}

export default async function PaginaDoDistrito({ 
  params 
}: { 
  params: Promise<{ lang: string; nome: string }> 
}) {
  const { lang, nome } = await params;
  const dict = await getDictionary(lang as "pt" | "en");
  const isEn = lang === 'en';
  
  const nomeLimpo = decodeURIComponent(nome);
  
  const { data: distrito } = await supabase
    .from('distritos')
    .select('*')
    .ilike('nome', nomeLimpo) 
    .single();

  const { data: camposNoDistrito } = await supabase
    .from('campos')
    .select('*')
    .not('contrato_parceiro_url', 'is', null)
    .or(`Distrito.ilike.%${nomeLimpo}%,local.ilike.%${nomeLimpo}%`); 

  if (!distrito) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center font-sans px-4">
        <h1 className="text-3xl font-black text-slate-900">
          {isEn ? 'District not found' : 'Não foi possível encontrar este distrito'} 🕵️‍♂️
        </h1>
        <Link href={`/${lang}`} className="mt-6 font-bold text-emerald-600 hover:text-emerald-700">
          &larr; {isEn ? 'Back to home' : 'Voltar à página inicial'}
        </Link>
      </div>
    );
  }

  const nomeDistrito = isEn && distrito.nome_en ? distrito.nome_en : distrito.nome;
  
  const descDistritoLonga = isEn 
    ? (distrito.seo_descricao_en || distrito.descricao_curta_en) 
    : (distrito.seo_descricao || distrito.descricao_curta);

  // Define a imagem final (Lógica do Fallback)
  const imagemCapaFinal = distrito.imagem_capa && distrito.imagem_capa.trim() !== "" 
    ? distrito.imagem_capa 
    : (IMAGENS_DISTRITOS[distrito.nome] || IMAGEM_GENERICA);

  // SCHEMA MARKUP PARA BREADCRUMBS
  const baseUrl = "https://www.hellocamp.pt";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": isEn ? "Home" : "Início", "item": `${baseUrl}/${lang}` },
      { "@type": "ListItem", "position": 2, "name": "Portugal", "item": `${baseUrl}/${lang}/pesquisa/pais/Portugal` },
      { "@type": "ListItem", "position": 3, "name": nomeDistrito, "item": `${baseUrl}/${lang}/distrito/${encodeURIComponent(nomeLimpo)}` }
    ]
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* SCRIPT SEO INVISÍVEL */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* 2. HEADER HERO DO DISTRITO */}
      <section className="bg-white border-b border-slate-200 pt-8 pb-12 px-4 md:px-6">
        <div className="max-w-[1100px] mx-auto">
          
          {/* BREADCRUMBS VISUAIS */}
          <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-6 tracking-wider uppercase">
            <Link href={`/${lang}`} className="hover:text-emerald-600 transition-colors">{isEn ? 'Home' : 'Início'}</Link>
            <span>/</span>
            <Link href={`/${lang}/pesquisa/pais/Portugal`} className="hover:text-emerald-600 transition-colors">Portugal</Link>
            <span>/</span>
            <span className="text-slate-600">{nomeDistrito}</span>
          </nav>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="max-w-2xl">
              <span className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">
                {isEn ? 'Destination Guide' : 'Guia de Destino'}
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight capitalize">
                {nomeDistrito}
              </h1>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed font-medium">
                {descDistritoLonga}
              </p>
            </div>
            
            <div className="w-full md:w-64 h-48 md:h-64 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg shadow-slate-200/50 hidden sm:block">
              <img src={imagemCapaFinal} alt={nomeDistrito} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. LISTAGEM DE CAMPOS NO DISTRITO */}
      <section className="max-w-[1100px] mx-auto px-4 py-12 md:py-16">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {isEn ? 'Available Programs' : 'Programas Disponíveis'}
            </h2>
            <p className="mt-2 text-slate-500 text-sm md:text-base font-medium">
              {isEn ? 'Explore the options we selected for' : 'Explore as opções que selecionámos para'}
              <span className="capitalize font-bold text-slate-700"> {nomeDistrito}</span>.
            </p>
          </div>
          <span className="hidden sm:inline-block text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            {camposNoDistrito?.length || 0} {isEn ? 'found' : 'encontrados'}
          </span>
        </div>
        
        {!camposNoDistrito || camposNoDistrito.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg text-slate-500 font-bold">
              {isEn ? 'There are no camps available for this district yet.' : 'Ainda não existem campos disponíveis para este distrito.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {camposNoDistrito.map((campo: any, index: number) => {
              const campoId = campo.id !== undefined && campo.id !== null ? campo.id : (index + 1);
              const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
              const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
              const localCampo = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
              const precoVisivel = campo.preco || (campo.turnos && campo.turnos.length > 0 ? campo.turnos[0].preco : 0);

              return (
                <div key={campoId} className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 relative shadow-sm hover:shadow-xl transition-all duration-300">
                  
                  <Link href={`/${lang}/campo/${campoId}`} className="absolute inset-0 z-10">
                    <span className="sr-only">Explorar {nomeCampo}</span>
                  </Link>

                  <div className="absolute top-3 right-3 z-20">
                    <BotaoFavorito campoId={campoId} />
                  </div>

                  <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                    <img src={campo.imagem} alt={nomeCampo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute top-3 left-3 bg-emerald-600 px-3 py-1 text-xs font-bold uppercase text-white rounded-full z-0">
                      {catCampo}
                    </div>
                  </div>
                  
                  <div className="flex flex-col p-5 flex-1 pointer-events-none">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">
                      📍 {localCampo}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-2">{nomeCampo}</h3>
                    <p className="text-sm text-slate-500 font-medium mb-6">
                      {isEn ? 'Age Group:' : 'Faixa Etária:'} <span className="text-slate-900">{campo.idade}</span>
                    </p>
                    
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                      <p className="text-xl font-black text-emerald-600 m-0">{precoVisivel}€</p>
                      <span className="text-sm font-bold text-[#EBA914] transition-transform group-hover:translate-x-1">
                        {isEn ? 'Explore' : 'Explorar'} &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. CROSS-LINKING */}
      <section className="bg-white border-t border-slate-200 py-16 px-4 md:px-6">
         <div className="max-w-[1100px] mx-auto">
            <h3 className="text-xl font-black text-slate-900 mb-6 capitalize">
              {isEn ? `Explore more in ${nomeDistrito}` : `Explore mais em ${nomeDistrito}`}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href={`/${lang}/pesquisa?distrito=${encodeURIComponent(distrito.nome)}&categoria=Desporto`} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-500 transition-colors text-sm font-bold text-slate-700 no-underline flex items-center gap-2 shadow-sm hover:shadow-md">
                ⚽ {isEn ? `Sports Camps in ${nomeDistrito}` : `Campos de Desporto em ${nomeDistrito}`}
              </Link>
              <Link href={`/${lang}/pesquisa?distrito=${encodeURIComponent(distrito.nome)}&categoria=Línguas`} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-500 transition-colors text-sm font-bold text-slate-700 no-underline flex items-center gap-2 shadow-sm hover:shadow-md">
                🗣️ {isEn ? `Language Camps in ${nomeDistrito}` : `Campos de Línguas em ${nomeDistrito}`}
              </Link>
              <Link href={`/${lang}/pesquisa?distrito=${encodeURIComponent(distrito.nome)}&categoria=Aventura & Natureza`} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-500 transition-colors text-sm font-bold text-slate-700 no-underline flex items-center gap-2 shadow-sm hover:shadow-md">
                🏕️ {isEn ? `Adventure Camps in ${nomeDistrito}` : `Campos de Aventura em ${nomeDistrito}`}
              </Link>
            </div>
         </div>
      </section>

    </main>
  );
}