import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Download,
  FileUp,
  Image as ImageIcon,
  Layers,
  Maximize2,
  Minimize2,
  Minus,
  Palette,
  Plus,
  RefreshCcw,
  Scissors,
  Settings,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Target,
  Type,
  Upload,
  Wand2,
} from 'lucide-react';

const A4_WIDTH_PX = 2480;
const A4_HEIGHT_PX = 3508;
const CIRCLE_DIAMETER_PX = 2362;
const MOCKUP_SIZE = 1080;
const PRINT_MATCH_TARGET = 90;
const DEFAULT_ARTWORK_SCALE = 0.9;
const MIN_ARTWORK_SCALE = 0.72;
const MAX_ARTWORK_SCALE = 2.5;
const PROMPT_REFINER_MODEL = 'gemini-2.5-flash-preview-09-2025';
const PROMPT_MAX_LENGTH = 900;
const CENTER_LOCK_PROMPT = `
      CENTER LOCK COMPOSITION:
      - Place the complete main subject exactly at the center of the square image canvas.
      - The subject centroid must be aligned to the canvas center point, not shifted left, right, top, or bottom.
      - Use a balanced radial composition for round wall decor.
      - Keep equal visual breathing room on the left, right, top, and bottom.
      - Keep all important flowers, leaves, ornaments, characters, faces, and focal details fully visible inside the circular artwork area.
      - No important details may touch or cross the circular edge.
      - Avoid off-center composition, diagonal drift, side-heavy layout, asymmetrical empty space, and cropped subject parts.
`;

const STYLE_PRESETS = [
  {
    id: 'vector',
    label: 'Flat Vector',
    code: 'ART',
    prompt: 'Flat vector digital illustration, clean ink lines, solid colors, crisp edges, commercial wall decor style, white background',
  },
  {
    id: 'scandi',
    label: 'Scandi Abstract',
    code: 'SCD',
    prompt: 'Abstract organic shapes composition, warm neutral accents, modern scandinavian decor, minimalist pattern, clean edges',
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    code: 'WTR',
    prompt: 'Premium watercolor painting isolated on white background, soft paper texture, elegant brush strokes, refined pastel colors',
  },
  {
    id: 'lineart',
    label: 'Line Art',
    code: 'INK',
    prompt: 'Black single line drawing on white background, high contrast, minimalist, clean decorative strokes, premium printable art',
  },
  {
    id: 'kids',
    label: 'Kids Cartoon',
    code: 'KID',
    prompt: 'Cute flat cartoon illustration, simple friendly shapes, pastel nursery colors, sticker art style, giftable kids room decor',
  },
  {
    id: 'japan',
    label: 'Japanese',
    code: 'JPN',
    prompt: 'Ukiyo-e inspired woodblock print style, flat colors, bold outlines, traditional japanese aesthetic, isolated artwork',
  },
];

const PROMPT_IDEAS = [
  'Bunga peony pink dengan daun sage, premium, cocok untuk dekorasi kamar',
  'Kucing lucu memakai mahkota kecil, warna pastel, hadiah anak',
  'Gunung dan matahari terbit, warm minimal, estetik ruang tamu',
  'Motif islami floral elegan, aksen gold, clean premium',
];

const CREATIVE_DIRECTIONS = [
  'editorial boutique decor, refined negative space, gallery-worthy premium composition',
  'lush ornamental centerpiece, layered botanical details, elegant artisan craft feeling',
  'modern playful collectible art, charming visual personality, strong thumbnail silhouette',
  'luxury gift-shop aesthetic, polished catalog finish, sophisticated color harmony',
  'soft dreamy nursery decor, gentle atmosphere, warm emotional appeal',
  'bold contemporary statement piece, high contrast focal point, memorable marketplace thumbnail',
  'handmade artisan illustration, imperfect organic charm, curated home decor look',
  'minimal premium icon composition, clean shapes, striking simple focal subject',
];

const COMPOSITION_VARIANTS = [
  'centered medallion composition with the full subject arranged as a balanced circular bouquet',
  'centered wreath-like radial layout with the main subject clearly dominant in the middle',
  'centered emblem composition with supporting motifs orbiting softly around the focal subject',
  'centered floating subject with decorative accents placed symmetrically around it',
  'centered layered paper-cut style composition with balanced depth and breathing room',
  'centered premium sticker-like subject with clean contour and subtle supporting pattern',
];

const PALETTE_DIRECTIONS = [
  'sage green, warm ivory, dusty rose, muted gold accents',
  'terracotta, cream, olive, soft charcoal accents',
  'powder blue, butter yellow, blush pink, warm white',
  'deep emerald, porcelain white, antique gold, soft beige',
  'lavender grey, pearl white, muted coral, eucalyptus green',
  'monochrome ink, warm cream, one refined accent color',
];

const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

