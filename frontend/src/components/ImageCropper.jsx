import React, { useState, useRef } from 'react';

/**
 * ImageCropper — reusable modal cropper using canvas.
 * Props:
 *   imageSrc   string  — data URL of the raw file
 *   onConfirm  (base64: string) => void
 *   onCancel   () => void
 *   circular   boolean (default true) — show circular preview outline
 */
export default function ImageCropper({ imageSrc, onConfirm, onCancel, circular = true }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const [crop, setCrop] = useState(null);

  /* ── init: called once after img loads ─────────────────────── */
  const initCrop = () => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.offsetWidth;
    const h = img.offsetHeight;
    const size = Math.floor(Math.min(w, h) * 0.75);
    setCrop({
      x: Math.floor((w - size) / 2),
      y: Math.floor((h - size) / 2),
      size,
    });
  };

  /* ── helpers ────────────────────────────────────────────────── */
  const clamp = (val, lo, hi) => Math.max(lo, Math.min(hi, val));

  const getMousePos = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  /* ── drag handlers ──────────────────────────────────────────── */
  const startDrag = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getMousePos(e);
    dragRef.current = { type, sx: pos.x, sy: pos.y, sc: { ...crop } };
  };

  const onMove = (e) => {
    if (!dragRef.current) return;
    const img = imgRef.current;
    const W = img.offsetWidth;
    const H = img.offsetHeight;
    const pos = getMousePos(e);
    const dx = pos.x - dragRef.current.sx;
    const dy = pos.y - dragRef.current.sy;
    const sc = dragRef.current.sc;

    if (dragRef.current.type === 'move') {
      setCrop({
        size: sc.size,
        x: clamp(sc.x + dx, 0, W - sc.size),
        y: clamp(sc.y + dy, 0, H - sc.size),
      });
    } else { // resize: drag bottom-right corner
      const delta = (dx + dy) / 2;
      const newSize = clamp(sc.size + delta, 40, Math.min(W - sc.x, H - sc.y));
      setCrop({ x: sc.x, y: sc.y, size: newSize });
    }
  };

  const stopDrag = () => { dragRef.current = null; };

  /* ── confirm: draw to canvas and export ─────────────────────── */
  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !crop) return;

    const scaleX = img.naturalWidth / img.offsetWidth;
    const scaleY = img.naturalHeight / img.offsetHeight;

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    if (circular) {
      // clip to circle
      ctx.beginPath();
      ctx.arc(200, 200, 200, 0, Math.PI * 2);
      ctx.clip();
    }

    ctx.drawImage(
      img,
      Math.round(crop.x * scaleX),
      Math.round(crop.y * scaleY),
      Math.round(crop.size * scaleX),
      Math.round(crop.size * scaleY),
      0, 0, 400, 400
    );

    onConfirm(canvas.toDataURL('image/jpeg', 0.88));
  };

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.88)',
      zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--surface, #1a1a2e)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '1.5rem',
        width: '100%', maxWidth: '540px',
        display: 'flex', flexDirection: 'column', gap: '1rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--accent, #d4af37)', fontSize: '1.1rem' }}>📷 Bildausschnitt wählen</h3>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
            Rahmen verschieben • Ecke ziehen zum Skalieren
          </p>
        </div>

        {/* ── crop area ── */}
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            background: '#000',
            borderRadius: '8px',
            overflow: 'hidden',
            cursor: 'crosshair',
            userSelect: 'none',
            lineHeight: 0,
          }}
          onMouseMove={onMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onTouchMove={onMove}
          onTouchEnd={stopDrag}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            onLoad={initCrop}
            alt=""
            style={{ display: 'block', width: '100%', height: 'auto', maxHeight: '380px' }}
            draggable={false}
          />

          {crop && (
            <>
              {/* Four dark overlay segments */}
              <div style={{ position:'absolute', inset:'0 0 auto 0', height: crop.y,           background:'rgba(0,0,0,0.62)', pointerEvents:'none' }} />
              <div style={{ position:'absolute', inset:`${crop.y+crop.size}px 0 0 0`,          background:'rgba(0,0,0,0.62)', pointerEvents:'none' }} />
              <div style={{ position:'absolute', top: crop.y, left:0, width: crop.x, height: crop.size, background:'rgba(0,0,0,0.62)', pointerEvents:'none' }} />
              <div style={{ position:'absolute', top: crop.y, left: crop.x+crop.size, right:0, height: crop.size, background:'rgba(0,0,0,0.62)', pointerEvents:'none' }} />

              {/* Crop frame */}
              <div
                style={{
                  position: 'absolute',
                  left: crop.x, top: crop.y,
                  width: crop.size, height: crop.size,
                  border: '2px solid var(--accent, #d4af37)',
                  borderRadius: circular ? '50%' : '4px',
                  boxSizing: 'border-box',
                  cursor: 'move',
                }}
                onMouseDown={(e) => startDrag(e, 'move')}
                onTouchStart={(e) => startDrag(e, 'move')}
              >
                {/* Rule-of-thirds grid */}
                {[33.33, 66.67].map(p => (
                  <React.Fragment key={p}>
                    <div style={{ position:'absolute', left:`${p}%`, top:0, bottom:0, width:1, background:'rgba(255,255,255,0.22)', pointerEvents:'none' }} />
                    <div style={{ position:'absolute', top:`${p}%`, left:0, right:0, height:1, background:'rgba(255,255,255,0.22)', pointerEvents:'none' }} />
                  </React.Fragment>
                ))}

                {/* Corner brackets (cosmetic) */}
                {[
                  { top: -2,   left: -2 },
                  { top: -2,   right: -2 },
                  { bottom: -2, left: -2 },
                  { bottom: -2, right: -2 },
                ].map((pos, i) => (
                  <div key={i} style={{
                    position: 'absolute', ...pos,
                    width: 12, height: 12,
                    border: '2px solid var(--accent, #d4af37)',
                    pointerEvents: 'none',
                  }} />
                ))}

                {/* Resize handle (bottom-right) */}
                <div
                  style={{
                    position: 'absolute', right: -9, bottom: -9,
                    width: 20, height: 20,
                    background: 'var(--accent, #d4af37)',
                    borderRadius: '4px',
                    cursor: 'nwse-resize',
                    zIndex: 5,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', color: '#000', fontWeight: '700',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                  }}
                  onMouseDown={(e) => { e.stopPropagation(); startDrag(e, 'resize'); }}
                  onTouchStart={(e) => { e.stopPropagation(); startDrag(e, 'resize'); }}
                >
                  ↘
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── buttons ── */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '0.75rem' }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-accent"
            style={{ flex: 2, padding: '0.75rem', fontWeight: '700' }}
            disabled={!crop}
          >
            ✓ Ausschnitt übernehmen
          </button>
        </div>
      </div>
    </div>
  );
}
