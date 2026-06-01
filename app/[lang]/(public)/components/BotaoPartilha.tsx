"use client";

import { useState } from "react";

interface BotaoPartilhaProps {
  url: string;
  titulo: string;
}

export default function BotaoPartilha({ url, titulo }: BotaoPartilhaProps) {
  const [copiado, setCopiado] = useState(false);

  const handlePartilhar = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Tenta usar a API nativa de partilha (funciona muito bem em mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: titulo,
          url: url,
        });
      } catch (error) {
        console.error("Erro ao partilhar:", error);
      }
    } else {
      // 2. Fallback: Copiar para a área de transferência se estiver em desktop sem suporte
      try {
        await navigator.clipboard.writeText(url);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000); // Esconde a mensagem após 2 segundos
      } catch (err) {
        console.error("Erro ao copiar o link:", err);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handlePartilhar}
        className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:scale-110 transition-transform outline-none z-20"
        title="Partilhar"
      >
        {copiado ? (
          // Ícone de Sucesso (Check)
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          // Ícone de Partilha (Share Nodes)
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-colors">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
        )}
      </button>

      {/* Tooltip de Feedback para o Fallback de Cópia */}
      {copiado && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
          Link copiado!
        </div>
      )}
    </div>
  );
}