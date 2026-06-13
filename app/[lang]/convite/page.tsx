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
    modalidadeReserva: "", // Anexo 1
    tipo_pagamento: "", // Anexo 2
    politica_cancelamento: "", // Anexo 3
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
      alert("Por favor, selecione as opções obrigatórias nos Anexos 1, 2 e 3.");
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
      alert("Erro ao criar conta: " + (authError?.message || "Desconhecido"));
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
      ipAssinatura: "Capturado via Registo Unificado"
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
          
          <div className="text-center mb-16">
            <div className="text-4xl font-black tracking-tighter mb-8 font-sans">
              <span className="text-black">Hello</span><span className="text-[#EBA914]">Camp</span>
            </div>
            <h1 className="text-2xl font-bold uppercase mb-2 tracking-widest border-b-2 border-black inline-block pb-2">
              Contrato de Intermediação – HelloCamp
            </h1>
            <p className="text-base italic text-gray-600 mt-4">O seu contrato de parceria com a HelloCamp, explicado de forma simples e objetiva.</p>
          </div>

          <div className="space-y-12 mb-16 font-sans">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">📝</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">1. Celebração do contrato</h3>
                <p className="text-slate-600 text-justify leading-relaxed">Parabéns! Celebrou um contrato de parceria com a HelloCamp. Este contrato regula a divulgação e a intermediação das suas ofertas através da plataforma HelloCamp.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">🏖️</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">2. Divulgação das ofertas</h3>
                <p className="text-slate-600 text-justify leading-relaxed">Após a celebração do contrato, a HelloCamp procede à recolha e organização das informações relativas às atividades disponibilizadas pelo parceiro, publicando as respetivas páginas.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">💻</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">3. Reservas através da HelloCamp</h3>
                <p className="text-slate-600 text-justify leading-relaxed">As reservas efetuadas serão comunicadas ao parceiro com os dados logísticos do cliente, competindo ao parceiro manter as vagas atualizadas.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-slate-900 text-white border border-slate-700 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">€</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">4. Pagamento da Comissão</h3>
                <p className="text-slate-600 text-justify leading-relaxed">A HelloCamp cobra uma comissão sobre cada reserva concluída. O modelo de pagamento dependerá das opções escolhidas nos Anexos deste contrato.</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-300 w-full my-12"></div>

          <div className="space-y-4 font-serif text-[15px]">
            <h2 className="text-xl font-bold text-center uppercase tracking-widest mb-8">Acordo de Prestação de Serviços</h2>
            <p>Entre a <strong>HelloCamp</strong>, com website em www.hellocamp.pt, doravante designada por "Primeiro Outorgante"; e do outro lado:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mt-8 bg-gray-50 p-8 border border-gray-200 rounded-lg">
              <div className="flex flex-col md:col-span-2"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Nome da Empresa (Faturação) *</label><input required type="text" className={inputClass} value={form.nomeEmpresa} onChange={e => setForm({...form, nomeEmpresa: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">NIF *</label><input required type="text" className={inputClass} value={form.nif} onChange={e => setForm({...form, nif: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Forma Jurídica *</label><input required type="text" className={inputClass} value={form.formaJuridica} onChange={e => setForm({...form, formaJuridica: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Pessoa de Contacto *</label><input required type="text" className={inputClass} value={form.pessoaContacto} onChange={e => setForm({...form, pessoaContacto: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Número de Telefone *</label><input required type="text" className={inputClass} value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} /></div>
              <div className="flex flex-col md:col-span-2"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Morada Fiscal *</label><input required type="text" className={inputClass} value={form.morada} onChange={e => setForm({...form, morada: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Código Postal e Cidade *</label><input required type="text" className={inputClass} value={form.codigoPostal} onChange={e => setForm({...form, codigoPostal: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">E-mail Comercial *</label><input required type="email" className={inputClass} value={form.emailContacto} onChange={e => setForm({...form, emailContacto: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">E-mail para Reservas *</label><input required type="email" className={inputClass} value={form.emailReservas} onChange={e => setForm({...form, emailReservas: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Website (Opcional)</label><input type="text" className={inputClass} value={form.website} onChange={e => setForm({...form, website: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Responsável de Dados (RGPD) *</label><input required type="text" className={inputClass} value={form.responsavelRGPD} onChange={e => setForm({...form, responsavelRGPD: e.target.value})} /></div>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-200 p-8 my-8 font-sans rounded-xl shadow-inner">
              <label className="text-sm font-bold text-emerald-900 block mb-3 uppercase tracking-widest">Nome do programa principal / campo de férias *</label>
              <input required type="text" className="w-full border-b-2 border-emerald-600 bg-transparent text-2xl font-black text-emerald-900 outline-none placeholder:text-emerald-300 transition-colors focus:border-emerald-800" value={form.nomePrograma} onChange={e => setForm({...form, nomePrograma: e.target.value})} placeholder="Ex: Summer Surf Camp 2026" />
            </div>
          </div>

          <div className="space-y-6 text-[15px] text-justify pt-8">
            <h3 className="font-bold text-xl uppercase tracking-widest border-b border-black pb-2 mb-6">Cláusulas Contratuais</h3>
            <p><strong>Art. 1º</strong> O Parceiro paga 12% (+ IVA) de comissão por cada reserva através da plataforma.</p>
            <p><strong>Art. 2º</strong> Os pagamentos seguem o estipulado no Anexo 2 via retenção Stripe ou gestão externa.</p>
            <p><strong>Art. 3º</strong> O Parceiro assegura responsabilidade civil e pratica paridade de preços com a plataforma.</p>
            <p><strong>Art. 4º</strong> O contrato vigora até final do ano civil e renova-se automaticamente.</p>
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
                    <span className="text-gray-600 leading-relaxed block">As reservas são processadas em tempo real via Stripe. O Parceiro acede a todos os dados do participante no seu Dashboard.</span>
                  </div>
                </label>

                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.modalidadeReserva === 'email' ? 'bg-white border-black shadow-sm' : 'border-transparent hover:bg-gray-100'}`}>
                  <input type="radio" name="anexo1" required value="email" checked={form.modalidadeReserva === 'email'} onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1 w-4 h-4 accent-black" />
                  <div>
                    <strong className="block text-black mb-1">Comunicação por E-mail (Reserva Sob Consulta)</strong>
                    <span className="text-gray-600 leading-relaxed block">A HelloCamp recolhe os dados e envia um e-mail. O Parceiro contacta a família para prosseguir com o pagamento externamente.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* ANEXO 2 - PAGAMENTOS E FATURAÇÃO */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h3 className="font-black text-lg mb-4 text-blue-950 uppercase border-l-4 border-blue-600 pl-3">Anexo 2 – Condições de Cobrança aos Pais</h3>
              <p className="mb-6 text-blue-900">Selecione o modelo de cobrança que será exigido aos pais no ato de inscrição.</p>
              
              <div className="space-y-3">
                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.tipo_pagamento === '100_total' ? 'bg-white border-blue-600 shadow-sm' : 'border-transparent hover:bg-blue-100/50'}`}>
                  <input type="radio" name="anexo2" required value="100_total" checked={form.tipo_pagamento === '100_total'} onChange={e => setForm({...form, tipo_pagamento: e.target.value})} className="mt-1 w-4 h-4 accent-blue-600" />
                  <div>
                    <strong className="block text-blue-950 mb-1">100% Pago no Ato da Reserva (Pagamento Imediato)</strong>
                    <span className="text-blue-800 leading-relaxed block">O cliente liquida a totalidade do valor do programa para assegurar a vaga.</span>
                  </div>
                </label>

                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.tipo_pagamento === '50_sinal' ? 'bg-white border-blue-600 shadow-sm' : 'border-transparent hover:bg-blue-100/50'}`}>
                  <input type="radio" name="anexo2" required value="50_sinal" checked={form.tipo_pagamento === '50_sinal'} onChange={e => setForm({...form, tipo_pagamento: e.target.value})} className="mt-1 w-4 h-4 accent-blue-600" />
                  <div>
                    <strong className="block text-blue-950 mb-1">Sinal de 50% Agora + 50% 1 Semana Antes</strong>
                    <span className="text-blue-800 leading-relaxed block">A plataforma debitará automaticamente a segunda metade do cartão 7 dias antes.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* ANEXO 3 - POLÍTICA DE CANCELAMENTO (FUNDIDA) */}
            <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
              <h3 className="font-black text-lg mb-4 text-amber-950 uppercase border-l-4 border-amber-500 pl-3">Anexo 3 – Política de Cancelamento</h3>
              <p className="mb-6 text-amber-900">A comissão devida à HelloCamp ajusta-se proporcionalmente ao montante retido pelo Parceiro.</p>
              
              <div className="space-y-3">
                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.politica_cancelamento === 'Flexível (Reembolso a 100% até 7 dias antes)' ? 'bg-white border-amber-500 shadow-sm' : 'border-transparent hover:bg-amber-100/50'}`}>
                  <input type="radio" name="anexo3" required value="Flexível (Reembolso a 100% até 7 dias antes)" checked={form.politica_cancelamento === 'Flexível (Reembolso a 100% até 7 dias antes)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600" />
                  <div>
                    <strong className="block text-amber-950 mb-1">Flexível (Reembolso a 100% até 7 dias antes)</strong>
                    <span className="text-amber-800 leading-relaxed block text-sm">Devolução integral se cancelado até 7 dias antes. A HelloCamp isenta a comissão nestes casos.</span>
                  </div>
                </label>

                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.politica_cancelamento === 'Moderada (Reembolso a 50% até 15 dias antes)' ? 'bg-white border-amber-500 shadow-sm' : 'border-transparent hover:bg-amber-100/50'}`}>
                  <input type="radio" name="anexo3" required value="Moderada (Reembolso a 50% até 15 dias antes)" checked={form.politica_cancelamento === 'Moderada (Reembolso a 50% até 15 dias antes)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600" />
                  <div>
                    <strong className="block text-amber-950 mb-1">Moderada (Reembolso a 50% até 15 dias antes)</strong>
                    <span className="text-amber-800 leading-relaxed block text-sm">O cliente recebe 50% do valor caso cancele atempadamente. A HelloCamp comissiona sobre a metade retida.</span>
                  </div>
                </label>

                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.politica_cancelamento === 'Estrita (Sem reembolso após reserva)' ? 'bg-white border-amber-500 shadow-sm' : 'border-transparent hover:bg-amber-100/50'}`}>
                  <input type="radio" name="anexo3" required value="Estrita (Sem reembolso após reserva)" checked={form.politica_cancelamento === 'Estrita (Sem reembolso após reserva)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600" />
                  <div>
                    <strong className="block text-amber-950 mb-1">Estrita (Sem reembolso após reserva)</strong>
                    <span className="text-amber-800 leading-relaxed block text-sm">Reservas finais. Sem reembolso ao cliente. Comissão retida na totalidade.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="font-black text-lg mb-4 text-black uppercase border-l-4 border-gray-400 pl-3">Anexo 4 – Acordos Extraordinários</h3>
              <textarea className="w-full border border-gray-300 p-4 rounded-lg bg-gray-50 outline-none focus:border-black transition-all" rows={2} value={form.acordosComplementares} onChange={e => setForm({...form, acordosComplementares: e.target.value})} placeholder="Insira as cláusulas pré-acordadas..."></textarea>
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
              </div>

              <div className="mt-8 bg-gray-50 p-4 border border-gray-200 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" required checked={form.concordaTermos} onChange={e => setForm({...form, concordaTermos: e.target.checked})} className="mt-1 w-5 h-5 accent-black cursor-pointer flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium leading-relaxed group-hover:text-black transition-colors">Declaro ter lido e aceite os termos.</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-2xl text-white font-sans mt-16 shadow-2xl relative overflow-hidden">
            <h3 className="text-2xl font-black mb-2">Último Passo: Conta de Acesso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email de Login *</label>
                <input type="email" required value={auth.emailAcesso} onChange={e => setAuth({...auth, emailAcesso: e.target.value})} className="w-full p-4 bg-slate-800 rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Password *</label>
                <input type="password" required minLength={6} value={auth.passwordAcesso} onChange={e => setAuth({...auth, passwordAcesso: e.target.value})} className="w-full p-4 bg-slate-800 rounded-xl" />
              </div>
            </div>
            <div className="pt-8 mt-8 flex justify-end">
              <button type="submit" disabled={loading || !form.concordaTermos} className="bg-emerald-600 text-white font-bold px-10 py-4 rounded-xl">
                {loading ? 'A criar...' : 'Assinar Contrato e Criar Conta'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </main>
  );
}