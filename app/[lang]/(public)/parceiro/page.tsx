import { Metadata } from 'next';
import React from 'react';

// 1. OTIMIZAÇÃO SEO B2B (Focado em angariação de parceiros)
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const isEn = lang === 'en';

  return {
    title: isEn ? 'Become a Partner | HelloCamp' : 'Junte-se como Parceiro | HelloCamp',
    description: isEn 
      ? 'Join HelloCamp, the leading holiday camp marketplace in Portugal. Increase your bookings, reach thousands of parents, and manage registrations, payments, and shifts seamlessly in one dashboard.'
      : 'Junte-se à HelloCamp, o maior marketplace e plataforma de gestão de campos de férias em Portugal. Aumente as suas reservas, alcance milhares de pais e simplifique a gestão de inscrições e pagamentos.',
    openGraph: {
      title: isEn ? 'Grow your Holiday Camp with HelloCamp' : 'Aumente as reservas do seu Campo de Férias',
      description: isEn ? 'The all-in-one platform for camp organizers.' : 'A plataforma tudo-em-um para organizadores de campos de férias.',
    }
  };
}

export default async function ParceirosLandingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const isEn = lang === 'en';

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* HEADER ESCURO (HERO SECTION) */}
      <section className="bg-slate-900 text-white pt-20 pb-32 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            {isEn ? 'Join Hello' : 'Junte-se à Hello'}<span className="text-[#EBA914]">Camp</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 font-medium">
            {isEn 
              ? 'Increase your bookings, gain premium visibility, and simplify your management.' 
              : 'Aumente as suas reservas, ganhe visibilidade premium e simplifique a gestão.'}
          </p>
        </div>
      </section>

      {/* CARTÃO BRANCO SOBREPOSTO (DESIGN EDITORIAL E MINIMALISTA) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 md:p-12 border border-slate-100">
          
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-6">
            {isEn ? 'Why become a partner?' : 'Porquê tornar-se parceiro?'}
          </h2>
          
          <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-10">
            {isEn 
              ? 'HelloCamp is more than a directory. It is a SaaS platform that places your holiday camp in front of thousands of parents actively looking for school break solutions. By joining us, you gain access to automated booking and financial tools.'
              : 'A HelloCamp é mais do que um diretório. É uma plataforma que coloca o seu campo de férias à frente de milhares de pais que procuram ativamente soluções para as pausas escolares. Ao juntar-se a nós, ganha visibilidade premium e acesso a um Dashboard completo de gestão de negócio.'}
          </p>

          {/* LISTA FORMATADA COM ÍCONES (SUBSTITUI O TEXTO DESCONFIGURADO) */}
          <ul className="space-y-5 mb-12">
            <ListItem 
              title={isEn ? 'Targeted Visibility' : 'Visibilidade Focada'} 
              desc={isEn ? 'Reach your exact target audience without spending on ads.' : 'Alcance o seu público-alvo exato de forma qualificada.'} 
            />
            <ListItem 
              title={isEn ? 'Automated Payments' : 'Processamento Seguro'} 
              desc={isEn ? 'Secure payment processing and automated invoicing via Stripe.' : 'Processamento automático de pagamentos e reservas via Stripe.'} 
            />
            <ListItem 
              title={isEn ? 'Total Autonomy' : 'Autonomia Total'} 
              desc={isEn ? 'Manage your own capacities, shifts, and prices in real-time.' : 'Controlo absoluto para gerir turnos, vagas, extras e preços.'} 
            />
            <ListItem 
              title={isEn ? 'Dedicated Support' : 'Suporte Técnico Dedicado'} 
              desc={isEn ? 'We help you set up and scale your business on our platform.' : 'Ajudamos a configurar e a otimizar a sua presença na plataforma.'} 
            />
          </ul>

          {/* CAIXA DE CALL TO ACTION (MODERNA E ENQUADRADA COM A MARCA) */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              {isEn ? 'Ready to get started?' : 'Pronto para começar?'}
            </h3>
            <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto">
              {isEn 
                ? 'Send us an email with your company details and our onboarding team will contact you within 24 hours.' 
                : 'Envie-nos um email com os dados da sua empresa e a nossa equipa entrará em contacto consigo em 24 horas.'}
            </p>
            
            <a 
              href="mailto:info@hellocamp.pt" 
              className="inline-flex justify-center items-center px-8 py-3.5 text-sm font-bold text-white bg-[#EBA914] hover:bg-[#d49612] rounded-lg transition-colors shadow-sm"
            >
              info@hellocamp.pt
            </a>
          </div>

        </div>
      </section>

    </main>
  );
}

// Subcomponente para garantir que os bullet points ficam alinhados e elegantes
function ListItem({ title, desc }: { title: string, desc: string }) {
  return (
    <li className="flex items-start gap-4">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <div>
        <h4 className="text-slate-900 font-bold text-base">{title}</h4>
        <p className="text-slate-500 text-sm mt-0.5">{desc}</p>
      </div>
    </li>
  );
}