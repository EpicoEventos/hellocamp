"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function GestaoReservasParceiro({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [reservas, setReservas] = useState<any[]>([]);
  const [reservaSelecionada, setReservaSelecionada] = useState<any>(null);

  useEffect(() => {
    const carregarReservas = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('reservas')
        .select(`
          id, created_at, valor_total, status_pagamento, turno_nome, extras_escolhidos,
          criancas ( nome, data_nascimento, sexo, restricoes_alimentares ),
          perfis ( nome_completo, email, telefone, nif, contacto_emergencia, pessoas_autorizadas_recolha ),
          campos ( nome )
        `)
        .eq('organizador_id', session.user.id)
        .order('created_at', { ascending: false });

      setReservas(data || []);
      setLoading(false);
    };
    carregarReservas();
  }, []);

  const safeExtract = (obj: any) => Array.isArray(obj) ? obj[0] : obj;

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>{isEn ? 'Loading bookings...' : 'A carregar as suas reservas...'}</div>;

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', padding: '2rem 1.5rem' }}>
      
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
          {isEn ? 'Bookings Management' : 'Gestão de Inscrições'}
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '15px' }}>
          {isEn ? 'Click on any participant to view full emergency and booking details.' : 'Clique no nome de qualquer participante para aceder à Ficha Completa (Segurança, Alergias, Pagamentos).'}
        </p>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {reservas.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            {isEn ? 'You have no bookings yet.' : 'Ainda não tem reservas efetuadas.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={thStyle}>{isEn ? 'Date' : 'Data'}</th>
                  <th style={thStyle}>{isEn ? 'Camp / Shift' : 'Campo / Turno'}</th>
                  <th style={thStyle}>{isEn ? 'Participant' : 'Participante'}</th>
                  <th style={thStyle}>{isEn ? 'Guardian' : 'Encarregado'}</th>
                  <th style={thStyle}>{isEn ? 'Status' : 'Estado'}</th>
                  <th style={thStyle}>{isEn ? 'Actions' : 'Ações'}</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((reserva) => {
                  const crianca = safeExtract(reserva.criancas) || {};
                  const pai = safeExtract(reserva.perfis) || {};
                  const campo = safeExtract(reserva.campos) || {};

                  return (
                    <tr key={reserva.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                      <td style={tdStyle}>{new Date(reserva.created_at).toLocaleDateString()}</td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{campo.nome}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{reserva.turno_nome}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 'bold', color: '#059669', cursor: 'pointer' }} onClick={() => setReservaSelecionada(reserva)}>
                          👦 {crianca.nome || 'N/A'}
                        </span>
                        {crianca.restricoes_alimentares && <span style={{ marginLeft: '8px', fontSize: '12px' }} title={isEn ? "Allergies" : "Alergias"}>⚠️</span>}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ color: '#334155', fontWeight: '600' }}>{pai.nome_completo || (isEn ? 'No Name' : 'Sem Nome')}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{pai.telefone}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold', backgroundColor: reserva.status_pagamento === 'Pago' ? '#ecfdf5' : '#fef3c7', color: reserva.status_pagamento === 'Pago' ? '#059669' : '#b45309' }}>
                          {reserva.status_pagamento === 'Pago' ? (isEn ? 'Paid' : 'Pago') : (isEn ? 'Pending' : 'Pendente')}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => setReservaSelecionada(reserva)} style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                          {isEn ? 'View Details' : 'Ver Ficha'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reservaSelecionada && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '800px', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            <div style={{ padding: '1.5rem 2rem', backgroundColor: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900' }}>{isEn ? 'Booking Details' : 'Ficha de Inscrição'}</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Ref: {reservaSelecionada.id}</p>
              </div>
              <button onClick={() => setReservaSelecionada(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>

            <div style={{ padding: '2rem', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                
                <div style={modalCardStyle}>
                  <h3 style={modalTitleStyle}>👦 {isEn ? 'Participant Data' : 'Dados do Participante'}</h3>
                  <DetailRow label={isEn ? "Name" : "Nome"} value={safeExtract(reservaSelecionada.criancas)?.nome} />
                  <DetailRow label={isEn ? "Birth Date" : "Data Nasc."} value={safeExtract(reservaSelecionada.criancas)?.data_nascimento} />
                  <DetailRow label={isEn ? "Gender" : "Género"} value={safeExtract(reservaSelecionada.criancas)?.sexo} />
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff7ed', borderRadius: '0.5rem', border: '1px solid #fed7aa' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#c2410c', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{isEn ? 'Allergies / Restrictions' : 'Alergias / Restrições'}</span>
                    <span style={{ fontSize: '14px', color: '#9a3412', fontWeight: 'bold' }}>{safeExtract(reservaSelecionada.criancas)?.restricoes_alimentares || (isEn ? 'None declared' : 'Nenhuma declarada')}</span>
                  </div>
                </div>

                <div style={modalCardStyle}>
                  <h3 style={modalTitleStyle}>🛡️ {isEn ? 'Security & Contacts (Guardian)' : 'Segurança e Contactos (Pai/Mãe)'}</h3>
                  <DetailRow label={isEn ? "Guardian" : "Encarregado"} value={safeExtract(reservaSelecionada.perfis)?.nome_completo} />
                  <DetailRow label={isEn ? "Phone" : "Telemóvel"} value={safeExtract(reservaSelecionada.perfis)?.telefone} />
                  <DetailRow label="Email" value={safeExtract(reservaSelecionada.perfis)?.email} />
                  <DetailRow label="NIF" value={safeExtract(reservaSelecionada.perfis)?.nif || (isEn ? 'Not provided' : 'Não fornecido')} />
                  
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fecaca' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#e11d48', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{isEn ? 'Emergency Contact (Alt.)' : 'Contacto de Emergência (Alt.)'}</span>
                    <span style={{ fontSize: '14px', color: '#9f1239', fontWeight: 'bold' }}>{safeExtract(reservaSelecionada.perfis)?.contacto_emergencia || (isEn ? '⚠️ Missing Data' : '⚠️ Faltam Dados')}</span>
                  </div>

                  <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#059669', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{isEn ? 'Authorized Pickup Persons' : 'Autorizados a Levantar'}</span>
                    <span style={{ fontSize: '14px', color: '#064e3b', fontWeight: '600', whiteSpace: 'pre-wrap' }}>{safeExtract(reservaSelecionada.perfis)?.pessoas_autorizadas_recolha || (isEn ? '⚠️ Missing Data' : '⚠️ Faltam Dados')}</span>
                  </div>
                </div>

                <div style={{ ...modalCardStyle, gridColumn: '1 / -1' }}>
                  <h3 style={modalTitleStyle}>📅 {isEn ? 'Program Details' : 'Detalhes do Programa'}</h3>
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <DetailRow label={isEn ? "Program / Shift" : "Programa/Turno"} value={reservaSelecionada.turno_nome} />
                      <DetailRow label={isEn ? "Effective Days" : "Dias Efetivos"} value={reservaSelecionada.extras_escolhidos?.dias_inscritos || (isEn ? 'Full Week' : 'Semana Completa')} />
                      <DetailRow label={isEn ? "Financial Status" : "Estado Financeiro"} value={reservaSelecionada.status_pagamento === 'Pago' ? (isEn ? 'Paid' : 'Pago') : (isEn ? 'Pending' : 'Pendente')} />
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '0.5rem' }}>
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{isEn ? 'Extras Contracted:' : 'Extras Contratados:'}</span>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '14px', color: '#334155', fontWeight: '600' }}>
                        {reservaSelecionada.extras_escolhidos?.extAlimentacao ? <li>{isEn ? 'Meals Included' : 'Refeições Incluídas'}</li> : null}
                        {reservaSelecionada.extras_escolhidos?.extAlojamento ? <li>{isEn ? 'Accommodation' : 'Alojamento/Dormida'}</li> : null}
                        {reservaSelecionada.extras_escolhidos?.extTransporte ? <li>{isEn ? 'Transport' : 'Transporte'}</li> : null}
                        {reservaSelecionada.extras_escolhidos?.extProlongamento ? <li>{isEn ? 'Extended Hours' : 'Prolongamento de Horário'}</li> : null}
                        {!reservaSelecionada.extras_escolhidos?.extAlimentacao && !reservaSelecionada.extras_escolhidos?.extAlojamento && !reservaSelecionada.extras_escolhidos?.extTransporte && !reservaSelecionada.extras_escolhidos?.extProlongamento && <li>{isEn ? 'No extras selected' : 'Nenhum extra selecionado'}</li>}
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}

const thStyle = { padding: '1rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' as const, fontSize: '12px' };
const tdStyle = { padding: '1rem 1rem', verticalAlign: 'middle' as const };
const modalCardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const modalTitleStyle = { margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: '900', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' };

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.25rem' }}>
    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>{label}:</span>
    <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700', textAlign: 'right' }}>{value || 'N/A'}</span>
  </div>
);