'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

interface ChatBubbleProps {
  onClose: () => void;
  spiderX?: number; // vw
  spiderY?: number; // vh
}

export const WHATSAPP_NUMBER = '51923593993';

function SpideyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <ellipse cx="32" cy="34" rx="6" ry="10" fill="currentColor" />
      <circle cx="32" cy="20" r="4.2" fill="currentColor" />
      <path d="M27 18 C18 12 12 12 4 4 M26 22 C16 20 8 20 1 15 M26 28 C17 30 9 33 3 41 M28 36 C21 42 16 48 14 58"
        stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M37 18 C46 12 52 12 60 4 M38 22 C48 20 56 20 63 15 M38 28 C47 30 55 33 61 41 M36 36 C43 42 48 48 50 58"
        stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function WebCorner({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      {[20, 40, 60, 80].map((r) => (
        <path key={r} d={`M0 0 Q ${r * 0.35} ${r * 0.62} ${r} ${r * 0.78} Q ${r * 0.62} ${r * 0.62} ${r * 0.78} ${r}`} stroke="currentColor" strokeWidth="1" opacity="0.25" />
      ))}
      <path d="M0 0 L96 0 M0 0 L0 96 M0 0 L68 68" stroke="currentColor" strokeWidth="1" opacity="0.35" />
    </svg>
  );
}

export function ChatBubble({ onClose, spiderX = 88, spiderY = 80 }: ChatBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('Hola Asahel, me gustaría hablar sobre un proyecto.');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Small delay so the entrance animation is visible
    const t = requestAnimationFrame(() => setIsVisible(true));
    const focusT = setTimeout(() => inputRef.current?.focus(), 400);
    return () => { cancelAnimationFrame(t); clearTimeout(focusT); };
  }, []);

  const handleSend = () => {
    const encodedText = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Position: smart placement ────────────────────────────
  const position = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

    if (isMobile) {
      // Mobile: chat at bottom, spider visible above
      return {
        top: 'auto' as const,
        bottom: '0px',
        left: '0px',
        right: '0px',
        width: '100%',
        maxWidth: 'none',
        borderRadius: '16px 16px 0 0',
        transformOrigin: 'bottom center',
      };
    }

    // Desktop: position tightly beside spider, always fully on-screen
    const spiderPxX = (spiderX / 100) * vw;
    const spiderPxY = (spiderY / 100) * vh;
    const chatW = 340;
    const gap = 12; // Gap between spider and chat

    // Height budget: the real rendered height may reach max-h (min 500px, viewport-constrained).
    // Use the actual available height to guarantee it never overflows the screen.
    const maxChatH = Math.min(500, vh - 96); // 100dvh - 6rem upper margin
    const chatH = maxChatH;
    // Effective right margin so the chat never touches the screen edge
    const screenMargin = 16;

    // Strategy: prefer placing chat to the LEFT of spider, vertically centered on it.
    let right = vw - spiderPxX + gap;
    let top = spiderPxY - chatH / 2;

    // Keep within the top edge
    const minTop = screenMargin;
    if (top < minTop) top = minTop;

    // Keep within the bottom edge (this is where the old bug was: used 440 not real height)
    if (top + chatH > vh - screenMargin) {
      top = vh - chatH - screenMargin;
    }

    // If chat would go off the right edge, flip to the left of the spider instead
    if (right + chatW > vw - screenMargin) {
      right = vw - spiderPxX - chatW - gap;
      // Re-clamp for the flipped side too
      if (right < screenMargin) right = screenMargin;
    }

    return {
      top: `${Math.round(top)}px`,
      bottom: 'auto' as const,
      right: `${Math.round(right)}px`,
      left: 'auto' as const,
      width: `${chatW}px`,
      maxWidth: 'none',
      transformOrigin: 'top right',
    };
  }, [spiderX, spiderY]);

  return (
    <div
      ref={containerRef}
      className={`
        fixed rounded-2xl overflow-hidden z-[85]
        bg-[var(--bg)] border border-[#e23636]/40 shadow-[0_18px_60px_rgba(226,54,54,0.18)]
        max-h-[min(500px,calc(100dvh-6rem))] overflow-y-auto
        ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3'}
      `}
      style={{
        ...position,
        transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      role="dialog"
      aria-label="Chat de WhatsApp"
      onKeyDown={handleKeyDown}
    >
      {/* ── Header ──────────────────────────────────── */}
      <div
        className="relative p-4 flex items-center justify-between text-white"
        style={{
          background: 'linear-gradient(135deg, #7f1010 0%, #b11313 45%, #e23636 70%, #7f1010 100%)',
        }}
      >
        <WebCorner className="absolute top-0 right-0 w-24 h-24 text-white pointer-events-none" />
        <WebCorner className="absolute bottom-0 left-0 w-16 h-16 rotate-180 text-white pointer-events-none opacity-70" />

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-black/45 border border-white/25 flex items-center justify-center shadow-inner">
            <SpideyIcon className="w-8 h-8 text-[#e23636] drop-shadow-[0_0_6px_rgba(255,80,80,0.65)]" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight tracking-tight">¿Hablamos?</h3>
            <p className="text-sm text-white/85">Tejemos tu web · respuesta en menos de 24h</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="relative text-white/90 hover:text-white hover:bg-black/30 rounded-full p-1.5 transition-colors"
          aria-label="Cerrar chat"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Body ────────────────────────────────────── */}
      <div
        className="p-4"
        style={{
          backgroundImage:
            'radial-gradient(circle at top right, rgba(226,54,54,0.07) 0%, transparent 42%), repeating-linear-gradient(45deg, transparent 0 14px, rgba(226,54,54,0.03) 14px 15px)',
        }}
      >
        <div className="relative mb-4 ml-1">
          <div className="rounded-xl rounded-tl-sm border border-[#e23636]/25 bg-[var(--bg-elevated)] p-3">
            <p className="text-[var(--fg)] text-sm leading-relaxed">
              Hola 👋 Soy la araña de <strong>Asahel</strong>. Cuéntame qué quieres construir y
              te envío una propuesta técnica clara en menos de 24 horas.
            </p>
            <span className="text-xs text-[var(--muted)] mt-1 block font-mono">{"// respuesta < 24h"}</span>
          </div>
          <span className="absolute -left-1.5 top-3 w-3 h-3 rotate-45 bg-[var(--bg-elevated)] border-l border-b border-[#e23636]/25" />
        </div>

        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe tu mensaje..."
          rows={3}
          aria-label="Mensaje para WhatsApp"
          className="w-full rounded-xl p-3 resize-none text-[var(--fg)] bg-[var(--bg)] border border-[var(--border)]
                     focus:outline-none focus:ring-2 focus:ring-[#e23636]/60 focus:border-transparent transition-all"
        />

        <button
          onClick={handleSend}
          className="w-full mt-3 py-3 rounded-xl font-bold text-white transition-all
                     flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98]
                     shadow-[0_6px_20px_rgba(178,19,19,0.35)]"
          style={{ background: 'linear-gradient(135deg, #b11313, #e23636)' }}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Abrir WhatsApp
        </button>

        <p className="mt-2 text-center text-xs text-[var(--muted)] font-mono">
          +51 923 593 993 · Lima, Perú
        </p>
      </div>
    </div>
  );
}
