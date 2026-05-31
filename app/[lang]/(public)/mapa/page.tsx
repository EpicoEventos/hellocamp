import { supabase } from "@/lib/supabase";
import Link from "next/link";
import MapaWrapper from "./MapaWrapper";
import { getDictionary } from "@/lib/getDictionary";

export default async function PaginaMapa({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "pt" | "en");
  const sp = await searchParams;
  
  const categoria = sp?.categoria || "";
  const idade = sp?.idade || "";
  const lingua = sp?.lingua || "";

  let query = supabase.from("campos").select("*").not("contrato_parceiro_url", "is", null);

  if (categoria) query = query.eq("categoria", categoria);
  if (idade) query = query.eq("idade", idade);
  if (lingua) query = query.ilike("linguas_faladas", `%${lingua}%`);

  const { data: campos } = await query;

  const { data: todosFiltros } = await supabase.from('campos').select('categoria, categoria_en, idade, idade_en, linguas_faladas').not("contrato_parceiro_url", "is", null);
  
  const categoriasMap = new Map();
  const idadesMap = new Map();
  const linguasMap = new Set<string>();

  if (todosFiltros) {
    todosFiltros.forEach(c => {
      if (c.categoria && c.categoria.trim()) categoriasMap.set(c.categoria.trim(), c.categoria_en?.trim() || c.categoria.trim());
      if (c.idade && c.idade.trim()) idadesMap.set(c.idade.trim(), c.idade_en?.trim() || c.idade.trim());
      if (c.linguas_faladas && c.linguas_faladas.trim()) linguasMap.add(c.linguas_faladas.trim());
    });
  }

  const categoriasOpcoes = Array.from(categoriasMap.entries()).map(([pt, en]) => ({ valor: pt, label: lang === 'en' ? en : pt }));
  const idadesOpcoes = Array.from(idadesMap.entries()).map(([pt, en]) => ({ valor: pt, label: lang === 'en' ? en : pt }));
  const linguasUnicas = Array.from(linguasMap);

  return (
    <main className="flex flex-col md:flex-row h-[calc(100vh-80px)] bg-slate-50 font-sans overflow-hidden">
        
      <aside className="w-full md:w-[320px] bg-white border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto p-4 md:p-6 flex flex-col flex-shrink-0 shadow-sm z-10 max-h-[40vh] md:max-h-full">
        
        <Link href={`/${lang}`} className="hidden md:inline-block mb-6 text-xs font-bold text-slate-500 no-underline hover:text-emerald-600">
          &larr; {dict.mapa.voltar}
        </Link>

        <h2 className="text-lg font-black text-slate-900 mb-4">{dict.mapa.filtros}</h2>
        
        <form action={`/${lang}/mapa`} method="GET" className="flex flex-col gap-4">
          
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">{dict.mapa.categoria}</label>
              <select name="categoria" defaultValue={categoria} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                <option value="">{dict.mapa.todas}</option>
                {categoriasOpcoes.map(cat => <option key={cat.valor} value={cat.valor}>{cat.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">{dict.mapa.idade}</label>
              <select name="idade" defaultValue={idade} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                <option value="">{dict.mapa.qualquer_idade}</option>
                {idadesOpcoes.map(id => <option key={id.valor} value={id.valor}>{id.label}</option>)}
              </select>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-600 mb-1">{dict.mapa.linguas}</label>
              <select name="lingua" defaultValue={lingua} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                <option value="">{dict.mapa.qualquer_lingua}</option>
                {linguasUnicas.map(lin => <option key={lin} value={lin}>{lin}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button type="submit" className="flex-1 bg-emerald-600 text-white font-bold py-2.5 rounded-lg text-sm">
              {dict.mapa.atualizar}
            </button>
            <Link href={`/${lang}/mapa`} className="text-sm text-slate-500 font-bold whitespace-nowrap">
              {dict.mapa.limpar}
            </Link>
          </div>
        </form>

        <div className="mt-4 md:mt-8 pt-4 border-t border-slate-100 hidden md:block">
          <p className="text-sm font-bold text-slate-900">{campos?.length || 0} {dict.mapa.encontrados}</p>
        </div>
      </aside>

      <section className="flex-1 relative min-h-[50vh] md:min-h-0">
        <MapaWrapper campos={campos || []} />
      </section>

    </main>
  );
}