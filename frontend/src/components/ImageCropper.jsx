import React, { useState, useRef } from 'react';

/**
 * ImageCropper — canvas-based modal cropper (no external deps).
 *
 * Props:
 *   imageSrc    string  — data URL of the raw file
 *   onConfirm   (base64: string) => void
 *   onCancel    () => void
 *   aspectRatio number  — width/height ratio of the output (e.g. 1 for square, 3 for 3:1)
 *   circular    boolean — render a circular outline (forces 1:1 output)
 *
 * Design:
 *   The inner wrapperRef is display:inline-block so it matches the
 *   image's actual rendered dimensions exactly — no letterbox offset.
 *   The image uses width:auto + max-* so the browser preserves aspect
 *   ratio without distortion.
 */
export default function ImageCropper({
  imageSrc,
  onConfirm,
  onCancel,
  aspectRatio = 1,   // width ÷ height
  circular = false,
}) {
  const wrapperRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const [crop, setCrop] = useState(null); // { x, y, w, h }

  /* ── init crop centered in image ─────────────────────────────── */
  const initCrop = () => {
    const img = imgRef.current;
    if (!img) return;
    const W = img.offsetWidth;
    const H = img.offsetHeight;

    // Largest crop that fits and matches aspectRatio
    let cw, ch;
    if (W / H >= aspectRatio) {
      // image is wider → constrain by height
      ch = Math.floor(H * 0.85);
      cw = Math.floor(ch * aspectRatio);
    } else {
      // image is taller → constrain by width
      cw = Math.floor(W * 0.85);
      ch = Math.floor(cw / aspectRatio);
    }

    setCrop({
      x: Math.floor((W - cw) / 2),
      y: Math.floor((H - ch) / 2),
      w: cw,
      h: ch,
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
        w: sc.w, h: sc.h,
        x: clamp(sc.x + dx, 0, W - sc.w),
        y: clamp(sc.y + dy, 0, H - sc.h),
      });
    } else {
      // Resize: drag bottom-right corner.
      // Use the axis with greater movement to drive scaling,
      // then derive the other axis from aspectRatio.
      const dMax = Math.max(Math.abs(dx), Math.abs(dy));
      const sign = (dx + dy) > 0 ? 1 : -1;
      const delta = sign * dMax;

      // Try width-driven first
      let newW = clamp(sc.w + delta, 30, W - sc.x);
      let newH = Math.round(newW / aspectRatio);
      if (newH > H - sc.y) {
        newH = H - sc.y;
        newW = Math.round(newH * aspectRatio);
      }
      newW = Math.max(30, newW);
      newH = Math.max(Math.round(30 / aspectRatio), newH);

      setCrop({ x: sc.x, y: sc.y, w: newW, h: newH });
    }
  };

  const stopDrag = () => { dragRef.current = null; };

  /* ── export via canvas ────────────────────────────────────────── */
  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !crop) return;

    const scaleX = img.naturalWidth / img.offsetWidth;
    const scaleY = img.naturalHeight / img.offsetHeight;

    // Output canvas matches the display aspect ratio
    const OUT_W = 800;
    const OUT_H = Math.round(OUT_W / aspectRatio);

    const canvas = document.createElement('canvas');
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext('2d');

    if (circular) {
      ctx.beginPath();
      ctx.arc(OUT_W / 2, OUT_H / 2, Math.min(OUT_W, OUT_H) / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    ctx.drawImage(
      img,
      Math.round(crop.x * scaleX),
      Math.round(crop.y * scaleY),
      Math.round(crop.w * scaleX),
      Math.round(crop.h * scaleY),
      0, 0, OUT_W, OUT_H
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
        width: '100%', maxWidth: '560px',
        display: 'flex', flexDirection: 'column', gap: '1rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--accent, #d4af37)', fontSize: '1.1rem' }}>
            📷 Bildausschnitt wählen
          </h3>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
            Rahmen verschieben&nbsp;•&nbsp;Ecke <strong style={{ color: 'var(--accent,#d4af37)' }}>↘</strong> ziehen zum Skalieren
          </p>
        </div>

        {/* Outer centering band */}
        <div style={{
          background: '#111',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '8px',
          minHeight: '80px',
        }}>
          {/*
            Inner wrapper: inline-block → exactly matches rendered image size.
            position:relative needed so absolute children use this as origin.
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
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                maxHeight: '420px',
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
                  background: 'rgba(0,0,0,0.65)', pointerEvents: 'none',
                }} />
                {/* bottom */}
                <div style={{
                  position: 'absolute', left: 0, top: crop.y + crop.h,
                  width: '100%', height: `calc(100% - ${crop.y + crop.h}px)`,
                  background: 'rgba(0,0,0,0.65)', pointerEvents: 'none',
                }} />
                {/* left */}
                <div style={{
                  position: 'absolute', left: 0, top: crop.y,
                  width: crop.x, height: crop.h,
                  background: 'rgba(0,0,0,0.65)', pointerEvents: 'none',
                }} />
                {/* right */}
                <div style={{
                  position: 'absolute', left: crop.x + crop.w, top: crop.y,
                  right: 0, height: crop.h,
                  background: 'rgba(0,0,0,0.65)', pointerEvents: 'none',
                }} />

                {/* ── crop frame ── */}
                <div
                  style={{
                    position: 'absolute',
                    left: crop.x, top: crop.y,
                    width: crop.w, height: crop.h,
                    border: '2px solid var(--accent, #d4af37)',
                    borderRadius: circular ? '50%' : '3px',
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

                  {/* Resize handle — bottom-right */}
                  <div
                    style={{
                      position: 'absolute', right: -11, bottom: -11,
                      width: 24, height: 24,
                      background: 'var(--accent, #d4af37)',
                      borderRadius: '5px',
                      cursor: 'nwse-resize',
                      zIndex: 5,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', color: '#000', fontWeight: '900',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
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

        {/* Aspect ratio hint */}
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
          {circular
            ? 'Kreiszuschnitt 1:1 — wie das Profilbild angezeigt wird'
            : `Seitenverhältnis ${aspectRatio % 1 === 0 ? aspectRatio + ':1' : aspectRatio.toFixed(2) + ':1'} — wie das Bild angezeigt wird`}
        </p>

        {/* Buttons */}
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
