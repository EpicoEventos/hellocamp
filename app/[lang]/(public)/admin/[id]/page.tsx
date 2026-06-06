import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoFavorito from "../../components/BotaoFavorito";

// 1. CHEFE DE SEO DINÂMICO PARA A PÁGINA DO ORGANIZADOR
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ lang: string; id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  const { data: organizador } = await supabase.from('perfis').select('empresa_nome, nome_completo, biografia_empresa, biografia_empresa_en').eq('id', id).single();
  
  if (!organizador) return { title: 'Parceiro não encontrado | HelloCamp' };
  
  const nomeReal = (organizador.empresa_nome && organizador.empresa_nome.trim() !== "") 
    ? organizador.empresa_nome 
    : (organizador.nome_completo ? organizador.nome_completo.split(' ')[0] : 'Organizador');

  const bioDesc = organizador.biografia_empresa ? organizador.biografia_empresa.substring(0, 150) + '...' : `Descubra todos os campos de férias e programas de ${nomeReal} na HelloCamp.`;

  return { 
    title: `${nomeReal} | Programas e Campos de Férias | HelloCamp`,
    description: bioDesc,
    openGraph: {
      title: `${nomeReal} na HelloCamp`,
      description: bioDesc,
      type: 'profile'
    }
  };
}

export default async function PerfilOrganizador({ 
  params 
}: { 
  params: Promise<{ lang: string; id: string }> 
}) {
  const { lang, id } = await params;
  const isEn = lang === 'en';

  // 2. Busca Rápida e em Paralelo dos Dados do Parceiro e os Seus Campos Ativos
  const [ { data: organizador }, { data: camposData } ] = await Promise.all([
    supabase.from("perfis").select("*").eq("id", id).single(),
    supabase.from("campos").select("*").eq("organizador_id", id).not('contrato_parceiro_url', 'is', null).order('created_at', { ascending: false })
  ]);

  const campos = camposData || [];

  if (!organizador) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-slate-50 font-sans px-4 text-center">
        <span className="text-6xl mb-4">🔎</span>
        <h1 className="text-3xl font-black text-slate-900">{isEn ? 'Partner not found' : 'Parceiro não encontrado'}</h1>
        <p className="text-slate-500 mt-2 font-medium">{isEn ? 'The profile you are looking for might have been moved or disabled.' : 'O perfil que procura pode ter sido movido ou desativado.'}</p>
        <Link href={`/${lang}/pesquisa`} className="mt-8 px-6 py-3 bg-emerald-600 text-white rounded-full font-bold shadow-lg hover:bg-emerald-700 transition-transform hover:-translate-y-1">
          {isEn ? 'Explore all camps' : 'Explorar todos os campos'}
        </Link>
      </div>
    );
  }

  // 3. Lógica Estrita de Nomenclatura B2B
  const nomeEmpresa = (organizador.empresa_nome && organizador.empresa_nome.trim() !== "") 
    ? organizador.empresa_nome 
    : (organizador.nome_completo ? organizador.nome_completo.split(' ')[0] : (isEn ? "Organizer" : "Organizador"));

  const biografia = isEn && organizador.biografia_empresa_en ? organizador.biografia_empresa_en : organizador.biografia_empresa;
  
  const totalCampos = campos.length;
  
  // Lógica Gramatical Dinâmica (1 Programa vs X Programas)
  const textoProgramas = totalCampos === 1 
    ? (isEn ? '1 Program' : '1 Programa') 
    : (isEn ? `${totalCampos} Programs` : `${totalCampos} Programas`);

  const cidadesAtuacao = Array.from(new Set(campos.map((c: any) => c.Distrito).filter(Boolean)));

  // 4. Motor de Recomendação: Campos Semelhantes na Mesma Região (Excluindo os deste organizador)
  let querySemelhantes = supabase
    .from("campos")
    .select("*")
    .not('contrato_parceiro_url', 'is', null)
    .neq('organizador_id', id)
    .limit(3)
    .order('created_at', { ascending: false });

  if (cidadesAtuacao.length > 0) {
    querySemelhantes = querySemelhantes.in('Distrito', cidadesAtuacao as string[]);
  }

  const { data: semelhantesData } = await querySemelhantes;
  const camposSemelhantes = semelhantesData || [];

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": nomeEmpresa,
    "description": biografia || `Fornecedor de atividades e campos de férias associado à HelloCamp.`,
    "url": `https://www.hellocamp.pt/${lang}/parceiro/${id}`,
    "logo": organizador.logotipo_url || ""
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />

      {/* 1. CABEÇALHO DO PERFIL (HEADER) - ELEGANTE E SÓBRIO SEM QUADRADOS */}
      <section className="bg-slate-900 pt-20 pb-32 px-4 md:px-6 relative flex flex-col items-center text-center border-b border-slate-800">
        
        {/* LOGOTIPO */}
        <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full p-1.5 shadow-2xl flex-shrink-0 flex items-center justify-center overflow-hidden mb-6 z-10 relative">
          {organizador.logotipo_url ? (
            <img src={organizador.logotipo_url} alt={nomeEmpresa} className="w-full h-full object-contain rounded-full" />
          ) : (
            <span className="text-5xl md:text-6xl font-black text-slate-300">{nomeEmpresa.charAt(0)}</span>
          )}
        </div>
        
        {/* NOME E TAGS */}
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
            {nomeEmpresa}
          </h1>
          
          <div className="flex flex-wrap justify-center gap-3">
            <span className="flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-sm text-slate-200 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-slate-700/50">
              🏕️ {textoProgramas}
            </span>
            {organizador.parceiro_verificado && (
              <span className="flex items-center gap-1.5 bg-emerald-500/10 backdrop-blur-sm text-emerald-400 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-500/20">
                ✓ {isEn ? 'Verified' : 'Verificado'}
              </span>
            )}
            {organizador.ano_fundacao && (
              <span className="flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-sm text-slate-200 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-slate-700/50">
                🏛️ {isEn ? 'Est.' : 'Desde'} {organizador.ano_fundacao}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 2. CONTEÚDO PRINCIPAL (SPLIT LAYOUT: SIDEBAR + LISTAGEM) */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR: SOBRE A ENTIDADE (Fixo no scroll) */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 lg:sticky lg:top-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">{isEn ? 'About the Organizer' : 'Sobre a Entidade'}</h3>
            
            <ul className="space-y-8">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 shrink-0 border border-slate-100">📍</div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isEn ? 'Active Regions' : 'Zonas de Atuação'}</span>
                  <span className="text-sm font-black text-slate-900">{cidadesAtuacao.length > 0 ? cidadesAtuacao.join(', ') : 'Nacional'}</span>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">🛡️</div>
                <div>
                  <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">{isEn ? 'Trust Guarantee' : 'Garantia HelloCamp'}</span>
                  <span className="text-sm font-bold text-slate-900 leading-tight block">{isEn ? 'Identity verified. Safe and encrypted payments.' : 'Identidade validada. Transações seguras e encriptadas.'}</span>
                </div>
              </li>
            </ul>

            {biografia && (
              <div className="mt-8 pt-8 border-t border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{isEn ? 'Manifesto / Bio' : 'Manifesto / Bio'}</span>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {biografia}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* LISTAGEM DE CAMPOS DO ORGANIZADOR */}
        <div className="w-full lg:w-2/3">
          {totalCampos === 0 ? (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center">
              <span className="text-4xl mb-4 text-slate-300">🏕️</span>
              <h3 className="text-xl font-black text-slate-900 mb-2">{isEn ? 'No active programs yet' : 'Sem programas ativos'}</h3>
              <p className="text-slate-500 font-medium max-w-md mx-auto">{isEn ? `${nomeEmpresa} has no active camps to book right now. Check back later!` : `${nomeEmpresa} não tem nenhum campo aberto a inscrições de momento.`}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campos.map((campo: any) => {
                const nomeVisivel = isEn && campo.nome_en ? campo.nome_en : campo.nome;
                const localVisivel = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
                const precoVisivel = campo.preco || (campo.turnos && campo.turnos.length > 0 ? campo.turnos[0].preco : 0);
                const catVisivel = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;

                return (
                  <div key={campo.id} className="group flex flex-col bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm relative hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-[400px]">
                    
                    <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10">
                      <span className="sr-only">Explorar {nomeVisivel}</span>
                    </Link>

                    <div className="absolute top-4 right-4 z-20">
                      <BotaoFavorito campoId={campo.id} />
                    </div>

                    {/* IMAGEM E CATEGORIA */}
                    <div className="relative h-[200px] w-full overflow-hidden bg-slate-100 shrink-0">
                      <img src={campo.imagem} alt={nomeVisivel} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute top-4 left-4 bg-emerald-600/90 backdrop-blur-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white rounded-full z-0 border border-emerald-500/50">
                        {catVisivel}
                      </div>
                    </div>

                    {/* INFO DO CARTÃO */}
                    <div className="flex flex-col p-6 flex-1 pointer-events-none bg-white">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1.5 truncate">📍 {localVisivel}</span>
                      <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 line-clamp-2">{nomeVisivel}</h3>
                      
                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{isEn ? 'From' : 'A partir de'}</span>
                          <p className="text-2xl font-black text-emerald-600 m-0 leading-none">{precoVisivel}€</p>
                        </div>
                        
                        <div className="w-10 h-10 rounded-full bg-[#EBA914] flex items-center justify-center transition-transform group-hover:scale-110 shadow-md shadow-amber-500/30">
                          <span className="text-white text-lg font-black leading-none">&rarr;</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 3. SUGESTÕES (OUTRAS OPÇÕES NA MESMA REGIÃO) */}
      {camposSemelhantes.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-24">
          <div className="border-t border-slate-200 pt-16">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">{isEn ? 'Other options in the region' : 'Outras opções nesta região'}</h2>
            <p className="text-slate-500 font-medium mb-8">{isEn ? 'Discover more highly-rated programs nearby.' : 'Descubra outros programas fantásticos perto de si.'}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {camposSemelhantes.map((campo: any) => {
                const nomeVisivel = isEn && campo.nome_en ? campo.nome_en : campo.nome;
                const localVisivel = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
                const precoVisivel = campo.preco || (campo.turnos && campo.turnos.length > 0 ? campo.turnos[0].preco : 0);
                const catVisivel = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;

                return (
                  <div key={campo.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10"><span className="sr-only">Explorar {nomeVisivel}</span></Link>
                    <div className="absolute top-3 right-3 z-20"><BotaoFavorito campoId={campo.id} /></div>

                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      <img src={campo.imagem} alt={nomeVisivel} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute top-3 left-3 bg-emerald-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white rounded-full z-0">
                        {catVisivel}
                      </div>
                    </div>

                    <div className="flex flex-col p-5 flex-1 pointer-events-none bg-white">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">📍 {localVisivel}</span>
                      <h3 className="text-base font-black text-slate-900 leading-tight mb-4 line-clamp-2">{nomeVisivel}</h3>
                      
                      <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100">
                        <p className="text-xl font-black text-emerald-600 m-0">{precoVisivel}€</p>
                        <span className="text-xs font-bold text-[#EBA914] uppercase tracking-wider">{isEn ? 'Explore' : 'Ver Mais'}</span>
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