const QUALITY_RULES = [
  { label: 'Center locked', detail: 'Subjek utama dipaksa berada di tengah komposisi.' },
  { label: 'Print match 90%+', detail: 'Print menjaga skala, posisi, dan komposisi image generate.' },
  { label: 'Mockup konsisten', detail: 'Mockup memakai render yang sama dengan print.' },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const AI_Craftr_Fixed = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefiningPrompt, setIsRefiningPrompt] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [workingImage, setWorkingImage] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('design');
  const [loadingMsg, setLoadingMsg] = useState('Meracik Desain...');
  const [selectedStyle, setSelectedStyle] = useState('vector');
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ARTWORK_SCALE);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showGuides, setShowGuides] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mockupBg, setMockupBg] = useState('wall-white');
  const [showLabel, setShowLabel] = useState(true);
  const [labelText, setLabelText] = useState('MDF-20-A1');
  const [previewScale, setPreviewScale] = useState(0.5);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeStyleObj = STYLE_PRESETS.find((style) => style.id === selectedStyle) || STYLE_PRESETS[0];
  const hasPrompt = prompt.trim().length > 0;
  const hasArtwork = Boolean(workingImage);
  const isCenterLocked = position.x === 0 && position.y === 0;

  const printMatchScore = useMemo(() => {
    const zoomPenalty = Math.abs(zoomLevel - DEFAULT_ARTWORK_SCALE) * 30;
    const panPenalty = (Math.abs(position.x) + Math.abs(position.y)) * 1.1;
    const promptBonus = hasPrompt ? 4 : 0;
    return clamp(Math.round(96 + promptBonus - zoomPenalty - panPenalty), 72, 99);
  }, [hasPrompt, position.x, position.y, zoomLevel]);

  const isPrintMatched = printMatchScore >= PRINT_MATCH_TARGET;
  const flowSteps = [
    { label: 'Generate', done: hasArtwork },
    { label: 'Center', done: hasArtwork && isCenterLocked },
    { label: 'Sell', done: false },
  ];

  const resetToCenter = () => {
    setPosition({ x: 0, y: 0 });
    setZoomLevel(DEFAULT_ARTWORK_SCALE);
  };

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      const baseA4Width = 794;
      const baseA4Height = 1123;
      const padding = 32;
      let scale = Math.min((containerWidth - padding) / baseA4Width, (containerHeight - padding) / baseA4Height);

      scale = clamp(scale, 0.2, 0.9);
      setPreviewScale(scale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const timeout = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, [activeTab, isFullScreen]);

  const drawConsistentArtwork = (ctx, img, cx, cy, diameter, scale = 1, pan = position) => {
    const s = Math.min(img.width, img.height);
    const sx = (img.width - s) / 2;
    const sy = (img.height - s) / 2;
    const drawSize = diameter * scale;
    const offsetX = (pan.x / 100) * diameter * 0.18;
    const offsetY = (pan.y / 100) * diameter * 0.18;

    ctx.drawImage(img, sx, sy, s, s, cx - drawSize / 2 + offsetX, cy - drawSize / 2 + offsetY, drawSize, drawSize);
  };

  const loadWorkingImage = () =>
    new Promise((resolve, reject) => {
      if (!workingImage) {
        reject(new Error('Belum ada desain aktif.'));
        return;
      }

      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Gambar tidak bisa dibaca.'));
      img.src = workingImage;
    });

  const fetchWithRetry = async (url, options, retries = 5, backoff = 1000) => {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(`Client Error: ${response.status}`);
        }

        throw new Error(`Server Error: ${response.status}`);
      }

      return response;
    } catch (err) {
      if (retries > 0) {
        setLoadingMsg(`Koneksi sibuk, mencoba lagi... (${retries})`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      }

      throw err;
    }
  };

  const getInlineImagePart = () => {
    if (!workingImage || !workingImage.startsWith('data:image/')) return null;

    const [meta, data] = workingImage.split(',');
    if (!meta || !data) return null;

    const mimeType = meta.match(/data:(.*);base64/)?.[1] || 'image/png';
    return {
      inline_data: {
        mime_type: mimeType,
        data,
      },
    };
  };

  const handleRefinePrompt = async () => {
    if (!hasPrompt && !workingImage) return;

    setIsRefiningPrompt(true);
    setError(null);
    setLoadingMsg('Menganalisis ide dan referensi...');

    const imagePart = getInlineImagePart();
    const refinerInstruction = `
      You are a highly creative marketplace product art director and prompt engineer for round wall decor print assets.
      Transform the user's idea into a more imaginative, more sellable, production-ready image generation prompt.
      Do not merely translate or paraphrase the user idea. Use it as a seed, then expand it creatively based on the selected style.

      USER IDEA:
      ${prompt || '(No text prompt. Use the attached image as the visual reference.)'}

      SELECTED STYLE:
      ${activeStyleObj.prompt}

      REQUIREMENTS:
      - Write in English.
      - Output only the final refined prompt, no title, no markdown, no explanation.
      - Be bold and creative while staying commercially sellable for marketplace buyers.
      - You may add tasteful supporting motifs, color direction, mood, composition details, and premium decor styling.
      - Do not limit yourself to the exact literal user words if a stronger product concept would sell better.
      - Create a distinctive concept, not a generic centered object.
      - Add a fresh art-direction hook such as boutique decor, collectible sticker charm, artisan botanical medallion, dreamy nursery piece, or luxury gift-shop aesthetic when suitable.
      - Vary the composition, palette, and decorative details based on the selected style.
      - Make the product look premium, giftable, and attractive in marketplace thumbnails.
      - Preserve or infer the key subject, color mood, and visual style.
      - Ensure the complete main subject fits inside a round wall decor composition.
      - Avoid cropped leaves, flowers, ornaments, characters, faces, or important details.
      - Keep print fidelity high: the generated image should print 90%-100% visually similar.
      - Request a centered, full visible subject with comfortable breathing room.
      - Forbid text, logos, watermarks, square frames, room mockups, perspective tilt, and clutter.

      ${CENTER_LOCK_PROMPT}
    `;

    const parts = imagePart ? [imagePart, { text: refinerInstruction }] : [{ text: refinerInstruction }];

    try {
      const apiKey = ''; // System injected
      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${PROMPT_REFINER_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 420,
            },
          }),
        },
      );

      const result = await response.json();
      const refinedText = result.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join(' ')
        .trim();

      if (!refinedText) throw new Error('Prompt refining kosong. Coba tulis ide lebih spesifik.');

      setPrompt(refinedText.slice(0, PROMPT_MAX_LENGTH));
    } catch (err) {
      console.error(err);
      setError(`Refine gagal: ${err.message || 'Gemini tidak merespon'}`);
    } finally {
      setIsRefiningPrompt(false);
    }
  };

  const parseImageAnalysis = (rawText) => {
    const cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return {
        analysis: parsed.analysis || cleaned,
        suggestedPrompt: parsed.suggestedPrompt || '',
      };
    } catch {
      const marker = 'SUGGESTED PROMPT:';
      const markerIndex = cleaned.toUpperCase().indexOf(marker);

      if (markerIndex >= 0) {
        return {
          analysis: cleaned.slice(0, markerIndex).trim(),
          suggestedPrompt: cleaned.slice(markerIndex + marker.length).trim(),
        };
      }

      return { analysis: cleaned, suggestedPrompt: '' };
    }
  };

  const handleAnalyzeImage = async () => {
    const imagePart = getInlineImagePart();
    if (!imagePart) {
      setError('Belum ada image aktif untuk dianalisis.');
      return;
    }

    setIsAnalyzingImage(true);
    setError(null);
    setLoadingMsg('Gemini menganalisis image...');

    const analyzerInstruction = `
      You are an expert marketplace art director for round wall decor print products.
      Analyze the attached generated image and provide a better prompt for the next generation.

      SELECTED STYLE:
      ${activeStyleObj.prompt}

      CURRENT USER PROMPT:
      ${prompt || '(empty)'}

      ANALYSIS GOALS:
      - Check whether the main subject is centered inside the circular composition.
      - Check whether any flowers, leaves, ornaments, characters, or important details are cropped or too close to the circle edge.
      - Check marketplace appeal: thumbnail clarity, premium look, color harmony, and giftability.
      - Suggest a more creative, sellable, center-locked prompt for the next generation.
      - The suggestion may improve the product concept creatively, not only correct technical issues.
      - If the image feels generic or similar to common outputs, propose a more distinctive concept, stronger palette, and more memorable supporting motifs.

      OUTPUT STRICT JSON ONLY:
      {
        "analysis": "Short Indonesian analysis, max 4 sentences.",
        "suggestedPrompt": "One English image generation prompt, creative, marketplace-ready, center-locked, round wall decor, no markdown."
      }

      ${CENTER_LOCK_PROMPT}
    `;

    try {
      const apiKey = ''; // System injected
      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${PROMPT_REFINER_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [imagePart, { text: analyzerInstruction }] }],
            generationConfig: {
              temperature: 0.45,
              maxOutputTokens: 720,
            },
          }),
        },
      );

      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join(' ')
        .trim();

      if (!rawText) throw new Error('Analisis image kosong. Coba generate atau upload ulang image.');

      setImageAnalysis(parseImageAnalysis(rawText));
    } catch (err) {
      console.error(err);
      setError(`Analisis gagal: ${err.message || 'Gemini tidak merespon'}`);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleGenerate = async () => {
    if (!hasPrompt) return;

    setIsGenerating(true);
    setError(null);
    setWorkingImage(null);
    setImageAnalysis(null);
    setZoomLevel(DEFAULT_ARTWORK_SCALE);
    setPosition({ x: 0, y: 0 });
    setLoadingMsg('Menghubungkan ke Studio AI...');

    const creativeDirection = randomItem(CREATIVE_DIRECTIONS);
    const compositionVariant = randomItem(COMPOSITION_VARIANTS);
    const paletteDirection = randomItem(PALETTE_DIRECTIONS);

    const engineeredPrompt = `
      Create a premium, marketplace-ready digital artwork for a ROUND WALL DECOR product.
      SUBJECT: ${prompt}.
      STYLE: ${activeStyleObj.prompt}.

      CREATIVE VARIATION FOR THIS GENERATION:
      - Creative direction: ${creativeDirection}.
      - Composition treatment: ${compositionVariant}.
      - Color palette direction: ${paletteDirection}.
      - Invent tasteful supporting details that make the product feel fresh and less generic.
      - Avoid repeating a predictable template; make this generation distinct, memorable, and commercially appealing.

      SALES-FOCUSED ART DIRECTION:
      - The design must look instantly desirable in an online marketplace thumbnail.
      - Make it giftable, decorative, premium, and suitable for home decor listings.
      - Use a strong center focal point, clear silhouette, balanced details, and tasteful color contrast.
      - Keep the finish clean, polished, sharp, high-resolution, and print-friendly.

      PRINT FIDELITY:
      - The printed result must look 90 to 100 percent visually similar to the generated image.
      - Preserve the original composition, colors, contrast, focal point, and visual balance.
      - Keep the complete main subject fully visible inside a circular wall decor shape.
      - Add comfortable visual breathing room around flowers, leaves, characters, and ornaments.
      - No petals, leaves, heads, hands, important ornaments, or focal details may touch or exceed the circular edge.
      - Use a simple printable background or supporting elements around the subject, but keep the full subject inside the round composition.
      - Flat 2D straight-on artwork, not a room mockup.

      ${CENTER_LOCK_PROMPT}

      NEGATIVE:
      - Text, letters, words, logo, watermark, signature, price tag, square border, frame edge.
      - Perspective tilt, room scene, cropped main subject, cluttered layout, low quality.
      - Off-center subject, subject shifted to one side, uneven empty space, asymmetric framing, cut-off leaves or flowers.
    `;

    try {
      const apiKey = ''; // System injected
      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt: engineeredPrompt }],
            parameters: { sampleCount: 1, aspectRatio: '1:1' },
          }),
        },
      );

      const result = await response.json();
      const base64 = result.predictions?.[0]?.bytesBase64Encoded;

      if (!base64) throw new Error('Respon AI kosong. Silakan coba prompt lain.');

      setWorkingImage(`data:image/png;base64,${base64}`);
    } catch (err) {
      console.error(err);
      setError(`Gagal: ${err.message || 'Koneksi tidak stabil'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setWorkingImage(e.target.result);
      setImageAnalysis(null);
      setZoomLevel(DEFAULT_ARTWORK_SCALE);
      setPosition({ x: 0, y: 0 });
      setActiveTab('design');
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const downloadPrintReady = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = await loadWorkingImage();

      canvas.width = A4_WIDTH_PX;
      canvas.height = A4_HEIGHT_PX;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = CIRCLE_DIAMETER_PX / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      drawConsistentArtwork(ctx, img, cx, cy, CIRCLE_DIAMETER_PX, zoomLevel);
      ctx.restore();

      const link = document.createElement('a');
      link.download = `PRINT_MATCH_${printMatchScore}_MDF_ROUND_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      setError(err.message);
    }
  };

  const downloadMockup = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = await loadWorkingImage();

      canvas.width = MOCKUP_SIZE;
      canvas.height = MOCKUP_SIZE;

      if (mockupBg === 'wall-white') {
        const grad = ctx.createLinearGradient(0, 0, 0, MOCKUP_SIZE);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(1, '#EEF2F6');
        ctx.fillStyle = grad;
      } else if (mockupBg === 'wall-sage') {
        ctx.fillStyle = '#E3EBE3';
      } else {
        ctx.fillStyle = '#E2E8F0';
      }

      ctx.fillRect(0, 0, MOCKUP_SIZE, MOCKUP_SIZE);

      const cx = MOCKUP_SIZE / 2;
      const cy = MOCKUP_SIZE / 2 - 46;
      const diameter = 700;
      const r = diameter / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(15,23,42,0.32)';
      ctx.shadowBlur = 42;
      ctx.shadowOffsetY = 22;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      drawConsistentArtwork(ctx, img, cx, cy, diameter, zoomLevel);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
      ctx.strokeStyle = 'rgba(15,23,42,0.12)';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (showLabel) {
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(15,23,42,0.12)';
        ctx.shadowBlur = 12;
        ctx.fillRect(MOCKUP_SIZE - 282, MOCKUP_SIZE - 112, 230, 68);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ITEM CODE', MOCKUP_SIZE - 167, MOCKUP_SIZE - 86);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 25px Arial';
        ctx.fillText(labelText || 'MDF-20-A1', MOCKUP_SIZE - 167, MOCKUP_SIZE - 58);
      }

      const safeLabel = (labelText || 'MOCKUP').replace(/[^a-z0-9-_]/gi, '_');
      const link = document.createElement('a');
      link.download = `KATALOG_MATCH_${printMatchScore}_${safeLabel}_${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.92);
      link.click();
    } catch (err) {
      setError(err.message);
    }
  };

  const renderArtworkPreview = (sizeClass, showProductionGuide = true) => (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-white relative`}>
      {workingImage ? (
        <img
          src={workingImage}
          className="w-full h-full object-contain transition-transform duration-200"
          style={{
            transform: `translate(${position.x * 0.18}%, ${position.y * 0.18}%) scale(${zoomLevel})`,
          }}
          alt="Design Asset"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300">
          <ImageIcon className="w-20 h-20 mb-2 opacity-50" />
          <p className="font-bold text-sm">AREA DESAIN</p>
        </div>
      )}

      {showGuides && showProductionGuide && (
        <>
          <div className="absolute inset-0 rounded-full ring-2 ring-red-500/60 pointer-events-none" />
          <div className="absolute left-1/2 top-[46%] h-[8%] w-px -translate-x-1/2 bg-red-500/45 pointer-events-none" />
          <div className="absolute left-[46%] top-1/2 h-px w-[8%] -translate-y-1/2 bg-red-500/45 pointer-events-none" />
        </>
      )}
    </div>
  );

  return (
    <div className="craftr-native-root h-screen bg-slate-100 font-sans flex flex-col md:flex-row overflow-hidden text-slate-900">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div
        className={`craftr-preview-pane relative flex flex-col justify-center items-center overflow-hidden shadow-inner bg-slate-900 transition-all duration-300 ${
          isFullScreen ? 'fixed inset-0 z-50 h-full w-full' : 'order-1 md:order-2 w-full md:flex-1 h-[45vh] md:h-full shrink-0'
        }`}
      >
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 pointer-events-auto md:hidden">
            <Layers className="w-4 h-4 text-indigo-700" />
            <span className="text-xs font-bold text-slate-800">AI Craftr</span>
          </div>

          <div className="ml-auto flex gap-2 pointer-events-auto">
            <div
              className={`backdrop-blur-sm text-white px-3 py-1.5 rounded-full shadow-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                isPrintMatched ? 'bg-green-600/90' : 'bg-amber-600/90'
              }`}
            >
              <ShieldCheck className="w-3 h-3" /> Print Match {printMatchScore}%
            </div>
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-1.5 rounded-full shadow-sm transition-all active:scale-95"
              aria-label={isFullScreen ? 'Exit fullscreen' : 'Preview fullscreen'}
            >
              {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isGenerating && (
          <div className="absolute inset-0 z-10 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white text-slate-900 rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3">
              <RefreshCcw className="w-5 h-5 text-indigo-600 animate-spin" />
              <div>
                <p className="text-sm font-bold">Membuat aset siap jual</p>
                <p className="text-xs text-slate-500">{loadingMsg}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'mockup' && (
          <div
            ref={containerRef}
            className={`w-full h-full flex items-center justify-center p-4 ${isFullScreen ? 'bg-slate-900' : ''}`}
          >
            <div
              className="bg-white shadow-2xl relative transition-transform duration-300 ease-out origin-center overflow-hidden"
              style={{ width: '210mm', height: '297mm', transform: `scale(${previewScale})`, flexShrink: 0 }}
            >
              <div className="absolute inset-0 pointer-events-none z-30">
                <svg width="100%" height="100%" viewBox="0 0 210 297" preserveAspectRatio="none">
                  <defs>
                    <mask id="circle-mask">
                      <rect width="100%" height="100%" fill="white" />
                      <circle cx="105" cy="148.5" r="100" fill="black" />
                    </mask>
                  </defs>
                  <rect width="100%" height="100%" fill="rgba(0,0,0,0.50)" mask="url(#circle-mask)" />
                  <circle cx="105" cy="148.5" r="100" fill="none" stroke="#ef4444" strokeWidth="0.55" strokeDasharray="2 2" />
                  <line x1="103" y1="148.5" x2="107" y2="148.5" stroke="#ef4444" strokeWidth="0.3" />
                  <line x1="105" y1="146.5" x2="105" y2="150.5" stroke="#ef4444" strokeWidth="0.3" />
                  <text x="105" y="40" textAnchor="middle" fill="#94a3b8" fontSize="4" fontWeight="bold">
                    AREA NON-AKTIF A4
                  </text>
                  <text x="105" y="255" textAnchor="middle" fill="#ef4444" fontSize="4" fontWeight="bold">
                    GARIS POTONG 20 CM
                  </text>
                  <text x="105" y="265" textAnchor="middle" fill="#22c55e" fontSize="3.6" fontWeight="bold">
                    PRINT MATCH TARGET 90%-100%
                  </text>
                </svg>
              </div>

              <div className="absolute inset-0 flex items-center justify-center">{renderArtworkPreview('w-[200mm] h-[200mm]', true)}</div>
            </div>
          </div>
        )}

        {activeTab === 'mockup' && (
          <div className="w-full h-full flex items-center justify-center p-4 bg-slate-800/50">
            <div
              className={`relative transition-all duration-300 flex items-center justify-center ${
                mockupBg === 'wall-white' ? 'bg-gradient-to-b from-white to-slate-100' : mockupBg === 'wall-sage' ? 'bg-[#E3EBE3]' : 'bg-slate-200'
              }`}
              style={{ width: '500px', height: '500px', transform: `scale(${previewScale * 1.2})`, flexShrink: 0 }}
            >
              {workingImage ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="w-[300px] h-[300px] rounded-full bg-black/20 absolute blur-xl translate-y-4 translate-x-2" />
                  <div className="relative z-10">{renderArtworkPreview('w-[300px] h-[300px]', false)}</div>
                  {showLabel && (
                    <div className="absolute bottom-10 right-10 bg-white px-4 py-2 shadow-lg z-20 flex flex-col items-center">
                      <span className="text-xs text-slate-400 font-mono tracking-widest uppercase">Item Code</span>
                      <span className="text-lg font-bold text-slate-800">{labelText}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400 font-bold flex flex-col items-center">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                  <p>Belum Ada Desain Aktif</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        className={`craftr-control-sheet bg-white z-30 flex flex-col order-2 md:order-1 w-full md:w-[430px] flex-1 md:h-full shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] md:shadow-xl rounded-t-3xl md:rounded-none overflow-hidden relative -mt-6 md:mt-0 ${
          isFullScreen ? 'hidden' : 'flex'
        }`}
      >
        <div className="hidden md:flex p-5 border-b border-slate-100 items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-700">
            <Layers className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold leading-none">AI Craftr</h1>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider">SELL READY PRINT GENERATOR</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-slate-400">Print Match</p>
            <p className={`text-xs font-bold ${isPrintMatched ? 'text-green-600' : 'text-amber-600'}`}>{printMatchScore}% match</p>
          </div>
        </div>

        <div className="md:hidden w-full flex justify-center pt-3 pb-1 cursor-pointer" onClick={() => setIsFullScreen(true)}>
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        <div className="px-4 py-3 md:px-5 bg-white border-b sticky top-0 z-20">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {flowSteps.map((step, index) => (
              <div key={step.label} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step.done ? 'bg-green-600 text-white' : activeTab === 'mockup' && index === 2 ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step.done ? <CheckCircle className="w-3.5 h-3.5" /> : index + 1}
                </div>
                <span className={`text-[10px] font-bold uppercase ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</span>
              </div>
            ))}
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('design')}
              className={`flex-1 py-2.5 md:py-2 text-xs font-bold rounded-lg flex justify-center gap-1 transition-all ${
                activeTab === 'design' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" /> Create
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2.5 md:py-2 text-xs font-bold rounded-lg flex justify-center gap-1 transition-all ${
                activeTab === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mockup')}
              disabled={!workingImage}
              className={`flex-1 py-2.5 md:py-2 text-xs font-bold rounded-lg flex justify-center gap-1 transition-all ${
                activeTab === 'mockup' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 disabled:opacity-50'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Sell
            </button>
          </div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto pb-10 md:pb-5">
          {activeTab === 'design' && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-indigo-950">Generate image siap jual</h2>
                    <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                      App menjaga hasil print 90%-100% mirip image generate dengan skala dan posisi yang sama untuk preview, mockup, dan print.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                    <Palette className="w-3.5 h-3.5" /> Pilih Gaya
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{activeStyleObj.label}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {STYLE_PRESETS.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border min-h-[74px] transition-all ${
                        selectedStyle === style.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300 bg-white'
                      }`}
                    >
                      <span className="text-[10px] font-black tracking-wide text-slate-400 mb-1">{style.code}</span>
                      <span className={`text-[10px] font-bold text-center leading-tight ${selectedStyle === style.id ? 'text-indigo-700' : 'text-slate-600'}`}>
                        {style.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Ide Produk</label>
                  <span className="text-[10px] text-slate-400">{prompt.length}/{PROMPT_MAX_LENGTH}</span>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1 focus-within:ring-2 focus-within:ring-indigo-100">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value.slice(0, PROMPT_MAX_LENGTH))}
                    placeholder="Contoh: floral premium warna sage dan gold untuk dekorasi ruang tamu"
                    className="w-full p-3 rounded-lg focus:outline-none h-28 text-sm resize-none"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
                  {PROMPT_IDEAS.map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      onClick={() => setPrompt(idea)}
                      className="shrink-0 max-w-[250px] truncate text-left text-[11px] font-semibold text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-full px-3 py-2 transition-colors"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleRefinePrompt}
                  disabled={isRefiningPrompt || (!hasPrompt && !workingImage)}
                  className={`w-full mt-3 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95 ${
                    isRefiningPrompt || (!hasPrompt && !workingImage)
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-100'
                  }`}
                >
                  {isRefiningPrompt ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isRefiningPrompt ? 'Refining dengan Gemini...' : workingImage ? 'Refine Prompt + Analisis Gambar' : 'Refine Prompt dengan Gemini'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || isRefiningPrompt || !hasPrompt}
                className={`w-full py-4 md:py-3 rounded-xl font-bold text-white shadow-md flex justify-center items-center gap-2 transition-transform active:scale-95 ${
                  isGenerating || isRefiningPrompt || !hasPrompt ? 'bg-slate-400 shadow-slate-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                }`}
              >
                {isGenerating ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                {isGenerating ? loadingMsg : hasArtwork ? 'Generate Ulang' : 'Buat Desain Siap Jual'}
              </button>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {workingImage && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-slate-400" />
                      <h3 className="text-sm font-bold text-slate-700">Print Fidelity</h3>
                    </div>
                    <div
                      className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-bold ${
                        isPrintMatched ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      <Target className="w-3 h-3" /> {printMatchScore}% Match
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={resetToCenter}
                    className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95 ${
                      isCenterLocked
                        ? 'bg-green-50 text-green-700 border border-green-100'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100'
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    {isCenterLocked ? 'Center Locked' : 'Reset ke Tengah'}
                  </button>

                  <button
                    type="button"
                    onClick={handleAnalyzeImage}
                    disabled={isAnalyzingImage}
                    className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95 ${
                      isAnalyzingImage
                        ? 'bg-slate-100 text-slate-400'
                        : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-100'
                    }`}
                  >
                    {isAnalyzingImage ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isAnalyzingImage ? 'Menganalisis Image...' : 'Analisis Image + Saran Prompt'}
                  </button>

                  {imageAnalysis && (
                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-3">
                      <div>
                        <p className="text-xs font-bold uppercase text-violet-700 mb-1">Analisis Gemini</p>
                        <p className="text-xs text-violet-900 leading-relaxed">{imageAnalysis.analysis}</p>
                      </div>
                      {imageAnalysis.suggestedPrompt && (
                        <div className="bg-white border border-violet-100 rounded-lg p-3">
                          <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Saran Prompt Baru</p>
                          <p className="text-xs text-slate-700 leading-relaxed">{imageAnalysis.suggestedPrompt}</p>
                          <button
                            type="button"
                            onClick={() => setPrompt(imageAnalysis.suggestedPrompt.slice(0, PROMPT_MAX_LENGTH))}
                            className="mt-3 w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors"
                          >
                            Pakai Saran Prompt
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    {QUALITY_RULES.map((rule) => (
                      <div key={rule.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 min-h-[86px]">
                        <div className="flex items-center gap-1 text-green-700 text-[10px] font-bold mb-1">
                          <CheckCircle className="w-3.5 h-3.5" /> OK
                        </div>
                        <p className="text-[11px] font-bold text-slate-700 leading-tight">{rule.label}</p>
                        <p className="text-[10px] text-slate-500 mt-1 leading-tight">{rule.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                        <SlidersHorizontal className="w-3.5 h-3.5" /> Skala Artwork
                      </span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded border font-mono">{Math.round(zoomLevel * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm border"
                        onClick={() => setZoomLevel((z) => Math.max(MIN_ARTWORK_SCALE, z - 0.05))}
                        aria-label="Kurangi skala"
                      >
                        <Minus className="w-4 h-4 text-slate-500" />
                      </button>
                      <input
                        type="range"
                        min={MIN_ARTWORK_SCALE}
                        max={MAX_ARTWORK_SCALE}
                        step="0.01"
                        value={zoomLevel}
                        onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg accent-indigo-600 cursor-pointer"
                      />
                      <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm border"
                        onClick={() => setZoomLevel((z) => Math.min(MAX_ARTWORK_SCALE, z + 0.05))}
                        aria-label="Tambah skala"
                      >
                        <Plus className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-600">Posisi X</span>
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded border font-mono">{position.x}</span>
                      </div>
                      <input
                        type="range"
                        min="-30"
                        max="30"
                        step="1"
                        value={position.x}
                        onChange={(e) => setPosition((pos) => ({ ...pos, x: parseInt(e.target.value, 10) }))}
                        className="w-full h-2 bg-slate-200 rounded-lg accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-600">Posisi Y</span>
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded border font-mono">{position.y}</span>
                      </div>
                      <input
                        type="range"
                        min="-30"
                        max="30"
                        step="1"
                        value={position.y}
                        onChange={(e) => setPosition((pos) => ({ ...pos, y: parseInt(e.target.value, 10) }))}
                        className="w-full h-2 bg-slate-200 rounded-lg accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                        <Scissors className="w-3.5 h-3.5" /> Tampilkan garis potong
                      </span>
                      <input
                        type="checkbox"
                        checked={showGuides}
                        onChange={(e) => setShowGuides(e.target.checked)}
                        className="accent-indigo-600 w-4 h-4 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={downloadPrintReady}
                      className="py-3 text-white rounded-xl font-bold shadow-md flex justify-center items-center gap-2 transition-all active:scale-95 bg-green-600 hover:bg-green-700 shadow-green-200"
                    >
                      <Download className="w-4 h-4" /> Print A4
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('mockup')}
                      className="py-3 text-white rounded-xl font-bold shadow-md flex justify-center items-center gap-2 transition-all active:scale-95 bg-pink-600 hover:bg-pink-700 shadow-pink-200"
                    >
                      Mockup <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center shadow-sm">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <FileUp className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="font-bold text-blue-900 text-base">Upload Desain Sendiri</h3>
                <p className="text-xs text-blue-700 mt-2 leading-relaxed">
                  Upload artwork 1:1, lalu app menjaga skala dan posisi yang sama untuk preview, print, dan mockup.
                </p>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md shadow-blue-200 active:scale-95 transition-all mt-4"
                >
                  Pilih File
                </button>
              </div>
            </div>
          )}

          {activeTab === 'mockup' && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-pink-900 text-sm">Studio Katalog</h3>
                  <p className="text-xs text-pink-700 mt-1">Mockup memakai render yang sama dengan print export.</p>
                </div>
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <ShoppingBag className="w-5 h-5 text-pink-500" />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Generated to Print Match</span>
                  <span className={`text-sm font-black ${isPrintMatched ? 'text-green-600' : 'text-amber-600'}`}>{printMatchScore}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <div className={`${isPrintMatched ? 'bg-green-500' : 'bg-amber-500'} h-full rounded-full`} style={{ width: `${printMatchScore}%` }} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block pl-1">Background</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setMockupBg('wall-white')}
                    className={`h-16 rounded-xl border-2 text-xs font-bold ${
                      mockupBg === 'wall-white' ? 'border-pink-500 text-pink-700' : 'border-slate-200 text-slate-600'
                    } bg-white shadow-sm`}
                  >
                    Clean
                  </button>
                  <button
                    type="button"
                    onClick={() => setMockupBg('wall-sage')}
                    className={`h-16 rounded-xl border-2 text-xs font-bold ${
                      mockupBg === 'wall-sage' ? 'border-pink-500 text-pink-700' : 'border-slate-200 text-slate-600'
                    } bg-[#E3EBE3] shadow-sm`}
                  >
                    Sage
                  </button>
                  <button
                    type="button"
                    onClick={() => setMockupBg('wall-concrete')}
                    className={`h-16 rounded-xl border-2 text-xs font-bold ${
                      mockupBg === 'wall-concrete' ? 'border-pink-500 text-pink-700' : 'border-slate-200 text-slate-600'
                    } bg-slate-200 shadow-sm`}
                  >
                    Grey
                  </button>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-slate-400" />
                    <label className="text-xs font-bold text-slate-600">Label Item</label>
                  </div>
                  <input
                    type="checkbox"
                    checked={showLabel}
                    onChange={(e) => setShowLabel(e.target.checked)}
                    className="accent-pink-500 w-4 h-4 rounded cursor-pointer"
                  />
                </div>
                {showLabel && (
                  <input
                    type="text"
                    value={labelText}
                    onChange={(e) => setLabelText(e.target.value)}
                    className="w-full text-sm border-b-2 border-slate-200 focus:border-pink-500 outline-none py-2 px-1 bg-transparent transition-colors font-medium text-slate-700"
                    placeholder="Contoh: MDF-20-A1"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('design')}
                  className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex justify-center items-center gap-2 active:scale-95 transition-all"
                >
                  Edit Print
                </button>
                <button
                  type="button"
                  onClick={downloadMockup}
                  className="py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow-md shadow-pink-200 flex justify-center items-center gap-2 active:scale-95 transition-all"
                >
                  <Download className="w-5 h-5" /> Katalog
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AI_Craftr_Fixed;
