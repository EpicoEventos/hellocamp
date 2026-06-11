"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function GestaoReservasParceiro({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [campoGrupos, setCampoGrupos] = useState<any[]>([]);
  const [filtroCampoId, setFiltroCampoId] = useState<string>('todos');
  const [filtroTurno, setFiltroTurno] = useState<string>('todos');
  
  const [reservaSelecionada, setReservaSelecionada] = useState<any>(null);

  useEffect(() => {
    const fetchDadosInscritos = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: camposData } = await supabase
        .from('campos')
        .select(`
          id, nome, nome_en, vagas_totais, turnos, contrato_parceiro_url,
          reservas (
            id, turno_nome, valor_total, created_at, extras_escolhidos, status_pagamento, status_reembolso, respostas_customizadas, nome_encarregado, email_encarregado, telefone_encarregado, nif_encarregado,
            criancas (
              nome, nif, data_nascimento, sexo, restricoes_alimentares,
              tipo_sanguineo, doencas_cronicas, medicacao_regular, limitacoes_fisicas,
              sabe_nadar, sabe_andar_bicicleta, tamanho_tshirt
            ),
            perfis:cliente_id (
              nome_completo, email, telefone, nif, contacto_emergencia, pessoas_autorizadas_recolha
            )
          )
        `)
        .eq('organizador_id', session.user.id);

      if (camposData) {
        const listaGrupos = camposData.map((c: any) => {
          const dataOrdenacao = c.turnos && c.turnos[0]?.data_inicio ? c.turnos[0].data_inicio : '9999-12-31';
          
          const inscritos = (c.reservas || []).map((reserva: any) => {
            const dataReserva = new Date(reserva.created_at).getTime();
            const agora = new Date().getTime();
            const minutosPassados = (agora - dataReserva) / (1000 * 60);

            let statusCalculado = reserva.status_pagamento || 'Pendente';
            
            // "Reembolsado" reflete o cancelamento do lado B2B
            if (statusCalculado === 'Reembolsado') {
               statusCalculado = 'Cancelada';
            } else if (statusCalculado === 'Pendente' && minutosPassados > 15) {
               statusCalculado = 'Abandonada';
            }

            const pai = Array.isArray(reserva.perfis) ? reserva.perfis[0] : reserva.perfis;

            return {
              reservaId: reserva.id,
              turno: reserva.turno_nome,
              valor: reserva.valor_total,
              dataReserva: reserva.created_at,
              statusPagamento: statusCalculado,
              extras: reserva.extras_escolhidos,
              respostasCustomizadas: reserva.respostas_customizadas || {},
              crianca: Array.isArray(reserva.criancas) ? reserva.criancas[0] : reserva.criancas,
              paiEncarregado: {
                nome: reserva.nome_encarregado || pai?.nome_completo || 'N/D',
                email: reserva.email_encarregado || pai?.email || 'N/D',
                telefone: reserva.telefone_encarregado || pai?.telefone || 'N/D',
                nif: reserva.nif_encarregado || pai?.nif || 'N/D',
                emergencia: pai?.contacto_emergencia || 'N/D',
                recolha: pai?.pessoas_autorizadas_recolha || 'Apenas o Encarregado'
              },
              campNome: isEn && c.nome_en ? c.nome_en : c.nome
            };
          });

          const realVagasTotais = c.turnos && c.turnos.length > 0
            ? c.turnos.reduce((acc: number, curr: any) => acc + (Number(curr.vagas) || 0), 0)
            : (Number(c.vagas_totais) || 0);

          return {
            id: c.id,
            nome: isEn && c.nome_en ? c.nome_en : c.nome,
            vagas_totais: realVagasTotais,
            turnosDisponiveis: c.turnos || [],
            dataInicioCronologica: dataOrdenacao,
            inscritos: inscritos.sort((a: any, b: any) => new Date(b.dataReserva).getTime() - new Date(a.dataReserva).getTime()),
          };
        });

        setCampoGrupos(listaGrupos.sort((a: any, b: any) => new Date(a.dataInicioCronologica).getTime() - new Date(b.dataInicioCronologica).getTime()));
      }
      setLoading(false);
    };

    fetchDadosInscritos();
  }, [isEn]);

  const obterIdade = (dataNasc: string) => {
    if (!dataNasc) return 0;
    const diff = Date.now() - new Date(dataNasc).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  const temAlertaMedico = (texto: string) => {
    if (!texto) return false;
    const textoLimpo = texto.toLowerCase().trim();
    const palavrasIgnoradas = ["nenhuma", "nenhum", "nao", "não", "nada", "n/a", "no", "none", "-", "sem alergias", "saudavel", "saudável"];
    return !palavrasIgnoradas.includes(textoLimpo);
  };

  let vagasTotaisExibidas = 0;
  let inscritosRows: any[] = [];
  let turnosDoCampoSelecionado: any[] = [];
  let campoNomeFicheiro = "global";

  if (filtroCampoId === 'todos') {
    campoGrupos.forEach(g => {
      vagasTotaisExibidas += g.vagas_totais;
      inscritosRows = [...inscritosRows, ...g.inscritos];
    });
  } else {
    const grupoSelecao = campoGrupos.find(g => g.id === filtroCampoId);
    if (grupoSelecao) {
      vagasTotaisExibidas = grupoSelecao.vagas_totais;
      turnosDoCampoSelecionado = grupoSelecao.turnosDisponiveis;
      campoNomeFicheiro = grupoSelecao.nome.toLowerCase().replace(/\s+/g, '_');
      inscritosRows = [...grupoSelecao.inscritos];
      
      if (filtroTurno !== 'todos') {
        inscritosRows = inscritosRows.filter(i => i.turno === filtroTurno);
        campoNomeFicheiro += `_${filtroTurno.toLowerCase().replace(/\s+/g, '_')}`;
      }
    }
  }

  // APENAS AS RESERVAS VÁLIDAS CONTAM PARA A LOTAÇÃO
  const inscritosValidosCount = inscritosRows.filter(r => r.statusPagamento !== 'Abandonada' && r.statusPagamento !== 'Cancelada').length;

  const exportarFichaMonitoresCSV = () => {
    const validos = inscritosRows.filter(r => r.statusPagamento !== 'Abandonada' && r.statusPagamento !== 'Cancelada');
    if (validos.length === 0) {
      alert("Não existem inscrições ativas no contexto selecionado para exportar.");
      return;
    }

    let csv = "FICHA DE CAMPO - LISTA DE MONITORES\n";
    csv += "Programa;Turno;Nome Participante;Idade;Sexo;Tipo Sanguineo;Alergias/Restricoes Alimentares;Doencas Cronicas;Medicacao Regular;Sabe Nadar;Sabe Andar Bicicleta;T-Shirt;Encarregado Educacao;Telefone Pai;Contacto Emergencia Alternativo;Pessoas Autorizadas Recolha;Respostas Perguntas Customizadas Campo\n";
    
    validos.forEach((item: any) => {
      const c = item.crianca || {};
      const p = item.paiEncarregado || {};
      
      const cAlergias = temAlertaMedico(c.restricoes_alimentares) ? c.restricoes_alimentares.replace(/;/g, ",").replace(/\n/g, " ") : "Nenhuma";
      const cDoencas = temAlertaMedico(c.doencas_cronicas) ? c.doencas_cronicas.replace(/;/g, ",").replace(/\n/g, " ") : "Nenhuma";
      const cMeds = temAlertaMedico(c.medicacao_regular) ? c.medicacao_regular.replace(/;/g, ",").replace(/\n/g, " ") : "Nenhuma";
      const recolha = p.recolha ? p.recolha.replace(/[\;\,\n]/g, " | ") : "Apenas Encarregado";

      let respostasTexto = "";
      if (item.respostasCustomizadas && Object.keys(item.respostasCustomizadas).length > 0) {
        respostasTexto = Object.entries(item.respostasCustomizadas)
          .map(([pergunta, resposta]) => `[${pergunta}: ${resposta}]`)
          .join(" ");
      } else {
        respostasTexto = "Sem perguntas adicionais";
      }

      csv += `"${item.campNome}";"${item.turno}";"${c.nome || ""}";"${c.data_nascimento ? obterIdade(c.data_nascimento) : ""}";"${c.sexo || ""}";"${c.tipo_sanguineo || "N/A"}";"${cAlergias}";"${cDoencas}";"${cMeds}";"${c.sabe_nadar || "N/A"}";"${c.sabe_andar_bicicleta || "N/A"}";"${c.tamanho_tshirt || "N/A"}";"${p.nome || "N/A"}";"${p.telefone || "N/A"}";"${p.emergencia || "N/A"}";"${recolha}";"${respostasTexto}"\n`;
    });

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `ficha_monitores_${campoNomeFicheiro}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>A carregar dados logísticos e nominais...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif', paddingBottom: '4rem', maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
            {isEn ? 'Logistics Dashboard' : 'Gestão Logística de Vagas'}
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem' }}>
            {isEn ? 'Real-time metrics, demography, and logistics data.' : 'Lista nominal, fichas clínicas e controlo de capacidade.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', minWidth: '350px' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={dropdownLabelStyle}>{isEn ? 'Select Camp' : 'Filtrar por Campo'}</label>
            <select value={filtroCampoId} onChange={(e) => { setFiltroCampoId(e.target.value); setFiltroTurno('todos'); }} style={selectDropdownStyle}>
              <option value="todos">{isEn ? 'All Active Camps' : 'Visão Global (Todos os Campos)'}</option>
              {campoGrupos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          {filtroCampoId !== 'todos' && turnosDoCampoSelecionado.length > 0 && (
            <div style={{ flex: '1 1 150px' }}>
              <label style={dropdownLabelStyle}>{isEn ? 'Select Shift' : 'Filtrar por Turno'}</label>
              <select value={filtroTurno} onChange={(e) => setFiltroTurno(e.target.value)} style={selectDropdownStyle}>
                <option value="todos">{isEn ? 'All Shifts' : 'Todos os Turnos'}</option>
                {turnosDoCampoSelecionado.map((t: any, idx: number) => (
                  <option key={idx} value={t.nome}>{t.nome}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>{isEn ? 'TOTAL CAPACITY' : 'LOTAÇÃO MÁXIMA'}</span>
            <span style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a' }}>{vagasTotaisExibidas}</span>
          </div>
          <div style={{ ...statCardStyle, borderLeft: '4px solid #059669' }}>
            <span style={statLabelStyle}>{isEn ? 'ACTIVE ENROLLMENTS' : 'LUGARES OCUPADOS'}</span>
            <span style={{ fontSize: '2rem', fontWeight: '900', color: '#059669' }}>{inscritosValidosCount}</span>
          </div>
          <div style={{ ...statCardStyle, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' }}>
            <button onClick={exportarFichaMonitoresCSV} disabled={inscritosValidosCount === 0} style={{ backgroundColor: inscritosValidosCount === 0 ? '#cbd5e1' : '#059669', color: 'white', border: 'none', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: inscritosValidosCount === 0 ? 'not-allowed' : 'pointer', fontSize: '13px', width: '100%', textAlign: 'center', boxShadow: '0 4px 12px rgba(5,150,105,0.15)' }}>
              📥 {isEn ? 'Export Sheet for Monitors' : 'Ficha Excel (Monitores)'}
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '1.25rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#334155', textTransform: 'uppercase' }}>{isEn ? 'NOMINAL ROSTER' : 'LISTA DE PARTICIPANTES'}</h3>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            {inscritosRows.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>
                Não existem inscrições registadas.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fdfdfd' }}>
                    <th style={thStyle}>{isEn ? 'PARTICIPANT' : 'MIÚDO / PROGRAMA'}</th>
                    <th style={thStyle}>{isEn ? 'AGE' : 'IDADE'}</th>
                    <th style={thStyle}>{isEn ? 'HEALTH/DIET' : 'SAÚDE'}</th>
                    <th style={thStyle}>{isEn ? 'SHIFT' : 'TURNO / VALOR'}</th>
                    <th style={thStyle}>{isEn ? 'PAYMENT' : 'ESTADO FINANÇAS'}</th>
                    <th style={thStyle}>{isEn ? 'ACTIONS' : 'AÇÕES'}</th>
                  </tr>
                </thead>
                <tbody>
                  {inscritosRows.map((item: any, idx: number) => {
                    const temAlerta = temAlertaMedico(item.crianca?.restricoes_alimentares) || temAlertaMedico(item.crianca?.doencas_cronicas) || temAlertaMedico(item.crianca?.medicacao_regular);
                    const isInativa = item.statusPagamento === 'Abandonada' || item.statusPagamento === 'Cancelada';
                    
                    return (
                      <tr key={idx} style={{ borderBottom: idx !== inscritosRows.length - 1 ? '1px solid #f1f5f9' : 'none', opacity: isInativa ? 0.6 : 1 }}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 'bold', color: '#0f172a', textDecoration: isInativa ? 'line-through' : 'none' }}>{item.crianca?.nome || 'N/A'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>🏕️ {item.campNome}</div>
                        </td>
                        <td style={tdStyle}>{item.crianca?.data_nascimento ? `${obterIdade(item.crianca.data_nascimento)} anos` : '-'}</td>
                        <td style={tdStyle}>
                          {temAlerta && !isInativa ? (
                            <span style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '11px', fontWeight: 'bold', border: '1px solid #fecaca' }}>
                              ⚠️ Alerta Médico
                            </span>
                          ) : <span style={{ color: '#94a3b8' }}>-</span>}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: '600' }}>
                          {item.turno} <div style={{ fontSize: '11px', color: isInativa ? '#94a3b8' : '#0f172a', fontWeight: 'bold', marginTop: '2px' }}>{item.valor}€</div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ 
                            backgroundColor: item.statusPagamento === 'Pago' || item.statusPagamento === 'Sinal Pago' ? '#ecfdf5' : (item.statusPagamento === 'Cancelada' ? '#fef2f2' : '#f1f5f9'), 
                            color: item.statusPagamento === 'Pago' || item.statusPagamento === 'Sinal Pago' ? '#059669' : (item.statusPagamento === 'Cancelada' ? '#dc2626' : '#64748b'), 
                            border: `1px solid ${item.statusPagamento === 'Pago' || item.statusPagamento === 'Sinal Pago' ? '#a7f3d0' : (item.statusPagamento === 'Cancelada' ? '#fecaca' : '#cbd5e1')}`, 
                            padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase'
                          }}>
                            {item.statusPagamento}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <button onClick={() => setReservaSelecionada(item)} style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                            {isEn ? 'View Data' : 'Ver Ficha'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {reservaSelecionada && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '850px', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            <div style={{ padding: '1.5rem 2rem', backgroundColor: reservaSelecionada.statusPagamento === 'Cancelada' || reservaSelecionada.statusPagamento === 'Abandonada' ? '#dc2626' : '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900' }}>Ficha de Participante {(reservaSelecionada.statusPagamento === 'Cancelada' || reservaSelecionada.statusPagamento === 'Abandonada') && '(Inscrição Anulada)'}</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#cbd5e1', fontSize: '12px', fontFamily: 'monospace' }}>Ref: {reservaSelecionada.reservaId}</p>
              </div>
              <button onClick={() => setReservaSelecionada(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>

            <div style={{ padding: '2rem', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                
                <div style={modalCardStyle}>
                  <h3 style={modalTitleStyle}>👦 {isEn ? 'Participant Data' : 'Identificação'}</h3>
                  <DetailRow label="Nome" value={reservaSelecionada.crianca?.nome} />
                  <DetailRow label="Data Nasc." value={reservaSelecionada.crianca?.data_nascimento} />
                  <DetailRow label="Género" value={reservaSelecionada.crianca?.sexo} />
                  <DetailRow label="NIF Criança" value={reservaSelecionada.crianca?.nif} />
                  
                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Características Físicas</h4>
                    <DetailRow label="Sabe nadar?" value={reservaSelecionada.crianca?.sabe_nadar} />
                    <DetailRow label="Andar bicicleta?" value={reservaSelecionada.crianca?.sabe_andar_bicicleta} />
                    <DetailRow label="T-Shirt" value={reservaSelecionada.crianca?.tamanho_tshirt} />
                  </div>
                </div>

                <div style={{...modalCardStyle, borderColor: '#fecaca'}}>
                  <h3 style={{...modalTitleStyle, color: '#991b1b'}}>🏥 {isEn ? 'Medical Profile' : 'Perfil Clínico e Restrições'}</h3>
                  <DetailRow label="Tipo Sanguíneo" value={reservaSelecionada.crianca?.tipo_sanguineo} />
                  
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff7ed', borderRadius: '0.5rem', border: '1px solid #fed7aa' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#c2410c', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Alergias Alimentares</span>
                    <span style={{ fontSize: '14px', color: '#9a3412', fontWeight: 'bold' }}>{reservaSelecionada.crianca?.restricoes_alimentares || 'Nenhuma declarada'}</span>
                  </div>
                  
                  <div style={{ marginTop: '1rem' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#991b1b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Doenças Crónicas</span>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '13px', color: '#475569', fontWeight: '600' }}>{reservaSelecionada.crianca?.doencas_cronicas || 'Nenhuma'}</p>
                    
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#991b1b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Medicação Regular</span>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '13px', color: '#475569', fontWeight: '600' }}>{reservaSelecionada.crianca?.medicacao_regular || 'Nenhuma'}</p>

                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#991b1b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Limitações Físicas</span>
                    <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontWeight: '600' }}>{reservaSelecionada.crianca?.limitacoes_fisicas || 'Nenhuma'}</p>
                  </div>
                </div>

                {reservaSelecionada.respostasCustomizadas && Object.keys(reservaSelecionada.respostasCustomizadas).length > 0 && (
                  <div style={{ ...modalCardStyle, gridColumn: '1 / -1', borderLeft: '4px solid #3b82f6', backgroundColor: '#eff6ff' }}>
                    <h3 style={{...modalTitleStyle, color: '#1e40af', borderColor: '#bfdbfe'}}>📋 Respostas ao Formulário do Campo</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {Object.entries(reservaSelecionada.respostasCustomizadas).map(([pergunta, resposta]: any, idx: number) => (
                        <div key={idx} style={{ borderBottom: '1px solid #dbeafe', paddingBottom: '0.5rem' }}>
                          <span style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '0.25rem' }}>{pergunta}</span>
                          <span style={{ fontSize: '14px', color: '#334155', fontWeight: '700' }}>{resposta || 'Sem resposta'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ ...modalCardStyle, gridColumn: '1 / -1' }}>
                  <h3 style={modalTitleStyle}>🛡️ Logística de Recolha e Responsável</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                    <div>
                      <DetailRow label="Responsável" value={reservaSelecionada.paiEncarregado?.nome} />
                      <DetailRow label="Telefone" value={reservaSelecionada.paiEncarregado?.telefone} />
                      <DetailRow label="Email" value={reservaSelecionada.paiEncarregado?.email} />
                      <DetailRow label="NIF Cliente" value={reservaSelecionada.paiEncarregado?.nif} />
                    </div>
                    <div>
                      <div style={{ padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fecaca', marginBottom: '1rem' }}>
                        <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#e11d48', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Contacto de Emergência (Em caso de falha do pai)</span>
                        <span style={{ fontSize: '14px', color: '#9f1239', fontWeight: 'bold' }}>{reservaSelecionada.paiEncarregado?.emergencia}</span>
                      </div>
                      <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                        <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#059669', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Identificação de quem levanta a criança</span>
                        <span style={{ fontSize: '13px', color: '#064e3b', fontWeight: '600', whiteSpace: 'pre-wrap' }}>{reservaSelecionada.paiEncarregado?.recolha}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

const statCardStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem', backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' };
const statLabelStyle = { fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em' };
const dropdownLabelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase' as const, marginBottom: '0.4rem' };
const thStyle = { padding: '1rem 1.5rem', fontSize: '11px', fontWeight: '800', color: '#475569', letterSpacing: '0.05em', whiteSpace: 'nowrap' as const };
const tdStyle = { padding: '1.25rem 1.5rem', color: '#334155', verticalAlign: 'middle' };
const selectDropdownStyle = { width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#0f172a', fontWeight: '700', fontSize: '14px', outline: 'none', appearance: 'none' as const, cursor: 'pointer', backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' };
const modalCardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' };
const modalTitleStyle = { margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: '900', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' };

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.25rem' }}>
    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>{label}:</span>
    <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700', textAlign: 'right', marginLeft: '1rem' }}>{value || 'N/D'}</span>
  </div>
);