"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function AssinaturaContratoPage({ params }: { params: Promise<{ lang: string, campoId: string }> }) {
  const { lang, campoId } = use(params);
  const router = useRouter();
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [campo, setCampo] = useState<any>(null);
  const [perfil, setPerfil] = useState<any>(null);

  // Variáveis do Contrato e Configurações da Base de Dados
  const [form, setForm] = useState({
    pessoaContacto: "",
    formaJuridica: "",
    morada: "",
    codigoPostal: "",
    telefone: "",
    emailContacto: "",
    emailReservas: "",
    website: "",
    responsavelRGPD: "",
    modalidadeReserva: "", // Anexo 1: 'email' ou 'direta'
    acordosComplementares: "",
    assinaturaNome: "",
    assinaturaCargo: "",
    concordaTermos: false,
    
    // Configurações que vão diretamente para as colunas do Supabase (Pais)
    tipo_pagamento: "100_total",
    politica_cancelamento: "" // Anexo 3 Unificado
  });

  useEffect(() => {
    const fetchDados = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/${lang}/admin/login`); return; }

      const { data: campoData } = await supabase.from('campos').select('*').eq('id', campoId).eq('organizador_id', session.user.id).single();
      const { data: perfilData } = await supabase.from('perfis').select('*').eq('id', session.user.id).single();

      if (!campoData || !perfilData) {
        alert("Acesso não autorizado ou campo inexistente.");
        router.push(`/${lang}/admin/dashboard`);
        return;
      }

      setCampo(campoData);
      setPerfil(perfilData);
      
      // Carrega dados pré-existentes se houver
      setForm(prev => ({
        ...prev,
        tipo_pagamento: campoData.tipo_pagamento || "100_total",
        politica_cancelamento: campoData.politica_cancelamento || ""
      }));
      
      setLoading(false);
    };
    fetchDados();
  }, [campoId, lang, router]);

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.modalidadeReserva || !form.politica_cancelamento) {
      alert("Por favor, selecione as opções obrigatórias nos Anexos 1 e 3.");
      return;
    }

    setSubmitting(true);

    const payloadJSON = {
      pessoaContacto: form.pessoaContacto,
      formaJuridica: form.formaJuridica,
      morada: form.morada,
      codigoPostal: form.codigoPostal,
      telefone: form.telefone,
      emailContacto: form.emailContacto,
      emailReservas: form.emailReservas,
      website: form.website,
      responsavelRGPD: form.responsavelRGPD,
      modalidadeReserva: form.modalidadeReserva,
      politicaCancelamento: form.politica_cancelamento, // Guardamos a escolha unificada
      acordosComplementares: form.acordosComplementares,
      assinaturaNome: form.assinaturaNome,
      assinaturaCargo: form.assinaturaCargo,
      empresaNome: perfil.empresa_nome,
      nif: perfil.nif_empresa,
      dataSubmissao: new Date().toISOString()
    };

    // Atualiza o JSON do contrato e as colunas de configurações dos pais em simultâneo
    const { error } = await supabase
      .from('campos')
      .update({
        contrato_dados: payloadJSON,
        status_aprovacao: 'Pendente de Revisão',
        tipo_pagamento: form.tipo_pagamento,
        politica_cancelamento: form.politica_cancelamento
      })
      .eq('id', campoId);

    if (error) {
      alert("Erro ao submeter: " + error.message);
    } else {
      alert("Contrato submetido com sucesso! A aguardar aprovação da equipa HelloCamp.");
      router.push(`/${lang}/admin/dashboard`);
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-500">A processar documento legal...</div>;

  const inputClass = "border-b border-gray-400 outline-none bg-transparent px-1 text-black placeholder:text-gray-400 w-full focus:border-black transition-colors";
  const dataAtual = new Date().toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <main className="min-h-screen bg-slate-200 py-12 px-4 font-sans text-black selection:bg-yellow-200">
      <div className="max-w-[900px] mx-auto">
        
        {/* BARRA DE TOPO FLUTUANTE */}
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
          <Link href={`/${lang}/admin/dashboard`} className="text-sm font-bold text-slate-500 hover:text-black transition-colors">
            &larr; Voltar ao Painel
          </Link>
          <button onClick={handleSubmeter} disabled={submitting || !form.concordaTermos} className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md">
            {submitting ? 'A submeter...' : 'Assinar e Submeter Contrato'}
          </button>
        </div>

        {/* O DOCUMENTO (ESTILO FOLHA A4) */}
        <form id="contrato-form" onSubmit={handleSubmeter} className="bg-white shadow-2xl p-8 md:p-16 text-black leading-relaxed rounded-sm font-serif">
          
          {/* CABEÇALHO HELLOCAMP */}
          <div className="text-center mb-16">
            <div className="text-4xl font-black tracking-tighter mb-8 font-sans">
              <span className="text-black">Hello</span><span className="text-[#EBA914]">Camp</span>
            </div>
            <h1 className="text-2xl font-bold uppercase mb-2 tracking-widest border-b-2 border-black inline-block pb-2">
              Contrato de Intermediação – HelloCamp
            </h1>
            <p className="text-base italic text-gray-600 mt-4">
              O seu contrato de parceria com a HelloCamp, explicado de forma simples e objetiva.
            </p>
          </div>

          {/* AS 4 FASES EXPLICATIVAS (Infografia estruturada em texto/ícones) */}
          <div className="space-y-12 mb-16 font-sans">
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">📝</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">1. Celebração do contrato</h3>
                <p className="text-slate-600 text-justify leading-relaxed">
                  Parabéns! Celebrou um contrato de parceria com a HelloCamp. Este contrato regula a divulgação e a intermediação das suas ofertas através da plataforma HelloCamp, estabelecendo os termos da colaboração entre ambas as partes. O acordo mantém-se válido até ao final do ano civil em curso, sendo automaticamente renovado por períodos sucessivos, salvo denúncia por qualquer uma das partes nos termos previstos contratualmente.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">🏖️</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">2. Divulgação das ofertas</h3>
                <p className="text-slate-600 text-justify leading-relaxed">
                  Após a celebração do contrato, a HelloCamp procede à recolha e organização das informações relativas às atividades disponibilizadas pelo parceiro, criando e publicando as respetivas páginas de oferta na plataforma. Paralelamente, promove os programas através dos seus canais digitais e poderá solicitar informações adicionais sempre que tal se revele necessário para garantir a qualidade e atualização dos conteúdos. A publicação das ofertas apenas ocorrerá após o cumprimento das condições contratuais aplicáveis e da validação de toda a informação necessária.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">💻</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">3. Reservas através da HelloCamp</h3>
                <p className="text-slate-600 text-justify leading-relaxed">
                  As reservas das atividades poderão ser efetuadas diretamente através da plataforma HelloCamp. Sempre que uma reserva seja realizada, a HelloCamp comunicará ao parceiro os dados do cliente, os detalhes da reserva e todas as informações necessárias à adequada gestão da inscrição. Por sua vez, o parceiro compromete-se a manter permanentemente atualizadas a disponibilidade das atividades, os preços praticados, os programas oferecidos e quaisquer outras informações relevantes relacionadas com as suas ofertas, assegurando a exatidão dos dados apresentados aos clientes.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-slate-900 text-white border border-slate-700 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">€</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">4. Pagamento da Comissão</h3>
                <p className="text-slate-600 text-justify leading-relaxed">
                  A HelloCamp cobra uma comissão sobre cada reserva concluída através da plataforma. O modelo de pagamento poderá assumir diferentes formas, nomeadamente através de pagamento direto ao parceiro pelo cliente, pagamento parcial processado pela HelloCamp ou qualquer outro modelo que venha a ser acordado entre ambas as partes. As condições específicas aplicáveis serão definidas de acordo com os termos estabelecidos no contrato de parceria.
                </p>
              </div>
            </div>

          </div>

          <div className="h-0.5 bg-black w-full my-16"></div>

          {/* INÍCIO DO CONTRATO FORMAL */}
          <div className="space-y-6 text-[15px] text-justify">
            <h2 className="text-2xl font-bold text-center uppercase tracking-widest mb-10">Contrato de Intermediação</h2>

            <p className="mb-4">Entre:</p>
            
            <div className="ml-8 mb-8 space-y-1">
              <p><strong>HelloCamp</strong></p>
              <p>Website: www.hellocamp.pt</p>
              <p>E-mail: info@hellocamp.pt</p>
            </div>

            <p className="mb-4">E</p>
            
            {/* FORMULÁRIO DOS DADOS DO PARCEIRO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 ml-8 mb-8 bg-gray-50 p-6 border border-gray-300 font-sans text-sm shadow-inner">
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">Pessoa de Contacto:</label><input required type="text" className={inputClass} value={form.pessoaContacto} onChange={e => setForm({...form, pessoaContacto: e.target.value})} placeholder="Nome completo" /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">Nome da Empresa:</label><input required type="text" className="border-b border-transparent bg-transparent px-1 font-bold text-gray-600 outline-none cursor-not-allowed" value={perfil.empresa_nome || ""} readOnly /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">Forma Jurídica:</label><input required type="text" className={inputClass} value={form.formaJuridica} onChange={e => setForm({...form, formaJuridica: e.target.value})} placeholder="Ex: Lda, Unipessoal" /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">Número de Identificação Fiscal:</label><input required type="text" className="border-b border-transparent bg-transparent px-1 font-bold text-gray-600 outline-none cursor-not-allowed" value={perfil.nif_empresa || ""} readOnly /></div>
              <div className="flex flex-col md:col-span-2"><label className="font-bold text-gray-700 mb-1">Morada:</label><input required type="text" className={inputClass} value={form.morada} onChange={e => setForm({...form, morada: e.target.value})} placeholder="Rua, número, andar" /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">Código Postal e Cidade:</label><input required type="text" className={inputClass} value={form.codigoPostal} onChange={e => setForm({...form, codigoPostal: e.target.value})} placeholder="0000-000 Localidade" /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">Número de Telefone:</label><input required type="text" className={inputClass} value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">E-mail de Contacto:</label><input required type="email" className={inputClass} value={form.emailContacto} onChange={e => setForm({...form, emailContacto: e.target.value})} /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">E-mail para Reservas:</label><input required type="email" className={inputClass} value={form.emailReservas} onChange={e => setForm({...form, emailReservas: e.target.value})} /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">Website:</label><input type="text" className={inputClass} value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="Opcional" /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">Responsável RGPD:</label><input required type="text" className={inputClass} value={form.responsavelRGPD} onChange={e => setForm({...form, responsavelRGPD: e.target.value})} placeholder="Nome do responsável de dados" /></div>
            </div>
            
            <p className="italic text-center mt-6 mb-8">- doravante designado por "Parceiro" -</p>
            <p className="font-bold text-center">É celebrado o presente contrato de intermediação e divulgação comercial aplicável ao programa designado: <span className="underline decoration-2 underline-offset-4">{campo.nome}</span>.</p>
          </div>

          {/* CLÁUSULAS CONTRATUAIS */}
          <div className="space-y-6 text-[15px] text-justify pt-12">
            <h3 className="font-bold text-xl uppercase tracking-widest border-b border-black pb-2 mb-8">Cláusulas Contratuais</h3>
            
            <h4 className="font-bold">Artigo 1.º – Comissão</h4>
            <p className="mb-4">O Parceiro compromete-se a pagar à HelloCamp uma comissão de 12% (iva não incluído) sobre cada reserva efetuada através da plataforma, nos termos definidos no presente contrato ou em acordo complementar celebrado entre as partes.</p>
            <p className="mb-4">A comissão é calculada sobre o valor efetivamente pago pelo cliente relativamente à atividade reservada, incluindo serviços adicionais contratados através da plataforma.</p>
            <p className="mb-4">A comissão torna-se devida após a confirmação da reserva pelo Parceiro e a transmissão dos respetivos dados de reserva.</p>
            <p className="mb-4">O Parceiro deverá enviar ao cliente a confirmação da reserva e assegurar a prestação dos serviços contratados.</p>
            <p className="mb-4">Caso uma reserva não possa ser realizada por motivos devidamente justificados, nomeadamente indisponibilidade da atividade ou não verificação das condições mínimas de realização, o Parceiro deverá informar a HelloCamp com a maior brevidade possível.</p>
            <p className="mb-8">Em caso de cancelamento por iniciativa do cliente, aplicar-se-ão as condições previstas no Anexo 3 – Cancelamento de Reservas.</p>

            <h4 className="font-bold">Artigo 2.º – Condições de Pagamento</h4>
            <p className="mb-8">As comissões devidas à HelloCamp serão faturadas de acordo com o modelo de pagamento acordado entre as partes. O Parceiro compromete-se a liquidar as faturas emitidas pela HelloCamp dentro dos prazos nelas indicados. Os valores acordados não incluem IVA ou outros impostos legalmente aplicáveis.</p>

            <h4 className="font-bold">Artigo 3.º – Obrigações do Parceiro</h4>
            <p className="mb-4">O Parceiro compromete-se a fornecer à HelloCamp todas as informações necessárias à divulgação das suas atividades, incluindo descrições, preços, disponibilidade, fotografias e demais conteúdos relevantes.</p>
            <p className="mb-4">O Parceiro garante que possui todos os direitos necessários sobre os conteúdos disponibilizados à HelloCamp, incluindo direitos de autor, direitos de imagem e demais autorizações legalmente exigidas.</p>
            <p className="mb-4">A HelloCamp poderá utilizar os conteúdos fornecidos pelo Parceiro para efeitos de promoção, comercialização e divulgação das atividades na plataforma e nos seus canais de comunicação.</p>
            <p className="mb-4">O Parceiro poderá solicitar, a qualquer momento, alterações às informações publicadas relativas às suas atividades.</p>
            <p className="mb-4">Os preços divulgados na plataforma HelloCamp não poderão ser superiores aos preços praticados pelo Parceiro para reservas diretas da mesma atividade.</p>
            <p className="mb-4">Sempre que existam campanhas promocionais, descontos ou condições especiais aplicáveis às atividades do Parceiro, a HelloCamp poderá refletir essas condições na plataforma durante o respetivo período de vigência.</p>
            <p className="mb-4">O Parceiro compromete-se a informar imediatamente a HelloCamp de quaisquer alterações relativas às suas atividades, incluindo preços, disponibilidade, programas, condições de participação ou outros elementos relevantes.</p>
            <p className="mb-4">O Parceiro compromete-se a realizar as atividades promovidas através da plataforma, salvo nos casos expressamente previstos nos seus termos e condições ou em situações de força maior.</p>
            <p className="mb-8">O Parceiro deverá comunicar à HelloCamp quaisquer alterações aos seus termos e condições gerais ou às condições aplicáveis às atividades disponibilizadas na plataforma.</p>

            <h4 className="font-bold">Artigo 4.º – Duração e Renovação</h4>
            <p className="mb-8">O presente contrato produz efeitos a partir da data da sua assinatura por ambas as partes. O contrato mantém-se válido até ao final do respetivo ano civil. O contrato será automaticamente renovado por períodos sucessivos de um ano, salvo denúncia por qualquer das partes. A intenção de não renovação deverá ser comunicada por escrito com uma antecedência mínima de 30 dias relativamente ao termo do período contratual em curso.</p>

            <h4 className="font-bold">Artigo 5.º – Cláusula de Separabilidade</h4>
            <p className="mb-8">A eventual invalidade, nulidade ou inaplicabilidade de qualquer disposição do presente contrato não prejudica a validade das restantes cláusulas, que permanecerão plenamente em vigor.</p>

            <h4 className="font-bold">Artigo 6.º – Alterações e Acordos Complementares</h4>
            <p className="mb-8">Quaisquer alterações ao presente contrato ou acordos complementares celebrados entre a HelloCamp e o Parceiro deverão ser efetuados por escrito, no anexo 4, para produzirem efeitos.</p>
          </div>

          <div className="h-px bg-gray-300 w-full my-12"></div>

          {/* ANEXOS E OPÇÕES DE OPERAÇÃO */}
          <div className="space-y-12 font-sans text-sm text-slate-800">
            
            {/* ANEXO 1 */}
            <div>
              <h3 className="font-black text-lg mb-4 text-black uppercase border-l-4 border-[#EBA914] pl-3">Anexo 1 – Procedimento de Reserva</h3>
              <p className="mb-4">O Parceiro deverá selecionar a modalidade de gestão de reservas aplicável à sua parceria com a HelloCamp.</p>
              
              <div className="space-y-3 bg-gray-50 p-6 rounded-lg border border-gray-200">
                <label className="flex items-start gap-4 cursor-pointer hover:bg-gray-100 p-3 rounded transition-colors">
                  <input type="radio" name="anexo1" required value="email" onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1 w-4 h-4 accent-black" />
                  <div>
                    <strong className="block text-black mb-1">Comunicação por E-mail</strong>
                    <span className="text-gray-600 leading-relaxed block">A HelloCamp enviará ao Parceiro, por correio eletrónico, todas as informações necessárias para a gestão da reserva, incluindo os dados do participante, os dados do responsável pela reserva e os detalhes da atividade reservada. O Parceiro dispõe de 2 (dois) dias úteis para comunicar à HelloCamp a rejeição de uma reserva por motivo devidamente justificado. Na ausência de resposta dentro deste prazo, a reserva considerar-se-á aceite, sendo aplicável a comissão prevista no contrato.</span>
                  </div>
                </label>

                <label className="flex items-start gap-4 cursor-pointer hover:bg-gray-100 p-3 rounded transition-colors border-t border-gray-200 pt-5">
                  <input type="radio" name="anexo1" required value="direta" onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1 w-4 h-4 accent-black" />
                  <div>
                    <strong className="block text-black mb-1">Reserva Direta</strong>
                    <span className="text-gray-600 leading-relaxed block">As reservas efetuadas através da plataforma HelloCamp serão registadas diretamente no sistema de reservas do Parceiro. Nesta modalidade, a HelloCamp terá direito à comissão acordada sobre cada reserva concluída. O formulário de reserva será configurado de acordo com as necessidades do Parceiro, recolhendo as informações necessárias para a correta gestão das inscrições. O Parceiro compromete-se a manter atualizadas as disponibilidades, preços e demais informações relevantes das atividades disponibilizadas através da plataforma.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* ANEXO 2 - PAGAMENTOS */}
            <div>
              <h3 className="font-black text-lg mb-4 text-black uppercase border-l-4 border-[#EBA914] pl-3">Anexo 2 – Pagamento e comissão</h3>
              <p className="mb-4 text-justify leading-relaxed">
                O Parceiro autoriza a HelloCamp a receber um depósito durante o processo de reserva efetuado através da plataforma Stripe. O valor do depósito corresponde, regra geral, à comissão devida à HelloCamp pela reserva efetuada, acrescida de IVA à taxa legal em vigor. Quaisquer condições específicas ou montantes adicionais deverão constar de acordo complementar entre as partes. Após a confirmação da reserva, o cliente efetua o pagamento do depósito à HelloCamp, sendo o valor remanescente pago diretamente ao Parceiro, de acordo com as condições definidas para a atividade. O Parceiro é responsável pelo envio ao cliente da confirmação da reserva, da respetiva fatura, dos documentos informativos legalmente exigidos e de quaisquer elementos necessários à participação na atividade. No final de cada período de faturação acordado, a HelloCamp emitirá a fatura correspondente às comissões devidas, deduzindo os montantes já recebidos a título de depósito.
              </p>
              
              {/* ESCOLHA PARA OS PAIS INJETADA NO ANEXO 2 */}
              <div className="bg-blue-50 border border-blue-200 p-5 rounded-lg mt-4">
                <label className="block text-xs font-bold text-blue-900 uppercase tracking-widest mb-2">Opção de Cobrança aos Clientes (Pais)</label>
                <select required value={form.tipo_pagamento} onChange={e => setForm({...form, tipo_pagamento: e.target.value})} className="w-full p-3 bg-white border border-blue-300 rounded-lg text-sm font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer">
                  <option value="100_total">100% Pago no Ato da Reserva (Pagamento Total Imediato)</option>
                  <option value="50_sinal">Sinal de 50% Agora + 50% 1 Semana Antes</option>
                </select>
              </div>
            </div>

            {/* ANEXO 3 - CANCELAMENTOS UNIFICADO */}
            <div>
              <h3 className="font-black text-lg mb-4 text-black uppercase border-l-4 border-[#EBA914] pl-3">Anexo 3 – Política de Cancelamento e Reembolso</h3>
              <p className="mb-4 text-justify leading-relaxed">O Parceiro deverá selecionar a política de cancelamento aplicável à atividade, a qual será visível para os clientes na página do programa. A comissão devida à HelloCamp será sempre ajustada proporcionalmente ao montante que o Parceiro retiver do cliente em caso de desistência.</p>
              
              <div className="space-y-3 bg-amber-50 p-6 rounded-lg border border-amber-200 mb-6">
                
                <label className="flex items-start gap-4 cursor-pointer hover:bg-amber-100 p-3 rounded transition-colors">
                  <input type="radio" name="anexo3" required value="Flexível (Reembolso a 100% até 7 dias antes)" checked={form.politica_cancelamento === 'Flexível (Reembolso a 100% até 7 dias antes)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600" />
                  <div>
                    <strong className="block text-amber-900 mb-1">Flexível (Reembolso a 100% até 7 dias antes)</strong>
                    <span className="text-amber-800 leading-relaxed block text-sm">O cliente tem direito à devolução integral do valor pago caso cancele até 7 dias antes do início do programa. Nestes casos, a HelloCamp isenta o Parceiro do pagamento de qualquer comissão. Cancelamentos após este prazo não conferem direito a reembolso, sendo devida a comissão integral à HelloCamp.</span>
                  </div>
                </label>

                <label className="flex items-start gap-4 cursor-pointer hover:bg-amber-100 p-3 rounded transition-colors border-t border-amber-200 pt-5">
                  <input type="radio" name="anexo3" required value="Moderada (Reembolso a 50% até 15 dias antes)" checked={form.politica_cancelamento === 'Moderada (Reembolso a 50% até 15 dias antes)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600" />
                  <div>
                    <strong className="block text-amber-900 mb-1">Moderada (Reembolso a 50% até 15 dias antes)</strong>
                    <span className="text-amber-800 leading-relaxed block text-sm">O cliente recebe 50% do valor pago caso cancele até 15 dias antes do início. O Parceiro retém os restantes 50% a título de penalização, sendo a comissão da HelloCamp recalculada e aplicada apenas sobre esse valor retido. Cancelamentos após este prazo não conferem direito a reembolso.</span>
                  </div>
                </label>

                <label className="flex items-start gap-4 cursor-pointer hover:bg-amber-100 p-3 rounded transition-colors border-t border-amber-200 pt-5">
                  <input type="radio" name="anexo3" required value="Estrita (Sem reembolso após reserva)" checked={form.politica_cancelamento === 'Estrita (Sem reembolso após reserva)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600" />
                  <div>
                    <strong className="block text-amber-900 mb-1">Estrita (Sem reembolso após reserva)</strong>
                    <span className="text-amber-800 leading-relaxed block text-sm">As reservas efetuadas são finais e não reembolsáveis em caso de cancelamento por iniciativa do cliente. A comissão da HelloCamp é devida na sua totalidade independentemente de o cliente comparecer ou não à atividade.</span>
                  </div>
                </label>

              </div>
            </div>

            {/* ANEXO 4 */}
            <div>
              <h3 className="font-black text-lg mb-4 text-black uppercase border-l-4 border-[#EBA914] pl-3">Anexo 4: Acordos complementares</h3>
              <p className="mb-3 text-gray-700 font-medium">Acordámos as seguintes alterações ao contrato-modelo:</p>
              <textarea 
                className="w-full border border-gray-300 p-4 rounded-lg bg-gray-50 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" 
                rows={4} 
                value={form.acordosComplementares} 
                onChange={e => setForm({...form, acordosComplementares: e.target.value})}
                placeholder="Insira as cláusulas de exceção pré-acordadas, ou deixe em branco."
              ></textarea>
            </div>

          </div>

          {/* ZONA DE ASSINATURAS FINAIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-16 pt-12 border-t-2 border-black font-sans">
            <div>
              <h4 className="font-black mb-6 uppercase tracking-wider text-black text-sm">Pela HelloCamp</h4>
              <p className="font-serif text-xl italic text-gray-500 mb-2">Administração HelloCamp</p>
              <p className="text-sm font-medium border-t border-gray-200 mt-6 pt-4">Data: {dataAtual}</p>
            </div>

            <div>
              <h4 className="font-black mb-6 uppercase tracking-wider text-black text-sm">Pelo Parceiro</h4>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase mb-1 text-gray-500">Nome da Assinatura Digital *</label>
                  <input required type="text" className="border-b-2 border-black bg-transparent outline-none py-2 text-xl font-serif italic focus:border-[#EBA914] transition-colors" value={form.assinaturaNome} onChange={e => setForm({...form, assinaturaNome: e.target.value})} placeholder="Nome de quem assina" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase mb-1 text-gray-500">Cargo *</label>
                  <input required type="text" className="border-b border-gray-300 bg-transparent outline-none py-2 focus:border-black transition-colors" value={form.assinaturaCargo} onChange={e => setForm({...form, assinaturaCargo: e.target.value})} placeholder="Ex: Sócio-Gerente" />
                </div>
                <p className="text-sm font-medium border-t border-gray-200 mt-6 pt-4">Data: {dataAtual}</p>
              </div>

              <div className="mt-8 bg-gray-50 p-4 border border-gray-200 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" required checked={form.concordaTermos} onChange={e => setForm({...form, concordaTermos: e.target.checked})} className="mt-1 w-5 h-5 accent-black cursor-pointer flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium leading-relaxed group-hover:text-black transition-colors">
                    Declaro ter lido e aceite os termos. Confirmo possuir poderes legais para vincular a entidade supra identificada através desta assinatura digital.
                  </span>
                </label>
              </div>
            </div>
          </div>

        </form>
      </div>
    </main>
  );
}