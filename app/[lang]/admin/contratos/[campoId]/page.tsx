"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AssinaturaContratoPage({ params }: { params: Promise<{ lang: string, campoId: string }> }) {
  const { lang, campoId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [campo, setCampo] = useState<any>(null);
  const [perfil, setPerfil] = useState<any>(null);

  // Variáveis do Contrato
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
    modalidadeReserva: "", // 'email' ou 'direta'
    modalidadeCancelamento: "", // 'gratuito' ou 'reduzida'
    acordosComplementares: "",
    assinaturaNome: "",
    assinaturaCargo: "",
  });

  useEffect(() => {
    const fetchDados = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/${lang}/admin/login`); return; }

      const { data: campoData } = await supabase.from('campos').select('*').eq('id', campoId).eq('organizador_id', session.user.id).single();
      const { data: perfilData } = await supabase.from('perfis').select('*').eq('id', session.user.id).single();

      if (!campoData || !perfilData) {
        alert("Acesso não autorizado.");
        router.push(`/${lang}/admin/dashboard`);
        return;
      }

      setCampo(campoData);
      setPerfil(perfilData);
      setLoading(false);
    };
    fetchDados();
  }, [campoId, lang, router]);

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.modalidadeReserva || !form.modalidadeCancelamento) {
      alert("Por favor, selecione as opções nos Anexos 1 e 3.");
      return;
    }

    setSubmitting(true);

    const payload = {
      ...form,
      empresaNome: perfil.empresa_nome,
      nif: perfil.nif_empresa,
      campoNome: campo.nome,
      dataSubmissao: new Date().toISOString()
    };

    const { error } = await supabase
      .from('campos')
      .update({
        contrato_dados: payload,
        status_aprovacao: 'Pendente de Revisão'
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

  if (loading) return <div className="p-20 text-center font-bold">A carregar documento...</div>;

  const inputClass = "border-b border-black outline-none bg-transparent px-1 font-bold text-black min-w-[250px] placeholder:font-normal placeholder:text-gray-400";
  const dataAtual = new Date().toLocaleDateString('pt-PT');

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 font-sans text-black">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-6 flex justify-between items-center">
          <Link href={`/${lang}/admin/dashboard`} className="text-sm font-bold text-gray-500 hover:text-black">&larr; Voltar ao Painel</Link>
          <button onClick={handleSubmeter} disabled={submitting} className="bg-black text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50">
            {submitting ? 'A submeter...' : 'Assinar e Submeter'}
          </button>
        </div>

        <form id="contrato-form" onSubmit={handleSubmeter} className="bg-white shadow-2xl p-8 md:p-16 font-serif text-black leading-relaxed space-y-8">
          
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold uppercase mb-2">Contrato de Intermediação – HelloCamp</h1>
            <p className="text-sm italic">O seu contrato de parceria com a HelloCamp, explicado de forma simples e objetiva.[cite: 1]</p>
          </div>

          <div className="space-y-4 text-sm bg-gray-50 p-6 border border-gray-200">
            <h3 className="font-bold uppercase">1. Celebração do contrato[cite: 1]</h3>
            <p>Parabéns! Celebrou um contrato de parceria com a HelloCamp. Este contrato regula a divulgação e a intermediação das suas ofertas através da plataforma HelloCamp, estabelecendo os termos da colaboração entre ambas as partes. O acordo mantém-se válido até ao final do ano civil em curso, sendo automaticamente renovado por períodos sucessivos, salvo denúncia por qualquer uma das partes nos termos previstos contratualmente.[cite: 1]</p>

            <h3 className="font-bold uppercase mt-4">2. Divulgação das ofertas[cite: 1]</h3>
            <p>Após a celebração do contrato, a HelloCamp procede à recolha e organização das informações relativas às atividades disponibilizadas pelo parceiro, criando e publicando as respetivas páginas de oferta na plataforma. Paralelamente, promove os programas através dos seus canais digitais e poderá solicitar informações adicionais sempre que tal se revele necessário para garantir a qualidade e atualização dos conteúdos. A publicação das ofertas apenas ocorrerá após o cumprimento das condições contratuais aplicáveis e da validação de toda a informação necessária.[cite: 1]</p>

            <h3 className="font-bold uppercase mt-4">3. Reservas através da HelloCamp[cite: 1]</h3>
            <p>As reservas das atividades poderão ser efetuadas diretamente através da plataforma HelloCamp. Sempre que uma reserva seja realizada, a HelloCamp comunicará ao parceiro os dados do cliente, os detalhes da reserva e todas as informações necessárias à adequada gestão da inscrição. Por sua vez, o parceiro compromete-se a manter permanentemente atualizadas a disponibilidade das atividades, os preços praticados, os programas oferecidos e quaisquer outras informações relevantes relacionadas com as suas ofertas, assegurando a exatidão dos dados apresentados aos clientes.[cite: 1]</p>

            <h3 className="font-bold uppercase mt-4">4. Comissão[cite: 1]</h3>
            <p>A HelloCamp cobra uma comissão sobre cada reserva concluída através da plataforma. O modelo de pagamento poderá assumir diferentes formas, nomeadamente através de pagamento direto ao parceiro pelo cliente, pagamento parcial processado pela HelloCamp ou qualquer outro modelo que venha a ser acordado entre ambas as partes. As condições específicas aplicáveis serão definidas de acordo com os termos estabelecidos no contrato de parceria.[cite: 1]</p>
          </div>

          <hr className="border-black" />

          <h2 className="text-xl font-bold text-center uppercase tracking-widest my-8">Contrato de Intermediação[cite: 1]</h2>

          <div className="space-y-2">
            <p>Entre: <strong>HelloCamp</strong> (Website: www.hellocamp.pt | E-mail: info@hellocamp.pt)[cite: 1]</p>
            <p>E</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 mt-4">
              <div className="flex flex-col"><label className="text-xs font-bold">Pessoa de Contacto:</label><input required type="text" className={inputClass} value={form.pessoaContacto} onChange={e => setForm({...form, pessoaContacto: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold">Nome da Empresa:</label><input required type="text" className={inputClass} value={perfil.empresa_nome || ""} readOnly /></div>
              <div className="flex flex-col"><label className="text-xs font-bold">Forma Jurídica:</label><input required type="text" className={inputClass} value={form.formaJuridica} onChange={e => setForm({...form, formaJuridica: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold">Morada:</label><input required type="text" className={inputClass} value={form.morada} onChange={e => setForm({...form, morada: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold">Código Postal e Cidade:</label><input required type="text" className={inputClass} value={form.codigoPostal} onChange={e => setForm({...form, codigoPostal: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold">Número de Telefone:</label><input required type="text" className={inputClass} value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold">E-mail de Contacto:</label><input required type="email" className={inputClass} value={form.emailContacto} onChange={e => setForm({...form, emailContacto: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold">E-mail para Reservas:</label><input required type="email" className={inputClass} value={form.emailReservas} onChange={e => setForm({...form, emailReservas: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold">Website:</label><input required type="text" className={inputClass} value={form.website} onChange={e => setForm({...form, website: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold">Responsável RGPD:</label><input required type="text" className={inputClass} value={form.responsavelRGPD} onChange={e => setForm({...form, responsavelRGPD: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold">NIF:</label><input required type="text" className={inputClass} value={perfil.nif_empresa || ""} readOnly /></div>
            </div>
            <p className="mt-4 italic">-doravante designado por "Parceiro"-[cite: 1]</p>
            <p className="font-bold">É celebrado o presente contrato de intermediação e divulgação comercial para o programa denominado: <span className="underline">{campo.nome}</span>.</p>
          </div>

          <div className="space-y-6">
            <h3 className="font-bold text-lg underline">Cláusulas Contratuais[cite: 1]</h3>
            
            <div>
              <h4 className="font-bold">Artigo 1.º – Comissão[cite: 1]</h4>
              <p>O Parceiro compromete-se a pagar à HelloCamp uma comissão de 12% (iva não incluido) sobre cada reserva efetuada através da plataforma, nos termos definidos no presente contrato ou em acordo complementar celebrado entre as partes.[cite: 1]</p>
              <p>A comissão é calculada sobre o valor efetivamente pago pelo cliente relativamente à atividade reservada, incluindo serviços adicionais contratados através da plataforma.[cite: 1]</p>
              <p>A comissão torna-se devida após a confirmação da reserva pelo Parceiro e a transmissão dos respetivos dados de reserva.[cite: 1]</p>
              <p>O Parceiro deverá enviar ao cliente a confirmação da reserva e assegurar a prestação dos serviços contratados.[cite: 1]</p>
              <p>Caso uma reserva não possa ser realizada por motivos devidamente justificados, nomeadamente indisponibilidade da atividade ou não verificação das condições mínimas de realização, o Parceiro deverá informar a HelloCamp com a maior brevidade possível.[cite: 1]</p>
              <p>Em caso de cancelamento por iniciativa do cliente, aplicar-se-ão as condições previstas no Anexo 3 – Cancelamento de Reservas.[cite: 1]</p>
            </div>

            <div>
              <h4 className="font-bold">Artigo 2.º – Condições de Pagamento[cite: 1]</h4>
              <p>As comissões devidas à HelloCamp serão faturadas de acordo com o modelo de pagamento acordado entre as partes. O Parceiro compromete-se a liquidar as faturas emitidas pela HelloCamp dentro dos prazos nelas indicados. Os valores acordados não incluem IVA ou outros impostos legalmente aplicáveis.[cite: 1]</p>
            </div>

            <div>
              <h4 className="font-bold">Artigo 3.º – Obrigações do Parceiro[cite: 1]</h4>
              <p>O Parceiro compromete-se a fornecer à HelloCamp todas as informações necessárias à divulgação das suas atividades, incluindo descrições, preços, disponibilidade, fotografias e demais conteúdos relevantes.[cite: 1]</p>
              <p>O Parceiro garante que possui todos os direitos necessários sobre os conteúdos disponibilizados à HelloCamp, incluindo direitos de autor, direitos de imagem e demais autorizações legalmente exigidas.[cite: 1]</p>
              <p>A HelloCamp poderá utilizar os conteúdos fornecidos pelo Parceiro para efeitos de promoção, comercialização e divulgação das atividades na plataforma e nos seus canais de comunicação.[cite: 1]</p>
              <p>O Parceiro poderá solicitar, a qualquer momento, alterações às informações publicadas relativas às suas atividades.[cite: 1]</p>
              <p>Os preços divulgados na plataforma HelloCamp não poderão ser superiores aos preços praticados pelo Parceiro para reservas diretas da mesma atividade.[cite: 1]</p>
              <p>Sempre que existam campanhas promocionais, descontos ou condições especiais aplicáveis às atividades do Parceiro, a HelloCamp poderá refletir essas condições na plataforma durante o respetivo período de vigência.[cite: 1]</p>
              <p>O Parceiro compromete-se a informar imediatamente a HelloCamp de quaisquer alterações relativas às suas atividades, incluindo preços, disponibilidade, programas, condições de participação ou outros elementos relevantes.[cite: 1]</p>
              <p>O Parceiro compromete-se a realizar as atividades promovidas através da plataforma, salvo nos casos expressamente previstos nos seus termos e condições ou em situações de força maior.[cite: 1]</p>
              <p>O Parceiro deverá comunicar à HelloCamp quaisquer alterações aos seus termos e condições gerais ou às condições aplicáveis às atividades disponibilizadas na plataforma.[cite: 1]</p>
            </div>

            <div>
              <h4 className="font-bold">Artigo 4.º – Duração e Renovação[cite: 1]</h4>
              <p>O presente contrato produz efeitos a partir da data da sua assinatura por ambas as partes. O contrato mantém-se válido até ao final do respetivo ano civil. O contrato será automaticamente renovado por períodos sucessivos de um ano, salvo denúncia por qualquer das partes. A intenção de não renovação deverá ser comunicada por escrito com uma antecedência mínima de 30 dias relativamente ao termo do período contratual em curso.[cite: 1]</p>
            </div>

            <div>
              <h4 className="font-bold">Artigo 5.º – Cláusula de Separabilidade[cite: 1]</h4>
              <p>A eventual invalidade, nulidade ou inaplicabilidade de qualquer disposição do presente contrato não prejudica a validade das restantes cláusulas, que permanecerão plenamente em vigor.[cite: 1]</p>
            </div>

            <div>
              <h4 className="font-bold">Artigo 6.º – Alterações e Acordos Complementares[cite: 1]</h4>
              <p>Quaisquer alterações ao presente contrato ou acordos complementares celebrados entre a HelloCamp e o Parceiro deverão ser efetuados por escrito, no anexo 4, para produzirem efeitos.[cite: 1]</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mt-12 pt-12 border-t border-black">
            <div>
              <h4 className="font-bold mb-4">Pela HelloCamp[cite: 1]</h4>
              <p>Nome: <span className="italic">Direção HelloCamp</span></p>
              <p>Data: {dataAtual}</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Pelo Parceiro (Assinatura Digital)[cite: 1]</h4>
              <p className="mb-2">Nome: <input required type="text" className={inputClass} value={form.assinaturaNome} onChange={e => setForm({...form, assinaturaNome: e.target.value})} placeholder="Escreva o seu nome" /></p>
              <p className="mb-2">Cargo: <input required type="text" className={inputClass} value={form.assinaturaCargo} onChange={e => setForm({...form, assinaturaCargo: e.target.value})} placeholder="O seu cargo" /></p>
              <p>Data: {dataAtual}[cite: 1]</p>
            </div>
          </div>

          <div className="space-y-8 mt-12 pt-12 border-t-4 border-black">
            
            <div className="bg-gray-50 p-6 border border-gray-300">
              <h3 className="font-bold text-lg mb-4">Anexo 1 – Procedimento de Reserva[cite: 1]</h3>
              <p className="mb-4">O Parceiro deverá selecionar a modalidade de gestão de reservas aplicável à sua parceria com a HelloCamp.[cite: 1]</p>
              
              <label className="flex items-start gap-3 mb-4 cursor-pointer">
                <input type="radio" name="anexo1" required value="email" onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1" />
                <div>
                  <span className="font-bold block">Comunicação por E-mail[cite: 1]</span>
                  <span className="text-sm">A HelloCamp enviará ao Parceiro, por correio eletrónico, todas as informações necessárias para a gestão da reserva, incluindo os dados do participante, os dados do responsável pela reserva e os detalhes da atividade reservada. O Parceiro dispõe de 2 (dois) dias úteis para comunicar à HelloCamp a rejeição de uma reserva por motivo devidamente justificado. Na ausência de resposta dentro deste prazo, a reserva considerar-se-á aceite, sendo aplicável a comissão prevista no contrato.[cite: 1]</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="anexo1" required value="direta" onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1" />
                <div>
                  <span className="font-bold block">Reserva Direta[cite: 1]</span>
                  <span className="text-sm">As reservas efetuadas através da plataforma HelloCamp serão registadas diretamente no sistema de reservas do Parceiro. Nesta modalidade, a HelloCamp terá direito à comissão acordada sobre cada reserva concluída. O formulário de reserva será configurado de acordo com as necessidades do Parceiro, recolhendo as informações necessárias para a correta gestão das inscrições. O Parceiro compromete-se a manter atualizadas as disponibilidades, preços e demais informações relevantes das atividades disponibilizadas através da plataforma.[cite: 1]</span>
                </div>
              </label>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Anexo 2 – Pagamento e comissão[cite: 1]</h3>
              <p className="text-sm">O Parceiro autoriza a HelloCamp a receber um depósito durante o processo de reserva efetuado através da plataforma Stripe. O valor do depósito corresponde, regra geral, à comissão devida à HelloCamp pela reserva efetuada, acrescida de IVA à taxa legal em vigor. Quaisquer condições específicas ou montantes adicionais deverão constar de acordo complementar entre as partes. Após a confirmação da reserva, o cliente efetua o pagamento do depósito à HelloCamp, sendo o valor remanescente pago diretamente ao Parceiro, de acordo com as condições definidas para a atividade. O Parceiro é responsável pelo envio ao cliente da confirmação da reserva, da respetiva fatura, dos documentos informativos legalmente exigidos e de quaisquer elementos necessários à participação na atividade. No final de cada período de faturação acordado, a HelloCamp emitirá a fatura correspondente às comissões devidas, deduzindo os montantes já recebidos a título de depósito.[cite: 1]</p>
            </div>

            <div className="bg-gray-50 p-6 border border-gray-300">
              <h3 className="font-bold text-lg mb-4">Anexo 3 – Cancelamento de Reservas por Iniciativa do Cliente[cite: 1]</h3>
              <p className="mb-4">O Parceiro deverá selecionar o regime de cancelamento aplicável às reservas efetuadas através da plataforma HelloCamp.[cite: 1]</p>
              
              <label className="flex items-start gap-3 mb-4 cursor-pointer">
                <input type="radio" name="anexo3" required value="gratuito" onChange={e => setForm({...form, modalidadeCancelamento: e.target.value})} className="mt-1" />
                <div>
                  <span className="font-bold block">Cancelamento Gratuito e Sem Comissão[cite: 1]</span>
                  <span className="text-sm">A HelloCamp não cobrará qualquer comissão sobre reservas canceladas pelo cliente. O Parceiro compromete-se a não aplicar quaisquer custos de cancelamento ao cliente, desde que o pedido de cancelamento seja comunicado por escrito à HelloCamp ou diretamente ao Parceiro até 12 (doze) dias antes do início da atividade. Os montantes já pagos pelo cliente deverão ser reembolsados pelo Parceiro no prazo máximo de 30 dias após a receção do pedido de cancelamento. Caso o cancelamento seja efetuado após o prazo referido no número anterior, poderão ser aplicadas as condições de cancelamento previstas nos termos e condições do Parceiro. Mesmo nos casos em que sejam aplicados custos de cancelamento ao cliente, a HelloCamp renuncia ao direito de receber qualquer comissão sobre a reserva cancelada.[cite: 1]</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="anexo3" required value="reduzida" onChange={e => setForm({...form, modalidadeCancelamento: e.target.value})} className="mt-1" />
                <div>
                  <span className="font-bold block">Comissão Reduzida em Caso de Cancelamento[cite: 1]</span>
                  <span className="text-sm">A comissão da HelloCamp é considerada devida após a confirmação da reserva e transmissão dos respetivos dados ao Parceiro. Em caso de cancelamento por iniciativa do cliente, o Parceiro poderá aplicar os custos de cancelamento previstos nos seus termos e condições gerais. Nestas situações, a comissão da HelloCamp será reduzida proporcionalmente ao valor efetivamente cobrado ao cliente a título de cancelamento. Para beneficiar desta redução, o Parceiro deverá comunicar à HelloCamp, por escrito, o cancelamento da reserva no prazo máximo de 2 (dois) dias úteis após a sua receção. Caso o cliente efetue uma nova reserva através da plataforma HelloCamp após o cancelamento da reserva inicial, a HelloCamp renuncia ao direito de comissão relativamente à reserva originalmente cancelada. A não comparência do cliente após o envio da documentação necessária para a participação na atividade será considerada um cancelamento na data de início da atividade, aplicando-se as condições de cancelamento previstas pelo Parceiro.[cite: 1]</span>
                </div>
              </label>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Anexo 4: Acordos complementares[cite: 1]</h3>
              <p className="mb-2">Acordámos as seguintes alterações ao contrato-modelo:[cite: 1]</p>
              <textarea 
                className="w-full border border-gray-300 p-4 rounded-lg bg-gray-50 outline-none" 
                rows={4} 
                value={form.acordosComplementares} 
                onChange={e => setForm({...form, acordosComplementares: e.target.value})}
                placeholder="Indique aqui eventuais acordos complementares ou deixe em branco."
              ></textarea>
            </div>

          </div>
        </form>
      </div>
    </main>
  );
}