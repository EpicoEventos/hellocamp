"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function SuperAdminBroadcast({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);

  const [activeTab, setActiveTab] = useState<'nova' | 'historico'>('nova');
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState<any[]>([]);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const [form, setForm] = useState({
    publico: "organizadores",
    assunto: "",
    tituloDaMensagem: "",
    mensagem: "",
    textoBotao: "",
    linkBotao: "",
    emailsManuais: [] as string[]
  });

  // Carregar histórico
  useEffect(() => {
    if (activeTab === 'historico') {
      const fetchHistory = async () => {
        const { data } = await supabase.from('email_broadcasts').select('*').order('created_at', { ascending: false });
        if (data) setHistorico(data);
      };
      fetchHistory();
    }
  }, [activeTab]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const emailsEncontrados = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      const emailsUnicos = [...new Set(emailsEncontrados)];
      setForm({ ...form, emailsManuais: emailsUnicos });
    };
    reader.readAsText(file);
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.publico === 'csv' && form.emailsManuais.length === 0) {
      alert("Anexe um ficheiro válido que contenha e-mails."); return;
    }

    const qtd = form.publico === 'csv' ? form.emailsManuais.length : `todos (${form.publico})`;
    if (!confirm(`Tem a certeza que deseja enviar este e-mail para ${qtd} destinatários?`)) return;

    setLoading(true);

    try {
      const res = await fetch('/api/superadmin/enviar-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro no envio.");

      alert(`✅ Sucesso! E-mail enviado a ${data.totalEnviados} destinatários e guardado no histórico.`);
      setForm({ ...form, assunto: "", tituloDaMensagem: "", mensagem: "", textoBotao: "", linkBotao: "", emailsManuais: [] });
    } catch (err: any) { alert("Erro: " + err.message); } 
    finally { setLoading(false); }
  };

  const reutilizarCampanha = (campanha: any) => {
    setForm({
      publico: campanha.publico || 'todos',
      assunto: campanha.assunto,
      tituloDaMensagem: campanha.titulo || '',
      mensagem: campanha.mensagem || '',
      textoBotao: campanha.texto_botao || '',
      linkBotao: campanha.link_botao || '',
      emailsManuais: []
    });
    setActiveTab('nova');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Email Marketing & Logística</h1>
          <p className="text-slate-500 font-medium">Crie campanhas ou comunique avisos à sua base de dados.</p>
        </div>
        
        {/* TAB CONTROLS */}
        <div className="flex bg-slate-200 p-1 rounded-xl">
          <button onClick={() => setActiveTab('nova')} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'nova' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Nova Campanha</button>
          <button onClick={() => setActiveTab('historico')} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'historico' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Histórico & Tracking</button>
        </div>
      </div>

      {activeTab === 'nova' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LADO ESQUERDO: FORMULÁRIO */}
          <form onSubmit={handleEnviar} className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col gap-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Público-Alvo</label>
              <select required value={form.publico} onChange={e => setForm({...form, publico: e.target.value, emailsManuais: []})} className="w-full p-4 bg-white border border-slate-300 rounded-xl outline-none focus:border-slate-500 font-bold text-slate-700 cursor-pointer">
                <option value="organizadores">Apenas Parceiros</option>
                <option value="clientes">Apenas Pais (Clientes)</option>
                <option value="todos">Toda a Base de Dados (Parceiros + Pais)</option>
                <option value="csv">Carregar Lista Externa (CSV/TXT)</option>
              </select>

              {form.publico === 'csv' && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <label className="block text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2">Anexe a sua folha (.CSV)</label>
                  <input type="file" accept=".csv, .txt" onChange={handleFileUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 cursor-pointer" />
                  {form.emailsManuais.length > 0 && <p className="text-xs font-bold text-emerald-600 mt-3">✅ Detetados {form.emailsManuais.length} e-mails únicos.</p>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Assunto do E-mail</label>
              <input required type="text" value={form.assunto} onChange={e => setForm({...form, assunto: e.target.value})} placeholder="Ex: Prepare o Verão!" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Título Principal (No E-mail)</label>
              <input required type="text" value={form.tituloDaMensagem} onChange={e => setForm({...form, tituloDaMensagem: e.target.value})} placeholder="Ex: Novas ofertas exclusivas." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-500 font-bold" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mensagem do Corpo</label>
              <textarea required rows={8} value={form.mensagem} onChange={e => setForm({...form, mensagem: e.target.value})} placeholder="Escreva a sua mensagem..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-500 resize-y"></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Texto do Botão</label>
                <input type="text" value={form.textoBotao} onChange={e => setForm({...form, textoBotao: e.target.value})} className="w-full p-3 border border-slate-300 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Link do Botão</label>
                <input type="url" value={form.linkBotao} onChange={e => setForm({...form, linkBotao: e.target.value})} placeholder="https://" className="w-full p-3 border border-slate-300 rounded-lg outline-none" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-4 rounded-xl transition-colors mt-2 disabled:opacity-50">
              {loading ? 'A Enviar...' : '🚀 Disparar E-mail Marketing'}
            </button>
          </form>

          {/* LADO DIREITO: PRÉ-VISUALIZAÇÃO AMPLIADA */}
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Pré-Visualização em Tempo Real</span>
              <div className="flex bg-slate-200 rounded-lg p-1">
                <button onClick={() => setPreviewMode('desktop')} className={`px-4 py-1.5 text-xs font-bold rounded-md ${previewMode === 'desktop' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Computador</button>
                <button onClick={() => setPreviewMode('mobile')} className={`px-4 py-1.5 text-xs font-bold rounded-md ${previewMode === 'mobile' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Telemóvel</button>
              </div>
            </div>
            
            <div className={`bg-slate-100 border border-slate-200 rounded-3xl p-4 sm:p-8 flex-1 flex justify-center items-start transition-all overflow-y-auto min-h-[600px]`}>
              <div className={`bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col p-8 md:p-12 text-center border border-slate-200 w-full transition-all duration-300 ${previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-[600px]'}`}>
                
                <div className="text-2xl font-black tracking-tighter mb-8 font-sans border-b border-slate-100 pb-6">
                  <span className="text-slate-900">Hello</span><span className="text-[#EBA914]">Camp</span>
                </div>
                
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 leading-snug">
                  {form.tituloDaMensagem || 'O Título do seu E-mail aparece aqui'}
                </h2>
                
                <p className="text-base text-slate-600 mb-8 leading-relaxed whitespace-pre-wrap text-left min-h-[100px]">
                  {form.mensagem || 'A sua mensagem será adaptada e enviada a cada contacto da lista, com design profissional à prova de Outlook.'}
                </p>

                {form.textoBotao && form.linkBotao && (
                  <div className="bg-slate-900 text-white font-bold px-8 py-4 rounded-xl mx-auto inline-block">
                    {form.textoBotao}
                  </div>
                )}
                
                <p className="text-xs text-slate-400 mt-12 pt-6 border-t border-slate-100">Este e-mail foi enviado pela HelloCamp.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEPARADOR 2: HISTÓRICO & ANÁLISE COMPLETA */}
      {activeTab === 'historico' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-slate-900">Histórico de Disparos Analítico</h2>
              <p className="text-xs text-slate-400 font-medium">As métricas atualizam-se automaticamente à medida que os utilizadores interagem.</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Campanha</th>
                  <th className="px-6 py-4">Público</th>
                  <th className="px-6 py-4">Enviados</th>
                  <th className="px-6 py-4 text-center">Entregues</th>
                  <th className="px-6 py-4 text-center text-blue-600">Aberturas</th>
                  <th className="px-6 py-4 text-center text-emerald-600">Cliques</th>
                  <th className="px-6 py-4 text-center text-rose-600">Falhas</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historico.length === 0 ? (
                  <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-bold">Nenhum envio registado ainda.</td></tr>
                ) : (
                  historico.map((campanha) => {
                    const taxaAbertura = campanha.total_enviados > 0 
                      ? ((campanha.total_abertos / campanha.total_enviados) * 100).toFixed(0) 
                      : 0;

                    return (
                      <tr key={campanha.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{new Date(campanha.created_at).toLocaleDateString('pt-PT')}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 m-0 max-w-[200px] truncate" title={campanha.assunto}>{campanha.assunto}</p>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">ID: {campanha.id.substring(0,8)}</span>
                        </td>
                        <td className="px-6 py-4"><span className="uppercase text-[10px] font-black tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded">{campanha.publico}</span></td>
                        <td className="px-6 py-4 font-black text-slate-900">{campanha.total_enviados}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{campanha.total_entregues || 0}</td>
                        <td className="px-6 py-4 text-center bg-blue-50/40">
                          <p className="font-black text-blue-700 m-0">{campanha.total_abertos || 0}</p>
                          <span className="text-[10px] text-blue-500 font-bold">{taxaAbertura}% taxa</span>
                        </td>
                        <td className="px-6 py-4 text-center font-black text-emerald-700 bg-emerald-50/30">{campanha.total_cliques || 0}</td>
                        <td className="px-6 py-4 text-center font-black text-rose-600">{campanha.total_falhas || 0}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => reutilizarCampanha(campanha)} className="bg-slate-900 text-white font-bold text-xs px-3 py-2 rounded-lg hover:bg-emerald-600 transition-colors">
                            Reutilizar
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}