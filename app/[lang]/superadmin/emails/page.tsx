"use client";

import { useState, use } from "react";
import React from "react";

export default function SuperAdminBroadcast({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    publico: "organizadores", // 'organizadores', 'clientes', 'todos', 'csv'
    assunto: "",
    tituloDaMensagem: "",
    mensagem: "",
    textoBotao: "",
    linkBotao: "",
    emailsManuais: [] as string[] // Guardará os emails extraídos do ficheiro
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Expressão Regular inteligente para capturar qualquer email no meio do texto
      const emailsEncontrados = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      // Remove duplicados
      const emailsUnicos = [...new Set(emailsEncontrados)];
      setForm({ ...form, emailsManuais: emailsUnicos });
    };
    reader.readAsText(file);
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.publico === 'csv' && form.emailsManuais.length === 0) {
      alert("Por favor, anexe um ficheiro CSV válido que contenha e-mails.");
      return;
    }

    const qtd = form.publico === 'csv' ? form.emailsManuais.length : `todos os utilizadores (${form.publico})`;
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

      alert(`✅ Sucesso! A newsletter foi colocada na fila de envio rápido para ${data.totalEnviados} destinatários.`);
      setForm({ ...form, assunto: "", tituloDaMensagem: "", mensagem: "", textoBotao: "", linkBotao: "", emailsManuais: [] });
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Email Marketing & Broadcast</h1>
        <p className="text-slate-500 font-medium">Envie newsletters e comunicações de alto impacto para a base de dados ou listas externas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* FORMULÁRIO DE CRIAÇÃO */}
        <form onSubmit={handleEnviar} className="md:col-span-2 bg-white border border-slate-200 p-8 rounded-3xl shadow-sm flex flex-col gap-6">
          
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Público-Alvo</label>
            <select required value={form.publico} onChange={e => setForm({...form, publico: e.target.value, emailsManuais: []})} className="w-full p-4 bg-white border border-slate-300 rounded-xl outline-none focus:border-slate-500 font-bold text-slate-700 cursor-pointer">
              <option value="organizadores">Apenas Parceiros (Organizadores Ativos)</option>
              <option value="clientes">Apenas Pais (Clientes)</option>
              <option value="todos">Toda a Base de Dados (Parceiros + Pais)</option>
              <option value="csv">Carregar Lista Externa (CSV / Ficheiro de Texto)</option>
            </select>

            {/* SELECÇÃO DE FICHEIRO: Só aparece se a opção "csv" for escolhida */}
            {form.publico === 'csv' && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <label className="block text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2">Anexe a sua folha de cálculo (.CSV)</label>
                <input type="file" accept=".csv, .txt" onChange={handleFileUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" />
                {form.emailsManuais.length > 0 && (
                  <p className="text-xs font-bold text-emerald-600 mt-3 flex items-center gap-1">
                    <span>✅</span> O sistema detetou {form.emailsManuais.length} e-mails válidos e únicos no ficheiro.
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Assunto do E-mail</label>
            <input required type="text" value={form.assunto} onChange={e => setForm({...form, assunto: e.target.value})} placeholder="Ex: Prepare o Verão com a HelloCamp!" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-500" />
          </div>

          <hr className="border-slate-100" />

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Título Principal (Dentro do E-mail)</label>
            <input required type="text" value={form.tituloDaMensagem} onChange={e => setForm({...form, tituloDaMensagem: e.target.value})} placeholder="Ex: Novas ofertas exclusivas." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-500 font-bold" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mensagem (Corpo do Texto)</label>
            <p className="text-xs text-slate-400 mb-2 mt-[-0.25rem]">Dica: Pode usar a tag &lt;br/&gt; para criar parágrafos.</p>
            <textarea required rows={6} value={form.mensagem} onChange={e => setForm({...form, mensagem: e.target.value})} placeholder="Escreva a sua mensagem aqui..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-500 resize-y"></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Texto do Botão (Opcional)</label>
              <input type="text" value={form.textoBotao} onChange={e => setForm({...form, textoBotao: e.target.value})} placeholder="Ex: Descobrir Agora" className="w-full p-3 border border-slate-300 rounded-lg outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Link do Botão</label>
              <input type="url" value={form.linkBotao} onChange={e => setForm({...form, linkBotao: e.target.value})} placeholder="https://hellocamp.pt/..." className="w-full p-3 border border-slate-300 rounded-lg outline-none" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-4 rounded-xl transition-colors mt-4 disabled:opacity-50">
            {loading ? 'A processar lotes e a enviar...' : '🚀 Disparar E-mail Marketing'}
          </button>
        </form>

        {/* PRÉ-VISUALIZAÇÃO EM TEMPO REAL */}
        <div className="hidden md:block">
          <div className="sticky top-8 bg-slate-100 border border-slate-200 rounded-3xl p-6 shadow-inner">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Pré-visualização</h3>
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col items-center p-8 text-center border border-slate-100">
              <div className="text-2xl font-black tracking-tighter mb-8 font-sans">
                <span className="text-slate-900">Hello</span><span className="text-[#EBA914]">Camp</span>
              </div>
              
              <h2 className="text-lg font-bold text-slate-900 mb-4 leading-tight">
                {form.tituloDaMensagem || 'O seu Título Aparece Aqui'}
              </h2>
              
              <p className="text-sm text-slate-600 mb-8 leading-relaxed whitespace-pre-wrap text-justify">
                {form.mensagem || 'A sua mensagem será perfeitamente adaptada e enviada a cada contacto da sua lista, com design profissional de newsletter.'}
              </p>

              {form.textoBotao && form.linkBotao && (
                <div className="bg-slate-900 text-white text-sm font-bold px-6 py-3 rounded-lg w-full">
                  {form.textoBotao}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}