"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; 
import Link from "next/link";
import React from "react";

export default function MeusCampos({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = React.use(params);
  const isEn = lang === 'en';

  const [campos, setCampos] = useState<any[]>([]);
  const [perfilBase, setPerfilBase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampos = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setLoading(false);

      const { data: perfilData } = await supabase.from('perfis').select('taxa_comissao, base_comissao').eq('id', session.user.id).single();
      setPerfilBase(perfilData || { taxa_comissao: 12 });

      // Selecionamos também o contrato_dados
      const { data } = await supabase.from('campos').select('*').eq('organizador_id', session.user.id).order('id', { ascending: false }); 
      setCampos(data || []);
      setLoading(false);
    };
    fetchCampos();
  }, []);

  const handleImprimirPDF = (campo: any) => {
    if (!campo || !campo.contrato_dados) {
      alert(isEn ? "Contract data not found." : "Os dados do contrato não foram encontrados.");
      return;
    }
    const dados = campo.contrato_dados;
    const comissaoText = campo.taxa_comissao || 12;
    const dataContrato = dados.dataSubmissao ? new Date(dados.dataSubmissao).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/D';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert(isEn ? "Your browser blocked the pop-up. Please allow it to generate the PDF." : "O seu navegador bloqueou a abertura da janela (Pop-up). Por favor, permita para gerar o PDF.");
      return;
    }

    // Textos Dinâmicos dos Anexos Baseados nas Escolhas
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
        <title>Contrato Intermediação - ${dados.empresaNome || campo.nome}</title>
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

        <p>É celebrado o presente contrato de intermediação e divulgação comercial aplicável, mas não limitado, ao programa/campo de férias com a designação: <strong>"${campo.nome}"</strong>.</p>

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
              ID Contrato Sistema: ${campo.id}
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

  return (
    <div className="max-w-[1200px] mx-auto pb-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 m-0">
            {isEn ? 'My Camps' : 'Os Meus Campos'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            {isEn ? 'Manage your holiday programs and availability.' : 'Gira os seus programas de férias e disponibilidade.'}
          </p>
        </div>
        
        <Link href={`/${lang}/admin/campos/novo`} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold text-sm text-center transition-colors shadow-sm no-underline">
          + {isEn ? 'Add New Camp' : 'Adicionar Novo'}
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-bold">{isEn ? 'Loading your camps...' : 'A carregar os seus campos...'}</div>
      ) : campos.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl">
          <p className="text-slate-500 mb-4 text-base md:text-lg">{isEn ? 'You haven\'t added any camps yet.' : 'Ainda não tem nenhum campo registado.'}</p>
          <Link href={`/${lang}/admin/campos/novo`} className="text-emerald-600 font-bold no-underline text-base hover:text-emerald-700">
            {isEn ? 'Create your first camp →' : 'Crie o seu primeiro campo →'}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {campos.map((campo) => {
            const nomeVisivel = isEn && campo.nome_en ? campo.nome_en : campo.nome;
            const localVisivel = isEn && campo.local_en ? campo.local_en : campo.local;
            const vagasVisivel = campo.vagas_totais || 0;
            const textoVagas = isEn ? 'spots' : 'vagas';
            let precoVisivel = campo.preco || (campo.turnos && campo.turnos.length > 0 ? campo.turnos[0].preco : 0);
            const isComissaoEspecifica = campo.taxa_comissao !== null && campo.taxa_comissao !== undefined;
            const taxaVisual = isComissaoEspecifica ? campo.taxa_comissao : (perfilBase?.taxa_comissao || 12);

            return (
              <div key={campo.id} className="flex flex-col lg:flex-row justify-between lg:items-center gap-5 p-5 md:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                
                <div className="flex-1">
                  <h3 className="m-0 text-lg md:text-xl font-black text-slate-900 mb-3">{nomeVisivel}</h3>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <span className="text-xs md:text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">📍 {localVisivel}</span>
                    <span className="text-xs md:text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">👥 {vagasVisivel} {textoVagas}</span>
                    <span className="text-xs md:text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">💰 {precoVisivel}€</span>
                    
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isComissaoEspecifica ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {taxaVisual}% {isEn ? 'Fee' : 'Comissão'}
                    </span>
                    
                    {campo.status_aprovacao === 'Aprovado' && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                        ✅ {isEn ? 'Verified' : 'Validado'}
                      </span>
                    )}
                    {campo.status_aprovacao === 'Pendente de Revisão' && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                        ⏳ {isEn ? 'Under Review' : 'Em Revisão'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap justify-end gap-3 mt-4 lg:mt-0 w-full lg:w-auto">
                  
                  <a href={`/${lang}/campo/${campo.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm no-underline transition-colors cursor-pointer">
                      {isEn ? 'Preview' : 'Ver Online'}
                  </a>

                  {/* NOVO BOTÃO DE PDF (Apenas se houver contrato assinado) */}
                  {campo.contrato_dados && (
                    <button onClick={() => handleImprimirPDF(campo)} className="flex items-center justify-center px-4 py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg font-bold text-sm no-underline transition-colors cursor-pointer">
                      {isEn ? 'Download Contract' : '📥 Contrato PDF'}
                    </button>
                  )}
                  
                  <Link href={`/${lang}/admin/campos/editar/${campo.id}`} className="flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-bold text-sm no-underline transition-colors">
                    {isEn ? 'Edit Camp' : 'Editar Campo'}
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}