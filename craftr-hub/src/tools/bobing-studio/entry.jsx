import React from 'react';
import { createRoot } from 'react-dom/client';
import { ToolShell, Card, Button, Field } from '../../shared/ui.jsx';
import '../../shared/tool-template.css';
import './bobing-tool.css';
import {
  buildCatalogPrompt,
  buildRecolorPrompt,
  DETECT_COLORS_PROMPT,
} from './prompts.js';
import {
  API_MODEL,
  API_KEY,
  MAX_UPLOAD_BYTES,
  QUICK_COLORS,
  CATALOG_STYLES,
  SUBJECT_TYPES,
  MODEL_POSES,
  CATALOG_SET_VARIANTS,
  QUICK_RECOLOR_COLORS,
  STORAGE_KEY,
} from './config.js';
import CatalogPanel from './CatalogPanel.jsx';
import RecolorPanel from './RecolorPanel.jsx';
import ResultViewer from './ResultViewer.jsx';
import CompareSlider from './CompareSlider.jsx';
import HistoryStrip from './HistoryStrip.jsx';

/* ─── Helpers ────────────────────────────────────────────────────────── */

function normalizeHex(value, fallback = '#777777') {
  const cleaned = String(value || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(cleaned)) return cleaned;
  if (/^[0-9a-f]{6}$/i.test(cleaned)) return `#${cleaned}`;
  return fallback;
}

function slugify(value, fallback = 'image') {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || fallback;
}

function downscale(dataUrl, maxSize = 1536, mime = 'image/jpeg', quality = 0.92) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * ratio);
      canvas.height = Math.round(image.height * ratio);
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL(mime, quality));
    };
    image.onerror = () => reject(new Error('Gambar tidak valid.'));
    image.src = dataUrl;
  });
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(new Error('File tidak bisa dibaca.'));
    reader.readAsDataURL(file);
  });
}

/* ─── API helpers ────────────────────────────────────────────────────── */

async function backoffFetch(url, options, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    if ((response.status === 429 || response.status >= 500) && attempt < retries) {
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      continue;
    }
    const text = await response.text().catch(() => '');
    throw new Error(`API error ${response.status}: ${text.slice(0, 200)}`);
  }
}

function buildApiUrl() {
  return `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=${API_KEY}`;
}

async function requestImage(baseImage, baseMime, prompt, temperature = 0.16) {
  const mimeType = baseMime || 'image/jpeg';
  const base64Data = baseImage.replace(/^data:[^;]+;base64,/, '');

  const body = {
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      temperature,
    },
  };

  const response = await backoffFetch(buildApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData);
  if (!imagePart) throw new Error('No image returned from API.');
  const outMime = imagePart.inlineData.mimeType || 'image/png';
  return `data:${outMime};base64,${imagePart.inlineData.data}`;
}

async function detectColorsApi(baseImage, baseMime) {
  const mimeType = baseMime || 'image/jpeg';
  const base64Data = baseImage.replace(/^data:[^;]+;base64,/, '');

  const body = {
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: DETECT_COLORS_PROMPT },
        ],
      },
    ],
    generationConfig: { temperature: 0.1 },
  };

  const response = await backoffFetch(buildApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const textPart = parts.find((p) => p.text);
  if (!textPart) throw new Error('No response from color detection.');
  const raw = textPart.text.replace(/```json\s*|```/g, '').trim();
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Invalid color detection result.');
  return parsed.slice(0, 6).map((item) => ({
    originalColor: item.originalColor || 'Unknown',
    originalHex: normalizeHex(item.originalHex),
    partDescription: item.partDescription || 'garment region',
    selected: true,
  }));
}

/* ─── Main Component ─────────────────────────────────────────────────── */

