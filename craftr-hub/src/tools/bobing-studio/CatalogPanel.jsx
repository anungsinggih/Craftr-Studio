import React from 'react';
import { CATALOG_STYLES, SUBJECT_TYPES, MODEL_POSES } from './config.js';

export default function CatalogPanel({
  productName,
  setProductName,
  catalogStyle,
  setCatalogStyle,
  subjectType,
  setSubjectType,
  modelPose,
  setModelPose,
  productHint,
  setProductHint,
  poseRelevant,
  busy,
}) {
  return (
    <section className="group">
      <h2 className="group-title">Catalog Setup</h2>

      <div className="field">
        <label htmlFor="productName">Nama produk</label>
        <input
          id="productName"
          type="text"
          placeholder="contoh: koko-halim-sage"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          disabled={busy}
        />
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="catalogStyle">Preset</label>
          <select
            id="catalogStyle"
            value={catalogStyle}
            onChange={(e) => setCatalogStyle(e.target.value)}
            disabled={busy}
          >
            {CATALOG_STYLES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="subjectType">Subject</label>
          <select
            id="subjectType"
            value={subjectType}
            onChange={(e) => setSubjectType(e.target.value)}
            disabled={busy}
          >
            {SUBJECT_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={`field${!poseRelevant ? ' is-muted' : ''}`}>
        <label htmlFor="modelPose">Pose model</label>
        <select
          id="modelPose"
          value={modelPose}
          onChange={(e) => setModelPose(e.target.value)}
          disabled={busy || !poseRelevant}
        >
          {MODEL_POSES.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="productHint">Catatan</label>
        <textarea
          id="productHint"
          placeholder="Contoh: koko pria, tunik muslimah, hijab motif, detail penting."
          value={productHint}
          onChange={(e) => setProductHint(e.target.value)}
          disabled={busy}
        />
      </div>
    </section>
  );
}
