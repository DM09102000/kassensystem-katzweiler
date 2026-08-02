import React, { useState, useEffect } from 'react';

/**
 * PwaInstallPrompt — Detects tablet/mobile browser visit and shows a premium PWA installation prompt.
 */
export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already installed & running in standalone app mode
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    
    if (standaloneMode) {
      setIsStandalone(true);
      return;
    }

    // 2. Detect iOS / iPadOS Safari
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document);
    setIsIos(isIosDevice);

    // 3. Listen for Chrome / Android / Edge PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Automatically prompt if user hasn't dismissed it in the last 24h
      const lastDismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!lastDismissed || Date.now() - parseInt(lastDismissed, 10) > 24 * 60 * 60 * 1000) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // On iOS, trigger modal if on mobile/tablet and not dismissed
    if (isIosDevice && !standaloneMode) {
      const lastDismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!lastDismissed || Date.now() - parseInt(lastDismissed, 10) > 24 * 60 * 60 * 1000) {
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      left: '1.5rem',
      maxWidth: '480px',
      margin: '0 auto',
      zIndex: 999999,
      background: 'rgba(15, 23, 42, 0.96)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(212, 175, 55, 0.4)',
      borderRadius: '16px',
      padding: '1.25rem',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 20px rgba(212, 175, 55, 0.2)',
      color: '#fff',
      animation: 'slideUp 0.4s ease-out',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{
          fontSize: '2.2rem',
          background: 'rgba(212, 175, 55, 0.15)',
          padding: '0.6rem 0.8rem',
          borderRadius: '12px',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          flexShrink: 0
        }}>
          📱
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 0.35rem 0', color: 'var(--accent, #d4af37)', fontSize: '1.1rem', fontWeight: '800' }}>
            Als Tablet-App installieren
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.4' }}>
            Nutze das FLB Kantine Kassensystem ohne Browserleiste direkt im Vollbildmodus auf deinem Startbildschirm!
          </p>

          {isIos && (
            <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              💡 Tippe im Browser unten auf <strong>Teilen</strong> <span style={{ fontSize: '1rem' }}>⎋</span> und wähle <strong>„Zum Home-Bildschirm“</strong>.
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            {!isIos && deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="btn btn-accent"
                style={{ flex: 2, padding: '0.6rem 1rem', fontSize: '0.9rem', fontWeight: '700' }}
              >
                📲 Jetzt installieren
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.85rem' }}
            >
              {isIos ? 'Verstanden' : 'Später'}
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
