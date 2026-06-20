"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function GestaoContratosHQ({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalContrato, setModalContrato] = useState<any>(null);
  
  // Filtro de Visualização
  const [filtroStatus, setFiltroStatus] = useState<string>('Pendente de Revisão');
  
  // Estados para Edição
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editComissao, setEditComissao] = useState<number>(12);
  const [savingEdit, setSavingEdit] = useState(false);

  // CLASSES DE ESTILO PARA O MODO DE EDIÇÃO
  const labelClass = "text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block";
  const inputClass = "w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm";
  const selectClass = "w-full p-2.5 pr-8 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_auto] bg-[position:right_1rem_center] bg-no-repeat";
  const textareaClass = "w-full p-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm resize-y";

  const fetchContratos = async () => {
    // Agora removemos o '.eq' para trazer TODOS os campos e filtrar no cliente
    const { data } = await supabase
      .from('campos')
      .select('id, nome, contrato_dados, status_aprovacao, taxa_comissao')
      .order('id', { ascending: false });
      
    setContratos(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchContratos(); }, []);

  const abrirModal = (contrato: any) => {
    setModalContrato(contrato);
    setEditForm(contrato.contrato_dados || {});
    setEditComissao(contrato.taxa_comissao || 12);
    setIsEditing(false);
  };

  const handleAcaoContrato = async (id: string, novoStatus: string) => {
    const isApproved = novoStatus === 'Aprovado';
    
    const updatePayload: any = { status_aprovacao: novoStatus };
    if (isApproved) {
      updatePayload.contrato_parceiro_url = `https://hellocamp.pt/contratos/aprovado_${id}.pdf`;
    }

    const { error } = await supabase.from('campos').update(updatePayload).eq('id', id);

    if (error) {
      alert("Erro ao atualizar: " + error.message);
    } else {
      alert(`Contrato ${novoStatus} com sucesso!`);
      // Em vez de fechar o modal, apenas atualizamos o estado visualmente
      setModalContrato((prev: any) => ({ ...prev, status_aprovacao: novoStatus }));
      fetchContratos();
    }
  };

  const handleGuardarEdicao = async () => {
    setSavingEdit(true);
    
    const { error } = await supabase
      .from('campos')
      .update({ 
        contrato_dados: editForm,
        taxa_comissao: editComissao 
      })
      .eq('id', modalContrato.id);

    if (error) {
      alert("Erro ao guardar edição: " + error.message);
      setSavingEdit(false);
      return;
    }

    try {
      await fetch('/api/notificacoes/contrato-editado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emailParceiro: editForm.emailContacto, 
          nomeParceiro: editForm.pessoaContacto,
          empresa: editForm.empresaNome,
          dadosAtualizados: editForm 
        })
      });
    } catch (err) {
      console.error("Erro ao notificar parceiro da edição:", err);
    }

    alert("Contrato editado com sucesso! Cópia atualizada enviada ao parceiro.");
    
    setModalContrato({ ...modalContrato, contrato_dados: editForm, taxa_comissao: editComissao });
    setIsEditing(false);
    setSavingEdit(false);
    fetchContratos();
  };

  const handleImprimirPDF = () => {
    if (!modalContrato || !modalContrato.contrato_dados) return;
    const dados = modalContrato.contrato_dados;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("O seu navegador bloqueou a abertura da janela (Pop-up). Por favor, permita para gerar o PDF.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <title>Contrato - ${dados.empresaNome || modalContrato.nome}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
          .header p { color: #555; margin: 5px 0 0 0; font-style: italic; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 14px; font-weight: bold; background-color: #f1f5f9; padding: 8px 12px; text-transform: uppercase; border-left: 4px solid #0f172a; margin-bottom: 15px; }
          .grid { display: flex; flex-wrap: wrap; gap: 20px; }
          .col { flex: 1; min-width: 300px; }
          .data-row { margin-bottom: 8px; font-size: 14px; }
          .data-row strong { color: #334155; }
          .signature-box { margin-top: 50px; padding: 20px; border: 1px solid #cbd5e1; background-color: #f8fafc; border-radius: 8px; }
          .signature-font { font-family: 'Times New Roman', Times, serif; font-size: 24px; font-style: italic; font-weight: bold; color: #065f46; margin-bottom: 5px; }
          @media print { body { padding: 0; } .print-hide { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Acordo de Intermediação HelloCamp</h1>
          <p>Documento de vinculação B2B gerado digitalmente</p>
        </div>

        <div class="section">
          <div class="section-title">Informação do Programa e Comissão</div>
          <div class="data-row"><strong>Nome do Campo/Programa:</strong> ${modalContrato.nome}</div>
          <div class="data-row"><strong>ID Interno:</strong> ${modalContrato.id}</div>
          <div class="data-row"><strong>Comissão Acordada:</strong> ${modalContrato.taxa_comissao || 12}%</div>
          <div class="data-row"><strong>Data de Submissão:</strong> ${dados.dataSubmissao ? new Date(dados.dataSubmissao).toLocaleString('pt-PT') : 'N/D'}</div>
          <div class="data-row"><strong>Estado da Aprovação:</strong> ${modalContrato.status_aprovacao}</div>
        </div>

        <div class="section">
          <div class="section-title">Dados Fiscais da Entidade Parceira</div>
          <div class="grid">
            <div class="col">
              <div class="data-row"><strong>Empresa (Faturação):</strong> ${dados.empresaNome}</div>
              <div class="data-row"><strong>Forma Jurídica:</strong> ${dados.formaJuridica}</div>
              <div class="data-row"><strong>NIF:</strong> ${dados.nif}</div>
            </div>
            <div class="col">
              <div class="data-row"><strong>Morada:</strong> ${dados.morada}</div>
              <div class="data-row"><strong>Código Postal:</strong> ${dados.codigoPostal}</div>
              <div class="data-row"><strong>Website:</strong> ${dados.website || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Pontos de Contacto Oficiais</div>
          <div class="grid">
            <div class="col">
              <div class="data-row"><strong>Responsável:</strong> ${dados.pessoaContacto}</div>
              <div class="data-row"><strong>Telefone:</strong> ${dados.telefone}</div>
              <div class="data-row"><strong>Responsável RGPD:</strong> ${dados.responsavelRGPD}</div>
            </div>
            <div class="col">
              <div class="data-row"><strong>E-mail Comercial:</strong> ${dados.emailContacto}</div>
              <div class="data-row"><strong>E-mail Reservas:</strong> ${dados.emailReservas}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Condições Operacionais (Anexos)</div>
          <div class="data-row"><strong>Gestão de Reservas:</strong> ${dados.modalidadeReserva === 'direta' ? 'Reserva Direta (Automático)' : 'Sob Consulta (E-mail)'}</div>
          <div class="data-row"><strong>Modelo de Pagamento:</strong> ${dados.tipoPagamento === '100_total' ? '100% no Ato da Reserva' : 'Sinal de 50% + Restante'}</div>
          <div class="data-row"><strong>Política de Cancelamento:</strong> ${dados.politicaCancelamento}</div>
          <div class="data-row" style="margin-top:15px;"><strong>Acordos Complementares / Exceções:</strong></div>
          <div style="background-color: #f8fafc; padding: 10px; font-style: italic; font-size: 13px; border: 1px solid #e2e8f0;">
            ${dados.acordosComplementares || 'Nenhuma cláusula de exceção definida ou preenchida pelo parceiro.'}
          </div>
        </div>

        <div class="signature-box">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-bottom: 10px;">Assinatura Digital de Vinculação Legal</div>
          <div class="signature-font">${dados.assinaturaNome}</div>
          <div class="data-row" style="color: #475569;">Cargo Declarado: ${dados.assinaturaCargo}</div>
          <div class="data-row" style="font-size: 11px; color: #94a3b8; margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            Registado digitalmente via: ${dados.ipAssinatura} | Timestamp: ${dados.dataSubmissao}
          </div>
        </div>

        <div class="print-hide" style="text-align: center; margin-top: 40px;">
          <button onclick="window.print()" style="padding: 10px 20px; background-color: #0f172a; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 16px;">Guardar PDF / Imprimir</button>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    // Pequeno atraso para garantir que os estilos carregam antes do diálogo de impressão
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const tabs = ['Pendente de Revisão', 'Aprovado', 'Rejeitado', 'Todos'];
  const contratosFiltrados = contratos.filter(c => filtroStatus === 'Todos' || c.status_aprovacao === filtroStatus);

  if (loading) return <div className="p-12 text-center text-slate-500 font-bold animate-pulse">A carregar registos da base de dados...</div>;

  return (
    <div className="p-8 font-sans">
      <h1 className="text-3xl font-black mb-2 text-slate-900">Gestão Global de Contratos</h1>
      <p className="text-slate-500 mb-8">Administre todo o histórico de acordos de intermediação B2B da plataforma.</p>

      {/* TABS DE FILTRAGEM */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-4">
        {tabs.map(tab => {
          const count = contratos.filter(c => tab === 'Todos' ? true : c.status_aprovacao === tab).length;
          return (
            <button 
              key={tab}
              onClick={() => setFiltroStatus(tab)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                filtroStatus === tab 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab} <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filtroStatus === tab ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {contratosFiltrados.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center text-slate-500 font-bold">
          Não existem contratos para o filtro selecionado.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Campo</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Entidade</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Comissão</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Estado</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contratosFiltrados.map(c => {
                const dados = c.contrato_dados || {};
                
                // Define as cores baseadas no status
                let statusColor = "bg-slate-100 text-slate-600";
                if (c.status_aprovacao === 'Aprovado') statusColor = "bg-emerald-100 text-emerald-800 border border-emerald-200";
                if (c.status_aprovacao === 'Rejeitado') statusColor = "bg-red-100 text-red-800 border border-red-200";
                if (c.status_aprovacao === 'Pendente de Revisão') statusColor = "bg-amber-100 text-amber-800 border border-amber-200";

                return (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{c.nome}</td>
                    <td className="p-4 text-sm text-slate-600">
                      {dados.empresaNome || 'N/D'}
                      <div className="text-[10px] text-slate-400 mt-1">{dados.dataSubmissao ? new Date(dados.dataSubmissao).toLocaleDateString('pt-PT') : ''}</div>
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-700">{c.taxa_comissao || 12}%</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${statusColor}`}>
                        {c.status_aprovacao}
                      </span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => abrirModal(c)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm">
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE REVISÃO DO CONTRATO COMPLETO */}
      {modalContrato && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            
            {/* CABEÇALHO DO MODAL */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  {modalContrato.nome}
                  {isEditing && <span className="bg-[#EBA914] text-white text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full shadow-sm">Modo de Edição</span>}
                  {!isEditing && (
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                      modalContrato.status_aprovacao === 'Aprovado' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      modalContrato.status_aprovacao === 'Rejeitado' ? 'bg-red-100 text-red-800 border-red-200' :
                      'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {modalContrato.status_aprovacao}
                    </span>
                  )}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">ID do Campo: {modalContrato.id}</p>
              </div>
              
              <div className="flex items-center gap-3 sm:gap-4">
                {/* BOTÃO DE PDF */}
                <button onClick={handleImprimirPDF} className="text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  <span className="hidden sm:inline">PDF</span>
                </button>

                {/* BOTÃO DE EDITAR */}
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors">
                    ✏️ <span className="hidden sm:inline">Editar</span>
                  </button>
                )}
                
                {/* BOTÃO FECHAR */}
                <button onClick={() => setModalContrato(null)} className="text-3xl font-bold text-slate-400 hover:text-slate-900 leading-none ml-2">&times;</button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* BLOCO 1: INFORMAÇÃO CORPORATIVA E CONTACTOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-inner">
                  <span className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Dados Fiscais da Entidade</span>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div><label className={labelClass}>Empresa</label><input className={inputClass} value={editForm.empresaNome || ''} onChange={e => setEditForm({...editForm, empresaNome: e.target.value})} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelClass}>Forma Jurídica</label><input className={inputClass} value={editForm.formaJuridica || ''} onChange={e => setEditForm({...editForm, formaJuridica: e.target.value})} /></div>
                        <div><label className={labelClass}>NIF</label><input className={inputClass} value={editForm.nif || ''} onChange={e => setEditForm({...editForm, nif: e.target.value})} /></div>
                      </div>
                      <div><label className={labelClass}>Morada</label><input className={inputClass} value={editForm.morada || ''} onChange={e => setEditForm({...editForm, morada: e.target.value})} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelClass}>Cód. Postal</label><input className={inputClass} value={editForm.codigoPostal || ''} onChange={e => setEditForm({...editForm, codigoPostal: e.target.value})} /></div>
                        <div><label className={labelClass}>Website</label><input className={inputClass} value={editForm.website || ''} onChange={e => setEditForm({...editForm, website: e.target.value})} /></div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <p><strong className="text-slate-800">Empresa:</strong> {modalContrato.contrato_dados?.empresaNome}</p>
                      <p><strong className="text-slate-800">Forma Jurídica:</strong> {modalContrato.contrato_dados?.formaJuridica}</p>
                      <p><strong className="text-slate-800">NIF:</strong> <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded">{modalContrato.contrato_dados?.nif}</span></p>
                      <p><strong className="text-slate-800">Morada:</strong> {modalContrato.contrato_dados?.morada}, {modalContrato.contrato_dados?.codigoPostal}</p>
                      <p><strong className="text-slate-800">Website:</strong> {modalContrato.contrato_dados?.website ? <a href={modalContrato.contrato_dados.website} target="_blank" className="text-blue-600 underline">{modalContrato.contrato_dados.website}</a> : 'N/A'}</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-inner">
                  <span className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Pontos de Contacto</span>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div><label className={labelClass}>Responsável</label><input className={inputClass} value={editForm.pessoaContacto || ''} onChange={e => setEditForm({...editForm, pessoaContacto: e.target.value})} /></div>
                      <div><label className={labelClass}>Telefone</label><input className={inputClass} value={editForm.telefone || ''} onChange={e => setEditForm({...editForm, telefone: e.target.value})} /></div>
                      <div><label className={labelClass}>E-mail Comercial</label><input className={inputClass} value={editForm.emailContacto || ''} onChange={e => setEditForm({...editForm, emailContacto: e.target.value})} /></div>
                      <div><label className={labelClass}>E-mail de Reservas</label><input className={inputClass} value={editForm.emailReservas || ''} onChange={e => setEditForm({...editForm, emailReservas: e.target.value})} /></div>
                      <div><label className={labelClass}>DPO (RGPD)</label><input className={inputClass} value={editForm.responsavelRGPD || ''} onChange={e => setEditForm({...editForm, responsavelRGPD: e.target.value})} /></div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <p><strong className="text-slate-800">Responsável:</strong> {modalContrato.contrato_dados?.pessoaContacto}</p>
                      <p><strong className="text-slate-800">Telefone:</strong> {modalContrato.contrato_dados?.telefone}</p>
                      <p><strong className="text-slate-800">E-mail Comercial:</strong> {modalContrato.contrato_dados?.emailContacto}</p>
                      <p><strong className="text-slate-800">E-mail de Reservas:</strong> <span className="font-bold text-amber-600">{modalContrato.contrato_dados?.emailReservas}</span></p>
                      <p><strong className="text-slate-800">DPO (RGPD):</strong> {modalContrato.contrato_dados?.responsavelRGPD}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* BLOCO 2: CONDIÇÕES DO SERVIÇO (ANEXOS) & COMISSÃO */}
              <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 relative">
                <span className="block text-xs font-black text-blue-800 uppercase tracking-widest mb-4 border-b border-blue-200 pb-2">Condições Operacionais & Comissão</span>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  {/* CAMPO DA COMISSÃO EM DESTAQUE */}
                  <div className={`${isEditing ? 'bg-amber-100 p-3 rounded-lg border border-amber-300 shadow-sm' : ''}`}>
                    {isEditing ? (
                      <>
                        <label className={`${labelClass} text-amber-900`}>Comissão Base (%)</label>
                        <div className="relative">
                          <input type="number" step="0.1" className={inputClass} value={editComissao} onChange={e => setEditComissao(Number(e.target.value))} />
                          <span className="absolute right-8 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <strong className="block text-blue-900 mb-1">Comissão Base</strong>
                        <p className="text-emerald-700 font-black text-lg bg-white border border-emerald-200 p-1.5 px-3 rounded shadow-sm inline-block">{modalContrato.taxa_comissao || 12}%</p>
                      </>
                    )}
                  </div>

                  {/* RESTANTES ANEXOS */}
                  {isEditing ? (
                    <>
                      <div>
                        <label className={labelClass}>Modelo de Reserva</label>
                        <select className={selectClass} value={editForm.modalidadeReserva || ''} onChange={e => setEditForm({...editForm, modalidadeReserva: e.target.value})}>
                          <option value="direta">Reserva Direta (Automático)</option>
                          <option value="email">Sob Consulta (E-mail)</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Modelo de Pagamento</label>
                        <select className={selectClass} value={editForm.tipoPagamento || ''} onChange={e => setEditForm({...editForm, tipoPagamento: e.target.value})}>
                          <option value="100_total">100% no Ato da Reserva</option>
                          <option value="50_sinal">Sinal de 50% + Restante</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Pol. Cancelamento</label>
                        <select className={selectClass} value={editForm.politicaCancelamento || ''} onChange={e => setEditForm({...editForm, politicaCancelamento: e.target.value})}>
                          <option value="Flexível (Reembolso a 100% até 7 dias antes)">Flexível (100% até 7 dias)</option>
                          <option value="Moderada (Reembolso a 50% até 15 dias antes)">Moderada (50% até 15 dias)</option>
                          <option value="Estrita (Sem reembolso após reserva)">Estrita (Sem reembolso)</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <strong className="block text-blue-900 mb-1">Modelo de Reserva</strong>
                        <p className="text-blue-700 bg-white border border-blue-100 p-2 rounded">{modalContrato.contrato_dados?.modalidadeReserva === 'direta' ? 'Reserva Direta' : 'Sob Consulta (E-mail)'}</p>
                      </div>
                      <div>
                        <strong className="block text-blue-900 mb-1">Modelo Pagamento</strong>
                        <p className="text-blue-700 bg-white border border-blue-100 p-2 rounded">{modalContrato.contrato_dados?.tipoPagamento === '100_total' ? '100% Ato da Reserva' : 'Sinal de 50%'}</p>
                      </div>
                      <div>
                        <strong className="block text-blue-900 mb-1">Pol. Cancelamento</strong>
                        <p className="text-blue-700 bg-white border border-blue-100 p-2 rounded leading-tight text-[11px] font-medium">{modalContrato.contrato_dados?.politicaCancelamento}</p>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="mt-5 bg-white p-4 rounded-lg border border-blue-100">
                  <strong className="block text-blue-900 text-[10px] font-bold uppercase tracking-widest mb-2">Acordos Complementares / Exceções:</strong>
                  {isEditing ? (
                    <textarea 
                      className={textareaClass} 
                      rows={3} 
                      value={editForm.acordosComplementares || ''} 
                      onChange={e => setEditForm({...editForm, acordosComplementares: e.target.value})}
                      placeholder="Nenhuma cláusula de exceção definida."
                    />
                  ) : (
                    <p className="text-blue-800 text-sm italic">{modalContrato.contrato_dados?.acordosComplementares || 'Nenhuma cláusula de exceção preenchida pelo parceiro.'}</p>
                  )}
                </div>
              </div>

              {/* BLOCO 3: ASSINATURA */}
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="block text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Assinatura Digital de Vinculação</span>
                  <p className="font-serif text-2xl font-black italic text-emerald-950 mb-1">{modalContrato.contrato_dados?.assinaturaNome}</p>
                  <p className="text-sm text-emerald-800"><strong>Cargo Declarado:</strong> {modalContrato.contrato_dados?.assinaturaCargo}</p>
                </div>
                <div className="text-left md:text-right bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                  <p className="text-xs text-slate-500 mb-1"><strong>Submetido a:</strong> {new Date(modalContrato.contrato_dados?.dataSubmissao).toLocaleString('pt-PT')}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Via: {modalContrato.contrato_dados?.ipAssinatura}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex flex-wrap gap-4 justify-between items-center">
              <div>
                {!isEditing && modalContrato.status_aprovacao !== 'Pendente de Revisão' && (
                  <button onClick={() => handleAcaoContrato(modalContrato.id, 'Pendente de Revisão')} className="text-sm font-bold text-slate-500 hover:text-slate-800 underline">
                    Reverter para Pendente
                  </button>
                )}
              </div>
              
              <div className="flex gap-4">
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="bg-white border border-slate-300 text-slate-600 font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors">
                      Cancelar
                    </button>
                    <button onClick={handleGuardarEdicao} disabled={savingEdit} className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-500 transition-transform hover:-translate-y-0.5 shadow-lg disabled:bg-slate-400 disabled:transform-none">
                      {savingEdit ? 'A Guardar...' : 'Guardar Alterações e Notificar Parceiro'}
                    </button>
                  </>
                ) : (
                  <>
                    {modalContrato.status_aprovacao !== 'Rejeitado' && (
                      <button onClick={() => handleAcaoContrato(modalContrato.id, 'Rejeitado')} className="bg-white border border-red-200 text-red-600 font-bold px-6 py-3 rounded-xl hover:bg-red-50 transition-colors">
                        Rejeitar Parceiro
                      </button>
                    )}
                    {modalContrato.status_aprovacao !== 'Aprovado' && (
                      <button onClick={() => handleAcaoContrato(modalContrato.id, 'Aprovado')} className="bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-emerald-500 transition-transform hover:-translate-y-0.5 shadow-lg">
                        Validar e Aprovar Contrato
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}