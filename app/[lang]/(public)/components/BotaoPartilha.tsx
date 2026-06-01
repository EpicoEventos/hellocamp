"use client";

import { useState, useEffect } from "react";

interface BotaoPartilhaProps {
  url: string;
  titulo: string;
  isEn?: boolean;
}

export default function BotaoPartilha({ url, titulo, isEn = false }: BotaoPartilhaProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Bloquear o scroll do body quando a lightbox estiver aberta
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  const openModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const closeModal = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsModalOpen(false);
  };

  return (
    <>
      {/* BOTÃO DE TRIGGER DA PÁGINA */}
      <button
        onClick={openModal}
        className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:scale-110 transition-transform outline-none z-20"
        title={isEn ? "Share" : "Partilhar"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-colors">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      </button>

      {/* LIGHTBOX DE PARTILHA (IDÊNTICA AO DASHBOARD) */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col transform transition-transform" 
            onClick={e => e.stopPropagation()}
          >
            {/* Header da Lightbox */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-xl">{isEn ? 'Share this camp' : 'Partilhar este campo'}</h3>
              <button 
                onClick={closeModal} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            {/* Preview do que está a ser partilhado */}
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl border border-emerald-100 shrink-0">
                  🏕️
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">HELLO CAMP</p>
                  <p className="text-base font-black text-slate-900 leading-tight">{titulo}</p>
                </div>
              </div>
            </div>

            {/* Grelha de Botões de Partilha */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <button 
                onClick={handleCopyLink}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-900 transition-colors group text-left outline-none"
              >
                <div className="text-slate-700 group-hover:text-slate-900">
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  )}
                </div>
                <span className={`text-sm font-bold ${copied ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {copied ? (isEn ? 'Copied!' : 'Copiado!') : (isEn ? 'Copy link' : 'Copiar ligação')}
                </span>
              </button>

              <a 
                href={`mailto:?subject=${encodeURIComponent(isEn ? `HelloCamp: ${titulo}` : `HelloCamp: ${titulo}`)}&body=${encodeURIComponent(isEn ? `Check out this holiday camp I found on HelloCamp:\n\n${url}` : `Vê este campo de férias que encontrei na HelloCamp:\n\n${url}`)}`}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-900 transition-colors group no-underline"
              >
                <div className="text-slate-700 group-hover:text-slate-900">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <span className="text-sm font-bold text-slate-800">{isEn ? 'Email' : 'Enviar e-mail'}</span>
              </a>

              <a 
                href={`https://wa.me/?text=${encodeURIComponent(isEn ? `Check out this holiday camp: ${url}` : `Vê este campo de férias: ${url}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-emerald-500 transition-colors group no-underline"
              >
                <div className="text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                </div>
                <span className="text-sm font-bold text-slate-800">WhatsApp</span>
              </a>

              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-600 transition-colors group no-underline"
              >
                <div className="text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </div>
                <span className="text-sm font-bold text-slate-800">Facebook</span>
              </a>

              <a 
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(isEn ? `Check out this camp on HelloCamp: ${titulo}` : `Vê este campo na HelloCamp: ${titulo}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-900 transition-colors group no-underline"
              >
                <div className="text-slate-900">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.73 15H20L8.27 4H4zm14 0L10.27 15H4l7.73-15H18z"></path></svg>
                </div>
                <span className="text-sm font-bold text-slate-800">X (Twitter)</span>
              </a>

            </div>
          </div>
        </div>
      )}
    </>
  );
}