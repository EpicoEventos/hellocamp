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
  
  const [form, setForm] = useState({
    nomeEmpresa: "",
    nif: "",
    nomePrograma: "",
    pessoaContacto: "",
    formaJuridica: "",
    morada: "",
    codigoPostal: "",
    telefone: "",
    emailContacto: "",
    emailReservas: "",
    website: "",
    responsavelRGPD: "",
    modalidadeReserva: "", 
    tipo_pagamento: "", 
    politica_cancelamento: "", 
    acordosComplementares: "",
    assinaturaNome: "",
    assinaturaCargo: "",
    concordaTermos: false
  });

  const [auth, setAuth] = useState({
    emailAcesso: "",
    passwordAcesso: ""
  });

  const handleSubmeterTudo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.modalidadeReserva || !form.tipo_pagamento || !form.politica_cancelamento) {
      alert(isEn ? "Please select the mandatory options in Annexes 1, 2, and 3." : "Por favor, selecione as opções obrigatórias nos Anexos 1, 2 e 3.");
      return;
    }

    setLoading(true);

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
      alert((isEn ? "Error creating account: " : "Erro ao criar conta: ") + (authError?.message || "Desconhecido"));
      setLoading(false);
      return;
    }

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
      tipoPagamento: form.tipo_pagamento,
      politicaCancelamento: form.politica_cancelamento,
      acordosComplementares: form.acordosComplementares,
      assinaturaNome: form.assinaturaNome,
      assinaturaCargo: form.assinaturaCargo,
      empresaNome: form.nomeEmpresa,
      nif: form.nif,
      dataSubmissao: new Date().toISOString(),
      ipAssinatura: isEn ? "Captured via Unified Registration" : "Capturado via Registo Unificado"
    };

    const { error: campoError } = await supabase
      .from('campos')
      .insert([
        {
          nome: form.nomePrograma,
          organizador_id: authData.user.id,
          contrato_dados: payloadJSON,
          status_aprovacao: 'Pendente de Revisão',
          tipo_pagamento: form.tipo_pagamento,
          politica_cancelamento: form.politica_cancelamento,
          ativo: false
        }
      ]);

    if (campoError) {
      alert(isEn ? "Account created, but there was an error attaching the contract. Contact support." : "Conta criada, mas houve um erro ao anexar o contrato. Contacte o suporte.");
    } else {
      alert(isEn ? "Contract signed and account successfully created! You can now access your portal." : "Contrato assinado e conta criada com sucesso! Pode agora aceder ao seu portal.");
      router.push(`/${lang}/admin/login`);
    }
    setLoading(false);
  };

  const inputClass = "border-b border-gray-400 outline-none bg-transparent px-1 py-2 text-base text-black placeholder:text-gray-400 w-full focus:border-black transition-colors";
  const dataAtual = new Date().toLocaleDateString(isEn ? 'en-US' : 'pt-PT', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <main className="min-h-screen bg-slate-200 py-8 md:py-12 px-4 sm:px-6 font-sans text-black selection:bg-yellow-200">
      <div className="max-w-[900px] mx-auto">
        
        <div className="mb-8 md:mb-10 text-center">
          <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-sm">
            {isEn ? 'Exclusive B2B Invitation' : 'Convite Exclusivo B2B'}
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-6">
            {isEn ? 'Welcome to HelloCamp' : 'Bem-vindo à HelloCamp'}
          </h1>
          <p className="text-sm md:text-base text-slate-600 font-medium mt-3 max-w-2xl mx-auto px-2">
            {isEn 
              ? 'Please fill out the partnership agreement below to digitize your operation. At the end of the document, you will define your portal access details.' 
              : 'Preencha o acordo de parceria abaixo para digitalizar a sua operação. No final do documento, definirá os seus dados de acesso ao portal.'}
          </p>
        </div>

        <form onSubmit={handleSubmeterTudo} className="bg-white shadow-2xl p-5 sm:p-10 md:p-16 text-black leading-relaxed rounded-xl font-serif">
          
          <div className="text-center mb-10 md:mb-16">
            <div className="text-3xl md:text-4xl font-black tracking-tighter mb-6 font-sans">
              <span className="text-black">Hello</span><span className="text-[#EBA914]">Camp</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold uppercase mb-2 tracking-widest border-b-2 border-black inline-block pb-2">
              {isEn ? 'Intermediation Contract – HelloCamp' : 'Contrato de Intermediação – HelloCamp'}
            </h1>
            <p className="text-sm md:text-base italic text-gray-600 mt-4">
              {isEn ? 'Your partnership contract with HelloCamp, explained simply and objectively.' : 'O seu contrato de parceria com a HelloCamp, explicado de forma simples e objetiva.'}
            </p>
          </div>

          <div className="space-y-8 md:space-y-12 mb-10 md:mb-16 font-sans">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">📝</div>
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-2">
                  {isEn ? '1. Conclusion of the Contract' : '1. Celebração do contrato'}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed">
                  {isEn 
                    ? 'Congratulations! You have entered into a partnership agreement with HelloCamp. This contract regulates the promotion and intermediation of your offers through the HelloCamp platform, establishing the terms of collaboration between both parties. The agreement remains valid until the end of the current calendar year and is automatically renewed for successive periods, unless terminated by either party under the contractual terms.' 
                    : 'Parabéns! Celebrou um contrato de parceria com a HelloCamp. Este contrato regula a divulgação e a intermediação das suas ofertas através da plataforma HelloCamp, estabelecendo os termos da colaboração entre ambas as partes. O acordo mantém-se válido até ao final do ano civil em curso, sendo automaticamente renovado por períodos sucessivos, salvo denúncia por qualquer uma das partes nos termos previstos contratualmente.'}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">🏖️</div>
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-2">
                  {isEn ? '2. Promotion of Offers' : '2. Divulgação das ofertas'}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed">
                  {isEn 
                    ? 'After the contract is signed, HelloCamp collects and organizes the information regarding the activities provided by the partner, creating and publishing the respective offer pages on the platform. Concurrently, it promotes the programs through its digital channels and may request additional information whenever necessary to ensure the quality and currency of the content. Publication of offers will only occur after compliance with the applicable contractual conditions and validation of all necessary information.' 
                    : 'Após a celebração do contrato, a HelloCamp procede à recolha e organização das informações relativas às atividades disponibilizadas pelo parceiro, criando e publicando as respetivas páginas de oferta na plataforma. Paralelamente, promove os programas através dos seus canais digitais e poderá solicitar informações adicionais sempre que tal se revele necessário para garantir a qualidade e atualização dos conteúdos. A publicação das ofertas apenas ocorrerá após o cumprimento das condições contratuais aplicáveis e da validação de toda a informação necessária.'}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">💻</div>
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-2">
                  {isEn ? '3. Bookings through HelloCamp' : '3. Reservas através da HelloCamp'}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed">
                  {isEn 
                    ? 'Activity bookings can be made directly through the HelloCamp platform. Whenever a booking is made, HelloCamp will communicate the client details, booking specifics, and all necessary information to the partner for proper management. In turn, the partner commits to keeping availability, prices, programs, and other relevant information permanently updated, ensuring data accuracy for clients.' 
                    : 'As reservas das atividades poderão ser efetuadas diretamente através da plataforma HelloCamp. Sempre que uma reserva seja realizada, a HelloCamp comunicará ao parceiro os dados do cliente, os detalhes da reserva e todas as informações necessárias à adequada gestão da inscrição. Por sua vez, o parceiro compromete-se a manter permanentemente atualizadas a disponibilidade das atividades, os preços praticados, os programas oferecidos e quaisquer outras informações relevantes relacionadas com as suas ofertas, assegurando a exatidão dos dados apresentados aos clientes.'}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-900 text-white border border-slate-700 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">€</div>
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-2">
                  {isEn ? '4. Commission Payment' : '4. Pagamento da Comissão'}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed">
                  {isEn 
                    ? 'HelloCamp charges a commission on each completed booking through the platform. The payment model may take different forms, such as direct payment to the partner by the client, partial payment processed by HelloCamp, or any other agreed-upon model. Specific conditions will be defined according to the terms established in the partnership contract.' 
                    : 'A HelloCamp cobra uma comissão sobre cada reserva concluída através da plataforma. O modelo de pagamento poderá assumir diferentes formas, nomeadamente através de pagamento direto ao parceiro pelo cliente, pagamento parcial processado pela HelloCamp ou qualquer outro modelo que venha a ser acordado entre ambas as partes. As condições específicas aplicáveis serão definidas de acordo com os termos estabelecidos no contrato de parceria.'}
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-300 w-full my-8 md:my-12"></div>

          <div className="space-y-4 font-serif text-sm md:text-[15px]">
            <h2 className="text-lg md:text-xl font-bold text-center uppercase tracking-widest mb-6 md:mb-8">
              {isEn ? 'Service Provision Agreement' : 'Acordo de Prestação de Serviços'}
            </h2>
            <p className="text-justify">
              {isEn 
                ? 'Between HelloCamp, with website at www.hellocamp.pt and contact via info@hellocamp.pt, hereinafter referred to as the "First Party"; and on the other side:' 
                : 'Entre a HelloCamp, com website em www.hellocamp.pt e contacto via info@hellocamp.pt, doravante designada por "Primeiro Outorgante"; e do outro lado:'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mt-8 bg-gray-50 p-5 md:p-8 border border-gray-200 rounded-lg">
              <div className="flex flex-col md:col-span-2"><label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{isEn ? 'Company Name (Billing) *' : 'Nome da Empresa (Faturação) *'}</label><input required type="text" className={inputClass} value={form.nomeEmpresa} onChange={e => setForm({...form, nomeEmpresa: e.target.value})} placeholder={isEn ? "Legal designation" : "Designação legal"} /></div>
              <div className="flex flex-col"><label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{isEn ? 'VAT Number *' : 'NIF *'}</label><input required type="text" className={inputClass} value={form.nif} onChange={e => setForm({...form, nif: e.target.value})} placeholder={isEn ? "Tax Identification Number" : "Número de Identificação Fiscal"} /></div>
              <div className="flex flex-col"><label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{isEn ? 'Legal Form *' : 'Forma Jurídica *'}</label><input required type="text" className={inputClass} value={form.formaJuridica} onChange={e => setForm({...form, formaJuridica: e.target.value})} placeholder={isEn ? "Ex: LLC, Association..." : "Ex: Lda, Associação..."} /></div>
              <div className="flex flex-col"><label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{isEn ? 'Contact Person *' : 'Pessoa de Contacto *'}</label><input required type="text" className={inputClass} value={form.pessoaContacto} onChange={e => setForm({...form, pessoaContacto: e.target.value})} placeholder={isEn ? "Full name" : "Nome completo"} /></div>
              <div className="flex flex-col"><label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{isEn ? 'Phone Number *' : 'Número de Telefone *'}</label><input required type="text" className={inputClass} value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} /></div>
              <div className="flex flex-col md:col-span-2"><label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{isEn ? 'Billing Address *' : 'Morada Fiscal *'}</label><input required type="text" className={inputClass} value={form.morada} onChange={e => setForm({...form, morada: e.target.value})} placeholder={isEn ? "Street, number, floor" : "Rua, número, andar"} /></div>
              <div className="flex flex-col"><label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{isEn ? 'Postal Code and City *' : 'Código Postal e Cidade *'}</label><input required type="text" className={inputClass} value={form.codigoPostal} onChange={e => setForm({...form, codigoPostal: e.target.value})} placeholder={isEn ? "0000-000 City" : "0000-000 Localidade"} /></div>
              <div className="flex flex-col"><label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{isEn ? 'Commercial E-mail *' : 'E-mail Comercial *'}</label><input required type="email" className={inputClass} value={form.emailContacto} onChange={e => setForm({...form, emailContacto: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{isEn ? 'Booking E-mail *' : 'E-mail para Reservas *'}</label><input required type="email" className={inputClass} value={form.emailReservas} onChange={e => setForm({...form, emailReservas: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{isEn ? 'Website (Optional)' : 'Website (Opcional)'}</label><input type="text" className={inputClass} value={form.website} onChange={e => setForm({...form, website: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{isEn ? 'Data Protection Officer (GDPR) *' : 'Responsável de Dados (RGPD) *'}</label><input required type="text" className={inputClass} value={form.responsavelRGPD} onChange={e => setForm({...form, responsavelRGPD: e.target.value})} placeholder={isEn ? "Officer's name" : "Nome do responsável"} /></div>
            </div>
            
            <p className="mt-6 italic text-center">{isEn ? '- hereinafter referred to as the "Partner" -' : '- doravante designado por "Parceiro" -'}</p>
            
            <div className="bg-emerald-50 border border-emerald-200 p-5 sm:p-8 my-8 font-sans rounded-xl shadow-inner">
              <label className="text-xs sm:text-sm font-bold text-emerald-900 block mb-3 uppercase tracking-widest">
                {isEn ? 'What is the name of your main program / summer camp? *' : 'Qual é o nome do seu programa principal / campo de férias? *'}
              </label>
              <input required type="text" className="w-full border-b-2 border-emerald-600 bg-transparent text-xl sm:text-2xl font-black text-emerald-900 outline-none placeholder:text-emerald-300 transition-colors focus:border-emerald-800 py-1" value={form.nomePrograma} onChange={e => setForm({...form, nomePrograma: e.target.value})} placeholder="Ex: Summer Surf Camp 2026" />
              <p className="text-xs sm:text-sm font-medium text-emerald-700 mt-4 leading-relaxed">
                {isEn ? 'This intermediation and commercial promotion contract is concluded for this specific program.' : 'É celebrado o presente contrato de intermediação e divulgação comercial para este programa específico.'}
              </p>
            </div>
          </div>

          <div className="space-y-6 text-sm md:text-[15px] text-justify pt-8 md:pt-12">
            <h3 className="font-bold text-lg md:text-xl uppercase tracking-widest border-b border-black pb-2 mb-6 md:mb-8">
              {isEn ? 'Contractual Clauses' : 'Cláusulas Contratuais'}
            </h3>
            
            <h4 className="font-bold">{isEn ? 'Article 1 – Commission' : 'Artigo 1.º – Comissão'}</h4>
            <p className="mb-4">
              {isEn 
                ? 'The Partner commits to paying HelloCamp a 12% commission (VAT not included) on each booking made through the platform, under the terms defined in this contract or a supplementary agreement.' 
                : 'O Parceiro compromete-se a pagar à HelloCamp uma comissão de 12% (iva não incluído) sobre cada reserva efetuada através da plataforma, nos termos definidos no presente contrato ou em acordo complementar celebrado entre as partes.'}
            </p>
            <p className="mb-4">
              {isEn 
                ? 'The commission is calculated on the amount actually paid by the client for the booked activity, including additional services contracted through the platform.' 
                : 'A comissão é calculada sobre o valor efetivamente pago pelo cliente relativamente à atividade reservada, incluindo serviços adicionais contratados através da plataforma.'}
            </p>
            <p className="mb-4">
              {isEn 
                ? 'The commission becomes due after the booking is confirmed by the Partner and the respective booking data is transmitted.' 
                : 'A comissão torna-se devida após a confirmação da reserva pelo Parceiro e a transmissão dos respetivos dados de reserva.'}
            </p>
            <p className="mb-4">
              {isEn 
                ? 'The Partner must send the client the booking confirmation and ensure the provision of the contracted services.' 
                : 'O Parceiro deverá enviar ao cliente a confirmação da reserva e assegurar a prestação dos serviços contratados.'}
            </p>
            <p className="mb-4">
              {isEn 
                ? 'If a booking cannot be fulfilled for justified reasons, the Partner must inform HelloCamp as soon as possible.' 
                : 'Caso uma reserva não possa ser realizada por motivos devidamente justificados, nomeadamente indisponibilidade da atividade ou não verificação das condições mínimas de realização, o Parceiro deverá informar a HelloCamp com a maior brevidade possível.'}
            </p>
            <p className="mb-8">
              {isEn 
                ? 'In case of cancellation by the client, the conditions set out in Annex 3 – Booking Cancellation will apply.' 
                : 'Em caso de cancelamento por iniciativa do cliente, aplicar-se-ão as condições previstas no Anexo 3 – Cancelamento de Reservas.'}
            </p>

            <h4 className="font-bold">{isEn ? 'Article 2 – Payment Conditions' : 'Artigo 2.º – Condições de Pagamento'}</h4>
            <p className="mb-8">
              {isEn 
                ? 'Commissions due to HelloCamp will be invoiced according to the agreed payment model. The Partner commits to settling invoices within the stated deadlines. Agreed amounts do not include VAT or other applicable taxes.' 
                : 'As comissões devidas à HelloCamp serão faturadas de acordo com o modelo de pagamento acordado entre as partes. O Parceiro compromete-se a liquidar as faturas emitidas pela HelloCamp dentro dos prazos nelas indicados. Os valores acordados não incluem IVA ou outros impostos legalmente aplicáveis.'}
            </p>

            <h4 className="font-bold">{isEn ? 'Article 3 – Partner Obligations' : 'Artigo 3.º – Obrigações do Parceiro'}</h4>
            <p className="mb-4">{isEn ? 'The Partner commits to providing HelloCamp with all necessary information to promote activities, including descriptions, prices, availability, photos, and relevant content.' : 'O Parceiro compromete-se a fornecer à HelloCamp todas as informações necessárias à divulgação das suas atividades, incluindo descrições, preços, disponibilidade, fotografias e demais conteúdos relevantes.'}</p>
            <p className="mb-4">{isEn ? 'The Partner guarantees they hold all necessary rights for the provided content, including copyrights and image rights.' : 'O Parceiro garante que possui todos os direitos necessários sobre os conteúdos disponibilizados à HelloCamp, incluindo direitos de autor, direitos de imagem e demais autorizações legalmente exigidas.'}</p>
            <p className="mb-4">{isEn ? 'HelloCamp may use the content provided by the Partner for promotion and marketing on the platform and communication channels.' : 'A HelloCamp poderá utilizar os conteúdos fornecidos pelo Parceiro para efeitos de promoção, comercialização e divulgação das atividades na plataforma e nos seus canais de comunicação.'}</p>
            <p className="mb-4">{isEn ? 'Prices advertised on HelloCamp must not exceed prices practiced by the Partner for direct bookings.' : 'Os preços divulgados na plataforma HelloCamp não poderão ser superiores aos preços praticados pelo Parceiro para reservas diretas da mesma atividade.'}</p>
            <p className="mb-4">{isEn ? 'The Partner commits to immediately informing HelloCamp of any changes regarding activities, prices, or conditions.' : 'O Parceiro compromete-se a informar imediatamente a HelloCamp de quaisquer alterações relativas às suas atividades, incluindo preços, disponibilidade, programas, condições de participação ou outros elementos relevantes.'}</p>
            <p className="mb-8">{isEn ? 'The Partner must notify HelloCamp of any changes to their general terms and conditions.' : 'O Parceiro deverá comunicar à HelloCamp quaisquer alterações aos seus termos e condições gerais ou às condições aplicáveis às atividades disponibilizadas na plataforma.'}</p>

            <h4 className="font-bold">{isEn ? 'Article 4 – Duration and Renewal' : 'Artigo 4.º – Duração e Renovação'}</h4>
            <p className="mb-8">{isEn ? 'This contract is effective from the date of signature by both parties until the end of the calendar year. It automatically renews for successive one-year periods unless terminated in writing at least 30 days prior.' : 'O presente contrato produz efeitos a partir da data da sua assinatura por ambas as partes. O contrato mantém-se válido até ao final do respetivo ano civil. O contrato será automaticamente renovado por períodos sucessivos de um ano, salvo denúncia por qualquer das partes. A intenção de não renovação deverá ser comunicada por escrito com uma antecedência mínima de 30 dias relativamente ao termo do período contratual em curso.'}</p>

            <h4 className="font-bold">{isEn ? 'Article 5 – Severability Clause' : 'Artigo 5.º – Cláusula de Separabilidade'}</h4>
            <p className="mb-8">{isEn ? 'The invalidity of any provision of this contract shall not affect the validity of the remaining clauses.' : 'A eventual invalidade, nulidade ou inaplicabilidade de qualquer disposição do presente contrato não prejudica a validade das restantes cláusulas, que permanecerão plenamente em vigor.'}</p>

            <h4 className="font-bold">{isEn ? 'Article 6 – Amendments' : 'Artigo 6.º – Alterações e Acordos Complementares'}</h4>
            <p className="mb-8">{isEn ? 'Any amendments to this contract must be made in writing in Annex 4 to be effective.' : 'Quaisquer alterações ao presente contrato ou acordos complementares celebrados entre a HelloCamp e o Parceiro deverão ser efetuados por escrito, no anexo 4, para produzirem efeitos.'}</p>

            <h4 className="font-bold">{isEn ? 'Article 7 – Limitation of Liability and Insurance' : 'Artigo 7.º – Limitação de Responsabilidade e Seguros'}</h4>
            <p className="mb-4">
              {isEn 
                ? 'HelloCamp acts exclusively as an intermediary booking platform. HelloCamp assumes no civil, criminal, or contractual liability for any accidents, damages, incidents, or disputes that may occur during the activities, involving participants, monitors, or third parties.' 
                : 'A HelloCamp atua exclusivamente como plataforma intermediária de reservas. A HelloCamp não assume qualquer responsabilidade civil, criminal ou contratual por eventuais acidentes, danos, incidentes ou disputas que ocorram durante a realização das atividades, envolvendo os participantes, monitores ou terceiros.'}
            </p>
            <p className="mb-8">
              {isEn 
                ? 'The Partner is solely and exclusively responsible for the provision of services and the safety of the participants, guaranteeing that they hold all legally mandatory insurance (including civil liability and personal accident), licenses, and certifications required to carry out their activity.' 
                : 'O Parceiro é o único e exclusivo responsável pela prestação dos serviços e pela segurança dos participantes, garantindo que possui todos os seguros obrigatórios por lei (incluindo responsabilidade civil e acidentes pessoais), licenças e certificações exigidas para o exercício da sua atividade.'}
            </p>

          </div>

          <div className="h-px bg-gray-300 w-full my-8 md:my-12"></div>

          {/* ANEXOS COM MÚLTIPLA ESCOLHA UNIFORMIZADA */}
          <div className="space-y-8 md:space-y-12 font-sans text-xs sm:text-sm text-slate-800">
            
            {/* ANEXO 1 - PROCEDIMENTO DE RESERVA */}
            <div className="bg-gray-50 p-5 md:p-6 rounded-xl border border-gray-200">
              <h3 className="font-black text-base sm:text-lg mb-4 text-black uppercase border-l-4 border-[#EBA914] pl-3">
                {isEn ? 'Annex 1 – Booking Procedure' : 'Anexo 1 – Procedimento de Reserva'}
              </h3>
              <p className="mb-6">{isEn ? 'Select the booking management modality applicable to your partnership.' : 'Selecione a modalidade de gestão de reservas aplicável à sua parceria com a HelloCamp.'}</p>
              
              <div className="space-y-3">
                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.modalidadeReserva === 'direta' ? 'bg-white border-black shadow-sm' : 'border-transparent hover:bg-gray-100'}`}>
                  <input type="radio" name="anexo1" required value="direta" checked={form.modalidadeReserva === 'direta'} onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1 w-4 h-4 accent-black flex-shrink-0" />
                  <div>
                    <strong className="block text-black mb-1">{isEn ? 'Direct Booking with Automatic Payment (Recommended)' : 'Reserva Direta com Pagamento Automático (Recomendado)'}</strong>
                    <span className="text-gray-600 leading-relaxed block">{isEn ? 'Bookings made through HelloCamp will be registered directly in the Partner\'s system. HelloCamp is entitled to the agreed commission on each completed booking.' : 'As reservas efetuadas através da plataforma HelloCamp serão registadas diretamente no sistema de reservas do Parceiro. Nesta modalidade, a HelloCamp terá direito à comissão acordada sobre cada reserva concluída. O formulário de reserva será configurado de acordo com as necessidades do Parceiro, recolhendo as informações necessárias para a correta gestão das inscrições. O Parceiro compromete-se a manter atualizadas as disponibilidades, preços e demais informações relevantes das atividades disponibilizadas através da plataforma.'}</span>
                  </div>
                </label>

                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.modalidadeReserva === 'email' ? 'bg-white border-black shadow-sm' : 'border-transparent hover:bg-gray-100'}`}>
                  <input type="radio" name="anexo1" required value="email" checked={form.modalidadeReserva === 'email'} onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1 w-4 h-4 accent-black flex-shrink-0" />
                  <div>
                    <strong className="block text-black mb-1">{isEn ? 'Email Communication (Booking Upon Request)' : 'Comunicação por E-mail (Reserva Sob Consulta)'}</strong>
                    <span className="text-gray-600 leading-relaxed block">{isEn ? 'HelloCamp will send the Partner an email with all necessary booking details. The Partner has 2 business days to reject a booking. Without a response, it is considered accepted.' : 'A HelloCamp enviará ao Parceiro, por correio eletrónico, todas as informações necessárias para a gestão da reserva, incluindo os dados do participante, os dados do responsável pela reserva e os detalhes da atividade reservada. O Parceiro dispõe de 2 (dois) dias úteis para comunicar à HelloCamp a rejeição de uma reserva por motivo devidamente justificado. Na ausência de resposta dentro deste prazo, a reserva considerar-se-á aceite, sendo aplicável a comissão prevista no contrato.'}</span>
                  </div>
                </label>
              </div>
            </div>

            {/* ANEXO 2 - PAGAMENTOS E FATURAÇÃO */}
            <div className="bg-blue-50 p-5 md:p-6 rounded-xl border border-blue-100">
              <h3 className="font-black text-base sm:text-lg mb-4 text-blue-950 uppercase border-l-4 border-blue-600 pl-3">
                {isEn ? 'Annex 2 – Payment and Commission' : 'Anexo 2 – Pagamento e Comissão'}
              </h3>
              <p className="mb-6 text-blue-900 leading-relaxed">
                {isEn ? 'The Partner authorizes HelloCamp to collect a deposit during the booking process via Stripe. The deposit generally corresponds to HelloCamp’s commission plus VAT. The remaining balance is paid directly to the Partner.' : 'O Parceiro autoriza a HelloCamp a receber um depósito durante o processo de reserva efetuado através da plataforma Stripe. O valor do depósito corresponde, regra geral, à comissão devida à HelloCamp pela reserva efetuada, acrescida de IVA à taxa legal em vigor. Quaisquer condições específicas ou montantes adicionais deverão constar de acordo complementar entre as partes. Após a confirmação da reserva, o cliente efetua o pagamento do depósito à HelloCamp, sendo o valor remanescente pago diretamente ao Parceiro, de acordo com as condições definidas para a atividade. O Parceiro é responsável pelo envio ao cliente da confirmação da reserva, da respetiva fatura, dos documentos informativos legalmente exigidos e de quaisquer elementos necessários à participação na atividade. No final de cada período de faturação acordado, a HelloCamp emitirá a fatura correspondente às comissões devidas, deduzindo os montantes já recebidos a título de depósito.'}
              </p>
              
              <div className="space-y-3">
                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.tipo_pagamento === '100_total' ? 'bg-white border-blue-600 shadow-sm' : 'border-transparent hover:bg-blue-100/50'}`}>
                  <input type="radio" name="anexo2" required value="100_total" checked={form.tipo_pagamento === '100_total'} onChange={e => setForm({...form, tipo_pagamento: e.target.value})} className="mt-1 w-4 h-4 accent-blue-600 flex-shrink-0" />
                  <div>
                    <strong className="block text-blue-950 mb-1">{isEn ? '100% Paid at Booking (Immediate Payment)' : '100% Pago no Ato da Reserva (Pagamento Imediato)'}</strong>
                    <span className="text-blue-800 leading-relaxed block">{isEn ? 'The client pays the full program amount immediately.' : 'O cliente liquida a totalidade do valor do programa para assegurar a vaga de imediato.'}</span>
                  </div>
                </label>

                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.tipo_pagamento === '50_sinal' ? 'bg-white border-blue-600 shadow-sm' : 'border-transparent hover:bg-blue-100/50'}`}>
                  <input type="radio" name="anexo2" required value="50_sinal" checked={form.tipo_pagamento === '50_sinal'} onChange={e => setForm({...form, tipo_pagamento: e.target.value})} className="mt-1 w-4 h-4 accent-blue-600 flex-shrink-0" />
                  <div>
                    <strong className="block text-blue-950 mb-1">{isEn ? '50% Deposit Now + 50% One Week Before' : 'Sinal de 50% Agora + 50% 1 Semana Antes'}</strong>
                    <span className="text-blue-800 leading-relaxed block">{isEn ? 'The platform automatically charges the second half 7 days prior.' : 'A plataforma debitará automaticamente a segunda metade do cartão do cliente 7 dias antes do início do programa.'}</span>
                  </div>
                </label>
              </div>
            </div>

            {/* ANEXO 3 - POLÍTICA DE CANCELAMENTO */}
            <div className="bg-amber-50 p-5 md:p-6 rounded-xl border border-amber-100">
              <h3 className="font-black text-base sm:text-lg mb-4 text-amber-950 uppercase border-l-4 border-amber-500 pl-3">
                {isEn ? 'Annex 3 – Cancellation and Refund Policy' : 'Anexo 3 – Política de Cancelamento e Reembolso'}
              </h3>
              <p className="mb-6 text-amber-900 leading-relaxed">
                {isEn ? 'The selected option sets refund rules for parents. HelloCamp’s commission adjusts proportionally to the amount retained.' : 'A opção selecionada ditará as regras de reembolso para os pais na plataforma. A comissão devida à HelloCamp será sempre ajustada proporcionalmente ao montante que o Parceiro retiver do cliente em caso de desistência.'}
              </p>
              
              <div className="space-y-3">
                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.politica_cancelamento === 'Flexível (Reembolso a 100% até 7 dias antes)' ? 'bg-white border-amber-500 shadow-sm' : 'border-transparent hover:bg-amber-100/50'}`}>
                  <input type="radio" name="anexo3" required value="Flexível (Reembolso a 100% até 7 dias antes)" checked={form.politica_cancelamento === 'Flexível (Reembolso a 100% até 7 dias antes)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600 flex-shrink-0" />
                  <div>
                    <strong className="block text-amber-950 mb-1">{isEn ? 'Flexible (100% refund up to 7 days prior)' : 'Flexível (Reembolso a 100% até 7 dias antes)'}</strong>
                    <span className="text-amber-800 leading-relaxed block text-xs sm:text-sm">
                      {isEn ? 'HelloCamp will not charge commission on canceled bookings if canceled 7 days before start.' : 'A HelloCamp não cobrará qualquer comissão sobre reservas canceladas pelo cliente. O Parceiro compromete-se a não aplicar quaisquer custos de cancelamento ao cliente, desde que o pedido seja comunicado até 7 (sete) dias antes do início da atividade. Os montantes pagos deverão ser reembolsados no prazo máximo de 30 dias. Cancelamentos após este prazo não conferem direito a reembolso, sendo a comissão integral devida à HelloCamp.'}
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.politica_cancelamento === 'Moderada (Reembolso a 50% até 15 dias antes)' ? 'bg-white border-amber-500 shadow-sm' : 'border-transparent hover:bg-amber-100/50'}`}>
                  <input type="radio" name="anexo3" required value="Moderada (Reembolso a 50% até 15 dias antes)" checked={form.politica_cancelamento === 'Moderada (Reembolso a 50% até 15 dias antes)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600 flex-shrink-0" />
                  <div>
                    <strong className="block text-amber-950 mb-1">{isEn ? 'Moderate (50% refund up to 15 days prior)' : 'Moderada (Reembolso a 50% até 15 dias antes)'}</strong>
                    <span className="text-amber-800 leading-relaxed block text-xs sm:text-sm">
                      {isEn ? 'If canceled 15 days prior, client receives 50% refund. HelloCamp commission is reduced proportionally.' : 'A comissão da HelloCamp é considerada devida após a confirmação. Em caso de cancelamento até 15 dias antes do início, o cliente recebe 50% do valor pago. Nestas situações, a comissão da HelloCamp será reduzida proporcionalmente ao valor efetivamente retido pelo Parceiro a título de cancelamento. Cancelamentos após este prazo não conferem direito a reembolso.'}
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.politica_cancelamento === 'Estrita (Sem reembolso após reserva)' ? 'bg-white border-amber-500 shadow-sm' : 'border-transparent hover:bg-amber-100/50'}`}>
                  <input type="radio" name="anexo3" required value="Estrita (Sem reembolso após reserva)" checked={form.politica_cancelamento === 'Estrita (Sem reembolso após reserva)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600 flex-shrink-0" />
                  <div>
                    <strong className="block text-amber-950 mb-1">{isEn ? 'Strict (No refunds after booking)' : 'Estrita (Sem reembolso após reserva)'}</strong>
                    <span className="text-amber-800 leading-relaxed block text-xs sm:text-sm">
                      {isEn ? 'Bookings are final. HelloCamp commission is due in full as the Partner’s revenue is guaranteed.' : 'As reservas efetuadas são finais e não reembolsáveis em caso de cancelamento por iniciativa do cliente. A comissão da HelloCamp é devida na sua totalidade independentemente de o cliente comparecer ou não à atividade, uma vez que a receita do Parceiro fica inteiramente garantida.'}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* ANEXO 4 */}
            <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200">
              <h3 className="font-black text-base sm:text-lg mb-4 text-black uppercase border-l-4 border-gray-400 pl-3">
                {isEn ? 'Annex 4 – Extraordinary Agreements' : 'Anexo 4 – Acordos Extraordinários'}
              </h3>
              <p className="mb-3 text-gray-700 font-medium">
                {isEn ? 'We have agreed to the following amendments:' : 'Acordámos as seguintes alterações ao contrato-modelo:'}
              </p>
              <textarea 
                className="w-full border border-gray-300 p-3 sm:p-4 rounded-lg bg-gray-50 outline-none focus:border-black transition-all text-sm md:text-base" 
                rows={3} 
                value={form.acordosComplementares} 
                onChange={e => setForm({...form, acordosComplementares: e.target.value})}
                placeholder={isEn ? "Insert pre-agreed exception clauses, or leave blank." : "Insira as cláusulas de exceção pré-acordadas, ou deixe em branco."}
              ></textarea>
            </div>

          </div>

          {/* ZONA DE ASSINATURAS FINAIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mt-12 md:mt-16 pt-8 md:pt-12 border-t-2 border-black font-sans">
            <div>
              <h4 className="font-black mb-4 sm:mb-6 uppercase tracking-wider text-black text-xs sm:text-sm">{isEn ? 'For HelloCamp' : 'Pela HelloCamp'}</h4>
              <p className="font-serif text-lg sm:text-xl italic text-gray-500 mb-2">{isEn ? 'HelloCamp Administration' : 'Administração HelloCamp'}</p>
              <p className="text-xs sm:text-sm font-medium border-t border-gray-200 mt-4 sm:mt-6 pt-3 sm:pt-4">{isEn ? 'Date:' : 'Data:'} {dataAtual}</p>
            </div>

            <div>
              <h4 className="font-black mb-4 sm:mb-6 uppercase tracking-wider text-black text-xs sm:text-sm">{isEn ? 'For the Partner' : 'Pelo Parceiro'}</h4>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-[10px] sm:text-xs font-bold uppercase mb-1 text-gray-500">{isEn ? 'Digital Signature Name *' : 'Nome da Assinatura Digital *'}</label>
                  <input required type="text" className="border-b-2 border-black bg-transparent outline-none py-2 text-lg sm:text-xl font-serif italic text-base focus:border-[#EBA914] transition-colors" value={form.assinaturaNome} onChange={e => setForm({...form, assinaturaNome: e.target.value})} placeholder={isEn ? "Signatory's name" : "Nome de quem assina"} />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] sm:text-xs font-bold uppercase mb-1 text-gray-500">{isEn ? 'Role / Position *' : 'Cargo *'}</label>
                  <input required type="text" className="border-b border-gray-300 bg-transparent outline-none py-2 text-base focus:border-black transition-colors" value={form.assinaturaCargo} onChange={e => setForm({...form, assinaturaCargo: e.target.value})} placeholder={isEn ? "Ex: Managing Partner" : "Ex: Sócio-Gerente"} />
                </div>
                <p className="text-xs sm:text-sm font-medium border-t border-gray-200 mt-4 sm:mt-6 pt-3 sm:pt-4">{isEn ? 'Date:' : 'Data:'} {dataAtual}</p>
              </div>

              <div className="mt-6 md:mt-8 bg-gray-50 p-4 border border-gray-200 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" required checked={form.concordaTermos} onChange={e => setForm({...form, concordaTermos: e.target.checked})} className="mt-1 w-5 h-5 accent-black cursor-pointer flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed group-hover:text-black transition-colors">
                    {isEn 
                      ? 'I declare that I have read and accepted the terms. I confirm I have the legal authority to bind the entity identified above through this digital signature.' 
                      : 'Declaro ter lido e aceite os termos. Confirmo possuir poderes legais para vincular a entidade supra identificada através desta assinatura digital.'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* CRIAÇÃO DA CONTA B2B */}
          <div className="bg-slate-900 p-6 md:p-8 rounded-2xl text-white font-sans mt-12 md:mt-16 shadow-2xl relative overflow-hidden">
            <h3 className="text-xl sm:text-2xl font-black mb-2 relative z-10">{isEn ? 'Final Step: Access Account' : 'Último Passo: Conta de Acesso'}</h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 md:mb-8 relative z-10">{isEn ? 'Define your credentials to access your Organizer Dashboard.' : 'Defina as credenciais para aceder ao seu Dashboard de Organizador e gerir este campo.'}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 relative z-10">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{isEn ? 'Login Email (Access) *' : 'Email de Login (Acesso) *'}</label>
                <input type="email" required value={auth.emailAcesso} onChange={e => setAuth({...auth, emailAcesso: e.target.value})} className="w-full p-3 sm:p-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-base outline-none focus:border-[#EBA914] transition-colors" placeholder="geral@suaempresa.pt" />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{isEn ? 'Define a Password *' : 'Defina uma Password *'}</label>
                <input type="password" required minLength={6} value={auth.passwordAcesso} onChange={e => setAuth({...auth, passwordAcesso: e.target.value})} className="w-full p-3 sm:p-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-base outline-none focus:border-[#EBA914] transition-colors" placeholder={isEn ? "Minimum 6 characters" : "Mínimo 6 caracteres"} />
              </div>
            </div>

            <div className="pt-6 mt-6 md:pt-8 md:mt-8 border-t border-slate-700 flex justify-end relative z-10">
              <button type="submit" disabled={loading || !form.concordaTermos} className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold px-6 sm:px-10 py-3 sm:py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1 cursor-pointer w-full md:w-auto text-base sm:text-lg border border-emerald-400">
                {loading 
                  ? (isEn ? 'Creating secure environment...' : 'A criar ambiente seguro...') 
                  : (isEn ? 'Sign Contract and Create Account' : 'Assinar Contrato e Criar Conta')}
              </button>
            </div>
          </div>

        </form>
      </div>
    </main>
  );
}