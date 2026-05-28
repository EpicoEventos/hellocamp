import { supabase } from "../../../../lib/supabase";
import Link from "next/link";
import MapaWrapper from "./MapaWrapper";
import { getDictionary } from "../../../../lib/getDictionary";

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

  // FILTRO APLICADO: Só procura campos com contrato assinado
  let query = supabase.from("campos").select("*").not("contrato_parceiro_url", "is", null);

  if (categoria) query = query.eq("categoria", categoria);
  if (idade) query = query.eq("idade", idade);
  if (lingua) query = query.ilike("linguas_faladas", `%${lingua}%`);

  const { data: campos } = await query;

  // FILTRO APLICADO: Só extrai categorias/idades de campos com contrato assinado
  const { data: todosFiltros } = await supabase
    .from('campos')
    .select('categoria, categoria_en, idade, idade_en, linguas_faladas')
    .not("contrato_parceiro_url", "is", null);
  
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

  // Preparar as opções para os dropdowns respeitando o idioma ativo
  const categoriasOpcoes = Array.from(categoriasMap.entries()).map(([pt, en]) => ({ valor: pt, label: lang === 'en' ? en : pt }));
  const idadesOpcoes = Array.from(idadesMap.entries()).map(([pt, en]) => ({ valor: pt, label: lang === 'en' ? en : pt }));
  const linguasUnicas = Array.from(linguasMap);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', overflow: 'hidden', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      {/* LAYOUT PRINCIPAL */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* BARRA LATERAL (Filtros) */}
        <aside style={{ width: '320px', backgroundColor: 'white', borderRight: '1px solid #e2e8f0', overflowY: 'auto', padding: '1.5rem', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
          
          <Link href={`/${lang}`} style={{ display: 'inline-block', marginBottom: '1.5rem', fontSize: '13px', fontWeight: 'bold', color: '#64748b', textDecoration: 'none' }}>
            &larr; {dict.mapa.voltar}
          </Link>

          <h2 style={{ fontSize: '1.125rem', fontWeight: '800', color: '#0f172a', marginBottom: '1.5rem' }}>{dict.mapa.filtros}</h2>
          
          <form action={`/${lang}/mapa`} method="GET" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '0.5rem' }}>{dict.mapa.categoria}</label>
              <select name="categoria" defaultValue={categoria} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '13px', color: '#334155', outline: 'none' }}>
                <option value="">{dict.mapa.todas}</option>
                {categoriasOpcoes.map(cat => <option key={cat.valor} value={cat.valor}>{cat.label}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '0.5rem' }}>{dict.mapa.idade}</label>
              <select name="idade" defaultValue={idade} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '13px', color: '#334155', outline: 'none' }}>
                <option value="">{dict.mapa.qualquer_idade}</option>
                {idadesOpcoes.map(id => <option key={id.valor} value={id.valor}>{id.label}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '0.5rem' }}>{dict.mapa.linguas}</label>
              <select name="lingua" defaultValue={lingua} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '13px', color: '#334155', outline: 'none' }}>
                <option value="">{dict.mapa.qualquer_lingua}</option>
                {linguasUnicas.map(lin => <option key={lin} value={lin}>{lin}</option>)}
              </select>
            </div>

            <button type="submit" style={{ marginTop: '1rem', width: '100%', backgroundColor: '#059669', color: 'white', fontWeight: 'bold', padding: '0.875rem', borderRadius: '0.75rem', fontSize: '13px', cursor: 'pointer', border: 'none' }}>
              {dict.mapa.atualizar}
            </button>
            <Link href={`/${lang}/mapa`} style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: 'bold', textDecoration: 'none', marginTop: '0.5rem' }}>
              {dict.mapa.limpar}
            </Link>
          </form>

          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{campos?.length || 0} {dict.mapa.encontrados}</p>
          </div>
        </aside>

        {/* ÁREA DO MAPA */}
        <section style={{ flex: 1, position: 'relative' }}>
          <MapaWrapper campos={campos || []} />
        </section>

      </div>
    </main>
  );
}