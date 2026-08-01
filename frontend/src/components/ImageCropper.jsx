import React, { useState, useRef } from 'react';

/**
 * ImageCropper — canvas-based modal cropper (no external deps).
 *
 * Key design choice: the inner `wrapperRef` is `display: inline-block`
 * so it matches the image's actual rendered dimensions exactly.
 * Mouse coords and overlay positions are all relative to this wrapper.
 * The image uses `width: auto; max-width: 100%; max-height: 380px` so
 * the browser preserves aspect ratio without distortion.
 */
export default function ImageCropper({ imageSrc, onConfirm, onCancel, circular = true }) {
  const wrapperRef = useRef(null); // sized to match image exactly
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const [crop, setCrop] = useState(null);

  /* ── initialise crop after image renders ──────────────────────── */
  const initCrop = () => {
    const img = imgRef.current;
    if (!img) return;
    // offsetWidth/Height are the actual rendered pixels (no distortion)
    const w = img.offsetWidth;
    const h = img.offsetHeight;
    const size = Math.floor(Math.min(w, h) * 0.75);
    setCrop({
      x: Math.floor((w - size) / 2),
      y: Math.floor((h - size) / 2),
      size,
    });
  };

  /* ── helpers ──────────────────────────────────────────────────── */
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const getPos = (e) => {
    const rect = wrapperRef.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  /* ── drag ─────────────────────────────────────────────────────── */
  const startDrag = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getPos(e);
    dragRef.current = { type, sx: pos.x, sy: pos.y, sc: { ...crop } };
  };

  const onMove = (e) => {
    if (!dragRef.current || !imgRef.current) return;
    const W = imgRef.current.offsetWidth;
    const H = imgRef.current.offsetHeight;
    const pos = getPos(e);
    const dx = pos.x - dragRef.current.sx;
    const dy = pos.y - dragRef.current.sy;
    const sc = dragRef.current.sc;

    if (dragRef.current.type === 'move') {
      setCrop({
        size: sc.size,
        x: clamp(sc.x + dx, 0, W - sc.size),
        y: clamp(sc.y + dy, 0, H - sc.size),
      });
    } else {
      // resize: drag bottom-right corner — average dx/dy keeps it square
      const delta = (dx + dy) / 2;
      const newSize = clamp(sc.size + delta, 40, Math.min(W - sc.x, H - sc.y));
      setCrop({ x: sc.x, y: sc.y, size: newSize });
    }
  };

  const stopDrag = () => { dragRef.current = null; };

  /* ── export cropped region via canvas ─────────────────────────── */
  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !crop) return;

    // Scale factors: natural size ÷ displayed size
    const scaleX = img.naturalWidth / img.offsetWidth;
    const scaleY = img.naturalHeight / img.offsetHeight;

    const OUT = 400;
    const canvas = document.createElement('canvas');
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext('2d');

    if (circular) {
      ctx.beginPath();
      ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    ctx.drawImage(
      img,
      Math.round(crop.x * scaleX),
      Math.round(crop.y * scaleY),
      Math.round(crop.size * scaleX),
      Math.round(crop.size * scaleY),
      0, 0, OUT, OUT
    );

    onConfirm(canvas.toDataURL('image/jpeg', 0.88));
  };

  /* ── render ───────────────────────────────────────────────────── */
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
          <h3 style={{ margin: 0, color: 'var(--accent, #d4af37)', fontSize: '1.1rem' }}>
            📷 Bildausschnitt wählen
          </h3>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
            Rahmen verschieben • Ecke <strong>↘</strong> ziehen zum Vergrößern/Verkleinern
          </p>
        </div>

        {/* Outer centering band */}
        <div style={{
          background: '#111',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80px',
          padding: '8px',
        }}>
          {/*
            Inner wrapper: display:inline-block makes it exactly the size
            of the image — no letterbox / empty space to mess up coords.
          */}
          <div
            ref={wrapperRef}
            style={{
              position: 'relative',
              display: 'inline-block',
              lineHeight: 0,
              cursor: 'crosshair',
              userSelect: 'none',
              borderRadius: '4px',
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
              style={{
                display: 'block',
                /* width:auto preserves aspect ratio; max-* constrain size */
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                maxHeight: '380px',
              }}
              draggable={false}
            />

            {crop && (
              <>
                {/* ── four dark overlay segments ── */}
                {/* top */}
                <div style={{
                  position: 'absolute', left: 0, top: 0,
                  width: '100%', height: crop.y,
                  background: 'rgba(0,0,0,0.6)', pointerEvents: 'none',
                }} />
                {/* bottom */}
                <div style={{
                  position: 'absolute', left: 0, top: crop.y + crop.size,
                  width: '100%', height: `calc(100% - ${crop.y + crop.size}px)`,
                  background: 'rgba(0,0,0,0.6)', pointerEvents: 'none',
                }} />
                {/* left */}
                <div style={{
                  position: 'absolute', left: 0, top: crop.y,
                  width: crop.x, height: crop.size,
                  background: 'rgba(0,0,0,0.6)', pointerEvents: 'none',
                }} />
                {/* right */}
                <div style={{
                  position: 'absolute', left: crop.x + crop.size, top: crop.y,
                  right: 0, height: crop.size,
                  background: 'rgba(0,0,0,0.6)', pointerEvents: 'none',
                }} />

                {/* ── crop frame ── */}
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
                      <div style={{
                        position: 'absolute', left: `${p}%`, top: 0, bottom: 0,
                        width: 1, background: 'rgba(255,255,255,0.25)', pointerEvents: 'none',
                      }} />
                      <div style={{
                        position: 'absolute', top: `${p}%`, left: 0, right: 0,
                        height: 1, background: 'rgba(255,255,255,0.25)', pointerEvents: 'none',
                      }} />
                    </React.Fragment>
                  ))}

                  {/* Corner brackets */}
                  {[
                    { top: -2, left: -2 },
                    { top: -2, right: -2 },
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

                  {/* Resize handle */}
                  <div
                    style={{
                      position: 'absolute', right: -10, bottom: -10,
                      width: 22, height: 22,
                      background: 'var(--accent, #d4af37)',
                      borderRadius: '4px',
                      cursor: 'nwse-resize',
                      zIndex: 5,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', color: '#000', fontWeight: '900',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
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
        </div>

        {/* ── action buttons ── */}
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
