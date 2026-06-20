"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function GestaoContratosHQ({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalContrato, setModalContrato] = useState<any>(null);
  
  const [filtroStatus, setFiltroStatus] = useState<string>('Pendente de Revisão');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editComissao, setEditComissao] = useState<number>(12);
  const [savingEdit, setSavingEdit] = useState(false);

  const labelClass = "text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block";
  const inputClass = "w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm";
  const selectClass = "w-full p-2.5 pr-8 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_auto] bg-[position:right_1rem_center] bg-no-repeat";
  const textareaClass = "w-full p-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm resize-y";

  const fetchContratos = async () => {
    const { data } = await supabase
      .from('campos')
      .select('id, nome, contrato_dados, status_aprovacao, taxa_comissao, ativo, organizador_id')
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
    
    const updatePayload: any = { 
      status_aprovacao: novoStatus,
      ativo: isApproved 
    };

    if (isApproved) {
      updatePayload.contrato_parceiro_url = `https://hellocamp.pt/contratos/aprovado_${id}.pdf`;
    } else {
      updatePayload.contrato_parceiro_url = null;
    }

    // 1. Atualiza o Campo na Base de Dados
    const { error } = await supabase.from('campos').update(updatePayload).eq('id', id);

    if (error) {
      alert("Erro ao atualizar base de dados: " + error.message);
    } else {
      
      // 2. Atualiza o perfil do parceiro para Verificado (se aplicável)
      if (modalContrato?.organizador_id) {
        await supabase
          .from('perfis')
          .update({ parceiro_verificado: isApproved })
          .eq('id', modalContrato.organizador_id);
      }

      // 3. Dispara a notificação por Email com a chave corrigida (parceiroEmail)
      try {
        const dados = modalContrato?.contrato_dados || {};
        await fetch('/api/notificacoes/status-contrato', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            parceiroEmail: dados.emailContacto, // Chave exata exigida pela API
            nomeCampo: modalContrato?.nome,
            status: novoStatus,
            lang: lang
          })
        });
      } catch (err) {
        console.error("Erro ao notificar parceiro da alteração de estado:", err);
      }

      alert(`Sucesso! Contrato alterado para ${novoStatus}. O campo está agora ${isApproved ? 'ATIVO' : 'OCULTO'}.`);
      setModalContrato((prev: any) => ({ ...prev, status_aprovacao: novoStatus, ativo: isApproved }));
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
          parceiroEmail: editForm.emailContacto, 
          nomeCampo: modalContrato?.nome,
          status: 'Editado',
          lang: lang
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
    const comissaoText = modalContrato.taxa_comissao || 12;
    const dataContrato = dados.dataSubmissao ? new Date(dados.dataSubmissao).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/D';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("O seu navegador bloqueou a abertura da janela (Pop-up). Por favor, permita para gerar o PDF.");
      return;
    }

    let anexo1Text = dados.modalidadeReserva === 'direta' 
      ? "<strong>Reserva Direta com Pagamento Automático (Recomendado):</strong> As reservas efetuadas através da plataforma HelloCamp serão registadas diretamente no sistema de reservas do Parceiro. Nesta modalidade, a HelloCamp terá direito à comissão acordada sobre cada reserva concluída. O formulário de reserva será configurado de acordo com as necessidades do Parceiro, recolhendo as informações necessárias para a correta gestão das inscrições. O Parceiro compromete-se a manter atualizadas as disponibilidades, preços e demais informações relevantes das atividades disponibilizadas através da plataforma."
      : "<strong>Comunicação por E-mail (Reserva Sob Consulta):</strong> A HelloCamp enviará ao Parceiro, por correio eletrónico, todas as informações necessárias para a gestão da reserva, incluindo os dados do participante, os dados do responsável pela reserva e os detalhes da atividade reservada. O Parceiro dispõe de 2 (dois) dias úteis para comunicar à HelloCamp a rejeição de uma reserva por motivo devidamente justificado. Na ausência de resposta dentro deste prazo, a reserva considerar-se-á aceite, sendo aplicável a comissão prevista no contrato.";

    let anexo2Text = dados.tipoPagamento === '100_total'
      ? "<strong>100% Pago no Ato da Reserva (Pagamento Imediato):</strong> O cliente liquida a totalidade do valor do programa para assegurar a vaga de imediato."
      : "<strong>Sinal de 50% Agora + 50% 1 Semana Antes:</strong> A plataforma debitará automaticamente a segunda metade do cartão do cliente 7 dias antes do início do programa.";

    let anexo3Text = "";
    if (dados.politicaCancelamento?.includes('Flexível')) {
      anexo3Text = "<strong>Flexível (Reembolso a 100% até 7 dias antes):</strong> A HelloCamp não cobrará qualquer comissão sobre reservas canceladas pelo cliente. O Parceiro compromete-se a não aplicar quaisquer custos de cancelamento ao cliente, desde que o pedido seja comunicado até 7 (sete) dias antes do início da atividade. Os montantes pagos deverão ser reembolsados no prazo máximo de 30 dias. Cancelamentos após este prazo não conferem direito a reembolso, sendo a comissão integral devida à HelloCamp.";
    } else if (dados.politicaCancelamento?.includes('Moderada')) {
      anexo3Text = "<strong>Moderada (Reembolso a 50% até 15 dias antes):</strong> A comissão da HelloCamp é considerada devida após a confirmação. Em caso de cancelamento até 15 dias antes do início, o cliente recebe 50% do valor pago. Nestas situações, a comissão da HelloCamp será reduzida proporcionalmente ao valor efetivamente retido pelo Parceiro a título de cancelamento. Cancelamentos após este prazo não conferem direito a reembolso.";
    } else {
      anexo3Text = "<strong>Estrita (Sem reembolso após reserva):</strong> As reservas efetuadas são finais e não reembolsáveis em caso de cancelamento por iniciativa do cliente. A comissão da HelloCamp é devida na sua totalidade independentemente de o cliente comparecer ou não à atividade, uma vez que a receita do Parceiro fica inteiramente garantida.";
    }

    const html = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <title>Contrato Intermediação - ${dados.empresaNome || modalContrato.nome}</title>
        <style>
          body { font-family: "Times New Roman", Times, serif; color: #000; max-width: 850px; margin: 0 auto; padding: 40px 30px; line-height: 1.5; font-size: 14px; text-align: justify; }
          .header { text-align: center; margin-bottom: 40px; }
          .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, sans-serif; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 10px; display: inline-block; }
          .header p { font-size: 12px; font-family: Arial, sans-serif; color: #555; margin-top: 5px; }
          
          h2 { font-size: 16px; text-align: center; text-transform: uppercase; font-family: Arial, sans-serif; margin-top: 30px; margin-bottom: 15px; }
          h3 { font-size: 14px; font-weight: bold; margin-top: 25px; margin-bottom: 10px; text-transform: uppercase; }
          
          .party-block { background-color: #f9f9f9; border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 4px; }
          .party-block p { margin: 5px 0; }
          
          .clause { margin-bottom: 15px; }
          .clause-title { font-weight: bold; }
          
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; border-top: 2px solid #000; padding-top: 30px; }
          .sig-box { width: 45%; }
          .sig-title { font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
          .sig-name { font-size: 22px; font-style: italic; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 5px; display: inline-block; min-width: 100%; }
          .sig-details { font-size: 12px; font-family: Arial, sans-serif; }
          
          .stamp { font-size: 10px; font-family: monospace; color: #666; margin-top: 15px; padding: 10px; border: 1px dashed #ccc; background: #fafafa; }
          
          @media print { 
            body { padding: 0; max-width: 100%; } 
            .print-btn { display: none; } 
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <div class="print-btn" style="text-align: center; margin-bottom: 30px;">
          <button onclick="window.print()" style="padding: 10px 25px; background: #000; color: #fff; font-weight: bold; border: none; cursor: pointer; font-size: 16px;">Imprimir Contrato Jurídico</button>
        </div>

        <div class="header">
          <h1>Contrato de Intermediação – HelloCamp</h1>
          <p>Acordo de Prestação de Serviços</p>
        </div>

        <p>Entre a <strong>HelloCamp</strong>, com website em www.hellocamp.pt e contacto via info@hellocamp.pt, doravante designada por "Primeiro Outorgante"; e do outro lado:</p>
        
        <div class="party-block">
          <p><strong>Nome da Empresa (Faturação):</strong> ${dados.empresaNome}</p>
          <p><strong>NIF:</strong> ${dados.nif}</p>
          <p><strong>Forma Jurídica:</strong> ${dados.formaJuridica}</p>
          <p><strong>Morada Fiscal:</strong> ${dados.morada}, ${dados.codigoPostal}</p>
          <p><strong>Pessoa de Contacto:</strong> ${dados.pessoaContacto}</p>
          <p><strong>Telefone:</strong> ${dados.telefone}</p>
          <p><strong>E-mail Comercial:</strong> ${dados.emailContacto}</p>
          <p><strong>E-mail para Reservas:</strong> ${dados.emailReservas}</p>
          <p><strong>Responsável de Dados (RGPD):</strong> ${dados.responsavelRGPD}</p>
          <p><strong>Website:</strong> ${dados.website || 'N/A'}</p>
        </div>

        <p style="text-align: center; font-style: italic;">- doravante designado por "Parceiro" -</p>

        <p>É celebrado o presente contrato de intermediação e divulgação comercial aplicável, mas não limitado, ao programa/campo de férias com a designação: <strong>"${modalContrato.nome}"</strong>.</p>

        <h2>Cláusulas Contratuais</h2>

        <div class="clause">
          <span class="clause-title">Artigo 1.º – Comissão</span><br>
          O Parceiro compromete-se a pagar à HelloCamp uma comissão de <strong>${comissaoText}% (iva não incluído)</strong> sobre cada reserva efetuada através da plataforma, nos termos definidos no presente contrato ou em acordo complementar celebrado entre as partes. A comissão é calculada sobre o valor efetivamente pago pelo cliente relativamente à atividade reservada, incluindo serviços adicionais contratados. A comissão torna-se devida após a confirmação da reserva. O Parceiro deverá enviar ao cliente a confirmação da reserva e assegurar a prestação dos serviços contratados. Caso uma reserva não possa ser realizada por motivos justificados, o Parceiro deverá informar a HelloCamp com a maior brevidade possível.
        </div>

        <div class="clause">
          <span class="clause-title">Artigo 2.º – Condições de Pagamento</span><br>
          As comissões devidas à HelloCamp serão faturadas de acordo com o modelo de pagamento acordado. O Parceiro compromete-se a liquidar as faturas emitidas pela HelloCamp dentro dos prazos nelas indicados. Os valores acordados não incluem IVA ou outros impostos legalmente aplicáveis.
        </div>

        <div class="clause">
          <span class="clause-title">Artigo 3.º – Obrigações do Parceiro</span><br>
          O Parceiro compromete-se a fornecer à HelloCamp todas as informações necessárias à divulgação das suas atividades. O Parceiro garante que possui todos os direitos necessários sobre os conteúdos disponibilizados (direitos de autor e de imagem). A HelloCamp poderá utilizar os conteúdos fornecidos para promoção. Os preços divulgados na plataforma não poderão ser superiores aos preços praticados pelo Parceiro para reservas diretas. O Parceiro compromete-se a informar imediatamente a HelloCamp de alterações de atividades, preços ou condições.
        </div>

        <div class="clause">
          <span class="clause-title">Artigo 4.º – Duração e Renovação</span><br>
          O presente contrato produz efeitos a partir da data da sua assinatura por ambas as partes e mantém-se válido até ao final do respetivo ano civil. O contrato será automaticamente renovado por períodos sucessivos de um ano, salvo denúncia por qualquer das partes com aviso prévio de 30 dias.
        </div>

        <div class="clause">
          <span class="clause-title">Artigo 5.º e 6.º – Separabilidade e Alterações</span><br>
          A eventual invalidade de qualquer disposição não prejudica a validade das restantes cláusulas. Quaisquer alterações a este contrato deverão constar no Anexo 4 para produzirem efeitos.
        </div>

        <div class="clause">
          <span class="clause-title">Artigo 7.º – Limitação de Responsabilidade e Seguros</span><br>
          A HelloCamp atua exclusivamente como plataforma intermediária de reservas e não assume qualquer responsabilidade civil, criminal ou contratual por eventuais acidentes, danos ou disputas. O Parceiro é o único e exclusivo responsável pela prestação dos serviços e pela segurança dos participantes, garantindo que possui todos os seguros obrigatórios por lei (incluindo responsabilidade civil e acidentes pessoais), licenças e certificações exigidas para o exercício da sua atividade.
        </div>

        <div class="page-break"></div>

        <h2>Anexos e Condições Operacionais Acordadas</h2>

        <div class="clause">
          <span class="clause-title">Anexo 1 – Procedimento de Reserva Acordado</span><br>
          ${anexo1Text}
        </div>

        <div class="clause">
          <span class="clause-title">Anexo 2 – Pagamento e Comissão</span><br>
          O Parceiro autoriza a HelloCamp a receber um depósito durante o processo de reserva efetuado através da plataforma Stripe. O valor do depósito corresponde, regra geral, à comissão devida à HelloCamp pela reserva efetuada, acrescida de IVA. Modalidade escolhida: <br>
          ${anexo2Text}
        </div>

        <div class="clause">
          <span class="clause-title">Anexo 3 – Política de Cancelamento e Reembolso</span><br>
          A opção selecionada ditará as regras de reembolso para os pais na plataforma. A comissão devida à HelloCamp será sempre ajustada proporcionalmente ao montante que o Parceiro retiver do cliente em caso de desistência. Modalidade escolhida: <br>
          ${anexo3Text}
        </div>

        <div class="clause">
          <span class="clause-title">Anexo 4 – Acordos Extraordinários</span><br>
          O Parceiro declarou e a HelloCamp validou as seguintes alterações ou exceções ao contrato-modelo:<br>
          <i>${dados.acordosComplementares || 'Nenhuma cláusula de exceção preenchida pelo parceiro. O contrato-modelo aplica-se na sua totalidade.'}</i>
        </div>

        <div class="signatures">
          <div class="sig-box">
            <div class="sig-title">Pela HelloCamp</div>
            <div class="sig-name" style="font-family: 'Times New Roman', serif;">Administração HelloCamp</div>
            <div class="sig-details">Data: ${dataContrato}</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">Pelo Parceiro</div>
            <div class="sig-name">${dados.assinaturaNome}</div>
            <div class="sig-details">Cargo: ${dados.assinaturaCargo}</div>
            <div class="sig-details">Data da Assinatura: ${dataContrato}</div>
            
            <div class="stamp">
              <strong>Declaração de Vinculação Aceite:</strong> "Declaro ter lido e aceite os termos. Confirmo possuir poderes legais para vincular a entidade supra identificada através desta assinatura digital."<br><br>
              <strong>Registo Digital:</strong><br>
              IP/Método: ${dados.ipAssinatura}<br>
              Timestamp: ${dados.dataSubmissao}<br>
              ID Contrato Sistema: ${modalContrato.id}
            </div>
          </div>
        </div>

      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
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
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Visibilidade</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Estado</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contratosFiltrados.map(c => {
                const dados = c.contrato_dados || {};
                
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
                    <td className="p-4 text-sm font-bold text-slate-700">
                      {c.ativo ? <span className="text-emerald-600 font-bold">● Público</span> : <span className="text-slate-400 font-medium">○ Oculto</span>}
                    </td>
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
                <button onClick={handleImprimirPDF} className="text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  <span className="hidden sm:inline">PDF Formal</span>
                </button>

                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors">
                    ✏️ <span className="hidden sm:inline">Editar</span>
                  </button>
                )}
                
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
                      {savingEdit ? 'A Guardar...' : 'Guardar Alterações'}
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