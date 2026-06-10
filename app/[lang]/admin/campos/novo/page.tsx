"use client";

import { useState, use, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import imageCompression from 'browser-image-compression';
import React from "react";

type ImagePreview = {
  file?: File;
  url?: string;
  preview: string;
  isMain: boolean;
};

const FOTOS_PADRAO = [
  { url: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1200&auto=format&fit=crop", nome: "Surf / Desportos Aquáticos" },
  { url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1200&auto=format&fit=crop", nome: "Acampamento / Tendas" },
  { url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop", nome: "Tecnologia / Sala" },
  { url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=1200&auto=format&fit=crop", nome: "Artes / Pintura" },
  { url: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop", nome: "Desporto / Relvado" },
  { url: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?q=80&w=1200&auto=format&fit=crop", nome: "Diversão / Brincar" },
  { url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1200&auto=format&fit=crop", nome: "Inglês / Londres" },
  { url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop", nome: "Inglês / Bandeira" },
  { url: "https://images.unsplash.com/photo-1503917988258-f87a78e3c995?q=80&w=1200&auto=format&fit=crop", nome: "Francês / Paris" }
];

const PERGUNTAS_SUGERIDAS = {
  "Desporto": [
    "Qual o nível de experiência na modalidade?",
    "A criança é federada nalgum clube?",
    "Qual o peso e altura? (Para equipamentos)",
    "Traz equipamento próprio ou precisa de alugar?"
  ],
  "Aventura & Natureza": [
    "Já tem experiência a dormir em tendas?",
    "Traz saco de cama e esteira próprios?",
    "A criança tem medo de alturas ou do escuro?"
  ],
  "Tecnologia & Ciência": [
    "Qual o nível de conhecimentos de informática?",
    "Vai trazer computador próprio (Portátil)?",
    "Qual o sistema operativo que utiliza (Mac/Windows)?"
  ],
  "Artes & Criatividade": [
    "Toca algum instrumento musical? Qual?",
    "Tem experiência prévia com teatro/dança?",
    "Traz os seus próprios materiais de pintura?"
  ],
  "Línguas": [
    "Já estudou este idioma antes?",
    "Qual o nível de proficiência atual (A1, A2, B1...)?",
    "Fez algum exame oficial recentemente?"
  ]
};

const PERGUNTAS_GERAIS = [
  "Autoriza que a criança saia sozinha no final do dia?",
  "Alguém diferente do encarregado vai recolher a criança?"
];

export default function NovoCampo({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const router = useRouter();
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [usarFotoPadrao, setUsarFotoPadrao] = useState(false);
  const [documentos, setDocumentos] = useState<File[]>([]);
  
  const [mapPreview, setMapPreview] = useState<{lat: number, lon: number} | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);

  const [pais, setPais] = useState("Portugal");
  const [linguas, setLinguas] = useState({ pt: true, en: false, es: false, fr: false, de: false });

  const [faixasSelecionadas, setFaixasSelecionadas] = useState({
    ca6_9: false, ca10_13: false, ca14_17: false, outra: false
  });
  const [idadeManual, setIdadeManual] = useState("");

  const [turnos, setTurnos] = useState([{ nome: "", data_inicio: "", data_fim: "", preco: 0, permite_dias: false, preco_dia: 0, vagas: 20 }]);

  const [perguntasCustomizadas, setPerguntasCustomizadas] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    nome: "", categoria: "", local: "", Distrito: "",
    racio_monitores: "", duracao_dias: 7,
    alimentacao: "Não tem", alojamento: "Não tem", seguro: "Incluído no Preço",
    politica_cancelamento: "Moderada (Reembolso a 50% até 15 dias antes)",
    tipo_pagamento: "100_total", // <--- Adicionado para controlar a estratégia de tesouraria
    descricao: "", regras_termos: "",
    extra_alimentacao: 0, tipo_cobranca_alimentacao: "Por Turno",
    extra_alojamento: 0, tipo_cobranca_alojamento: "Por Turno",
    extra_prolongamento: 0, tipo_cobranca_prolongamento: "Por Turno",
    extra_transporte: 0, tipo_cobranca_transporte: "Por Turno"
  });

  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];
  const paises = [
    { pt: "Portugal", en: "Portugal" }, { pt: "Espanha", en: "Spain" }, { pt: "França", en: "France" },
    { pt: "Reino Unido", en: "United Kingdom" }, { pt: "Brasil", en: "Brazil" }, { pt: "Estados Unidos", en: "United States" }, { pt: "Outro", en: "Other" }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map((file, index) => ({
        file, preview: URL.createObjectURL(file), isMain: images.length === 0 && index === 0
      }));
      setImages(prev => [...prev, ...newImages]);
      setUsarFotoPadrao(false);
    }
  };

  const selecionarFotoPadrao = (url: string) => {
    setImages([{ url, preview: url, isMain: true }]);
    setUsarFotoPadrao(true);
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, idx) => idx !== indexToRemove);
      if (prev[indexToRemove].isMain && newImages.length > 0) newImages[0].isMain = true;
      if (newImages.length === 0) setUsarFotoPadrao(false);
      return newImages;
    });
  };

  const setMainImage = (indexToMain: number) => {
    setImages(prev => prev.map((img, idx) => ({ ...img, isMain: idx === indexToMain })));
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setDocumentos(prev => [...prev, ...Array.from(e.target.files as FileList)]);
  };

  const removeDoc = (indexToRemove: number) => setDocumentos(prev => prev.filter((_, idx) => idx !== indexToRemove));

  const handleLinguasChange = (langKey: keyof typeof linguas) => setLinguas(prev => ({ ...prev, [langKey]: !prev[langKey] }));

  const getLinguasString = () => {
    const ativas = [];
    if (linguas.pt) ativas.push("Português");
    if (linguas.en) ativas.push("Inglês");
    if (linguas.es) ativas.push("Espanhol");
    if (linguas.fr) ativas.push("Francês");
    if (linguas.de) ativas.push("Alemão");
    return ativas.join(", ");
  };

  const handleFaixasChange = (key: keyof typeof faixasSelecionadas) => {
    setFaixasSelecionadas(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const construirStringIdades = () => {
    const lista = [];
    if (faixasSelecionadas.ca6_9) lista.push("6-9 anos");
    if (faixasSelecionadas.ca10_13) lista.push("10-13 anos");
    if (faixasSelecionadas.ca14_17) lista.push("14-17 anos");
    if (faixasSelecionadas.outra && idadeManual.trim()) lista.push(idadeManual.trim());
    return lista.join(", ");
  };

  const handleAddTurno = () => setTurnos([...turnos, { nome: "", data_inicio: "", data_fim: "", preco: 0, permite_dias: false, preco_dia: 0, vagas: 20 }]);
  const handleRemoveTurno = (index: number) => setTurnos(turnos.filter((_, i) => i !== index));
  const handleTurnoChange = (index: number, field: string, value: string | number | boolean) => {
    const novosTurnos = [...turnos];
    novosTurnos[index] = { ...novosTurnos[index], [field]: value };
    setTurnos(novosTurnos);
  };

  const handleAddPergunta = () => setPerguntasCustomizadas([...perguntasCustomizadas, ""]);
  const handleRemovePergunta = (index: number) => setPerguntasCustomizadas(perguntasCustomizadas.filter((_, i) => i !== index));
  const handlePerguntaChange = (index: number, val: string) => {
    const novas = [...perguntasCustomizadas];
    novas[index] = val;
    setPerguntasCustomizadas(novas);
  };

  const adicionarPerguntaSugerida = (pergunta: string) => {
    if (!perguntasCustomizadas.includes(pergunta)) {
      setPerguntasCustomizadas([...perguntasCustomizadas, pergunta]);
    }
  };

  const sugestoesAtuais = formData.categoria 
    ? PERGUNTAS_SUGERIDAS[formData.categoria as keyof typeof PERGUNTAS_SUGERIDAS] || [] 
    : [];

  const buscarNoMapaManual = async () => {
    if (formData.local.length < 3) return;
    try {
      const queryStr = pais === "Portugal" && formData.Distrito ? `${formData.local}, ${formData.Distrito}, ${pais}` : `${formData.local}, ${pais}`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}`);
      const data = await res.json();
      if (data && data.length > 0) setMapPreview({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
    } catch (e) { console.error(e); }
    setAddressSuggestions([]);
  };

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (formData.local.length > 4 && !mapPreview) {
        try {
          const queryStr = pais === "Portugal" && formData.Distrito ? `${formData.local}, ${formData.Distrito}, ${pais}` : `${formData.local}, ${pais}`;
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=5`);
          const data = await res.json();
          setAddressSuggestions(data || []);
        } catch (e) { console.error(e); }
      } else { setAddressSuggestions([]); }
    }, 600);
    return () => clearTimeout(delayDebounce);
  }, [formData.local, formData.Distrito, pais]);

  const sanitizeFileName = (name: string) => {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.\-]/g, "_");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const stringIdadesCompleta = construirStringIdades();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    if (!mapPreview) { alert(isEn ? "Please ensure the map is loaded." : "Por favor, garanta que o mapa carregou."); setLoading(false); return; }
    if (images.length === 0) { alert(isEn ? "Please select a photo." : "Por favor, adicione uma fotografia."); setLoading(false); return; }
    if (!stringIdadesCompleta) { alert(isEn ? "Please select or type at least one age range." : "Por favor, selecione ou digite pelo menos uma faixa etária."); setLoading(false); return; }

    try {
      setStatusText(isEn ? "Processing images..." : "A processar fotografias...");
      const uploadedImages = await Promise.all(images.map(async (img) => {
        if (img.url) return { url: img.url, isMain: img.isMain };
        const compressedFile = await imageCompression(img.file!, { maxSizeMB: 0.2, maxWidthOrHeight: 1200, useWebWorker: true });
        const fileName = `${Date.now()}-${sanitizeFileName(compressedFile.name)}`;
        const { error } = await supabase.storage.from('campos-imagens').upload(fileName, compressedFile);
        if (error) throw error;
        const { data: publicUrlData } = supabase.storage.from('campos-imagens').getPublicUrl(fileName);
        return { url: publicUrlData.publicUrl, isMain: img.isMain };
      }));

      const mainImageUrl = uploadedImages.find(i => i.isMain)?.url || uploadedImages[0].url;
      const galeriaUrls = uploadedImages.filter(i => !i.isMain).map(i => i.url);

      setStatusText(isEn ? "Uploading documents..." : "A processar documentos...");
      const programasDocs = await Promise.all(documentos.map(async (doc) => {
        const fileName = `${Date.now()}-${sanitizeFileName(doc.name)}`;
        const { error } = await supabase.storage.from('campos-documentos').upload(fileName, doc);
        if (error) throw error;
        const { data: publicUrlData } = supabase.storage.from('campos-documentos').getPublicUrl(fileName);
        return { nome: doc.name, url: publicUrlData.publicUrl };
      }));

      setStatusText(isEn ? "Saving camp..." : "A gravar o campo principal...");
      const linguasFinais = getLinguasString();
      const perguntasValidas = perguntasCustomizadas.filter(p => p.trim() !== "");
      
      const precoGlobal = turnos[0]?.preco || 0;
      const formatarDataStr = (d: string) => d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }) : '';
      const textoDatas = turnos.map(t => `${formatarDataStr(t.data_inicio)} a ${formatarDataStr(t.data_fim)}`).join(", ");
      const totalVagasCalculado = turnos.reduce((acc, curr) => acc + (Number(curr.vagas) || 0), 0);

      const { data: novoCampoInserido, error: insertError } = await supabase.from("campos").insert([{
        ...formData,
        idade: stringIdadesCompleta,
        vagas_totais: totalVagasCalculado,
        preco: precoGlobal,                      
        datas_disponiveis: textoDatas,           
        datas_disponiveis_en: textoDatas,     
        pais, pais_en: pais, 
        linguas_faladas: linguasFinais, linguas_faladas_en: linguasFinais,
        imagem: mainImageUrl, galeria: galeriaUrls,
        programas_pdf: programasDocs, regras_termos_en: formData.regras_termos, politica_cancelamento_en: formData.politica_cancelamento,
        latitude: mapPreview.lat, longitude: mapPreview.lon,
        turnos, turnos_en: turnos, organizador_id: session.user.id,
        nome_en: formData.nome, categoria_en: formData.categoria, local_en: formData.local, idade_en: stringIdadesCompleta, descricao_en: formData.descricao,
        alimentacao_en: formData.alimentacao, alojamento_en: formData.alojamento, seguro_en: formData.seguro, Distrito_en: formData.Distrito,
        perguntas_customizadas: perguntasValidas,
        perguntas_customizadas_en: perguntasValidas
      }]).select("id").single();

      if (insertError) throw insertError;

      fetch(`/api/translate-camp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: novoCampoInserido.id })
      }).catch(err => console.error("Erro assíncrono de tradução:", err));

      router.push(`/${lang}/admin/campos`);
    } catch (error: any) { 
      alert("Erro: " + error.message); 
      setLoading(false);
    } finally { 
      setStatusText(""); 
    }
  };

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '2rem' }}>
        {isEn ? 'Add New Camp' : 'Criar Novo Programa de Férias'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* 1. INFO BÁSICA */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>{isEn ? '1. Basic Information' : '1. Informações Básicas'}</h2>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>{isEn ? 'Camp Name' : 'Nome do Campo'}</label>
              <input type="text" required onChange={e => setFormData({...formData, nome: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{isEn ? 'Category' : 'Categoria'}</label>
              <select required onChange={e => setFormData({...formData, categoria: e.target.value})} style={selectStyle}>
                <option value="">{isEn ? 'Select...' : 'Selecione...'}</option>
                <option value="Desporto">{isEn ? 'Sports' : 'Desporto'}</option>
                <option value="Aventura & Natureza">{isEn ? 'Adventure & Nature' : 'Aventura & Natureza'}</option>
                <option value="Tecnologia & Ciência">{isEn ? 'Tech & Science' : 'Tecnologia & Ciência'}</option>
                <option value="Artes & Criatividade">{isEn ? 'Arts & Creativity' : 'Artes & Criatividade'}</option>
                <option value="Línguas">{isEn ? 'Languages' : 'Línguas'}</option>
              </select>
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{isEn ? 'Age Groups (Select multiple or add manually)' : 'Faixas Etárias'}</label>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: '0.5rem', marginBottom: '1rem' }}>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={faixasSelecionadas.ca6_9} onChange={() => handleFaixasChange('ca6_9')} /> 6-9 {isEn ? 'years' : 'anos'}</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={faixasSelecionadas.ca10_13} onChange={() => handleFaixasChange('ca10_13')} /> 10-13 {isEn ? 'years' : 'anos'}</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={faixasSelecionadas.ca14_17} onChange={() => handleFaixasChange('ca14_17')} /> 14-17 {isEn ? 'years' : 'anos'}</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={faixasSelecionadas.outra} onChange={() => handleFaixasChange('outra')} /> {isEn ? 'Custom range' : 'Outro intervalo'}</label>
              </div>
              {faixasSelecionadas.outra && (
                <div style={{ maxWidth: '300px', animation: 'fadeIn 0.2s' }}>
                  <label style={{ ...labelStyle, fontSize: '11px', color: '#64748b' }}>{isEn ? 'Custom Age Group' : 'Faixa Etária Customizada (ex: 8-15 anos)'}</label>
                  <input type="text" required={faixasSelecionadas.outra} value={idadeManual} onChange={e => setIdadeManual(e.target.value)} placeholder="Ex: 8-15 anos" style={inputStyle} />
                </div>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
              <label style={{...labelStyle, color: '#0f172a'}}>{isEn ? 'Cancellation Policy' : 'Política de Cancelamento'}</label>
              <select required value={formData.politica_cancelamento} onChange={e => setFormData({...formData, politica_cancelamento: e.target.value})} style={{...selectStyle, width: '100%'}}>
                <option value="Flexível (Reembolso a 100% até 7 dias antes)">{isEn ? 'Flexible (100% refund up to 7 days before)' : 'Flexível (Reembolso a 100% até 7 dias antes)'}</option>
                <option value="Moderada (Reembolso a 50% até 15 dias antes)">{isEn ? 'Moderate (50% refund up to 15 days before)' : 'Moderada (Reembolso a 50% até 15 dias antes)'}</option>
                <option value="Estrita (Sem reembolso após reserva)">{isEn ? 'Strict (No refund after booking)' : 'Estrita (Sem reembolso após reserva)'}</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>{isEn ? 'Spoken Languages' : 'Línguas Faladas'}</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.pt} onChange={() => handleLinguasChange('pt')} /> PT</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.en} onChange={() => handleLinguasChange('en')} /> EN</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.es} onChange={() => handleLinguasChange('es')} /> ES</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.fr} onChange={() => handleLinguasChange('fr')} /> FR</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.de} onChange={() => handleLinguasChange('de')} /> DE</label>
              </div>
            </div>
          </div>
        </div>

        {/* 2. LOCALIZAÇÃO */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>{isEn ? '2. Location' : '2. Localização'}</h2>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>{isEn ? 'Country' : 'País'}</label>
              <select required value={pais} onChange={e => { setPais(e.target.value); setMapPreview(null); if (e.target.value !== "Portugal") setFormData({...formData, Distrito: ""}); }} style={selectStyle}>
                {paises.map(p => <option key={p.pt} value={p.pt}>{isEn ? p.en : p.pt}</option>)}
              </select>
            </div>
            {pais === "Portugal" && (
              <div>
                <label style={labelStyle}>{isEn ? 'District' : 'Distrito'}</label>
                <select required onChange={e => { setFormData({...formData, Distrito: e.target.value}); setMapPreview(null); }} style={selectStyle}>
                  <option value="">{isEn ? 'Select District...' : 'Selecione o Distrito...'}</option>
                  {distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
            <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
              <label style={labelStyle}>{isEn ? 'Specific Address' : 'Morada Específica (Pressione Enter para pesquisar)'}</label>
              <input type="text" required value={formData.local} onChange={e => { setFormData({...formData, local: e.target.value}); setMapPreview(null); }} onBlur={buscarNoMapaManual} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); buscarNoMapaManual(); } }} style={inputStyle} />
              
              {addressSuggestions.length > 0 && !mapPreview && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '0.5rem', marginTop: '0.25rem', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                  {addressSuggestions.map((sugestao, index) => (
                    <div key={index} onClick={() => { setFormData({ ...formData, local: sugestao.display_name }); setMapPreview({ lat: parseFloat(sugestao.lat), lon: parseFloat(sugestao.lon) }); setAddressSuggestions([]); }} style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: index !== addressSuggestions.length -1 ? '1px solid #f1f5f9' : 'none', fontSize: '13px', color: '#334155' }}>
                      {sugestao.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {mapPreview && (
            <div style={{ marginTop: '1.5rem', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <iframe width="100%" height="250" frameBorder="0" scrolling="no" src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapPreview.lon-0.005},${mapPreview.lat-0.005},${mapPreview.lon+0.005},${mapPreview.lat+0.005}&layer=mapnik&marker=${mapPreview.lat},${mapPreview.lon}`}></iframe>
            </div>
          )}
        </div>

        {/* 3. TURNOS E FLEXIBILIDADE */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>{isEn ? '3. Shifts & Flexibility' : '3. Turnos e Flexibilidade'}</h2>
            <button type="button" onClick={handleAddTurno} style={{ backgroundColor: '#f1f5f9', color: '#059669', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>+ {isEn ? 'Add Shift' : 'Adicionar Turno'}</button>
          </div>
          
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={labelStyle}>{isEn ? 'Base Duration (Days)' : 'Duração Base (em Dias)'}</label>
              <input type="number" required value={formData.duracao_dias} onChange={e => setFormData({...formData, duracao_dias: Number(e.target.value)})} style={inputStyle} />
            </div>
          </div>

          {turnos.map((turno, index) => (
            <div key={index} style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                <div style={{ flex: '1 1 180px' }}><label style={labelStyle}>{isEn ? 'Shift Name' : 'Nome do Turno'}</label><input type="text" required value={turno.nome} onChange={e => handleTurnoChange(index, 'nome', e.target.value)} style={inputStyle} /></div>
                <div style={{ flex: '1 1 110px' }}><label style={labelStyle}>{isEn ? 'Start Date' : 'Data Início'}</label><input type="date" required value={turno.data_inicio} onChange={e => handleTurnoChange(index, 'data_inicio', e.target.value)} style={inputStyle} /></div>
                <div style={{ flex: '1 1 110px' }}><label style={labelStyle}>{isEn ? 'End Date' : 'Data Fim'}</label><input type="date" required value={turno.data_fim} onChange={e => handleTurnoChange(index, 'data_fim', e.target.value)} style={inputStyle} /></div>
                <div style={{ width: '90px' }}><label style={labelStyle}>{isEn ? 'Spots' : 'Vagas'}</label><input type="number" required value={turno.vagas} onChange={e => handleTurnoChange(index, 'vagas', Number(e.target.value))} style={inputStyle} /></div>
                <div style={{ width: '100px' }}><label style={labelStyle}>{isEn ? 'Price (€)' : 'Preço (€)'}</label><input type="number" required value={turno.preco} onChange={e => handleTurnoChange(index, 'preco', Number(e.target.value))} style={inputStyle} /></div>
                {turnos.length > 1 && <button type="button" onClick={() => handleRemoveTurno(index)} style={{ padding: '0.875rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>X</button>}
              </div>

              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <label style={checkboxLabelStyle}>
                  <input type="checkbox" checked={turno.permite_dias} onChange={e => handleTurnoChange(index, 'permite_dias', e.target.checked)} />
                  {isEn ? 'Allow booking specific days?' : 'Permitir inscrição em dias isolados?'}
                </label>
                {turno.permite_dias && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>{isEn ? 'Price/Day (€):' : 'Preço/Dia (€):'}</label>
                    <input type="number" required={turno.permite_dias} value={turno.preco_dia} onChange={e => handleTurnoChange(index, 'preco_dia', Number(e.target.value))} style={{ ...inputStyle, width: '100px', padding: '0.5rem' }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 4. CONDIÇÕES E DOCUMENTOS */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>{isEn ? '4. Program & Conditions' : '4. Programa e Condições'}</h2>
          
          <div style={{ gridColumn: '1 / -1', backgroundColor: '#eff6ff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #bfdbfe', marginBottom: '2rem' }}>
            <label style={{...labelStyle, color: '#1e3a8a'}}>{isEn ? 'Payment Rule for Parents' : 'Condição de Pagamento Exigida (Aos Pais)'}</label>
            <p style={{ fontSize: '13px', color: '#1e40af', marginBottom: '1rem', marginTop: '-0.25rem' }}>
              Pode facilitar a vida aos pais exigindo apenas um sinal de 50% para reservar a vaga. O resto do valor será pago 1 semana antes.
            </p>
            <select required value={formData.tipo_pagamento} onChange={e => setFormData({...formData, tipo_pagamento: e.target.value})} style={{...selectStyle, width: '100%', borderColor: '#93c5fd'}}>
              <option value="100_total">{isEn ? '100% Upfront at Booking' : '100% Pago no Ato da Reserva (Tradicional)'}</option>
              <option value="50_sinal">{isEn ? '50% Deposit Now + 50% Later' : 'Sinal de 50% Agora + 50% 1 Semana Antes'}</option>
            </select>
          </div>

          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>{isEn ? 'Food' : 'Alimentação'}</label>
              <select value={formData.alimentacao} onChange={e => setFormData({...formData, alimentacao: e.target.value})} style={selectStyle}>
                <option value="Incluído no Preço">Incluído no Preço</option><option value="Opcional (Pago à parte)">Opcional</option><option value="Não tem">Não tem</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{isEn ? 'Accommodation' : 'Alojamento'}</label>
              <select value={formData.alojamento} onChange={e => setFormData({...formData, alojamento: e.target.value})} style={selectStyle}>
                <option value="Incluído no Preço">Incluído no Preço</option><option value="Opcional (Pago à parte)">Opcional</option><option value="Não tem">Não tem</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{isEn ? 'Insurance' : 'Seguro Obrigatório'}</label>
              <select value={formData.seguro} onChange={e => setFormData({...formData, seguro: e.target.value})} style={selectStyle}>
                <option value="Incluído no Preço">Incluído</option><option value="Pago à parte no local">Pago no local</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{isEn ? 'Staff Ratio' : 'Rácio Monitores'}</label>
              <input type="text" value={formData.racio_monitores} onChange={e => setFormData({...formData, racio_monitores: e.target.value})} style={inputStyle} />
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{isEn ? 'Full Description' : 'Descrição Completa do Programa'}</label>
              <textarea rows={5} required onChange={e => setFormData({...formData, descricao: e.target.value})} style={{...inputStyle, resize: 'vertical'}} />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <label style={labelStyle}>{isEn ? 'Specific Rules & Terms' : 'Regras e Termos Específicos'}</label>
              <textarea rows={4} onChange={e => setFormData({...formData, regras_termos: e.target.value})} style={{...inputStyle, resize: 'vertical'}} />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #cbd5e1' }}>
              <label style={labelStyle}>{isEn ? 'Camp Program (PDF)' : 'Programa do Campo (PDF/Word)'}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                {documentos.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%' }}>
                    {documentos.map((doc, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '13px', gap: '1rem' }}>
                        <span style={{ fontWeight: 'bold', color: '#0f172a' }}>📄 {doc.name}</span>
                        <button type="button" onClick={() => removeDoc(idx)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                      </div>
                    ))}
                  </div>
                )}
                <label style={{ display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: '#e2e8f0', color: '#334155', fontWeight: 'bold', borderRadius: '0.5rem', cursor: 'pointer', textAlign: 'center', fontSize: '14px' }}>
                  + {isEn ? 'Attach Document' : 'Anexar Documento'}
                  <input type="file" accept=".pdf,.doc,.docx" multiple onChange={handleDocSelect} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 5. CUSTOS EXTRA OPCIONAIS */}
        <div style={sectionStyle}>
          <div style={{ marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>{isEn ? '5. Optional Services (€)' : '5. Custos de Serviços Opcionais (€)'}</h2>
          </div>
          <div style={gridStyle}>
            {['alimentacao', 'alojamento', 'prolongamento', 'transporte'].map(extra => (
              <div key={extra} style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                <label style={labelStyle}>{extra.charAt(0).toUpperCase() + extra.slice(1)} Extra</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="number" onChange={e => setFormData({...formData, [`extra_${extra}`]: Number(e.target.value)})} style={{...inputStyle, flex: 1}} />
                  <select value={(formData as any)[`tipo_cobranca_${extra}`]} onChange={e => setFormData({...formData, [`tipo_cobranca_${extra}`]: e.target.value})} style={{...selectStyle, flex: 1}}>
                    <option value="Por Turno">Por Turno</option><option value="Por Dia">Por Dia</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5.1. PERGUNTAS CUSTOMIZADAS PARA O CHECKOUT */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              {isEn ? '5.1. Checkout Questions' : '5.1. Perguntas para o Checkout'}
            </h2>
            <button type="button" onClick={handleAddPergunta} style={{ backgroundColor: '#f1f5f9', color: '#059669', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
              + {isEn ? 'Custom Question' : 'Pergunta Livre'}
            </button>
          </div>
          
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '-0.5rem', marginBottom: '1rem' }}>
            {isEn ? 'Select suggested questions or create your own to ask parents during booking.' : 'Selecione as perguntas sugeridas para a sua categoria ou crie perguntas livres.'}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
            {sugestoesAtuais.map((pergunta, idx) => (
              <button 
                key={`cat-${idx}`} type="button" onClick={() => adicionarPerguntaSugerida(pergunta)} disabled={perguntasCustomizadas.includes(pergunta)}
                style={{ padding: '0.5rem 0.875rem', backgroundColor: perguntasCustomizadas.includes(pergunta) ? '#f1f5f9' : '#f0fdf4', color: perguntasCustomizadas.includes(pergunta) ? '#94a3b8' : '#059669', border: `1px solid ${perguntasCustomizadas.includes(pergunta) ? '#e2e8f0' : '#a7f3d0'}`, borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', cursor: perguntasCustomizadas.includes(pergunta) ? 'default' : 'pointer', transition: 'all 0.2s' }}
              >
                + {pergunta}
              </button>
            ))}
            {PERGUNTAS_GERAIS.map((pergunta, idx) => (
              <button 
                key={`geral-${idx}`} type="button" onClick={() => adicionarPerguntaSugerida(pergunta)} disabled={perguntasCustomizadas.includes(pergunta)}
                style={{ padding: '0.5rem 0.875rem', backgroundColor: perguntasCustomizadas.includes(pergunta) ? '#f1f5f9' : '#f8fafc', color: perguntasCustomizadas.includes(pergunta) ? '#94a3b8' : '#475569', border: `1px solid ${perguntasCustomizadas.includes(pergunta) ? '#e2e8f0' : '#cbd5e1'}`, borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', cursor: perguntasCustomizadas.includes(pergunta) ? 'default' : 'pointer' }}
              >
                + {pergunta}
              </button>
            ))}
          </div>
          
          {perguntasCustomizadas.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '0.75rem' }}>
              <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold', margin: 0 }}>
                {isEn ? 'No questions added yet.' : 'Nenhuma pergunta adicionada ao checkout.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {perguntasCustomizadas.map((pergunta, index) => (
                <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '30px', height: '30px', backgroundColor: '#0f172a', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px', flexShrink: 0 }}>{index + 1}</div>
                  <input type="text" value={pergunta} onChange={e => handlePerguntaChange(index, e.target.value)} placeholder={isEn ? `Type your question here...` : `Escreva a sua pergunta livre...`} style={inputStyle} required />
                  <button type="button" onClick={() => handleRemovePergunta(index)} style={{ padding: '0.875rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}>Remover</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. GALERIA */}
        <div style={sectionStyle}>
          <div style={{ marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>{isEn ? '6. Main Photo & Gallery' : '6. Fotografia Principal e Galeria'}</h2>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Opção A: Escolher Padrão</p>
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {FOTOS_PADRAO.map((foto, idx) => (
                <div key={idx} onClick={() => selecionarFotoPadrao(foto.url)} style={{ minWidth: '120px', height: '80px', borderRadius: '0.5rem', overflow: 'hidden', border: images[0]?.url === foto.url ? '3px solid #059669' : '1px solid #cbd5e1', cursor: 'pointer', position: 'relative' }}>
                  <img src={foto.url} alt={foto.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {images[0]?.url === foto.url && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 150, 105, 0.2)' }} />}
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 'bold', margin: '1.5rem 0', fontSize: '12px' }}>OU</div>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', cursor: 'pointer', backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '0.75rem', transition: 'background-color 0.2s' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', fontSize: '15px' }}>📸 Clique aqui para enviar fotografias...</span>
            <input type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
          </label>

          {images.length > 0 && !usarFotoPadrao && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', border: img.isMain ? '3px solid #059669' : '1px solid #e2e8f0', height: '120px' }}>
                  <img src={img.preview} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: '5px', right: '5px', background: '#dc2626', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                  {!img.isMain && (
                    <button type="button" onClick={() => setMainImage(idx)} style={{ position: 'absolute', bottom: '5px', left: '5px', right: '5px', background: 'rgba(15,23,42,0.85)', color: 'white', fontSize: '11px', padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                      Tornar Principal
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1rem' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#b45309', fontWeight: 'bold' }}>
            ⚠️ Importante: Após gravar, o seu campo ficará em análise pela equipa HelloCamp para validação e contrato.
          </p>
        </div>

        <button type="submit" disabled={loading} style={{ padding: '1.25rem', backgroundColor: '#0f172a', color: 'white', fontWeight: '900', borderRadius: '0.75rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1.125rem', transition: 'transform 0.1s' }}>
          {loading ? statusText : 'Gravar e Submeter para Validação'}
        </button>
      </form>
    </main>
  );
}

const sectionStyle = { backgroundColor: 'white', padding: '2.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
const sectionTitleStyle = { fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '2rem' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const inputStyle = { width: '100%', padding: '0.875rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' as const };
const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' as const, backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' };
const checkboxLabelStyle = { display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '14px', color: '#334155', cursor: 'pointer', fontWeight: '600' };