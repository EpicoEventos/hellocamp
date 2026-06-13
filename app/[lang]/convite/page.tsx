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
  
  // Dados da Empresa e Contrato
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
    iban: "",
    modalidadeReserva: "", 
    modalidadeCancelamento: "",
    acordosComplementares: "",
    assinaturaNome: "",
    assinaturaCargo: "",
    concordaTermos: false
  });

  // Dados de Autenticação (Para criar a conta na hora)
  const [auth, setAuth] = useState({
    emailAcesso: "",
    passwordAcesso: ""
  });

  const handleSubmeterTudo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.modalidadeReserva || !form.modalidadeCancelamento) {
      alert("Por favor, selecione as opções nos Anexos 1 e 3.");
      return;
    }
    if (form.assinaturaNome.trim().toLowerCase() !== form.pessoaContacto.trim().toLowerCase()) {
      alert("A assinatura digital deve corresponder exatamente ao nome da Pessoa de Contacto inserida.");
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

    if (authError) {
      alert("Erro ao criar conta: " + authError.message);
      setLoading(false);
      return;
    }

    // 2. Se o Auth funcionou, aguardamos 1 segundo para o Trigger do Supabase criar o Perfil
    await new Promise(resolve => setTimeout(resolve, 1000));

    const payloadContrato = {
      ...form,
      dataSubmissao: new Date().toISOString(),
      ipAssinatura: "Capturado via Registo Unificado"
    };

    // 3. Criar o 1º Campo do parceiro com o contrato já anexado e pendente
    const { error: campoError } = await supabase
      .from('campos')
      .insert([
        {
          nome: form.nomePrograma,
          organizador_id: authData.user?.id,
          contrato_dados: payloadContrato,
          status_aprovacao: 'Pendente de Revisão',
          ativo: false
        }
      ]);

    if (campoError) {
      alert("Conta criada, mas houve um erro ao anexar o contrato. Contacte o suporte.");
    } else {
      alert("Contrato assinado e conta criada com sucesso! Verifique o seu email para ativar a conta.");
      router.push(`/${lang}/admin/login`);
    }
    setLoading(false);
  };

  const inputClass = "border-b border-black outline-none bg-transparent px-1 font-bold text-black min-w-[250px] placeholder:font-normal placeholder:text-gray-400 w-full";
  const dataAtual = new Date().toLocaleDateString('pt-PT');

  return (
    <main className="min-h-screen bg-slate-100 py-12 px-4 font-sans text-black">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-10 text-center">
          <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">Convite Exclusivo</span>
          <h1 className="text-4xl font-black tracking-tight mt-6">Bem-vindo à HelloCamp</h1>
          <p className="text-slate-600 font-medium mt-3 max-w-2xl mx-auto">Preencha o contrato B2B abaixo. No final do documento, irá definir os seus dados de acesso ao painel de controlo.</p>
        </div>

        <form onSubmit={handleSubmeterTudo} className="bg-white shadow-2xl p-8 md:p-16 font-serif text-black leading-relaxed space-y-8 rounded-2xl">
          
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold uppercase mb-2">Contrato de Intermediação</h2>
          </div>

          <div className="space-y-4 text-sm bg-gray-50 p-6 border border-gray-200 font-sans">
            <h3 className="font-bold uppercase">1. Celebração do contrato</h3>
            <p>Parabéns! Celebrou um contrato de parceria com a HelloCamp. Este contrato regula a divulgação e a intermediação das suas ofertas através da plataforma HelloCamp...</p>
            {/* Omitido texto extenso igual para poupar espaço, mantenha o seu texto original aqui */}
          </div>

          <hr className="border-black my-8" />

          <div className="space-y-4">
            <p>Entre: <strong>HelloCamp</strong> (Website: www.hellocamp.pt | E-mail: info@hellocamp.pt)</p>
            <p>E</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6 mt-6 bg-slate-50 p-6 border border-slate-200 font-sans">
              <div className="flex flex-col"><label className="text-xs font-bold text-slate-500 uppercase">Nome da Empresa *</label><input required type="text" className={inputClass} value={form.nomeEmpresa} onChange={e => setForm({...form, nomeEmpresa: e.target.value})} placeholder="Ex: Aventuras Lda." /></div>
              <div className="flex flex-col"><label className="text-xs font-bold text-slate-500 uppercase">NIF da Entidade *</label><input required type="text" className={inputClass} value={form.nif} onChange={e => setForm({...form, nif: e.target.value})} placeholder="500..." /></div>
              <div className="flex flex-col"><label className="text-xs font-bold text-slate-500 uppercase">Pessoa de Contacto *</label><input required type="text" className={inputClass} value={form.pessoaContacto} onChange={e => setForm({...form, pessoaContacto: e.target.value})} placeholder="Nome de quem assina" /></div>
              <div className="flex flex-col"><label className="text-xs font-bold text-slate-500 uppercase">Forma Jurídica *</label><input required type="text" className={inputClass} value={form.formaJuridica} onChange={e => setForm({...form, formaJuridica: e.target.value})} placeholder="Ex: Lda, Unipessoal, Associação" /></div>
              <div className="flex flex-col md:col-span-2"><label className="text-xs font-bold text-slate-500 uppercase">Morada *</label><input required type="text" className={inputClass} value={form.morada} onChange={e => setForm({...form, morada: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold text-slate-500 uppercase">Código Postal e Cidade *</label><input required type="text" className={inputClass} value={form.codigoPostal} onChange={e => setForm({...form, codigoPostal: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold text-slate-500 uppercase">Número de Telefone *</label><input required type="text" className={inputClass} value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold text-slate-500 uppercase">E-mail de Contacto Comercial *</label><input required type="email" className={inputClass} value={form.emailContacto} onChange={e => setForm({...form, emailContacto: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold text-slate-500 uppercase">E-mail para Alertas de Reservas *</label><input required type="email" className={inputClass} value={form.emailReservas} onChange={e => setForm({...form, emailReservas: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold text-slate-500 uppercase">Website *</label><input required type="text" className={inputClass} value={form.website} onChange={e => setForm({...form, website: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold text-slate-500 uppercase">IBAN para Pagamentos *</label><input required type="text" className={inputClass} value={form.iban} onChange={e => setForm({...form, iban: e.target.value})} placeholder="PT50..." /></div>
            </div>

            <p className="mt-4 italic">-doravante designado por "Parceiro"-</p>
            
            <div className="bg-emerald-50 border border-emerald-200 p-6 my-6 font-sans">
              <label className="text-sm font-bold text-emerald-900 block mb-2">Qual é o nome do seu programa principal / campo de férias? *</label>
              <input required type="text" className="w-full border-b-2 border-emerald-600 bg-transparent text-xl font-black text-emerald-900 outline-none placeholder:text-emerald-300" value={form.nomePrograma} onChange={e => setForm({...form, nomePrograma: e.target.value})} placeholder="Ex: Summer Surf Camp 2026" />
              <p className="text-xs text-emerald-700 mt-2">É celebrado o presente contrato de intermediação para este programa.</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-bold text-lg underline">Cláusulas Contratuais</h3>
            {/* Colar as cláusulas de 1 a 6 iguais ao outro ficheiro */}
            <p className="text-sm text-gray-600">[Cláusulas 1 a 6 conforme documento legal...]</p>
          </div>

          {/* ANEXOS (Radios de Escolha) */}
          <div className="space-y-8 mt-12 pt-12 border-t border-black font-sans">
            <div className="bg-gray-50 p-6 border border-gray-300">
              <h3 className="font-bold text-lg mb-4">Anexo 1 – Procedimento de Reserva</h3>
              <label className="flex items-start gap-3 mb-4 cursor-pointer">
                <input type="radio" name="anexo1" required value="email" onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1" />
                <span className="text-sm"><strong className="block">Comunicação por E-mail:</strong> A HelloCamp enviará os dados por correio eletrónico...</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="anexo1" required value="direta" onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1" />
                <span className="text-sm"><strong className="block">Reserva Direta:</strong> Acesso em tempo real pelo Dashboard (Recomendado)...</span>
              </label>
            </div>
            
            <div className="bg-gray-50 p-6 border border-gray-300">
              <h3 className="font-bold text-lg mb-4">Anexo 3 – Cancelamento</h3>
              <label className="flex items-start gap-3 mb-4 cursor-pointer">
                <input type="radio" name="anexo3" required value="gratuito" onChange={e => setForm({...form, modalidadeCancelamento: e.target.value})} className="mt-1" />
                <span className="text-sm"><strong className="block">Cancelamento Gratuito:</strong> Sem comissão se cancelado atempadamente...</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="anexo3" required value="reduzida" onChange={e => setForm({...form, modalidadeCancelamento: e.target.value})} className="mt-1" />
                <span className="text-sm"><strong className="block">Comissão Reduzida:</strong> Aplicam-se as taxas da entidade...</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 pt-12 border-t-4 border-black">
            <div>
              <h4 className="font-bold mb-4 font-sans uppercase">Pela HelloCamp</h4>
              <p>Nome: <span className="italic">Direção HelloCamp</span></p>
              <p>Data: {dataAtual}</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 font-sans uppercase">Pelo Parceiro (Assinatura Digital)</h4>
              <p className="mb-2">Nome: <input required type="text" className={inputClass} value={form.assinaturaNome} onChange={e => setForm({...form, assinaturaNome: e.target.value})} placeholder="Escreva o seu nome" /></p>
              <p className="mb-2">Cargo: <input required type="text" className={inputClass} value={form.assinaturaCargo} onChange={e => setForm({...form, assinaturaCargo: e.target.value})} placeholder="O seu cargo" /></p>
              <p>Data: {dataAtual}</p>
              <label className="flex items-start gap-2 mt-4 cursor-pointer font-sans text-xs">
                <input type="checkbox" required checked={form.concordaTermos} onChange={e => setForm({...form, concordaTermos: e.target.checked})} className="mt-1" />
                <span className="text-gray-600">Confirmo possuir poderes legais para vincular a entidade supra identificada através desta assinatura.</span>
              </label>
            </div>
          </div>

          {/* CRIAÇÃO DA CONTA */}
          <div className="bg-slate-900 p-8 rounded-2xl text-white font-sans mt-12">
            <h3 className="text-xl font-black mb-2">Criação de Conta de Acesso</h3>
            <p className="text-sm text-slate-400 mb-6">Defina as credenciais para aceder ao seu Dashboard de Organizador e gerir este contrato.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email de Acesso (Login) *</label>
                <input type="email" required value={auth.emailAcesso} onChange={e => setAuth({...auth, emailAcesso: e.target.value})} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Defina uma Password *</label>
                <input type="password" required minLength={6} value={auth.passwordAcesso} onChange={e => setAuth({...auth, passwordAcesso: e.target.value})} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-slate-700 flex justify-end">
              <button type="submit" disabled={loading || !form.concordaTermos} className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-colors cursor-pointer w-full md:w-auto text-lg">
                {loading ? 'A processar contrato...' : 'Assinar Contrato e Criar Conta'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </main>
  );
}