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
    modalidadeReserva: "", // Anexo 1
    tipo_pagamento: "", // Anexo 2
    politica_cancelamento: "", // Anexo 3
    acordosComplementares: "",
    assinaturaNome: "",
    assinaturaCargo: "",
    concordaTermos: false
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
      
      setForm(prev => ({
        ...prev,
        tipo_pagamento: campoData.tipo_pagamento || "",
        politica_cancelamento: campoData.politica_cancelamento || ""
      }));
      
      setLoading(false);
    };
    fetchDados();
  }, [campoId, lang, router]);

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.modalidadeReserva || !form.tipo_pagamento || !form.politica_cancelamento) {
      alert("Por favor, selecione as opções obrigatórias nos Anexos 1, 2 e 3.");
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
      tipoPagamento: form.tipo_pagamento,
      politicaCancelamento: form.politica_cancelamento,
      acordosComplementares: form.acordosComplementares,
      assinaturaNome: form.assinaturaNome,
      assinaturaCargo: form.assinaturaCargo,
      empresaNome: perfil.empresa_nome,
      nif: perfil.nif_empresa,
      dataSubmissao: new Date().toISOString()
    };

    // Grava o JSON e atualiza as colunas vitais para o Checkout e Portal dos Pais
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
        
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
          <Link href={`/${lang}/admin/dashboard`} className="text-sm font-bold text-slate-500 hover:text-black transition-colors">
            &larr; Voltar ao Painel
          </Link>
          <button onClick={handleSubmeter} disabled={submitting || !form.concordaTermos} className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md">
            {submitting ? 'A submeter...' : 'Assinar e Submeter Contrato'}
          </button>
        </div>

        <form id="contrato-form" onSubmit={handleSubmeter} className="bg-white shadow-2xl p-8 md:p-16 text-black leading-relaxed rounded-sm font-serif">
          
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

          <div className="space-y-12 mb-16 font-sans">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">📝</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">1. Celebração do contrato</h3>
                <p className="text-slate-600 text-justify leading-relaxed">Parabéns! Celebrou um contrato de parceria com a HelloCamp. Este contrato regula a divulgação e a intermediação das suas ofertas através da plataforma HelloCamp, estabelecendo os termos da colaboração entre ambas as partes. O acordo mantém-se válido até ao final do ano civil em curso.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">🏖️</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">2. Divulgação das ofertas</h3>
                <p className="text-slate-600 text-justify leading-relaxed">Após a celebração do contrato, a HelloCamp procede à recolha e organização das informações relativas às atividades disponibilizadas pelo parceiro, criando e publicando as respetivas páginas de oferta na plataforma. A publicação das ofertas apenas ocorrerá após a validação de toda a informação necessária.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">💻</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">3. Reservas através da HelloCamp</h3>
                <p className="text-slate-600 text-justify leading-relaxed">As reservas poderão ser efetuadas diretamente através da plataforma HelloCamp. Sempre que uma reserva seja realizada, comunicaremos ao parceiro os dados do cliente e os detalhes da inscrição. O parceiro compromete-se a manter permanentemente atualizadas as disponibilidades e preços.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-slate-900 text-white border border-slate-700 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">€</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">4. Pagamento da Comissão</h3>
                <p className="text-slate-600 text-justify leading-relaxed">A HelloCamp cobra uma comissão sobre cada reserva concluída. O modelo de pagamento poderá assumir diferentes formas (reserva direta com retenção via Stripe ou gestão externa pelo parceiro), conforme as opções selecionadas nos Anexos deste contrato.</p>
              </div>
            </div>
          </div>

          <div className="h-0.5 bg-black w-full my-16"></div>

          <div className="space-y-6 text-[15px] text-justify">
            <h2 className="text-2xl font-bold text-center uppercase tracking-widest mb-10">Contrato de Intermediação</h2>

            <p className="mb-4">Entre:</p>
            <div className="ml-8 mb-8 space-y-1">
              <p><strong>HelloCamp</strong></p>
              <p>Website: www.hellocamp.pt</p>
              <p>E-mail: info@hellocamp.pt</p>
            </div>

            <p className="mb-4">E</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 ml-8 mb-8 bg-gray-50 p-6 border border-gray-300 font-sans text-sm shadow-inner">
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">Pessoa de Contacto:</label><input required type="text" className={inputClass} value={form.pessoaContacto} onChange={e => setForm({...form, pessoaContacto: e.target.value})} placeholder="Nome completo" /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">Nome da Empresa:</label><input required type="text" className="border-b border-transparent bg-transparent px-1 font-bold text-gray-600 outline-none cursor-not-allowed" value={perfil.empresa_nome || ""} readOnly /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">Forma Jurídica:</label><input required type="text" className={inputClass} value={form.formaJuridica} onChange={e => setForm({...form, formaJuridica: e.target.value})} placeholder="Ex: Lda, Unipessoal" /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">NIF:</label><input required type="text" className="border-b border-transparent bg-transparent px-1 font-bold text-gray-600 outline-none cursor-not-allowed" value={perfil.nif_empresa || ""} readOnly /></div>
              <div className="flex flex-col md:col-span-2"><label className="font-bold text-gray-700 mb-1">Morada:</label><input required type="text" className={inputClass} value={form.morada} onChange={e => setForm({...form, morada: e.target.value})} placeholder="Rua, número, andar" /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">Código Postal e Cidade:</label><input required type="text" className={inputClass} value={form.codigoPostal} onChange={e => setForm({...form, codigoPostal: e.target.value})} placeholder="0000-000 Localidade" /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">Número de Telefone:</label><input required type="text" className={inputClass} value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">E-mail de Contacto:</label><input required type="email" className={inputClass} value={form.emailContacto} onChange={e => setForm({...form, emailContacto: e.target.value})} /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">E-mail para Reservas:</label><input required type="email" className={inputClass} value={form.emailReservas} onChange={e => setForm({...form, emailReservas: e.target.value})} /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">Website:</label><input type="text" className={inputClass} value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="Opcional" /></div>
              <div className="flex flex-col"><label className="font-bold text-gray-700 mb-1">Responsável RGPD:</label><input required type="text" className={inputClass} value={form.responsavelRGPD} onChange={e => setForm({...form, responsavelRGPD: e.target.value})} placeholder="Nome do responsável" /></div>
            </div>
            
            <p className="italic text-center mt-6 mb-8">- doravante designado por "Parceiro" -</p>
            <p className="font-bold text-center">É celebrado o presente contrato aplicável ao programa designado: <span className="underline decoration-2 underline-offset-4">{campo.nome}</span>.</p>
          </div>

          <div className="space-y-6 text-[15px] text-justify pt-12">
            <h3 className="font-bold text-xl uppercase tracking-widest border-b border-black pb-2 mb-8">Cláusulas Contratuais</h3>
            <h4 className="font-bold">Artigo 1.º – Comissão</h4>
            <p className="mb-4">O Parceiro compromete-se a pagar à HelloCamp uma comissão de 12% (iva não incluído) sobre cada reserva efetuada através da plataforma, nos termos definidos no presente contrato ou em acordo complementar celebrado entre as partes. A comissão é calculada sobre o valor efetivamente pago pelo cliente relativamente à atividade reservada. A comissão torna-se devida após a confirmação da reserva pelo Parceiro.</p>
            <h4 className="font-bold">Artigo 2.º – Condições de Pagamento</h4>
            <p className="mb-8">As comissões devidas à HelloCamp serão faturadas de acordo com o modelo de pagamento acordado. O Parceiro compromete-se a liquidar as faturas emitidas pela HelloCamp dentro dos prazos nelas indicados, salvo se a opção de retenção automática via Stripe for selecionada.</p>
            <h4 className="font-bold">Artigo 3.º – Obrigações do Parceiro</h4>
            <p className="mb-4">O Parceiro garante que possui todos os direitos necessários sobre os conteúdos disponibilizados à HelloCamp. Os preços divulgados na plataforma não poderão ser superiores aos preços praticados pelo Parceiro para reservas diretas. O Parceiro compromete-se a realizar as atividades promovidas e assumir toda a responsabilidade civil inerente.</p>
            <h4 className="font-bold">Artigo 4.º – Duração e Renovação</h4>
            <p className="mb-8">O presente contrato produz efeitos a partir da data da sua assinatura por ambas as partes e mantém-se válido até ao final do respetivo ano civil, sendo automaticamente renovado por períodos sucessivos de um ano.</p>
          </div>

          <div className="h-px bg-gray-300 w-full my-12"></div>

          {/* ANEXOS COM MÚLTIPLA ESCOLHA UNIFORMIZADA */}
          <div className="space-y-12 font-sans text-sm text-slate-800">
            
            {/* ANEXO 1 - PROCEDIMENTO DE RESERVA */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="font-black text-lg mb-4 text-black uppercase border-l-4 border-[#EBA914] pl-3">Anexo 1 – Procedimento de Reserva</h3>
              <p className="mb-6">Selecione a modalidade de gestão de reservas aplicável à sua parceria.</p>
              
              <div className="space-y-3">
                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.modalidadeReserva === 'direta' ? 'bg-white border-black shadow-sm' : 'border-transparent hover:bg-gray-100'}`}>
                  <input type="radio" name="anexo1" required value="direta" checked={form.modalidadeReserva === 'direta'} onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1 w-4 h-4 accent-black" />
                  <div>
                    <strong className="block text-black mb-1">Reserva Direta com Pagamento Automático (Recomendado)</strong>
                    <span className="text-gray-600 leading-relaxed block">As reservas são processadas em tempo real. O encarregado de educação paga de imediato via Stripe, garantindo a vaga. O Parceiro acede a todos os dados do participante (fichas clínicas, autorizações) no seu Dashboard.</span>
                  </div>
                </label>

                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.modalidadeReserva === 'email' ? 'bg-white border-black shadow-sm' : 'border-transparent hover:bg-gray-100'}`}>
                  <input type="radio" name="anexo1" required value="email" checked={form.modalidadeReserva === 'email'} onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1 w-4 h-4 accent-black" />
                  <div>
                    <strong className="block text-black mb-1">Comunicação por E-mail (Reserva Sob Consulta)</strong>
                    <span className="text-gray-600 leading-relaxed block">O cliente não paga no imediato na plataforma. A HelloCamp recolhe os dados logísticos e envia-lhe um e-mail. O Parceiro contacta a família para prosseguir com o pagamento de forma externa.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* ANEXO 2 - PAGAMENTOS E FATURAÇÃO */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h3 className="font-black text-lg mb-4 text-blue-950 uppercase border-l-4 border-blue-600 pl-3">Anexo 2 – Condições de Cobrança aos Pais</h3>
              <p className="mb-6 text-blue-900">Selecione o modelo de cobrança que será exigido aos pais no momento da inscrição através da HelloCamp.</p>
              
              <div className="space-y-3">
                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.tipo_pagamento === '100_total' ? 'bg-white border-blue-600 shadow-sm' : 'border-transparent hover:bg-blue-100/50'}`}>
                  <input type="radio" name="anexo2" required value="100_total" checked={form.tipo_pagamento === '100_total'} onChange={e => setForm({...form, tipo_pagamento: e.target.value})} className="mt-1 w-4 h-4 accent-blue-600" />
                  <div>
                    <strong className="block text-blue-950 mb-1">100% Pago no Ato da Reserva (Pagamento Imediato)</strong>
                    <span className="text-blue-800 leading-relaxed block">O cliente liquida a totalidade do valor do programa para assegurar a vaga. A comissão da HelloCamp é retida automaticamente deste montante.</span>
                  </div>
                </label>

                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.tipo_pagamento === '50_sinal' ? 'bg-white border-blue-600 shadow-sm' : 'border-transparent hover:bg-blue-100/50'}`}>
                  <input type="radio" name="anexo2" required value="50_sinal" checked={form.tipo_pagamento === '50_sinal'} onChange={e => setForm({...form, tipo_pagamento: e.target.value})} className="mt-1 w-4 h-4 accent-blue-600" />
                  <div>
                    <strong className="block text-blue-950 mb-1">Sinal de 50% Agora + 50% 1 Semana Antes</strong>
                    <span className="text-blue-800 leading-relaxed block">O cliente assegura a vaga pagando metade do valor. A plataforma agendará e debitará automaticamente a segunda metade do cartão de crédito do cliente 7 dias antes do campo começar.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* ANEXO 3 - POLÍTICA DE CANCELAMENTO (FUNDIDA) */}
            <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
              <h3 className="font-black text-lg mb-4 text-amber-950 uppercase border-l-4 border-amber-500 pl-3">Anexo 3 – Política de Cancelamento e Reembolso</h3>
              <p className="mb-6 text-amber-900">A opção selecionada ditará as regras de reembolso para os pais na plataforma. A comissão da HelloCamp incidirá apenas sobre o montante que o Parceiro retiver.</p>
              
              <div className="space-y-3">
                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.politica_cancelamento === 'Flexível (Reembolso a 100% até 7 dias antes)' ? 'bg-white border-amber-500 shadow-sm' : 'border-transparent hover:bg-amber-100/50'}`}>
                  <input type="radio" name="anexo3" required value="Flexível (Reembolso a 100% até 7 dias antes)" checked={form.politica_cancelamento === 'Flexível (Reembolso a 100% até 7 dias antes)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600" />
                  <div>
                    <strong className="block text-amber-950 mb-1">Flexível (Reembolso a 100% até 7 dias antes)</strong>
                    <span className="text-amber-800 leading-relaxed block text-sm">O cliente tem direito à devolução integral caso cancele atempadamente. A HelloCamp abdica da sua comissão nestas situações.</span>
                  </div>
                </label>

                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.politica_cancelamento === 'Moderada (Reembolso a 50% até 15 dias antes)' ? 'bg-white border-amber-500 shadow-sm' : 'border-transparent hover:bg-amber-100/50'}`}>
                  <input type="radio" name="anexo3" required value="Moderada (Reembolso a 50% até 15 dias antes)" checked={form.politica_cancelamento === 'Moderada (Reembolso a 50% até 15 dias antes)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600" />
                  <div>
                    <strong className="block text-amber-950 mb-1">Moderada (Reembolso a 50% até 15 dias antes)</strong>
                    <span className="text-amber-800 leading-relaxed block text-sm">O cliente recebe 50% do valor caso cancele atempadamente. A comissão da HelloCamp é calculada apenas sobre a metade que o Parceiro retém.</span>
                  </div>
                </label>

                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.politica_cancelamento === 'Estrita (Sem reembolso após reserva)' ? 'bg-white border-amber-500 shadow-sm' : 'border-transparent hover:bg-amber-100/50'}`}>
                  <input type="radio" name="anexo3" required value="Estrita (Sem reembolso após reserva)" checked={form.politica_cancelamento === 'Estrita (Sem reembolso após reserva)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600" />
                  <div>
                    <strong className="block text-amber-950 mb-1">Estrita (Sem reembolso após reserva)</strong>
                    <span className="text-amber-800 leading-relaxed block text-sm">As reservas são finais. O cliente não recebe reembolso se cancelar, garantindo a receita do Parceiro e a comissão total da HelloCamp.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* ANEXO 4 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="font-black text-lg mb-4 text-black uppercase border-l-4 border-gray-400 pl-3">Anexo 4 – Acordos Extraordinários</h3>
              <p className="mb-3 text-gray-700 font-medium">Registe abaixo caso existam adendas pré-acordadas com a HelloCamp. Caso não existam, deixe em branco.</p>
              <textarea 
                className="w-full border border-gray-300 p-4 rounded-lg bg-gray-50 outline-none focus:border-black transition-all" 
                rows={3} 
                value={form.acordosComplementares} 
                onChange={e => setForm({...form, acordosComplementares: e.target.value})}
              ></textarea>
            </div>

          </div>

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
                  <label className="text-xs font-bold uppercase mb-1 text-gray-500">Escreva o seu Nome *</label>
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