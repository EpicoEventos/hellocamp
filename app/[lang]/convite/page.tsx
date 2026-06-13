"use client";

import { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import React from "react";

export default function ConviteParceiroPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const router = useRouter();
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(false);
  
  // Dados da Empresa, Contrato e Configurações Iniciais
  const [form, setForm] = useState({
    nomeEmpresa: "",
    nif: "",
    nomePrograma: "", // Cria o 1º campo automaticamente
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
    politica_cancelamento: "", // Anexo 3 (Fundido B2B e B2C)
    acordosComplementares: "",
    assinaturaNome: "",
    assinaturaCargo: "",
    concordaTermos: false,
    tipo_pagamento: "100_total"
  });

  // Dados de Autenticação (Para criar a conta na hora)
  const [auth, setAuth] = useState({
    emailAcesso: "",
    passwordAcesso: ""
  });

  const handleSubmeterTudo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.modalidadeReserva || !form.politica_cancelamento) {
      alert("Por favor, selecione as opções obrigatórias nos Anexos 1 e 3.");
      return;
    }

    setLoading(true);

    // 1. Criar a Conta de Organizador
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: auth.emailAcesso,
      password: auth.passwordAcesso,
      options: {
        data: {
          empresa_nome: form.nomeEmpresa,
          nif_empresa: form.nif,
          role: 'organizador'
        }
      }
    });

    if (authError || !authData.user) {
      alert("Erro ao criar conta: " + (authError?.message || "Desconhecido"));
      setLoading(false);
      return;
    }

    // 2. Aguardamos 1.5 segundos para garantir que o Trigger do Supabase criou o Perfil
    await new Promise(resolve => setTimeout(resolve, 1500));

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
      empresaNome: form.nomeEmpresa,
      nif: form.nif,
      dataSubmissao: new Date().toISOString(),
      ipAssinatura: "Capturado via Registo Unificado"
    };

    // 3. CRIAÇÃO DO CAMPO EM CADEIA
    const { error: campoError } = await supabase
      .from('campos')
      .insert([
        {
          nome: form.nomePrograma,
          organizador_id: authData.user.id,
          contrato_dados: payloadJSON,
          status_aprovacao: 'Pendente de Revisão',
          tipo_pagamento: form.tipo_pagamento,
          politica_cancelamento: form.politica_cancelamento, // Injeta diretamente na coluna do campo
          ativo: false
        }
      ]);

    if (campoError) {
      alert("Conta criada, mas houve um erro ao anexar o contrato. Contacte o suporte.");
    } else {
      alert("Contrato assinado e conta criada com sucesso! Pode agora aceder ao seu portal.");
      router.push(`/${lang}/admin/login`);
    }
    setLoading(false);
  };

  const inputClass = "border-b border-gray-400 outline-none bg-transparent px-1 text-black placeholder:text-gray-400 w-full focus:border-black transition-colors";
  const dataAtual = new Date().toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <main className="min-h-screen bg-slate-200 py-12 px-4 font-sans text-black selection:bg-yellow-200">
      <div className="max-w-[900px] mx-auto">
        
        <div className="mb-10 text-center">
          <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">Convite Exclusivo B2B</span>
          <h1 className="text-4xl font-black tracking-tight mt-6">Bem-vindo à HelloCamp</h1>
          <p className="text-slate-600 font-medium mt-3 max-w-2xl mx-auto">Preencha o acordo de parceria abaixo para digitalizar a sua operação. No final do documento, definirá os seus dados de acesso ao portal.</p>
        </div>

        <form onSubmit={handleSubmeterTudo} className="bg-white shadow-2xl p-8 md:p-16 text-black leading-relaxed rounded-sm font-serif">
          
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

          {/* AS 4 FASES EXPLICATIVAS */}
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
                <p className="text-slate-600 text-justify leading-relaxed">Após a celebração do contrato, a HelloCamp procede à recolha e organização das informações relativas às atividades disponibilizadas pelo parceiro, criando e publicando as respetivas páginas de oferta na plataforma. A publicação apenas ocorrerá após a validação da informação.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">💻</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">3. Reservas através da HelloCamp</h3>
                <p className="text-slate-600 text-justify leading-relaxed">Sempre que uma reserva seja realizada, a HelloCamp comunicará ao parceiro os dados do cliente, os detalhes da reserva e todas as informações necessárias à adequada gestão da inscrição. O parceiro compromete-se a manter permanentemente atualizada a disponibilidade das atividades.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-slate-900 text-white border border-slate-700 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">€</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">4. Pagamento da Comissão</h3>
                <p className="text-slate-600 text-justify leading-relaxed">A HelloCamp cobra uma comissão sobre cada reserva concluída através da plataforma. O modelo de pagamento poderá assumir diferentes formas (reserva direta ou pagamento externo), conforme acordado nos Anexos deste documento.</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-300 w-full my-12"></div>

          {/* IDENTIFICAÇÃO DAS PARTES */}
          <div className="space-y-4 font-serif text-[15px]">
            <h2 className="text-xl font-bold text-center uppercase tracking-widest mb-8">Acordo de Prestação de Serviços</h2>
            <p>Entre a <strong>HelloCamp</strong>, com website em www.hellocamp.pt e contacto via info@hellocamp.pt, doravante designada por "Primeiro Outorgante"; e do outro lado:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mt-8 bg-gray-50 p-8 border border-gray-200 rounded-lg">
              <div className="flex flex-col md:col-span-2"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Nome da Empresa (Faturação) *</label><input required type="text" className={inputClass} value={form.nomeEmpresa} onChange={e => setForm({...form, nomeEmpresa: e.target.value})} placeholder="Designação legal" /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">NIF *</label><input required type="text" className={inputClass} value={form.nif} onChange={e => setForm({...form, nif: e.target.value})} placeholder="Número de Identificação Fiscal" /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Forma Jurídica *</label><input required type="text" className={inputClass} value={form.formaJuridica} onChange={e => setForm({...form, formaJuridica: e.target.value})} placeholder="Ex: Lda, Associação..." /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Pessoa de Contacto *</label><input required type="text" className={inputClass} value={form.pessoaContacto} onChange={e => setForm({...form, pessoaContacto: e.target.value})} placeholder="Nome completo" /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Número de Telefone *</label><input required type="text" className={inputClass} value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} /></div>
              <div className="flex flex-col md:col-span-2"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Morada Fiscal *</label><input required type="text" className={inputClass} value={form.morada} onChange={e => setForm({...form, morada: e.target.value})} placeholder="Rua, número, andar" /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Código Postal e Cidade *</label><input required type="text" className={inputClass} value={form.codigoPostal} onChange={e => setForm({...form, codigoPostal: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">E-mail Comercial *</label><input required type="email" className={inputClass} value={form.emailContacto} onChange={e => setForm({...form, emailContacto: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">E-mail para Reservas *</label><input required type="email" className={inputClass} value={form.emailReservas} onChange={e => setForm({...form, emailReservas: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Website (Opcional)</label><input type="text" className={inputClass} value={form.website} onChange={e => setForm({...form, website: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Responsável de Dados (RGPD) *</label><input required type="text" className={inputClass} value={form.responsavelRGPD} onChange={e => setForm({...form, responsavelRGPD: e.target.value})} /></div>
            </div>
            
            <p className="mt-6 italic text-center">- doravante designado por "Parceiro" -</p>
            
            <div className="bg-emerald-50 border border-emerald-200 p-8 my-8 font-sans rounded-xl shadow-inner">
              <label className="text-sm font-bold text-emerald-900 block mb-3 uppercase tracking-widest">Qual é o nome do seu programa principal / campo de férias? *</label>
              <input required type="text" className="w-full border-b-2 border-emerald-600 bg-transparent text-2xl font-black text-emerald-900 outline-none placeholder:text-emerald-300 transition-colors focus:border-emerald-800" value={form.nomePrograma} onChange={e => setForm({...form, nomePrograma: e.target.value})} placeholder="Ex: Summer Surf Camp 2026" />
              <p className="text-sm font-medium text-emerald-700 mt-4">É celebrado o presente contrato de intermediação e divulgação comercial para este programa específico.</p>
            </div>
          </div>

          {/* CLÁUSULAS CONTRATUAIS */}
          <div className="space-y-8 font-serif text-[15px] text-justify pt-8">
            <h3 className="font-bold text-xl uppercase tracking-widest border-b border-black pb-2 mb-6">Cláusulas Contratuais</h3>
            <div>
              <h4 className="font-bold mb-2">Artigo 1.º – Objeto e Comissão</h4>
              <p className="mb-2">1. O Parceiro compromete-se a remunerar o Primeiro Outorgante com uma comissão de prestação de serviços fixada em <strong>12% (IVA não incluído)</strong> sobre cada reserva efetivada através da plataforma HelloCamp.</p>
              <p className="mb-2">2. A base de incidência da comissão recai sobre o valor total efetivamente pago pelo cliente final relativamente à atividade reservada, incluindo eventuais serviços logísticos adicionais contratados pelo cliente através do portal.</p>
              <p className="mb-2">3. O Parceiro compromete-se a enviar ao cliente a devida confirmação de inscrição e a assegurar o cumprimento integral e zeloso da prestação dos serviços contratados pela família.</p>
              <p>4. Em caso de cancelamento da reserva por iniciativa do cliente, aplicar-se-ão estritamente as condições previstas no Anexo 3 deste documento.</p>
            </div>
            <div>
              <h4 className="font-bold mb-2">Artigo 2.º – Processamento e Condições de Pagamento</h4>
              <p className="mb-2">1. Caso o Parceiro opte pela modalidade de "Reserva Direta", os pagamentos serão processados de forma segura através da infraestrutura financeira <strong>Stripe Connect</strong>.</p>
              <p>2. Na referida modalidade, o valor da comissão devida à HelloCamp é automaticamente retido no ato do pagamento, sendo o montante remanescente (lucro líquido) transferido diretamente para a conta bancária associada pelo Parceiro na plataforma, isentando as partes de faturação manual morosa.</p>
            </div>
            <div>
              <h4 className="font-bold mb-2">Artigo 3.º – Obrigações e Responsabilidades do Parceiro</h4>
              <p className="mb-2">1. O Parceiro declara, sob compromisso de honra, que possui todos os seguros de responsabilidade civil e acidentes pessoais legalmente exigidos, bem como o licenciamento do IPDJ válido para a execução das atividades propostas.</p>
              <p className="mb-2">2. O Parceiro garante deter a titularidade ou autorização sobre todos os direitos de imagem e conteúdos textuais fornecidos à HelloCamp para efeitos de divulgação comercial.</p>
              <p className="mb-2">3. O Parceiro obriga-se a praticar na plataforma HelloCamp preços de paridade comercial, não podendo estes ser superiores aos preços divulgados nos canais diretos do próprio Parceiro.</p>
              <p>4. O Parceiro assume inteira e exclusiva responsabilidade civil, criminal e operacional sobre a salvaguarda e bem-estar dos participantes durante o decurso dos turnos.</p>
            </div>
            <div>
              <h4 className="font-bold mb-2">Artigo 4.º – Duração, Renovação e Denúncia</h4>
              <p>O presente contrato entra em vigor na data da sua assinatura eletrónica. O seu término coincide com o último dia do ano civil em curso, renovando-se automaticamente por sucessivos períodos de um ano. A intenção de rescisão deverá ser comunicada por escrito, por qualquer uma das partes, com uma antecedência mínima de 30 dias face ao seu termo.</p>
            </div>
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
                  <input type="radio" name="anexo1" required value="direta" onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1 w-4 h-4 accent-black" />
                  <div>
                    <strong className="block text-black mb-1">Reserva Direta com Pagamento Automático (Recomendado)</strong>
                    <span className="text-gray-600 leading-relaxed block">As reservas são processadas em tempo real. O encarregado de educação paga de imediato via Stripe, garantindo a vaga. O Parceiro acede a todos os dados do participante no Dashboard.</span>
                  </div>
                </label>

                <label className="flex items-start gap-4 cursor-pointer hover:bg-gray-100 p-3 rounded transition-colors border-t border-gray-200 pt-5">
                  <input type="radio" name="anexo1" required value="email" onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1 w-4 h-4 accent-black" />
                  <div>
                    <strong className="block text-black mb-1">Comunicação por E-mail (Reserva Sob Consulta)</strong>
                    <span className="text-gray-600 leading-relaxed block">O cliente não paga no imediato. A HelloCamp recolhe os dados e envia-lhe um e-mail com a intenção de reserva. O Parceiro analisa, valida e contacta a família para organizar o pagamento de forma externa.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* ANEXO 2 - PAGAMENTOS */}
            <div>
              <h3 className="font-black text-lg mb-4 text-black uppercase border-l-4 border-[#EBA914] pl-3">Anexo 2 – Pagamento e comissão</h3>
              <p className="mb-4 text-justify leading-relaxed">
                O Parceiro autoriza a HelloCamp a receber um depósito durante o processo de reserva efetuado através da plataforma Stripe. O valor do depósito corresponde, regra geral, à comissão devida à HelloCamp pela reserva efetuada, acrescida de IVA à taxa legal em vigor. Após a confirmação da reserva, o cliente efetua o pagamento do depósito à HelloCamp, sendo o valor remanescente pago diretamente ao Parceiro. No final de cada período de faturação acordado, a HelloCamp emitirá a fatura correspondente às comissões devidas, deduzindo os montantes já recebidos a título de depósito.
              </p>
              
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
                  <input type="radio" name="anexo3" required value="Flexível (Reembolso a 100% até 7 dias antes)" onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600" />
                  <div>
                    <strong className="block text-amber-900 mb-1">Flexível (Reembolso a 100% até 7 dias antes)</strong>
                    <span className="text-amber-800 leading-relaxed block text-sm">O cliente tem direito à devolução integral do valor pago caso cancele até 7 dias antes do início do programa. Nestes casos, a HelloCamp isenta o Parceiro do pagamento de qualquer comissão. Cancelamentos após este prazo não conferem direito a reembolso, sendo devida a comissão integral à HelloCamp.</span>
                  </div>
                </label>

                <label className="flex items-start gap-4 cursor-pointer hover:bg-amber-100 p-3 rounded transition-colors border-t border-amber-200 pt-5">
                  <input type="radio" name="anexo3" required value="Moderada (Reembolso a 50% até 15 dias antes)" onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600" />
                  <div>
                    <strong className="block text-amber-900 mb-1">Moderada (Reembolso a 50% até 15 dias antes)</strong>
                    <span className="text-amber-800 leading-relaxed block text-sm">O cliente recebe 50% do valor pago caso cancele até 15 dias antes do início. O Parceiro retém os restantes 50% a título de penalização, sendo a comissão da HelloCamp recalculada e aplicada apenas sobre esse valor retido. Cancelamentos após este prazo não conferem direito a reembolso.</span>
                  </div>
                </label>

                <label className="flex items-start gap-4 cursor-pointer hover:bg-amber-100 p-3 rounded transition-colors border-t border-amber-200 pt-5">
                  <input type="radio" name="anexo3" required value="Estrita (Sem reembolso após reserva)" onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600" />
                  <div>
                    <strong className="block text-amber-900 mb-1">Estrita (Sem reembolso após reserva)</strong>
                    <span className="text-amber-800 leading-relaxed block text-sm">As reservas efetuadas são finais e não reembolsáveis em caso de cancelamento por iniciativa do cliente. A comissão da HelloCamp é devida na sua totalidade independentemente de o cliente comparecer ou não à atividade.</span>
                  </div>
                </label>

              </div>
            </div>

            {/* ANEXO 4 */}
            <div>
              <h3 className="font-black text-lg mb-4 text-black uppercase border-l-4 border-[#EBA914] pl-3">Anexo 4 – Acordos Extraordinários</h3>
              <p className="text-sm mb-2 text-gray-600">Registe abaixo caso existam adendas pré-acordadas com a equipa HelloCamp (ex: Taxa de comissão diferente da padrão). Caso não existam, deixe em branco.</p>
              <textarea 
                className="w-full border border-gray-300 p-4 rounded-lg bg-gray-50 outline-none focus:border-black" 
                rows={3} 
                value={form.acordosComplementares} 
                onChange={e => setForm({...form, acordosComplementares: e.target.value})}
              ></textarea>
            </div>

          </div>

          {/* ÁREA DE ASSINATURAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16 pt-12 border-t-2 border-black font-sans">
            <div>
              <h4 className="font-black mb-6 uppercase tracking-wider text-black text-sm">Pela HelloCamp</h4>
              <p className="font-serif text-xl italic text-gray-500 mb-2">Administração HelloCamp</p>
              <p className="text-sm font-medium border-t border-gray-200 mt-6 pt-4">Data: {dataAtual}</p>
            </div>

            <div>
              <h4 className="font-black mb-6 uppercase tracking-wider text-black text-sm">Pelo Parceiro (Assinatura Digital)</h4>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase mb-1 text-gray-500">Escreva o seu Nome *</label>
                  <input required type="text" className="border-b-2 border-black bg-transparent outline-none py-2 text-xl font-serif italic focus:border-[#EBA914] transition-colors" value={form.assinaturaNome} onChange={e => setForm({...form, assinaturaNome: e.target.value})} placeholder="Nome de quem assina" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase mb-1 text-gray-500">Indique o seu Cargo *</label>
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

          {/* CRIAÇÃO DA CONTA B2B */}
          <div className="bg-slate-900 p-8 rounded-2xl text-white font-sans mt-16 shadow-2xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#EBA914]/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <h3 className="text-2xl font-black mb-2 relative z-10">Último Passo: Conta de Acesso</h3>
            <p className="text-sm text-slate-400 mb-8 relative z-10">Defina as credenciais para aceder ao seu Dashboard de Organizador e gerir este campo.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email de Login (Acesso) *</label>
                <input type="email" required value={auth.emailAcesso} onChange={e => setAuth({...auth, emailAcesso: e.target.value})} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-[#EBA914] transition-colors" placeholder="geral@suaempresa.pt" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Defina uma Password *</label>
                <input type="password" required minLength={6} value={auth.passwordAcesso} onChange={e => setAuth({...auth, passwordAcesso: e.target.value})} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-[#EBA914] transition-colors" placeholder="Mínimo 6 caracteres" />
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-slate-700 flex justify-end relative z-10">
              <button type="submit" disabled={loading || !form.concordaTermos} className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold px-10 py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1 cursor-pointer w-full md:w-auto text-lg border border-emerald-400">
                {loading ? 'A criar ambiente seguro...' : 'Assinar Contrato e Criar Conta'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </main>
  );
}