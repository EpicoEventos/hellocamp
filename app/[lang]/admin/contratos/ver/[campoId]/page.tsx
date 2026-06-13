"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import React from "react";

export default function VerContratoPage({ params }: { params: Promise<{ lang: string, campoId: string }> }) {
  const { lang, campoId } = use(params);
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [contrato, setContrato] = useState<any>(null);

  useEffect(() => {
    const fetchContrato = async () => {
      const { data: campoData } = await supabase.from('campos').select('nome, contrato_dados, status_aprovacao').eq('id', campoId).single();
      
      if (campoData && campoData.contrato_dados) {
        setContrato({ ...campoData.contrato_dados, status: campoData.status_aprovacao });
      }
      setLoading(false);
    };
    fetchContrato();
  }, [campoId]);

  if (loading) return <div className="p-20 text-center font-bold">A carregar documento legal...</div>;
  if (!contrato) return <div className="p-20 text-center font-bold text-red-600">Contrato não encontrado.</div>;

  return (
    <main className="min-h-screen bg-slate-200 py-12 px-4 font-sans text-black">
      <div className="max-w-[800px] mx-auto">
        
        {/* BARRA DE FERRAMENTAS (NÃO APARECE NA IMPRESSÃO) */}
        <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm print:hidden">
          <Link href={`/${lang}/admin/dashboard`} className="text-sm font-bold text-slate-500 hover:text-black">
            &larr; Voltar
          </Link>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full ${contrato.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {contrato.status}
            </span>
            <button onClick={() => window.print()} className="bg-slate-900 text-white px-5 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-md flex items-center gap-2">
              <span>🖨️</span> Descarregar PDF
            </button>
          </div>
        </div>

        {/* DOCUMENTO A4 PARA IMPRESSÃO */}
        <div className="bg-white shadow-2xl p-12 md:p-16 text-black leading-relaxed font-serif print:shadow-none print:p-0">
          
          <div className="text-center mb-12 border-b-2 border-black pb-8">
             <div className="text-4xl font-black tracking-tighter mb-4 font-sans">
              <span>Hello</span><span className="text-[#EBA914]">Camp</span>
            </div>
            <h1 className="text-xl font-bold uppercase tracking-widest">Contrato de Intermediação Comercial</h1>
            <p className="text-sm text-gray-500 mt-2">Cópia Legal Gerada Eletronicamente</p>
          </div>

          <div className="space-y-6 text-sm text-justify">
            <p><strong>Primeiro Outorgante:</strong> HelloCamp (www.hellocamp.pt | info@hellocamp.pt)</p>
            <p><strong>Segundo Outorgante (Parceiro):</strong></p>
            
            <div className="ml-4 pl-4 border-l-2 border-gray-300 space-y-1">
              <p><strong>Empresa:</strong> {contrato.empresaNome}</p>
              <p><strong>NIF:</strong> {contrato.nif}</p>
              <p><strong>Forma Jurídica:</strong> {contrato.formaJuridica}</p>
              <p><strong>Morada Sede:</strong> {contrato.morada}, {contrato.codigoPostal}</p>
              <p><strong>Contacto (Pessoa):</strong> {contrato.pessoaContacto}</p>
              <p><strong>Telefone:</strong> {contrato.telefone}</p>
              <p><strong>E-mail Comercial:</strong> {contrato.emailContacto}</p>
              <p><strong>E-mail Reservas:</strong> {contrato.emailReservas}</p>
              <p><strong>Responsável RGPD:</strong> {contrato.responsavelRGPD}</p>
            </div>

            <p className="font-bold mt-6">É celebrado o presente contrato aplicável ao programa: <span className="underline">{contrato.campoNome || 'Programa Registado'}</span>.</p>

            <h3 className="font-bold text-lg uppercase mt-8 mb-4 border-b border-gray-200">Cláusulas Contratuais</h3>
            <p><strong>Artigo 1.º (Comissão):</strong> A HelloCamp cobra uma comissão de 12% (+IVA) sobre cada reserva efetuada.</p>
            <p><strong>Artigo 2.º (Pagamentos):</strong> Processamentos de acordo com o Anexo 2 via Stripe Connect ou faturação.</p>
            <p><strong>Artigo 3.º (Obrigações):</strong> O Parceiro assegura a conformidade legal, seguros e paridade de preços.</p>
            <p><strong>Artigo 4.º (Duração):</strong> O contrato vigora até final do ano civil, renovando-se automaticamente.</p>

            <h3 className="font-bold text-lg uppercase mt-8 mb-4 border-b border-gray-200">Condições Operacionais (Anexos)</h3>
            <p><strong>1. Gestão de Reservas:</strong> {contrato.modalidadeReserva === 'direta' ? 'Reserva Direta com Pagamento Automático' : 'Comunicação por E-mail (Sob Consulta)'}</p>
            <p><strong>2. Cobrança aos Pais:</strong> {contrato.tipoPagamento === '100_total' ? '100% Pago no Ato da Reserva' : 'Sinal de 50% + 50% 1 Semana Antes'}</p>
            <p><strong>3. Política de Cancelamento:</strong> {contrato.politicaCancelamento}</p>
            {contrato.acordosComplementares && <p><strong>4. Acordos Extraordinários:</strong> {contrato.acordosComplementares}</p>}

            <div className="grid grid-cols-2 gap-12 mt-16 pt-8 border-t-2 border-black">
              <div>
                <h4 className="font-bold uppercase mb-4 text-xs text-gray-500">Pela HelloCamp</h4>
                <p className="font-serif text-lg italic text-gray-800">Administração HelloCamp</p>
                <p className="text-xs text-gray-500 mt-2">Data Submissão: {new Date(contrato.dataSubmissao).toLocaleDateString('pt-PT')}</p>
              </div>
              <div>
                <h4 className="font-bold uppercase mb-4 text-xs text-gray-500">Pelo Parceiro</h4>
                <p className="font-serif text-lg italic text-gray-800">{contrato.assinaturaNome}</p>
                <p className="text-sm font-bold text-gray-700">{contrato.assinaturaCargo}</p>
                <p className="text-xs text-gray-500 mt-2">Assinatura Digital Verificada ({contrato.ipAssinatura})</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ESTILOS DE IMPRESSÃO INCORPORADOS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background-color: white; }
          @page { margin: 20mm; }
        }
      `}} />
    </main>
  );
}