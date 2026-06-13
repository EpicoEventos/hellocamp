"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function GestaoContratosHQ({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalContrato, setModalContrato] = useState<any>(null);

  const fetchContratos = async () => {
    // Busca campos onde o contrato foi submetido mas ainda não aprovado/rejeitado
    const { data } = await supabase
      .from('campos')
      .select('id, nome, contrato_dados, status_aprovacao')
      .eq('status_aprovacao', 'Pendente de Revisão')
      .order('id', { ascending: false });
      
    setContratos(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchContratos(); }, []);

  const handleAcaoContrato = async (id: string, novoStatus: string) => {
    const isApproved = novoStatus === 'Aprovado';
    
    // Atualiza o status e, se aprovado, simula a gravação de um URL válido para "destrancar" o campo na plataforma
    const updatePayload: any = { status_aprovacao: novoStatus };
    if (isApproved) {
      updatePayload.contrato_parceiro_url = `https://hellocamp.pt/contratos/aprovado_${id}.pdf`;
    }

    const { error } = await supabase.from('campos').update(updatePayload).eq('id', id);

    if (error) {
      alert("Erro ao atualizar: " + error.message);
    } else {
      alert(`Contrato ${novoStatus} com sucesso!`);
      setModalContrato(null);
      fetchContratos();
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">A carregar contratos pendentes...</div>;

  return (
    <div className="p-8 font-sans">
      <h1 className="text-3xl font-black mb-2 text-slate-900">Validação de Contratos</h1>
      <p className="text-slate-500 mb-8">Reveja e aprove os acordos de intermediação submetidos pelos parceiros.</p>

      {contratos.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center text-slate-500 font-bold">
          Não existem contratos pendentes de revisão.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Campo</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Entidade</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Data Submissão</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map(c => {
                const dados = c.contrato_dados || {};
                return (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="p-4 font-bold text-slate-900">{c.nome}</td>
                    <td className="p-4 text-sm text-slate-600">{dados.empresaNome || 'N/D'}</td>
                    <td className="p-4 text-sm text-slate-600">{dados.dataSubmissao ? new Date(dados.dataSubmissao).toLocaleDateString('pt-PT') : 'N/D'}</td>
                    <td className="p-4">
                      <button onClick={() => setModalContrato(c)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors">
                        Rever Documento
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE REVISÃO DO CONTRATO */}
      {modalContrato && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black">Revisão de Contrato: {modalContrato.nome}</h2>
              <button onClick={() => setModalContrato(null)} className="text-2xl font-bold text-slate-400 hover:text-slate-900">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Entidade e Contacto</span>
                  <p><strong>Empresa:</strong> {modalContrato.contrato_dados?.empresaNome}</p>
                  <p><strong>NIF:</strong> {modalContrato.contrato_dados?.nif}</p>
                  <p><strong>Pessoa Contacto:</strong> {modalContrato.contrato_dados?.pessoaContacto}</p>
                  <p><strong>Email:</strong> {modalContrato.contrato_dados?.emailContacto}</p>
                  <p><strong>Telefone:</strong> {modalContrato.contrato_dados?.telefone}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Opções Selecionadas</span>
                  <p><strong>Gestão Reservas (Anexo 1):</strong> {modalContrato.contrato_dados?.modalidadeReserva}</p>
                  <p><strong>Cancelamentos (Anexo 3):</strong> {modalContrato.contrato_dados?.modalidadeCancelamento}</p>
                  <p className="mt-2 text-xs text-slate-500"><strong>Acordos Extra:</strong> {modalContrato.contrato_dados?.acordosComplementares || 'Nenhum'}</p>
                </div>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                <span className="block text-xs font-bold text-emerald-600 uppercase mb-2">Assinatura Digital Capturada</span>
                <p className="font-serif text-xl italic text-slate-900">{modalContrato.contrato_dados?.assinaturaNome}</p>
                <p className="text-xs text-slate-500 mt-1">Cargo: {modalContrato.contrato_dados?.assinaturaCargo} | Data: {new Date(modalContrato.contrato_dados?.dataSubmissao).toLocaleString('pt-PT')}</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-4 justify-end">
              <button onClick={() => handleAcaoContrato(modalContrato.id, 'Rejeitado')} className="bg-white border border-red-200 text-red-600 font-bold px-6 py-3 rounded-xl hover:bg-red-50 transition-colors">
                Rejeitar Contrato
              </button>
              <button onClick={() => handleAcaoContrato(modalContrato.id, 'Aprovado')} className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg">
                Validar e Aprovar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}