function BobingStudio() {
  const [mode, setMode] = React.useState('catalog');
  const [baseImage, setBaseImage] = React.useState(null);
  const [baseMime, setBaseMime] = React.useState(null);
  const [generatedImage, setGeneratedImage] = React.useState(null);
  const [detectedColors, setDetectedColors] = React.useState([]);
  const [favoriteColors, setFavoriteColors] = React.useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(saved) ? saved.slice(0, 18) : [];
    } catch { return []; }
  });
  const [comparePosition, setComparePosition] = React.useState(50);
  const [history, setHistory] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const [busyMessage, setBusyMessage] = React.useState('');
  const [toast, setToast] = React.useState(null);

  // Form state
  const [productName, setProductName] = React.useState('');
  const [catalogStyle, setCatalogStyle] = React.useState('white');
  const [subjectType, setSubjectType] = React.useState('ai_model');
  const [modelPose, setModelPose] = React.useState('market_front');
  const [productHint, setProductHint] = React.useState('');
  const [targetColor, setTargetColor] = React.useState('#7d8b6f');
  const [colorName, setColorName] = React.useState('sage green');
  const [recolorRegion, setRecolorRegion] = React.useState(
    'Change only the main garment fabric color. Preserve embroidery, buttons, labels, skin, mannequin, and background.'
  );

  const toastTimer = React.useRef(null);
  const fileInputRef = React.useRef(null);

  /* ─── Toast ───────────────────────────────────────────────────────── */

  function showToast(message) {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }

  /* ─── File upload ─────────────────────────────────────────────────── */

  async function handleFileUpload(file) {
    if (busy) { showToast('Tunggu proses selesai dulu.'); return; }
    if (!file || !['image/jpeg', 'image/png'].includes(file.type)) {
      showToast('Gunakan file JPG atau PNG.'); return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      showToast('File terlalu besar. Maksimal 5MB.'); return;
    }
    setBusy(true);
    setBusyMessage('Preprocessing image');
    try {
      const raw = await readFile(file);
      const dataUrl = await downscale(raw);
      setBaseImage(dataUrl);
      setBaseMime('image/jpeg');
      setGeneratedImage(null);
      setDetectedColors([]);
      setBusy(false);
      setBusyMessage('');
    } catch (error) {
      setBusy(false);
      setBusyMessage('');
      showToast(error.message || 'Gagal membaca gambar.');
    }
  }

  function handleUploadClick() {
    if (!busy && fileInputRef.current) fileInputRef.current.click();
  }

  function handleFileDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) handleFileUpload(file);
  }

  /* ─── Mode switch ─────────────────────────────────────────────────── */

  function switchMode(newMode) {
    if (busy) { showToast('Tunggu proses selesai dulu.'); return; }
    setMode(newMode);
  }

  /* ─── Detect colors ───────────────────────────────────────────────── */

  async function handleDetectColors() {
    if (!baseImage || busy) return;
    setBusy(true);
    setBusyMessage('Detecting colors');
    try {
      const colors = await detectColorsApi(baseImage, baseMime);
      setDetectedColors(colors);
      setBusy(false);
      setBusyMessage('');
      showToast(`Detected ${colors.length} color region(s).`);
    } catch (error) {
      setBusy(false);
      setBusyMessage('');
      showToast(error.message || 'Color detection failed.');
    }
  }

  function handleToggleDetectedColor(index) {
    setDetectedColors((prev) =>
      prev.map((item, i) => i === index ? { ...item, selected: !item.selected } : item)
    );
  }

  /* ─── Favorite colors ─────────────────────────────────────────────── */

  function handleSaveColor() {
    const hex = normalizeHex(targetColor);
    const name = colorName.trim() || hex;
    const updated = [[name, hex], ...favoriteColors.filter(([, h]) => h !== hex)].slice(0, 18);
    setFavoriteColors(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    showToast(`Saved "${name}" to favorites.`);
  }

  /* ─── Prompt builder ──────────────────────────────────────────────── */

  function buildCurrentPrompt() {
    if (mode === 'catalog') {
      return buildCatalogPrompt({
        style: catalogStyle,
        subject: subjectType,
        pose: modelPose,
        productName,
        productHint,
        shotInstruction: '',
      });
    }
    const selectedRegions = detectedColors.filter((c) => c.selected);
    const detectedRegionsText = selectedRegions.length
      ? selectedRegions.map((c) => `- ${c.partDescription}: ${c.originalColor} (${c.originalHex}) → recolor to ${colorName || targetColor}`).join('\n')
      : '';
    return buildRecolorPrompt({
      targetHex: normalizeHex(targetColor),
      colorName: colorName.trim(),
      productName,
      recolorRegion,
      detectedRegionsText,
    });
  }

  /* ─── Generate single ─────────────────────────────────────────────── */

  async function handleGenerate() {
    if (!baseImage || busy) return;
    const label = mode === 'catalog' ? 'Generating catalog' : 'Generating recolor';
    setBusy(true);
    setBusyMessage(label);
    try {
      const prompt = buildCurrentPrompt();
      const result = await requestImage(baseImage, baseMime, prompt);
      setGeneratedImage(result);
      setHistory((prev) => [{ image: result, label: `${mode} – ${new Date().toLocaleTimeString()}` }, ...prev]);
      setBusy(false);
      setBusyMessage('');
    } catch (error) {
      setBusy(false);
      setBusyMessage('');
      showToast(error.message || 'Generation failed.');
    }
  }

  /* ─── Generate catalog set (4 shots) ──────────────────────────────── */

  async function handleGenerateCatalogSet() {
    if (!baseImage || busy) return;
    setBusy(true);
    setBusyMessage('Catalog set 1/4');
    try {
      for (let i = 0; i < CATALOG_SET_VARIANTS.length; i++) {
        setBusyMessage(`Catalog set ${i + 1}/${CATALOG_SET_VARIANTS.length}`);
        const variant = CATALOG_SET_VARIANTS[i];
        const prompt = buildCatalogPrompt({
          style: variant.style,
          subject: variant.subject,
          pose: variant.pose,
          productName,
          productHint,
          shotInstruction: variant.shotInstruction,
        });
        const result = await requestImage(baseImage, baseMime, prompt);
        setGeneratedImage(result);
        setHistory((prev) => [{ image: result, label: `set ${i + 1} – ${new Date().toLocaleTimeString()}` }, ...prev]);
      }
      setBusy(false);
      setBusyMessage('');
      showToast('Catalog set complete (4 shots).');
    } catch (error) {
      setBusy(false);
      setBusyMessage('');
      showToast(error.message || 'Catalog set failed.');
    }
  }

  /* ─── Generate 6 quick recolor variants ───────────────────────────── */

  async function handleGenerateQuickVariants() {
    if (!baseImage || busy) return;
    setBusy(true);
    setBusyMessage('Generating variant 1/6');
    try {
      const selectedRegions = detectedColors.filter((c) => c.selected);
      for (let i = 0; i < QUICK_RECOLOR_COLORS.length; i++) {
        setBusyMessage(`Generating variant ${i + 1}/${QUICK_RECOLOR_COLORS.length}`);
        const [name, hex] = QUICK_RECOLOR_COLORS[i];
        const detectedRegionsText = selectedRegions.length
          ? selectedRegions.map((c) => `- ${c.partDescription}: ${c.originalColor} (${c.originalHex}) → recolor to ${name}`).join('\n')
          : '';
        const prompt = buildRecolorPrompt({
          targetHex: hex,
          colorName: name,
          productName,
          recolorRegion,
          detectedRegionsText,
        });
        const result = await requestImage(baseImage, baseMime, prompt);
        setGeneratedImage(result);
        setHistory((prev) => [{ image: result, label: `${name} – ${new Date().toLocaleTimeString()}` }, ...prev]);
      }
      setBusy(false);
      setBusyMessage('');
      showToast('Quick variants complete (6 colors).');
    } catch (error) {
      setBusy(false);
      setBusyMessage('');
      showToast(error.message || 'Quick variants failed.');
    }
  }

  /* ─── Use result as base ──────────────────────────────────────────── */

  function handleUseAsBase() {
    if (!generatedImage) return;
    setBaseImage(generatedImage);
    setBaseMime('image/png');
    setGeneratedImage(null);
    setDetectedColors([]);
    showToast('Result set as new base image.');
  }

  /* ─── Download ────────────────────────────────────────────────────── */

  function handleDownload() {
    if (!generatedImage) return;
    const slug = slugify(productName, 'bobing-product');
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `${slug}-${Date.now()}.png`;
    link.click();
  }

  function handleDownloadAll() {
    if (history.length === 0) return;
    const slug = slugify(productName, 'bobing-product');
    history.forEach((item, index) => {
      const link = document.createElement('a');
      link.href = item.image;
      link.download = `${slug}-${index + 1}.png`;
      link.click();
    });
  }

  /* ─── Clear / select history ──────────────────────────────────────── */

  function handleClear() {
    setGeneratedImage(null);
  }

  function handleHistorySelect(item) {
    setGeneratedImage(item.image);
  }

  /* ─── Copy prompt ─────────────────────────────────────────────────── */

  function handleCopyPrompt() {
    const prompt = buildCurrentPrompt();
    navigator.clipboard.writeText(prompt).then(() => showToast('Prompt copied.')).catch(() => {});
  }

  /* ─── Pose relevance ──────────────────────────────────────────────── */

  const poseRelevant = ['ai_model', 'original'].includes(subjectType) && !['flatlay', 'detail'].includes(catalogStyle);

  /* ─── Render ──────────────────────────────────────────────────────── */

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>Bobing Studio V2</h1>
          <p>Foto katalog marketplace dan recolor varian produk fashion muslim.</p>
        </div>

        <div className="controls">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/png,image/jpeg"
            onChange={(e) => { handleFileUpload(e.target.files?.[0]); e.target.value = ''; }}
          />

          {/* Upload zone */}
          <div className="group">
            <div
              className={`upload${busy ? ' locked' : ''}`}
              role="button"
              tabIndex={0}
              onClick={handleUploadClick}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleUploadClick(); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
            >
              {baseImage ? (
                <img src={baseImage} alt="Uploaded base" />
              ) : (
                <div>
                  <strong>Upload foto produk</strong>
                  <span>JPG/PNG maksimal 5MB. Pakai foto produk paling jelas sebagai base.</span>
                </div>
              )}
            </div>
          </div>

          {/* Mode tabs */}
          <div className="tabs">
            <button
              className={`tab${mode === 'catalog' ? ' active' : ''}`}
              type="button"
              disabled={busy}
              onClick={() => switchMode('catalog')}
            >
              Catalog
            </button>
            <button
              className={`tab${mode === 'recolor' ? ' active' : ''}`}
              type="button"
              disabled={busy}
              onClick={() => switchMode('recolor')}
            >
              Recolor
            </button>
          </div>

          {/* Panel for active mode */}
          {mode === 'catalog' ? (
            <CatalogPanel
              productName={productName}
              setProductName={setProductName}
              catalogStyle={catalogStyle}
              setCatalogStyle={setCatalogStyle}
              subjectType={subjectType}
              setSubjectType={setSubjectType}
              modelPose={modelPose}
              setModelPose={setModelPose}
              productHint={productHint}
              setProductHint={setProductHint}
              poseRelevant={poseRelevant}
              busy={busy}
            />
          ) : (
            <RecolorPanel
              targetColor={targetColor}
              setTargetColor={setTargetColor}
              colorName={colorName}
              setColorName={setColorName}
              recolorRegion={recolorRegion}
              setRecolorRegion={setRecolorRegion}
              detectedColors={detectedColors}
              onToggleDetectedColor={handleToggleDetectedColor}
              onDetectColors={handleDetectColors}
              onSaveColor={handleSaveColor}
              favoriteColors={favoriteColors}
              busy={busy}
              baseImage={baseImage}
            />
          )}

          {/* Action buttons */}
          <div className="action-stack">
            <button
              className={`btn primary${busy && /Generating catalog|Generating recolor/i.test(busyMessage) ? ' is-loading' : ''}`}
              type="button"
              disabled={!baseImage || busy}
              onClick={handleGenerate}
            >
              {mode === 'catalog' ? 'Generate Catalog' : 'Generate Recolor'}
            </button>
            {mode === 'catalog' && (
              <button
                className={`btn${busy && /Catalog set/i.test(busyMessage) ? ' is-loading' : ''}`}
                type="button"
                disabled={!baseImage || busy}
                onClick={handleGenerateCatalogSet}
              >
                Generate Set
              </button>
            )}
            {mode === 'recolor' && (
              <button
                className={`btn${busy && /Generating variant/i.test(busyMessage) ? ' is-loading' : ''}`}
                type="button"
                disabled={!baseImage || busy}
                onClick={handleGenerateQuickVariants}
              >
                Generate 6 Quick Variants
              </button>
            )}
            <button
              className="btn"
              type="button"
              disabled={!generatedImage || busy}
              onClick={handleUseAsBase}
            >
              Use as Base
            </button>
            <button
              className="btn"
              type="button"
              disabled={!generatedImage || busy}
              onClick={handleDownload}
            >
              Download
            </button>
            <button
              className="btn"
              type="button"
              disabled={history.length === 0 || busy}
              onClick={handleDownloadAll}
            >
              Download All
            </button>
          </div>

          {/* Prompt preview */}
          <section className="group prompt-card">
            <h2 className="group-title">Prompt Preview</h2>
            <textarea
              className="prompt-preview"
              readOnly
              value={buildCurrentPrompt()}
            />
            <button className="btn" type="button" disabled={busy} onClick={handleCopyPrompt}>
              Copy Prompt
            </button>
          </section>
        </div>
      </aside>

      <main className="main">
        <ResultViewer
          baseImage={baseImage}
          baseMime={baseMime}
          generatedImage={generatedImage}
          busy={busy}
          busyMessage={busyMessage}
          mode={mode}
          onClear={handleClear}
        />

        <HistoryStrip
          history={history}
          generatedImage={generatedImage}
          onSelect={handleHistorySelect}
        />

        <CompareSlider
          baseImage={baseImage}
          generatedImage={generatedImage}
          comparePosition={comparePosition}
          setComparePosition={setComparePosition}
        />
      </main>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<BobingStudio />);
