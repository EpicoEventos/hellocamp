"use client";

import { use } from "react";
import Link from "next/link";
import React from "react";

export default function SerParceiroPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  return (
    <main className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 pb-20">
      
      {/* SEÇÃO HERO B2B - Foco na dor do organizador e no valor tecnológico */}
      <section className="bg-slate-900 text-white py-24 md:py-32 text-center relative overflow-hidden border-b-8 border-[#EBA914]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <span className="text-xs font-bold text-[#EBA914] bg-[#EBA914]/10 px-4 py-2 rounded-full border border-[#EBA914]/20 uppercase tracking-widest shadow-sm">
            {isEn ? 'HelloCamp B2B Platform' : 'HelloCamp para Organizadores'}
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mt-8 mb-6 leading-tight">
            {isEn ? 'Maximize Bookings. Simplify Operations.' : 'Aumente as Inscrições. Otimize a Sua Operação.'}
          </h1>
          <p className="text-lg md:text-xl text-slate-300 font-medium max-w-3xl mx-auto leading-relaxed mb-10">
            {isEn 
              ? 'The ultimate technological solution for camp organizers. No fixed costs. Absolute control.' 
              : 'A solução tecnológica definitiva para promotores de campos de férias. Simplifique a tesouraria e a gestão de clientes sem custos fixos e com controlo total.'}
          </p>
          <Link href={`/${lang}/admin/registo`} className="inline-block bg-[#EBA914] text-white font-bold px-10 py-4 rounded-xl no-underline hover:bg-amber-500 transition-all transform hover:-translate-y-1 shadow-xl shadow-amber-500/20 text-lg">
            {isEn ? 'Create Partner Account' : 'Registar Conta Parceiro'}
          </Link>
        </div>
      </section>

      {/* OS 3 PILARES DO VALOR B2B */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-24">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            {isEn ? 'Why digitize your operation with HelloCamp?' : 'Porquê digitalizar a sua operação connosco?'}
          </h2>
          <p className="text-slate-600 text-base mt-4 max-w-3xl mx-auto font-medium leading-relaxed">
            {isEn 
              ? 'We engineered an infrastructure designed specifically to eliminate bottlenecks in treasury, marketing, and staff logistics.' 
              : 'Desenhámos uma infraestrutura dedicada exclusivamente a eliminar constrangimentos de tesouraria, angariação de clientes e logística de monitores.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* PILAR 1: STRIPE CONNECT / FATURAÇÃO */}
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/30 flex flex-col hover:border-emerald-200 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mb-8 shadow-inner border border-emerald-100">💳</div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-4">
              {isEn ? 'Automated Payouts' : 'Faturação e Pagamentos Automatizados'}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              {isEn 
                ? 'Say goodbye to chasing bank transfers. Parents pay, and Stripe Connect splits the transaction instantly. Your net revenue is deposited directly into your bank account.' 
                : 'Esqueça a validação manual de transferências bancárias. Através da nossa integração com a Stripe Connect, o pagamento do cliente é processado e dividido na hora: a nossa comissão é deduzida e o seu ganho líquido é depositado diretamente na sua conta bancária.'}
            </p>
          </div>

          {/* PILAR 2: CENTRAL LOGÍSTICA */}
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/30 flex flex-col hover:border-blue-200 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mb-8 shadow-inner border border-blue-100">📊</div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-4">
              {isEn ? 'Nominal Rosters & Export' : 'Gestão Logística e Dados Nominais'}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              {isEn 
                ? 'Centralize medical records, emergency contacts, and custom Q&A. Export real-time operational spreadsheets for your on-ground staff with a single click.' 
                : 'Substitua folhas de papel e ficheiros complexos. Acompanhe em tempo real o preenchimento de vagas, restrições alimentares e autorizações de recolha. Exporte a listagem nominal das suas equipas para Excel/CSV com um único clique.'}
            </p>
          </div>

          {/* PILAR 3: CUSTO ZERO DE RISCO */}
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/30 flex flex-col hover:border-purple-200 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-3xl mb-8 shadow-inner border border-purple-100">⚖️</div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-4">
              {isEn ? 'Zero Risk. Success-Based Model.' : 'Risco Zero. Modelo Baseado no Sucesso'}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              {isEn 
                ? 'No setup fees, no monthly retainers. Creating an account and listing your camp portfolio is 100% free. We strictly operate on a performance fee per successful booking.' 
                : 'Não aplicamos custos de configuração, mensalidades ou anuidades. O registo da sua entidade e a publicação dos seus programas são 100% gratuitos. A HelloCamp opera estritamente à performance, deduzindo uma taxa apenas quando uma inscrição é efetivada.'}
            </p>
          </div>

        </div>
      </section>

      {/* SEÇÃO CONTRATO E TRANSPARÊNCIA */}
      <section className="bg-white border-t border-b border-slate-200 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">{isEn ? 'Full Commercial Control' : 'Transparência e Flexibilidade Comercial'}</h3>
          <p className="text-slate-600 text-base font-medium leading-relaxed max-w-3xl mx-auto">
            {isEn 
              ? 'Our dynamic management panel adapts to your business rules. View custom commission rates, track billing history, and manage specific program exemptions directly in your dashboard.' 
              : 'O nosso painel central ajusta-se à sua realidade operacional. Pode consultar regras de comissionamento gerais ou específicas, acompanhar o histórico de faturação de cada participante e gerir a capacidade dos seus turnos, garantindo transparência financeira absoluta.'}
          </p>
        </div>
      </section>

      {/* CTA INFERIOR */}
      <section className="max-w-4xl mx-auto px-4 pt-24 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-6">
          {isEn ? 'Prepared to boost your organization?' : 'Preparado para impulsionar a sua organização?'}
        </h2>
        <p className="text-slate-500 text-base max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
          {isEn 
            ? 'It takes less than 5 minutes to set up your profile. Start receiving automated enrollments for your programs today.' 
            : 'O processo de configuração do perfil demora menos de 5 minutos. Inscreva a sua entidade e comece a receber reservas estruturadas para os seus programas de férias ao longo de todo o ano.'}
        </p>
        <Link href={`/${lang}/admin/registo`} className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold px-10 py-4 rounded-xl no-underline transition-colors shadow-lg shadow-slate-900/20 text-lg">
          {isEn ? 'Start Registration' : 'Iniciar Registo da Entidade'}
        </Link>
      </section>

    </main>
  );
}