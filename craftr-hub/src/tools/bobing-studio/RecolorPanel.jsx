import React from 'react';
import { QUICK_COLORS } from './config.js';

function normalizeHex(value, fallback = '#777777') {
  const cleaned = String(value || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(cleaned)) return cleaned;
  if (/^[0-9a-f]{6}$/i.test(cleaned)) return `#${cleaned}`;
  return fallback;
}

export default function RecolorPanel({
  targetColor,
  setTargetColor,
  colorName,
  setColorName,
  recolorRegion,
  setRecolorRegion,
  detectedColors,
  onToggleDetectedColor,
  onDetectColors,
  onSaveColor,
  favoriteColors,
  busy,
  baseImage,
}) {
  return (
    <section className="group">
      <h2 className="group-title">Recolor Variant</h2>
      <p className="hint">
        Ubah warna produk untuk varian marketplace, sambil menjaga motif, jahitan, siluet, lighting, dan tekstur.
      </p>

      {/* Smart detect */}
      <button
        className={`btn${busy && /Detecting/i.test('') ? ' is-loading' : ''}`}
        type="button"
        disabled={!baseImage || busy}
        onClick={onDetectColors}
      >
        Smart Detect Colors
      </button>

      {/* Detected colors list */}
      <div className="detect-list">
        {detectedColors.length === 0 ? (
          <div className="hint" style={{ margin: 0 }}>
            Belum ada hasil deteksi. Klik Smart Detect Colors untuk produk kombinasi 2 warna atau lebih.
          </div>
        ) : (
          <>
            <div className="hint" style={{ margin: 0 }}>
              Checklist area yang ingin diubah warnanya. Area yang tidak dicentang akan dipertahankan warna aslinya.
            </div>
            {detectedColors.map((item, index) => {
              const hex = normalizeHex(item.originalHex);
              return (
                <label key={index} className="detect-item">
                  <input
                    type="checkbox"
                    checked={item.selected !== false}
                    onChange={() => onToggleDetectedColor(index)}
                    disabled={busy}
                  />
                  <span className="detect-swatch" style={{ background: hex }} />
                  <span className="detect-copy">
                    <strong>{item.originalColor} {hex}</strong>
                    <span>{item.partDescription}</span>
                  </span>
                </label>
              );
            })}
          </>
        )}
      </div>

      {/* Target color picker */}
      <div className="field">
        <label htmlFor="targetColor">Warna tujuan</label>
        <input
          id="targetColor"
          type="color"
          value={targetColor}
          onChange={(e) => setTargetColor(e.target.value)}
          disabled={busy}
        />
      </div>

      {/* Quick color swatches */}
      <div className="swatches">
        {QUICK_COLORS.map(([name, hex]) => (
          <button
            key={hex}
            className={`swatch${hex === targetColor ? ' active' : ''}`}
            type="button"
            title={name}
            aria-label={name}
            style={{ background: hex }}
            disabled={busy}
            onClick={() => { setTargetColor(hex); setColorName(name.toLowerCase()); }}
          />
        ))}
      </div>

      {/* Save favorite */}
      <button className="btn" type="button" disabled={busy} onClick={onSaveColor}>
        Save Favorite Color
      </button>

      {/* Favorite colors grid */}
      {favoriteColors.length > 0 && (
        <div className="favorite-colors">
          {favoriteColors.map(([name, hex], index) => (
            <button
              key={`${hex}-${index}`}
              className={`swatch${hex === targetColor ? ' active' : ''}`}
              type="button"
              title={name}
              aria-label={name}
              style={{ background: hex }}
              disabled={busy}
              onClick={() => { setTargetColor(hex); setColorName(name.toLowerCase()); }}
            />
          ))}
        </div>
      )}

      {/* Color name */}
      <div className="field">
        <label htmlFor="colorName">Nama warna</label>
        <input
          id="colorName"
          type="text"
          placeholder="sage green, dusty pink, navy, maroon"
          value={colorName}
          onChange={(e) => setColorName(e.target.value)}
          disabled={busy}
        />
      </div>

      {/* Recolor region */}
      <div className="field">
        <label htmlFor="recolorRegion">Area yang diubah</label>
        <textarea
          id="recolorRegion"
          placeholder="Contoh: ubah warna kain utama saja. Jangan ubah bordir, kancing, label, kulit model, atau background."
          value={recolorRegion}
          onChange={(e) => setRecolorRegion(e.target.value)}
          disabled={busy}
        />
      </div>
    </section>
  );
}
