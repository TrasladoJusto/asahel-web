'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const navLinks = [
  { href: '/work', label: 'Trabajos' },
  { href: '/process', label: 'Proceso' },
  { href: '/about', label: 'Sobre mí' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const closeMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  // Body scroll lock
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Focus first link on open
  useEffect(() => {
    if (isMobileMenuOpen) {
      requestAnimationFrame(() => firstLinkRef.current?.focus());
    }
  }, [isMobileMenuOpen]);

  // Escape key closes menu
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, closeMenu]);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled((prev) => {
        const scrolled = window.scrollY > 20;
        return prev === scrolled ? prev : scrolled;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close on scroll
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleScroll = () => closeMenu();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen, closeMenu]);

  const drawerContent = (
    <>
      {/* Backdrop - fixed to viewport */}
      <div
        className={`fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Drawer Panel - fixed to viewport */}
      <div
        id="mobile-menu"
        className={`fixed bottom-0 right-0 top-0 z-[95] flex w-[min(85vw,340px)] flex-col border-l border-[var(--border)] bg-[var(--bg)] px-8 pb-10 pt-28 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        {/* Close button inside drawer */}
        <button
          type="button"
          onClick={closeMenu}
          className="absolute right-6 top-6 z-[100] flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--fg)] transition-colors hover:bg-[var(--fg)] hover:text-[var(--bg)]"
          aria-label="Cerrar menú"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <line x1="4" y1="4" x2="14" y2="14" />
            <line x1="14" y1="4" x2="4" y2="14" />
          </svg>
        </button>

        {/* Nav links */}
        <nav className="flex flex-col gap-1" aria-label="Menú móvil">
          {navLinks.map((link, index) => (
            <a
              key={link.href}
              ref={index === 0 ? firstLinkRef : undefined}
              href={link.href}
              onClick={closeMenu}
              className="group relative border-b border-[var(--border)] px-1 py-3 text-[22px] font-medium tracking-[-0.01em] text-[var(--fg)] transition-colors duration-200 last:border-b-0 hover:text-[var(--accent)]"
              style={{
                transitionDelay: isMobileMenuOpen ? `${index * 60 + 100}ms` : '0ms',
                opacity: isMobileMenuOpen ? 1 : 0,
                transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(20px)',
                transitionProperty: 'opacity, transform, color',
                transitionDuration: '0.3s, 0.3s, 0.2s',
                transitionTimingFunction: 'ease, ease, ease',
              }}
            >
              {link.label}
            </a>
          ))}
          {/* Contacto en el menú móvil */}
          <a
            href="/contact"
            onClick={closeMenu}
            className="group relative px-1 py-3 text-[22px] font-medium tracking-[-0.01em] text-[var(--accent)] transition-colors duration-200 hover:text-[var(--accent-hover)]"
            style={{
              transitionDelay: isMobileMenuOpen ? `${navLinks.length * 60 + 100}ms` : '0ms',
              opacity: isMobileMenuOpen ? 1 : 0,
              transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(20px)',
              transitionProperty: 'opacity, transform, color',
              transitionDuration: '0.3s, 0.3s, 0.2s',
              transitionTimingFunction: 'ease, ease, ease',
            }}
          >
            Contacto
          </a>
        </nav>

        {/* Contact CTA at bottom */}
        <div className="mt-auto border-t border-[var(--border)] pt-8">
          <a
            href="mailto:asahel20tj@hotmail.com"
            onClick={closeMenu}
            className="flex items-center gap-2 font-mono text-sm text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            asahel20tj@hotmail.com
          </a>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Navbar bar */}
      <header
        className={`fixed left-0 right-0 top-0 z-[80] transition-all duration-300 ${
          isScrolled
            ? 'bg-[var(--bg)]/90 border-b border-[var(--border)] backdrop-blur-md'
            : 'bg-transparent'
        }`}
        role="navigation"
        aria-label="Navegación principal"
      >
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="flex h-[64px] items-center justify-between sm:h-[72px]">
            {/* Logo */}
            <a href="/" className="group flex items-center gap-2.5" aria-label="Asahel - Inicio">
              <span className="font-heading text-[20px] font-medium tracking-[-0.03em] text-[var(--fg)] sm:text-[22px]">
                Asahel
              </span>
              <span
                className="select-none text-[18px] text-[var(--accent)] transition-transform duration-200 group-hover:rotate-90 sm:text-[20px]"
                aria-hidden="true"
              >
                ✳︎
              </span>
            </a>

            {/* Desktop Nav Links */}
            <nav
              className="hidden items-center gap-1 md:flex"
              aria-label="Navegación de escritorio"
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="hover:bg-[var(--fg)]/[0.04] relative rounded-lg px-4 py-2 text-[15px] font-medium tracking-[0.01em] text-[var(--fg)] transition-colors hover:text-[var(--accent)]"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/contact"
                className="border-[var(--accent)]/30 ml-3 rounded-full border px-4 py-2 font-mono text-[13px] font-medium tracking-[0.02em] text-[var(--accent)] transition-all duration-200 hover:bg-[var(--accent)] hover:text-[var(--bg)]"
              >
                Contacto
              </a>
            </nav>

            {/* Mobile Hamburger */}
            <button
              type="button"
              className={`relative z-[100] flex h-10 w-10 items-center justify-center md:hidden ${isMobileMenuOpen ? 'pointer-events-none' : ''}`}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span
                className={`absolute h-[1.5px] w-5 rounded-full bg-[var(--fg)] transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] ${
                  isMobileMenuOpen ? 'translate-y-0 rotate-45' : '-translate-y-[6px]'
                }`}
              />
              <span
                className={`absolute h-[1.5px] w-5 rounded-full bg-[var(--fg)] transition-all duration-200 ${
                  isMobileMenuOpen ? 'scale-x-0 opacity-0' : 'translate-y-[6px]'
                }`}
              />
              <span
                className={`absolute h-[1.5px] w-5 rounded-full bg-[var(--fg)] transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] ${
                  isMobileMenuOpen ? 'translate-y-0 -rotate-45' : 'translate-y-[6px]'
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer + backdrop via portal to body */}
      {mounted && createPortal(drawerContent, document.body)}
    </>
  );
}
