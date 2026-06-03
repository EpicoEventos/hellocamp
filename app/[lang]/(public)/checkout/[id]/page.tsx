"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

const calcularIdade = (dataNasc: string) => {
  if (!dataNasc) return 0;
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade;
};

export default function CheckoutPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEn = lang === 'en';

  const [campo, setCampo] = useState<any>(null);
  const [organizador, setOrganizador] = useState<any>(null);
  const [criancas, setCriancas] = useState<any[]>([]);
  const [reservasExistentes, setReservasExistentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [processingStripe, setProcessingStripe] = useState(false);

  const quantidade = parseInt(searchParams.get("quantidade_criancas") || "1");
  const diasInscritosParam = searchParams.get("dias_inscritos");
  
  const extAlimentacao = searchParams.get("ext_alimentacao") === "true";
  const extAlojamento = searchParams.get("ext_alojamento") === "true";
  const extProlongamento = searchParams.get("ext_prolongamento") === "true";
  const extTransporte = searchParams.get("ext_transporte") === "true";
  
  let turnoSelecionado: any = null;
  try {
    const turnoParam = searchParams.get("turno");
    if (turnoParam) turnoSelecionado = JSON.parse(turnoParam);
  } catch (e) { console.error(e); }

  const diasBaseShift = Number(turnoSelecionado?.dias) || Number(campo?.duracao_dias) || 5;
  const diasEfetivos = (diasInscritosParam && diasInscritosParam !== 'full') ? Number(diasInscritosParam) : diasBaseShift;
  
  const [selecoesCriancas, setSelecoesCriancas] = useState<string[]>(Array(quantidade).fill(""));

  // ESTADO PARA AS RESPOSTAS CUSTOMIZADAS
  const [respostasCustomizadas, setRespostasCustomizadas] = useState<Record<number, Record<string, string>>>({});

  const [showModal, setShowModal] = useState(false);
  const [indexToAssign, setIndexToAssign] = useState<number | null>(null);
  const [savingChild, setSavingChild] = useState(false);
  
  const [newChild, setNewChild] = useState({ 
    nome: '', nif: '', data_nascimento: '', sexo: '', 
    restricoes_alimentares: '', tipo_sanguineo: '', doencas_cronicas: '', 
    medicacao_regular: '', limitacoes_fisicas: '', sabe_nadar: '', 
    sabe_andar_bicicleta: '', tamanho_tshirt: '' 
  });

  useEffect(() => {
    const fetchDados = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        sessionStorage.setItem('redirect_after_login', window.location.href);
        router.push(`/${lang}/login`);
        return;
      }
      setUser(session.user);

      const { data: campoData } = await supabase.from("campos").select("*").eq("id", id).single();
      if (!campoData) { router.push(`/${lang}`); return; }
      setCampo(campoData);

      const { data: orgData } = await supabase.from("perfis").select("*").eq("id", campoData.organizador_id).single();
      setOrganizador(orgData);

      const { data: criancasData } = await supabase.from("criancas").select("*").eq("cliente_id", session.user.id).order('created_at', { ascending: false });
      setCriancas(criancasData || []);
      
      const { data: reservasData } = await supabase.from("reservas").select("crianca_id, turno_nome").eq("cliente_id", session.user.id).eq("campo_id", id);
      setReservasExistentes(reservasData || []);

      setLoading(false);
    };
    fetchDados();
  }, [id, lang, router]);

  const noites = Math.max(1, diasEfetivos - 1);
  const valAlimentacao = extAlimentacao ? (Number(campo?.extra_alimentacao) || 0) * diasEfetivos : 0;
  const valAlojamento = extAlojamento ? (Number(campo?.extra_alojamento) || 0) * noites : 0;
  const valProlongamento = extProlongamento ? (Number(campo?.extra_prolongamento) || 0) * diasEfetivos : 0;
  const valTransporte = extTransporte ? (Number(campo?.extra_transporte) || 0) * diasEfetivos : 0;

  const totalExtrasPorCrianca = valAlimentacao + valAlojamento + valProlongamento + valTransporte;
  
  let precoBaseUnitario = Number(turnoSelecionado?.preco || campo?.preco || 0);
  if (turnoSelecionado?.permite_dias && diasInscritosParam && diasInscritosParam !== 'full') {
    precoBaseUnitario = Number(turnoSelecionado.preco_dia) * diasEfetivos;
  }

  const precoFinalTotal = (precoBaseUnitario + totalExtrasPorCrianca) * quantidade;

  const openNewChildModal = (index: number) => {
    setNewChild({ 
      nome: '', nif: '', data_nascimento: '', sexo: '', 
      restricoes_alimentares: '', tipo_sanguineo: '', doencas_cronicas: '', 
      medicacao_regular: '', limitacoes_fisicas: '', sabe_nadar: '', 
      sabe_andar_bicicleta: '', tamanho_tshirt: '' 
    });
    setIndexToAssign(index);
    setShowModal(true);
  };

  const handleSaveNewChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingChild(true);
    const { data, error } = await supabase.from('criancas').insert({
      cliente_id: user.id,
      ...newChild
    }).select().single();

    if (error) {
      alert("Erro ao adicionar: " + error.message);
    } else if (data && indexToAssign !== null) {
      setCriancas(prev => [data, ...prev]);
      const novasSelecoes = [...selecoesCriancas];
      novasSelecoes[indexToAssign] = data.id;
      setSelecoesCriancas(novasSelecoes);
      setShowModal(false);
    }
    setSavingChild(false);
  };

  const handleUpdateLocalCrianca = (idDaCrianca: string, campoTabela: string, valor: string) => {
    setCriancas(prev => prev.map(c => c.id === idDaCrianca ? { ...c, [campoTabela]: valor } : c));
  };
  const handleSaveDBCrianca = async (idDaCrianca: string, campoTabela: string, valor: string) => {
    await supabase.from('criancas').update({ [campoTabela]: valor }).eq('id', idDaCrianca);
  };

  const handleRespostaCustomizada = (participantIndex: number, pergunta: string, resposta: string) => {
    setRespostasCustomizadas(prev => ({
      ...prev,
      [participantIndex]: {
        ...(prev[participantIndex] || {}),
        [pergunta]: resposta
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selecoesCriancas.some(c => c === "")) {
      alert(isEn ? "Please select a child for each participant slot." : "Por favor, selecione um participante válido para todas as vagas."); return;
    }

    setProcessingStripe(true);

    try {
      const insercoes = selecoesCriancas.map((crianca_id, index) => ({
        cliente_id: user.id, 
        crianca_id: crianca_id, 
        campo_id: campo.id,
        organizador_id: campo.organizador_id, 
        quantidade_criancas: 1,
        valor_total: precoFinalTotal / quantidade,
        turno_nome: turnoSelecionado?.nome || 'Programa Base',
        status_pagamento: 'Pendente',
        extras_escolhidos: { extAlimentacao, extAlojamento, extProlongamento, extTransporte, dias_inscritos: diasEfetivos },
        respostas_customizadas: respostasCustomizadas[index] || {}
      }));

      const { data: reservasData, error: supabaseError } = await supabase.from('reservas').insert(insercoes).select('id');
      
      if (supabaseError) {
        throw new Error("Erro Base de Dados: " + supabaseError.message);
      }
      
      const idsCriados = reservasData.map(r => r.id);

      if (organizador?.modelo_pagamento === 'parceiro_recebe') {
        router.push(`/${lang}/sucesso`);
        return;
      }

      const res = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservasIds: idsCriados,
          totalAmount: precoFinalTotal,
          userEmail: user.email,
          lang: lang,
          campoNome: campo.nome,
          stripeAccountId: organizador?.stripe_account_id
        })
      });

      if (!res.ok) {
        const textError = await res.text();
        throw new Error("Erro Servidor (HTTP " + res.status + "): " + textError);
      }

      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url; 
      } else {
        throw new Error("Erro na Stripe: A resposta não continha um link de pagamento válido.");
      }

    } catch (error: any) { 
      alert("ATENÇÃO - Erro Técnico:\n" + error.message); 
      setProcessingStripe(false); 
    }
  };

  if (loading || !campo) return <div style={{ padding: '4rem', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{isEn ? 'Preparing secure checkout...' : 'A preparar a sua reserva de forma segura...'}</div>;

  const temPerguntasCustomizadas = campo?.perguntas_customizadas && campo.perguntas_customizadas.length > 0;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', paddingBottom: '5rem', paddingTop: '3rem', position: 'relative' }}>
      
      {processingStripe && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(255,255,255,0.95)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1.5rem' }}></div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a' }}>A redirecionar para pagamento seguro...</h2>
          <p style={{ color: '#64748b' }}>Por favor, aguarde.</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* MODAL ADICIONAR NOVA CRIANÇA */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '600px', borderRadius: '1.5rem', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', marginBottom: '1.5rem' }}>{isEn ? 'Add New Participant' : 'Adicionar Novo Participante'}</h3>
            
            <form onSubmit={handleSaveNewChild} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={labelStyle}>{isEn ? 'Full Name' : 'Nome Completo'} *</label>
                <input type="text" required value={newChild.nome} onChange={e => setNewChild({...newChild, nome: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 150px' }}>
                  <label style={labelStyle}>{isEn ? 'Date of Birth' : 'Data Nasc.'} *</label>
                  <input type="date" required value={newChild.data_nascimento} onChange={e => setNewChild({...newChild, data_nascimento: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ flex: '1 1 150px' }}>
                  <label style={labelStyle}>{isEn ? 'Gender' : 'Sexo'} *</label>
                  <select required value={newChild.sexo} onChange={e => setNewChild({...newChild, sexo: e.target.value})} style={selectStyle}>
                    <option value="">Selecione...</option><option value="Masculino">{isEn ? 'Male' : 'Masculino'}</option><option value="Feminino">{isEn ? 'Female' : 'Feminino'}</option><option value="Prefiro não dizer">{isEn ? 'Prefer not to say' : 'Prefiro não dizer'}</option>
                  </select>
                </div>
                <div style={{ flex: '1 1 150px' }}>
                  <label style={labelStyle}>{isEn ? 'Blood Type' : 'Tipo Sanguíneo'}</label>
                  {/* CORRIGIDO NO MODAL (newChild em vez de childInfo) */}
                  <select value={newChild.tipo_sanguineo} onChange={e => setNewChild({...newChild, tipo_sanguineo: e.target.value})} style={selectStyle}>
                    <option value="">N/A</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>{isEn ? 'Allergies / Restrictions' : 'Alergias / Restrições'}</label>
                <textarea rows={2} value={newChild.restricoes_alimentares} onChange={e => setNewChild({...newChild, restricoes_alimentares: e.target.value})} style={{...inputStyle, resize: 'vertical'}} placeholder={isEn ? "None" : "Nenhuma"} />
              </div>
              <button type="submit" disabled={savingChild} style={{ marginTop: '0.5rem', width: '100%', padding: '1rem', backgroundColor: '#059669', color: 'white', fontWeight: '900', borderRadius: '0.75rem', border: 'none', cursor: 'pointer' }}>
                {savingChild ? 'A guardar...' : (isEn ? 'Save Participant' : 'Guardar Participante')}
              </button>
            </form>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '3rem', alignItems: 'flex-start' }}>
        
        <div style={{ flex: '1 1 60%', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* SELEÇÃO DE PARTICIPANTES */}
            <section style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, marginBottom: '1.5rem' }}>{isEn ? 'Select Participants' : 'Selecionar Participantes'}</h2>

              {Array.from({ length: quantidade }).map((_, i) => {
                const childId = selecoesCriancas[i];
                const childInfo = criancas.find(c => c.id === childId);

                return (
                  <div key={i} style={{ marginBottom: i !== quantidade - 1 ? '2.5rem' : 0, paddingBottom: i !== quantidade - 1 ? '2.5rem' : 0, borderBottom: i !== quantidade - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#059669', marginBottom: '0.5rem' }}>PARTICIPANTE {i + 1}</label>
                    
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <select required value={childId} onChange={(e) => {
                        const novas = [...selecoesCriancas];
                        novas[i] = e.target.value;
                        setSelecoesCriancas(novas);
                      }} style={{ ...selectStyle, flex: 1 }}>
                        <option value="">{isEn ? 'Choose a child...' : 'Escolha um participante...'}</option>
                        {criancas.map(c => {
                          const idade = calcularIdade(c.data_nascimento);
                          const idadeForaLimite = (campo.idade_min && idade < campo.idade_min) || (campo.idade_max && idade > campo.idade_max);
                          const jaInscritoNesteTurno = reservasExistentes.some(r => r.crianca_id === c.id && r.turno_nome === (turnoSelecionado?.nome || 'Programa Base'));
                          const jaSelecionadoNesteForm = selecoesCriancas.includes(c.id) && selecoesCriancas[i] !== c.id;
                          
                          const isDisabled = idadeForaLimite || jaInscritoNesteTurno || jaSelecionadoNesteForm;
                          
                          let aviso = "";
                          if (idadeForaLimite) aviso = isEn ? `(Age not allowed: ${idade} yrs)` : `(Idade não permitida: ${idade} anos)`;
                          else if (jaInscritoNesteTurno) aviso = isEn ? "(Already registered)" : "(Já inscrito neste turno)";
                          else if (jaSelecionadoNesteForm) aviso = "(Selecionado nesta compra)";

                          return (
                            <option key={c.id} value={c.id} disabled={isDisabled}>
                              {c.nome} {aviso}
                            </option>
                          );
                        })}
                      </select>
                      
                      <button type="button" onClick={() => openNewChildModal(i)} style={{ padding: '0.875rem 1.25rem', backgroundColor: '#f0fdf4', color: '#059669', fontWeight: 'bold', borderRadius: '0.75rem', border: '1px solid #a7f3d0', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        + {isEn ? 'New' : 'Novo'}
                      </button>
                    </div>

                    {/* FICHA DETALHADA E CLÍNICA INLINE */}
                    {childInfo && (
                      <div style={{ marginTop: '1.5rem', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' }}>{isEn ? 'Verify Details & Safety' : 'Verificar Detalhes de Segurança'}</h4>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>💾 {isEn ? 'Auto-saves' : 'Grava autom.'}</span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                          {/* Dados Pessoais */}
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>{isEn ? 'Full Name' : 'Nome Completo'}</label>
                            <input type="text" required value={childInfo.nome || ''} onChange={e => handleUpdateLocalCrianca(childId, 'nome', e.target.value)} onBlur={e => handleSaveDBCrianca(childId, 'nome', e.target.value)} style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>{isEn ? 'Date of Birth' : 'Data Nascimento'}</label>
                            <input type="date" required value={childInfo.data_nascimento || ''} onChange={e => handleUpdateLocalCrianca(childId, 'data_nascimento', e.target.value)} onBlur={e => handleSaveDBCrianca(childId, 'data_nascimento', e.target.value)} style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>{isEn ? 'Gender' : 'Sexo'}</label>
                            <select value={childInfo.sexo || ''} onChange={e => {handleUpdateLocalCrianca(childId, 'sexo', e.target.value); handleSaveDBCrianca(childId, 'sexo', e.target.value);}} style={selectStyle}>
                              <option value="Masculino">{isEn ? 'Male' : 'Masculino'}</option><option value="Feminino">{isEn ? 'Female' : 'Feminino'}</option><option value="Prefiro não dizer">{isEn ? 'Prefer not to say' : 'Prefiro não dizer'}</option>
                            </select>
                          </div>
                          
                          {/* Logística */}
                          <div>
                            <label style={labelStyle}>{isEn ? 'T-Shirt Size' : 'Tamanho T-Shirt'}</label>
                            <select value={childInfo.tamanho_tshirt || ''} onChange={e => {handleUpdateLocalCrianca(childId, 'tamanho_tshirt', e.target.value); handleSaveDBCrianca(childId, 'tamanho_tshirt', e.target.value);}} style={selectStyle}>
                              <option value="">N/A</option><option value="5-6 Anos">5-6 Anos</option><option value="7-8 Anos">7-8 Anos</option><option value="9-11 Anos">9-11 Anos</option><option value="12-14 Anos">12-14 Anos</option><option value="S Adulto">S</option><option value="M Adulto">M</option><option value="L Adulto">L</option>
                            </select>
                          </div>
                          
                          {/* CORRIGIDO TIPO SANGUINEO - Exatamente igual à T-shirt */}
                          <div>
                            <label style={labelStyle}>{isEn ? 'Blood Type' : 'Tipo Sanguíneo'}</label>
                            <select value={childInfo.tipo_sanguineo || ''} onChange={e => {handleUpdateLocalCrianca(childId, 'tipo_sanguineo', e.target.value); handleSaveDBCrianca(childId, 'tipo_sanguineo', e.target.value);}} style={selectStyle}>
                              <option value="">N/A</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
                            </select>
                          </div>
                          
                          {/* Dados Médicos */}
                          <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #cbd5e1', paddingTop: '1rem', marginTop: '0.5rem' }}>
                            <label style={{...labelStyle, color: '#991b1b'}}>{isEn ? 'Medical Profile' : 'Perfil Médico (Alergias e Condições)'}</label>
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>{isEn ? 'Food Allergies / Restrictions' : 'Alergias Alimentares'}</label>
                            <input type="text" value={childInfo.restricoes_alimentares || ''} onChange={e => handleUpdateLocalCrianca(childId, 'restricoes_alimentares', e.target.value)} onBlur={e => handleSaveDBCrianca(childId, 'restricoes_alimentares', e.target.value)} style={inputStyle} placeholder={isEn ? "None" : "Nenhuma"} />
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>{isEn ? 'Chronic Diseases / Medication' : 'Doenças Crónicas ou Medicação Regular'}</label>
                            <input type="text" value={childInfo.doencas_cronicas || ''} onChange={e => handleUpdateLocalCrianca(childId, 'doencas_cronicas', e.target.value)} onBlur={e => handleSaveDBCrianca(childId, 'doencas_cronicas', e.target.value)} style={inputStyle} placeholder={isEn ? "None" : "Nenhuma"} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PERGUNTAS CUSTOMIZADAS DO CAMPO DE FÉRIAS */}
                    {childInfo && temPerguntasCustomizadas && (
                      <div style={{ marginTop: '1rem', backgroundColor: '#eff6ff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #bfdbfe' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#1e40af', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                          {isEn ? 'Specific Questions for this Camp' : 'Perguntas Específicas do Programa'}
                        </h4>
                        
                        <div style={{ display: 'grid', gap: '1rem' }}>
                          {campo.perguntas_customizadas.map((perguntaOriginal: string, pIdx: number) => {
                            // Mostrar a versão traduzida se for inglês e existir tradução
                            const perguntaVisivel = isEn && campo.perguntas_customizadas_en && campo.perguntas_customizadas_en[pIdx] 
                                                    ? campo.perguntas_customizadas_en[pIdx] 
                                                    : perguntaOriginal;
                            return (
                              <div key={pIdx}>
                                <label style={{...labelStyle, color: '#1e3a8a'}}>{perguntaVisivel} *</label>
                                <input 
                                  type="text" 
                                  required
                                  value={respostasCustomizadas[i]?.[perguntaOriginal] || ''} 
                                  onChange={e => handleRespostaCustomizada(i, perguntaOriginal, e.target.value)} 
                                  style={{...inputStyle, borderColor: '#93c5fd'}}
                                  placeholder={isEn ? 'Your answer...' : 'A sua resposta...'}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>

            <section style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem' }}>{isEn ? 'Secure Payment' : 'Pagamento Seguro'}</h2>
              
              {organizador?.modelo_pagamento === 'parceiro_recebe' ? (
                <div style={{ padding: '1.5rem', backgroundColor: '#f0fdf4', border: '1px solid #059669', borderRadius: '1rem' }}>
                  <p style={{ fontWeight: 'bold', color: '#064e3b', marginBottom: '0.5rem' }}>Transferência Bancária Direta (Parceiro)</p>
                  <p style={{ fontSize: '14px', color: '#334155', margin: 0 }}>Entidade: {organizador.empresa_nome}</p>
                  <p style={{ fontSize: '14px', color: '#334155', margin: 0 }}>IBAN: {organizador.iban}</p>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '1rem' }}>* A sua reserva ficará pendente. O parceiro irá processar este pagamento diretamente e validar a sua inscrição.</p>
                </div>
              ) : (
                <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#0f172a', margin: '0 0 0.5rem 0' }}>Stripe Checkout</p>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Pague de forma 100% segura através de MB WAY, Cartão de Crédito ou Débito.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontWeight: 'bold', color: '#0f172a' }}>
                    <span style={{ fontStyle: 'italic', color: '#005f8f' }}>MB WAY</span>
                    <span style={{ fontSize: '24px' }}>💳</span>
                  </div>
                </div>
              )}
            </section>

            <button type="submit" disabled={processingStripe} style={{ width: '100%', padding: '1.25rem', backgroundColor: '#0f172a', color: 'white', fontSize: '1.125rem', fontWeight: '900', borderRadius: '1rem', border: 'none', cursor: processingStripe ? 'not-allowed' : 'pointer', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)', transition: 'transform 0.2s' }}>
              Confirmar e Pagar {precoFinalTotal}€
            </button>
          </form>
        </div>

        {/* SIDEBAR RESUMO FINANCEIRO */}
        <aside style={{ flex: '1 1 30%', minWidth: '320px', position: 'sticky', top: '2rem' }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '900', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
              {isEn ? 'Booking Summary' : 'Resumo da Reserva'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Programa</span>
                <p style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{turnoSelecionado?.nome || campo?.nome}</p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Duração</span>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#334155', margin: 0 }}>{diasEfetivos} {diasEfetivos === 1 ? 'Dia' : 'Dias'}</p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Preço Programa (x{quantidade})</span>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#334155', margin: 0 }}>{precoBaseUnitario * quantidade}€</p>
              </div>
              
              {totalExtrasPorCrianca > 0 && (
                <div>
                  <span style={{ fontSize: '12px', color: '#059669', fontWeight: 'bold', textTransform: 'uppercase' }}>+ Extras Selecionados</span>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#334155', margin: 0 }}>{totalExtrasPorCrianca * quantidade}€</p>
                </div>
              )}
            </div>

            <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f172a' }}>Total a Pagar</span>
              <span style={{ fontSize: '2rem', fontWeight: '900', color: '#059669' }}>{precoFinalTotal}€</span>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}

const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' as const, marginBottom: '0.4rem' };
const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '14px', color: '#0f172a', outline: 'none' };
// PaddingRight 2.5rem adicionado aqui para resolver o texto cortado
const selectStyle = { padding: '0.75rem 1rem', paddingRight: '2.5rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '14px', fontWeight: '600', color: '#0f172a', outline: 'none', appearance: 'none' as const, cursor: 'pointer', backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' };