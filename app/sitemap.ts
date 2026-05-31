import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.hellocamp.pt';

  // 1. Links Base (Estáticos)
  const baseUrls: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/pt`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/en`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/pt/pesquisa`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/en/pesquisa`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/pt/mapa`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  // 2. Links Dinâmicos dos Campos de Férias
  const { data: campos } = await supabase.from('campos').select('id, updated_at').not('contrato_parceiro_url', 'is', null);
  
  const camposUrls: MetadataRoute.Sitemap = (campos || []).flatMap((campo) => [
    { url: `${baseUrl}/pt/campo/${campo.id}`, lastModified: new Date(campo.updated_at || new Date()), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/en/campo/${campo.id}`, lastModified: new Date(campo.updated_at || new Date()), changeFrequency: 'weekly', priority: 0.8 }
  ]);

  // 3. Links Dinâmicos dos Países (Guias de Destino)
  const { data: paises } = await supabase.from('paises').select('nome, updated_at');
  
  const paisesUrls: MetadataRoute.Sitemap = (paises || []).flatMap((pais) => [
    { url: `${baseUrl}/pt/pesquisa/${encodeURIComponent(pais.nome)}`, lastModified: new Date(pais.updated_at || new Date()), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/en/pesquisa/${encodeURIComponent(pais.nome)}`, lastModified: new Date(pais.updated_at || new Date()), changeFrequency: 'weekly', priority: 0.8 }
  ]);

  // 4. Links Dinâmicos dos Distritos (Guias de Destino)
  const { data: distritos } = await supabase.from('distritos').select('nome, updated_at');
  
  const distritosUrls: MetadataRoute.Sitemap = (distritos || []).flatMap((distrito) => [
    { url: `${baseUrl}/pt/distrito/${encodeURIComponent(distrito.nome)}`, lastModified: new Date(distrito.updated_at || new Date()), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/en/distrito/${encodeURIComponent(distrito.nome)}`, lastModified: new Date(distrito.updated_at || new Date()), changeFrequency: 'weekly', priority: 0.8 }
  ]);

  // Junta todos os links e envia ao Google
  return [...baseUrls, ...camposUrls, ...paisesUrls, ...distritosUrls];
}