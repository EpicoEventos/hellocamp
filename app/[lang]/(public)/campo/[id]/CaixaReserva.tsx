"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react";

export default function CaixaReserva({ campo, lang, dict }: { campo: any, lang: string, dict: any }) {
  const router = useRouter();
  const isEn = lang === 'en';

  const [quantidade, setQuantidade] = useState(1);
  
  // 1. Extrair turnos
  const turnos = isEn && campo.turnos_en && campo.turnos_en.length > 0 ? campo.turnos_en : (campo.turnos || []);
  const temTurnos = turnos.length > 0;
  
  const [turnoIndex, setTurnoIndex] = useState(0);
  const turnoSelecionado = temTurnos ? turnos[turnoIndex] : null;

  // Estado para escolher quantos dias (se o turno permitir)
  const [diasEscolhidos, setDiasEscolhidos] = useState<number | 'full'>('full');

  // Resetar a escolha dos dias sempre que muda de turno
  useEffect(() => {
    setDiasEscolhidos('full');
  }, [turnoIndex]);

  // 2. Extras
  const [extraAlimentacao, setExtraAlimentacao] = useState(false);
  const [extraAlojamento, setExtraAlojamento] = useState(false);
  const [extraProlongamento, setExtraProlongamento] = useState(false);
  const [extraTransporte, setExtraTransporte] = useState(false);

  const valAlimentacao = campo.extra_alimentacao || 0;
  const valAlojamento = campo.extra_alojamento || 0;
  const valProlongamento = campo.extra_prolongamento || 0;
  const valTransporte = campo.extra_transporte || 0;

  // 3. Cálculos Complexos
  let precoBase = 0;
  let diasParaCalculo = 5;

  if (turnoSelecionado) {
    const diasBaseTurno = Number(turnoSelecionado.dias) || campo.duracao_dias || 5;
    if (turnoSelecionado.permite_dias && diasEscolhidos !== 'full') {
      precoBase = Number(turnoSelecionado.preco_dia) * diasEscolhidos;
      diasParaCalculo = diasEscolhidos;
    } else {
      precoBase = Number(turnoSelecionado.preco);
      diasParaCalculo = diasBaseTurno;
    }
  } else {
    precoBase = Number(campo.preco) || 0;
    diasParaCalculo = campo.duracao_dias || 5;
  }

  const noitesDormida = Math.max(1, diasParaCalculo - 1);

  let totalExtras = 0;
  if (extraAlimentacao) totalExtras += (valAlimentacao * diasParaCalculo);
  if (extraAlojamento) totalExtras += (valAlojamento * noitesDormida);
  if (extraProlongamento) totalExtras += (valProlongamento * diasParaCalculo);
  if (extraTransporte) totalExtras += (valTransporte * diasParaCalculo);

  const precoTotal = (precoBase + totalExtras) * quantidade;

  // 4. Formatar Data
  const formatarData = (dStr: string) => {
    if (!dStr) return '';
    return new Date(dStr).toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { day: '2-digit', month: '2-digit' });
  };

  const handleReservar = () => {
    const params = new URLSearchParams();
    params.set("quantidade_criancas", quantidade.toString());
    
    if (temTurnos) {
      params.set("turno", JSON.stringify(campo.turnos[turnoIndex]));
    }
    
    params.set("dias_inscritos", diasEscolhidos.toString());
    
    if (extraAlimentacao) params.set("ext_alimentacao", "true");
    if (extraAlojamento) params.set("ext_alojamento", "true");
    if (extraProlongamento) params.set("ext_prolongamento", "true");
    if (extraTransporte) params.set("ext_transporte", "true");

    router.push(`/${lang}/checkout/${campo.id}?${params.toString()}`);
  };

  const disabledReserva = !temTurnos || precoBase === 0;

  // VERIFICAÇÃO DE ESCASSEZ (SCARCITY)
  const vagasTurno = turnoSelecionado ? Number(turnoSelecionado.vagas) : 0;
  const mostrarEscassez = turnoSelecionado && vagasTurno > 0 && vagasTurno <= 3;

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 sticky top-8 w-full">
      
      {/* PREÇO BASE */}
      <div className="mb-8">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
          {isEn ? 'Starting from' : 'A partir de'}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-slate-900 leading-none">{precoBase}€</span>
          <span className="text-sm font-bold text-slate-500">/ {isEn ? 'child' : 'criança'}</span>
        </div>
      </div>

      {/* SELETOR DE TURNOS */}
      <div className="mb-6">
        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{isEn ? 'Select Shift' : 'Selecione o Turno'}</label>
        {temTurnos ? (
          <select 
            value={turnoIndex} 
            onChange={(e) => setTurnoIndex(Number(e.target.value))} 
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-emerald-500"
            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
          >
            {turnos.map((t: any, i: number) => (
              <option key={i} value={i}>{t.nome} ({formatarData(t.data_inicio)} - {formatarData(t.data_fim)})</option>
            ))}
          </select>
        ) : (
          <div className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-400">
            {isEn ? 'Dates to be defined' : 'Datas a definir'}
          </div>
        )}
      </div>

      {/* SELETOR DE DIAS (Se permitido) */}
      {turnoSelecionado?.permite_dias && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
          <label className="block text-xs font-black text-emerald-700 uppercase tracking-widest mb-2">{isEn ? 'Select Duration' : 'Duração da Inscrição'}</label>
          <select 
            value={diasEscolhidos} 
            onChange={(e) => setDiasEscolhidos(e.target.value === 'full' ? 'full' : Number(e.target.value))} 
            className="w-full p-3 bg-white border border-emerald-200 rounded-lg text-sm font-bold text-emerald-800 outline-none appearance-none cursor-pointer focus:border-emerald-500"
            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23047857' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
          >
            <option value="full">{isEn ? 'Full Shift' : 'Turno Completo'} ({turnoSelecionado.preco}€)</option>
            {Array.from({ length: Number(turnoSelecionado.dias) || campo.duracao_dias || 5 }).map((_, i) => {
              const dias = i + 1;
              if (dias === (Number(turnoSelecionado.dias) || campo.duracao_dias || 5)) return null; 
              return (
                <option key={dias} value={dias}>
                  {dias} {isEn ? (dias === 1 ? 'Day' : 'Days') : (dias === 1 ? 'Dia' : 'Dias')} ({Number(turnoSelecionado.preco_dia) * dias}€)
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* EXTRAS OPCIONAIS */}
      {(valAlimentacao > 0 || valAlojamento > 0 || valProlongamento > 0 || valTransporte > 0) && (
        <div className="mb-6 border-t border-slate-100 pt-6">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">{isEn ? 'Optional Extras' : 'Extras Opcionais'}</p>
          <div className="flex flex-col gap-3">
            {valAlimentacao > 0 && <ExtraCheckbox icon="🍎" label={isEn ? 'Meals' : 'Alimentação'} price={valAlimentacao * diasParaCalculo} active={extraAlimentacao} onChange={() => setExtraAlimentacao(!extraAlimentacao)} />}
            {valAlojamento > 0 && <ExtraCheckbox icon="🏕️" label={isEn ? 'Sleepover' : 'Dormida'} price={valAlojamento * noitesDormida} active={extraAlojamento} onChange={() => setExtraAlojamento(!extraAlojamento)} />}
            {valProlongamento > 0 && <ExtraCheckbox icon="⏰" label={isEn ? 'Extended Hours' : 'Horário Extra'} price={valProlongamento * diasParaCalculo} active={extraProlongamento} onChange={() => setExtraProlongamento(!extraProlongamento)} />}
            {valTransporte > 0 && <ExtraCheckbox icon="🚌" label={isEn ? 'Transport' : 'Transporte'} price={valTransporte * diasParaCalculo} active={extraTransporte} onChange={() => setExtraTransporte(!extraTransporte)} />}
          </div>
        </div>
      )}

      {/* QUANTIDADE DE CRIANÇAS */}
      <div className="mb-8 border-t border-slate-100 pt-6">
        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">{isEn ? 'Number of Children' : 'Quantidade de Crianças'}</label>
        <div className="flex items-center gap-4">
          <button onClick={() => setQuantidade(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 text-slate-600 font-black text-lg hover:bg-slate-100 transition-colors shadow-sm flex items-center justify-center">-</button>
          <span className="text-2xl font-black text-slate-900 w-8 text-center">{quantidade}</span>
          <button onClick={() => setQuantidade(q => q + 1)} className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 text-slate-600 font-black text-lg hover:bg-slate-100 transition-colors shadow-sm flex items-center justify-center">+</button>
        </div>
      </div>

      {/* TOTAL */}
      <div className="bg-slate-50 p-6 rounded-2xl mb-6 flex justify-between items-center border border-slate-100">
        <span className="text-lg font-black text-slate-900">Total</span>
        <span className="text-3xl font-black text-emerald-600">{precoTotal}€</span>
      </div>

      {/* ESCASSEZ ELEGANTE (Apenas visível se vagas <= 3) */}
      {mostrarEscassez && (
        <p className="text-center text-sm font-black text-red-500 mb-3 animate-pulse">
          🔥 {isEn ? `Only ${vagasTurno} spots left in this shift!` : `Apenas ${vagasTurno} vagas restantes neste turno!`}
        </p>
      )}

      {/* BOTÃO DE RESERVA */}
      <button 
        onClick={handleReservar} 
        disabled={disabledReserva} 
        className={`w-full py-4 rounded-xl text-lg font-black transition-all ${disabledReserva ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#EBA914] hover:bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:-translate-y-1'}`}
      >
        {isEn ? 'Book Spot Now' : 'Reservar Vaga Agora'}
      </button>

      {/* SELOS DE CONFIANÇA (TRUST BADGES) */}
      <div className="flex items-center justify-center gap-5 mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <span className="text-base leading-none">🛡️</span> {isEn ? 'Free Cancelation*' : 'Cancelamento Gratuito*'}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <span className="text-base leading-none">🔒</span> {isEn ? 'Secure Payment' : 'Pagamento Seguro'}
        </div>
      </div>
      
      {disabledReserva && (
        <p className="text-center text-xs text-red-500 mt-4 font-bold">
          {isEn ? 'No shifts defined yet.' : 'Reserva indisponível. Turnos não definidos.'}
        </p>
      )}
    </div>
  );
}

// Subcomponente para as caixas de Extra
function ExtraCheckbox({ icon, label, price, active, onChange }: { icon: string, label: string, price: number, active: boolean, onChange: () => void }) {
  return (
    <label className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border-2 ${active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={active} onChange={onChange} className="w-5 h-5 accent-emerald-600 cursor-pointer" />
        <span className={`text-sm ${active ? 'font-black text-emerald-900' : 'font-bold text-slate-600'}`}>{icon} {label}</span>
      </div>
      <span className={`text-sm font-black ${active ? 'text-emerald-600' : 'text-slate-400'}`}>+{price}€</span>
    </label>
  );
}