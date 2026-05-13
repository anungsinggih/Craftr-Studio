import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Card, Field, ToolShell } from '../../shared/ui.jsx';
import '../../shared/tool-template.css';
import './mockup-tool.css';

const API_MODEL = 'gemini-2.5-flash-image-preview';
const API_KEY = typeof __api_key !== 'undefined' ? __api_key : '';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=${API_KEY}`;

const DISC_DIAMETER_CM = 20;
const EXPORT_PPI = 300;
const DISC_PX = Math.round((DISC_DIAMETER_CM / 2.54) * EXPORT_PPI);

const MANDATORY_COLOR_ENFORCEMENT = 'Use sterile, neutral lighting. Ensure the background elements do not cast color onto the disc.';

const BASE_SYSTEM_INSTRUCTION = `
Act as an expert e-commerce product photographer. Your goal is to produce a mockup that is **IDENTICAL to the real physical product** a customer would receive.
The product is a circular **20cm diameter, 6mm thick MDF board** with a full-coverage printed Art Paper sticker on the front face.

**REAL PRODUCT ACCURACY (HIGHEST PRIORITY):**
In real life, the printed sticker covers 100% of the front face - edge to edge. When viewed from the front, the customer sees ONLY the printed design and NO wood border/rim.
The 6mm MDF edge (light brown wood) is only barely visible as a very thin hairline at the outer perimeter, because the camera is nearly straight-on.
Do NOT exaggerate the MDF edge thickness. It should be at most 1-2 pixels wide in the final render - a subtle hint, NOT a prominent ring or border.

**TEXTURE MAPPING RULE:**
The uploaded input image is a PRE-PRINTED PHOTOGRAPH physically applied to the board.
Treat it as an **OPAQUE PHOTOGRAPHIC TEXTURE** - do NOT read, interpret, modify, or regenerate any content within it.
Apply the input as-is like a UV texture map, preserving every pixel exactly.
The print must look **perfectly flat, matte, and 2D** - no gloss, no reflections, no shadows ON the print surface.

**PRODUCT ISOLATION:** The printed surface must maintain 100% color fidelity. No color spill from background lighting.

**DVD ONLY:** For DVD concepts, render a center spindle hole as solid pure black (#000000).
`;

const GLOBAL_INVARIANTS_SYSTEM_INSTRUCTION = `
[SYSTEM: GLOBAL INVARIANTS - DISC MOCKUP CONTRACT]

A. Product fidelity
- The printed artwork is a pixel-faithful 2D replica of the input.
- No relighting, no LUT/tone-mapping, no hue/saturation shift, no bloom on print.
- Color Spill Exclusion: background lighting and props never tint the print.

B. Physical scale & geometry
- Disc diameter = 200 mm exactly.
- The product is a circular 6mm thick MDF board. The side edge is light brown wood, but since the camera is nearly frontal, this edge should appear as a very thin hairline (1-2px), NOT a thick border.

C. Stand / Hanging contract
- If placement = "table_stand" or "both", the disc rests on a black decorative plate display stand.
- If placement = "wall_mount", the disc hangs flat on the wall. NO STAND, NO PROPS, NO HOOKS VISIBLE.
- Finish: black matte; NO colorful reflections.

D. Camera & composition
- Camera angle: **nearly straight-on frontal view** (0-3 degree tilt). The product face must be almost perfectly parallel to the camera sensor.
- This means the 6mm side edge of the MDF board is barely visible - just a very thin hairline at the perimeter.
- Product centered in frame.
- **CRITICAL SCALE:** The product must NOT fill the entire frame. Leave generous negative space. The product should occupy roughly 50-60% of the vertical frame.

E. Lighting hygiene
- Key light on disc print = D65 neutral, flat, diffuse.
- Specular Kill on print area.
- Shadows: one soft penumbra on the supporting surface or wall, opacity 8-20%.

F. Background effects containment
- All stylization confined to BACKGROUND LAYER ONLY. Never bleed onto disc print.

G. **PRINT MAPPING CONTRACT (MANDATORY - ZERO TOLERANCE)**
- The input image is the FINAL artwork. It has already been pre-cropped and margin-adjusted.
- Map the input 1:1 onto the circular front face. NO cropping, NO zooming, NO scaling up, NO repositioning.
- If the input has a white/colored margin near the edge, that margin MUST remain visible on the board. Do NOT remove or clip it.
- ALL text, logos, and graphic elements from the input MUST be 100% visible on the rendered board.
- The rendered artwork boundary MUST exactly match the physical board edge. No artwork may extend beyond or be clipped by the edge.
- This rule overrides any artistic preference to "fill" or "bleed" the artwork.
`;

const NEGATIVE_PROMPT_BLOCK = `
[NEGATIVE PROMPTS / DO NOT DO THIS]
- DO NOT render a thick or prominent wood border/rim around the product. The MDF edge is only 6mm and barely visible from the front.
- DO NOT add shadows, glare, specular highlights, reflections, or gradient lighting TO THE PRINTED ARTWORK itself.
- DO NOT change the aspect ratio, color palette, or layout of the uploaded image.
- DO NOT crop, zoom in, scale up, or reposition the artwork on the board. The input is FINAL.
- DO NOT cut off any text or graphics near the edges.
- DO NOT use an A-frame easel or tripod-style stand.
- DO NOT place the disc off-center.
- DO NOT add floating elements, lens flares overlapping the product, or dramatic rim lights hitting the print.
- DO NOT skew or tilt the disc more than 3 degrees.
`;

const DVD_OVERRIDE_PROMPT = `
[DVD OVERRIDE]
**CRITICAL:** The product is a DVD/CD style disc.
- Center Hole: Exactly 15mm diameter, perfectly black (#000000).
- Data Ring: Metallic silver/transparent ring extending from 20mm to 36mm diameter.
`;

const POLOS_OVERRIDE_PROMPT = `
[POLOS OVERRIDE]
**CRITICAL:** The product is a SOLID MDF BOARD with full-coverage print. There is NO CENTER HOLE.
The printed sticker covers 100% of the front face. From the front camera angle, the customer sees ONLY the print - no wood border, no rim, no unprinted area.
The artwork is ALREADY the final version - map it exactly as-is, no cropping, no zoom.
`;

const BOTH_SPEC_PROMPT = `
[BOTH VIEW ENFORCEMENT]
Render TWO instances of the same product:
- Foreground: on tabletop with the stand.
- Background: wall-mounted copy of the SAME 200 mm product.
Both must maintain identical physical size. No extra stands are invented for the background copy.
`;

const PRINT_ANCHOR = '\nIMPORTANT REMINDER: The circular disc in the uploaded image contains the EXACT artwork to render. Do NOT regenerate, re-draw, or modify the artwork. The print on the board must be a pixel-identical copy of the uploaded disc. Focus your creativity ONLY on the background/scene - NEVER on the disc print itself.';

const SCENE_PRESETS = [
  {
    value: 'minimalis',
    label: 'Minimalist Clean',
    prompt: `A photorealistic product photo: The MDF board product is displayed in a bright, modern, minimalist studio. Background: clean, seamless light gray or off-white. Lighting: very soft, diffused, neutral (D65). A single soft shadow beneath the product anchors it. No extra props, no decorations. The product's printed face must remain UNTOUCHED and pixel-identical to the input.${PRINT_ANCHOR}`
  },
  {
    value: 'warm_retro',
    label: 'Warm Retro',
    prompt: `A photorealistic product photo: The MDF board product sits in a warm, nostalgic setting. Background (BLURRED): vintage audio equipment on a walnut wood shelf. Lighting: warm golden-hour ambiance on the BACKGROUND ONLY. CRITICAL: The warm lighting must NOT tint or color-shift the printed artwork on the product face. The print stays neutral and pixel-identical to the input.${PRINT_ANCHOR}`
  },
  {
    value: 'neon_gaming',
    label: 'Neon Gaming',
    prompt: `A photorealistic product photo: The MDF board product is on a matte black desk in a dark gaming room. Background (DEEPLY BLURRED): subtle RGB LED strips and neon signs casting pink/cyan on distant walls only. CRITICAL: The neon colors must NEVER reflect onto or tint the printed artwork surface. The print on the board must remain color-accurate and pixel-identical to the input.${PRINT_ANCHOR}`
  },
  {
    value: 'industrial_shelf',
    label: 'Industrial Shelf',
    prompt: `A photorealistic product photo: The MDF board product rests on a black metal industrial shelf. Background: light gray concrete wall with subtle texture. Lighting: warm overhead track lighting illuminating the scene. CRITICAL: The print artwork on the product must remain neutral, unaffected by scene lighting. Pixel-identical to the input.${PRINT_ANCHOR}`
  },
  {
    value: 'cozy_nook',
    label: 'Cozy Bookshelf Nook',
    prompt: `A photorealistic product photo: The MDF board product sits on a shelf in a rustic wooden bookshelf. Background: blurred books and a small potted plant. Lighting: warm amber from the side (natural window light). CRITICAL: The warm light must illuminate the SCENE/BACKGROUND only - the printed artwork on the product face must remain color-neutral and pixel-identical to the input.${PRINT_ANCHOR}`
  }
];

const fetchWithRetry = async (url, options, retries = 2) => {
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)));
        continue;
      }
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Max retries reached');
};

const mmToPxRadius = (canvasSizePx, mm) => {
  const radiusPx = canvasSizePx / 2;
  return (mm / (DISC_DIAMETER_CM * 10 / 2)) * radiusPx;
};

function MockupStudio() {
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [discType, setDiscType] = useState('polos');
  const [productType, setProductType] = useState('table_stand');
  const [presetStyle, setPresetStyle] = useState('minimalis');
  const [customScene, setCustomScene] = useState('');
  const [originalImage, setOriginalImage] = useState(null);
  const [circularPreviewURL, setCircularPreviewURL] = useState(null);
  const [mockupResults, setMockupResults] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [imgZoom, setImgZoom] = useState(1);
  const [imgRotation, setImgRotation] = useState(0);
  const [imgPanX, setImgPanX] = useState(0);
  const [imgPanY, setImgPanY] = useState(0);
  const [printBrightness, setPrintBrightness] = useState(100);
  const [printContrast, setPrintContrast] = useState(100);
  const [printSaturation, setPrintSaturation] = useState(100);
  const fileInputRef = useRef(null);

  const pushToast = useCallback((type, title, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 4000);
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setMockupResults([]);
        setSelectedIdx(0);
        setImgZoom(1);
        setImgRotation(0);
        setImgPanX(0);
        setImgPanY(0);
        pushToast('success', 'Image Loaded', 'Adjust zoom and rotation, then generate.');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const redrawPreview = useCallback(() => {
    if (!originalImage) return null;
    const canvas = document.createElement('canvas');
    canvas.width = DISC_PX;
    canvas.height = DISC_PX;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, DISC_PX, DISC_PX);
    ctx.beginPath();
    ctx.arc(DISC_PX / 2, DISC_PX / 2, DISC_PX / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const tCtx = document.createElement('canvas').getContext('2d');
    tCtx.canvas.width = 1;
    tCtx.canvas.height = 1;
    tCtx.drawImage(originalImage, originalImage.width * 0.05, originalImage.height / 2, 1, 1, 0, 0, 1, 1);
    const [r, g, b, a] = tCtx.getImageData(0, 0, 1, 1).data;
    if (a > 10) {
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fill();
    }

    const SAFE_SCALE = 0.92;
    const baseScale = Math.max(DISC_PX / originalImage.width, DISC_PX / originalImage.height) * SAFE_SCALE;
    const finalScale = baseScale * imgZoom;
    const dw = originalImage.width * finalScale;
    const dh = originalImage.height * finalScale;
    const cx = DISC_PX / 2 + (imgPanX * DISC_PX / 100);
    const cy = DISC_PX / 2 + (imgPanY * DISC_PX / 100);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((imgRotation * Math.PI) / 180);
    ctx.drawImage(originalImage, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();

    if (discType === 'dvd') {
      const hubCx = DISC_PX / 2;
      const hubCy = DISC_PX / 2;
      const holeR = mmToPxRadius(DISC_PX, 7.5);
      const innerRingR = mmToPxRadius(DISC_PX, 10);
      const outerRingR = mmToPxRadius(DISC_PX, 18);
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.arc(hubCx, hubCy, outerRingR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hubCx, hubCy, innerRingR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hubCx, hubCy, holeR, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
    }

    const dataUrl = canvas.toDataURL('image/png');
    setCircularPreviewURL(dataUrl);
    return dataUrl;
  }, [originalImage, discType, imgZoom, imgRotation, imgPanX, imgPanY]);

  const buildAIInput = useCallback(() => new Promise((resolve) => {
    const previewUrl = redrawPreview();
    if (!previewUrl) return resolve(null);
    const PAD_FACTOR = 1.5;
    const padSize = Math.round(DISC_PX * PAD_FACTOR);
    const padCanvas = document.createElement('canvas');
    padCanvas.width = padSize;
    padCanvas.height = padSize;
    const padCtx = padCanvas.getContext('2d');
    padCtx.fillStyle = '#FFFFFF';
    padCtx.fillRect(0, 0, padSize, padSize);
    const discImg = new Image();
    discImg.onload = () => {
      const offset = (padSize - DISC_PX) / 2;
      padCtx.drawImage(discImg, offset, offset, DISC_PX, DISC_PX);
      resolve(padCanvas.toDataURL('image/png'));
    };
    discImg.onerror = () => resolve(null);
    discImg.src = previewUrl;
  }), [redrawPreview]);

  useEffect(() => {
    if (originalImage) redrawPreview();
  }, [originalImage, discType, imgZoom, imgRotation, imgPanX, imgPanY, redrawPreview]);

  const buildPrompt = () => {
    const isDVD = discType === 'dvd';
    const needsStand = productType === 'table_stand' || productType === 'both';
    const currentPreset = SCENE_PRESETS.find((preset) => preset.value === presetStyle) || SCENE_PRESETS[0];
    const scenePrompt = presetStyle === 'custom'
      ? `[SCENE: CUSTOM]\nApply user details: ${customScene.trim()}\nRespect GLOBAL INVARIANTS A-G. Keep print identical.`
      : `[SCENE: ${currentPreset.label.toUpperCase().replace(/\s/g, '_')}]\n${currentPreset.prompt}`;

    const replicateCommand = 'TASK: Render a product photography scene containing the MDF board product. The uploaded image shows the circular disc artwork centered on a white background. Extract ONLY the circular disc portion and place it as the printed face of the MDF board. STRICT RULES: (1) The print on the board must be a PIXEL-IDENTICAL reproduction of the disc in the uploaded image. (2) Do NOT read, interpret, or regenerate any text, logos, or graphics - copy them exactly. (3) Do NOT crop, zoom, scale, or reposition the artwork. (4) Apply ALL creative effort to the BACKGROUND SCENE ONLY. The product print is FROZEN and UNTOUCHABLE.';
    const standInstruction = needsStand ? '\n**MUST INCLUDE** the Black Folding Plate Display Stand as specified in the component contract.' : '';

    let placementDesc = '';
    switch (productType) {
      case 'table_stand': placementDesc = 'Disc on tabletop, supported by a black plate display stand. Eye-level camera.'; break;
      case 'wall_mount': placementDesc = 'Disc hanging flat on a neutral wall. NO STAND, NO EASEL. Eye-level camera.'; break;
      case 'framed': placementDesc = 'Disc inside simple wooden shadow box on a wall. Eye-level camera.'; break;
      case 'both': placementDesc = 'One disc on tabletop with stand (foreground) AND another identical disc wall-mounted in background. Eye-level camera.'; break;
      default: placementDesc = '';
    }

    const styleOverride = isDVD ? DVD_OVERRIDE_PROMPT : POLOS_OVERRIDE_PROMPT;
    const bothOverride = productType === 'both' ? BOTH_SPEC_PROMPT : '';

    return `
[TASK] ${replicateCommand}${standInstruction}

[PLACEMENT] ${placementDesc}

${scenePrompt}

${bothOverride}
${styleOverride}
${NEGATIVE_PROMPT_BLOCK}

[LIGHTING & BG SAFETY] ${MANDATORY_COLOR_ENFORCEMENT}

[FINAL CHECKPOINT - PRINT FIDELITY]
Before outputting, verify: Is the printed artwork on the board face an EXACT, unmodified copy of the circular disc from the input image? If any text, graphic, or color has been changed, RE-DO the render. The print is sacred and immutable.
                `.trim();
  };

  const handleGenerate = async () => {
    if (!originalImage) return pushToast('error', 'Upload Required', 'Please upload an image first.');
    const aiInputBase64 = await buildAIInput();
    if (!aiInputBase64) return null;
    const hiResBase64 = circularPreviewURL || redrawPreview();
    const BATCH_COUNT = 3;
    setIsLoading(true);
    setMockupResults([]);
    setSelectedIdx(0);
    setLoadingText(`Generating ${BATCH_COUNT} variations...`);

    try {
      let inputForMockup = aiInputBase64;
      const isDVD = discType === 'dvd';

      if (isDVD) {
        setLoadingText('Stage 1: Generating CD/DVD Geometry...');
        const stage1Prompt = 'Circular 20cm diameter product made of 6mm thick MDF board with light brown wood edges. Edge-to-edge print on the front. Center hole: 15mm pure black. Data ring: 20mm-36mm silver/transparent. Surface: Smooth Art Paper texture. Output isolated, circular board only, transparent background. Scale 20cm equivalent.';
        const payload1 = {
          contents: [{ role: 'user', parts: [{ text: stage1Prompt }, { inlineData: { mimeType: 'image/png', data: hiResBase64.replace(/^data:image\/png;base64,/, '') } }] }],
          systemInstruction: { parts: [{ text: BASE_SYSTEM_INSTRUCTION }] },
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
        };
        const res1 = await fetchWithRetry(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload1) });
        if (!res1.ok) throw new Error('DVD Stage Failed');
        const json1 = await res1.json();
        const b64 = json1?.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData?.data;
        if (b64) inputForMockup = `data:image/png;base64,${b64}`;
      }

      setLoadingText(isDVD ? `Stage 2: Rendering ${BATCH_COUNT} mockups...` : `Rendering ${BATCH_COUNT} mockup variations...`);
      const systemPrompt = [
        GLOBAL_INVARIANTS_SYSTEM_INSTRUCTION,
        BASE_SYSTEM_INSTRUCTION,
        productType === 'table_stand' || productType === 'both' ? '\n[COMPONENT: STAND SPEC]\nType: Black folding decorative plate display stand (plate easel).\n**CRITICAL:** Stand must be rendered as a **black plastic/wood plate display stand** with two curved front hooks that hold the bottom rim of the disc, and a back supporting leg. Finish: Matte or satin black.' : ''
      ].filter(Boolean).join('\n\n');
      const userPrompt = buildPrompt();
      const imageData = inputForMockup.replace(/^data:image\/png;base64,/, '');

      const requests = Array.from({ length: BATCH_COUNT }, (_, i) => {
        const payload = {
          contents: [{ role: 'user', parts: [{ text: `${userPrompt}\n[VARIATION_SEED: ${i + 1}]` }, { inlineData: { mimeType: 'image/png', data: imageData } }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
        };
        return fetchWithRetry(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          .then((res) => res.ok ? res.json() : null)
          .then((json) => {
            const b64 = json?.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData?.data;
            return b64 ? `data:image/jpeg;base64,${b64}` : null;
          })
          .catch(() => null);
      });

      const results = await Promise.all(requests);
      const successResults = results.filter(Boolean);
      if (successResults.length === 0) throw new Error('All generation attempts failed.');
      setMockupResults(successResults);
      setSelectedIdx(0);
      pushToast('success', 'Batch Complete', `${successResults.length}/${BATCH_COUNT} mockups generated. Pick your favorite.`);
    } catch (err) {
      console.error(err);
      pushToast('error', 'Generation Failed', err.message);
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  const exportPresetsToJson = () => {
    const config = {
      discType, productType, presetStyle, customScene,
      adjustments: { zoom: imgZoom, rotation: imgRotation, panX: imgPanX, panY: imgPanY }
    };
    const jsonStr = JSON.stringify(config, null, 2);
    const fallbackCopy = (text) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        pushToast('success', 'Copied', 'JSON preset copied to clipboard.');
      } catch {
        pushToast('error', 'Copy Failed', 'Could not copy to clipboard.');
      }
      document.body.removeChild(ta);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(jsonStr)
        .then(() => pushToast('success', 'Copied', 'JSON preset copied to clipboard.'))
        .catch(() => fallbackCopy(jsonStr));
    } else {
      fallbackCopy(jsonStr);
    }
  };

  const downloadMockup = (idx) => {
    const selected = idx !== undefined ? idx : selectedIdx;
    const url = mockupResults[selected];
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `mockup_v${selected + 1}_${Date.now()}.jpg`;
    a.click();
  };

  const buildPrintPNG = useCallback(() => new Promise((resolve) => {
    if (!circularPreviewURL) return resolve(null);
    const img = new Image();
    img.onload = () => {
      const size = img.width;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.filter = `brightness(${printBrightness}%) contrast(${printContrast}%) saturate(${printSaturation}%)`;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = circularPreviewURL;
  }), [circularPreviewURL, printBrightness, printContrast, printSaturation]);

  const autoAnalyzeMockup = useCallback(() => {
    if (!circularPreviewURL || mockupResults.length === 0) return;
    const analyzeImage = (src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        const sampleSize = 64;
        c.width = sampleSize;
        c.height = sampleSize;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
        let totalR = 0, totalG = 0, totalB = 0, count = 0;
        for (let y = 0; y < sampleSize; y += 1) {
          for (let x = 0; x < sampleSize; x += 1) {
            const dx = x - sampleSize / 2;
            const dy = y - sampleSize / 2;
            if (dx * dx + dy * dy > (sampleSize / 2.5) * (sampleSize / 2.5)) continue;
            const i = (y * sampleSize + x) * 4;
            if (data[i + 3] < 128) continue;
            totalR += data[i];
            totalG += data[i + 1];
            totalB += data[i + 2];
            count += 1;
          }
        }
        if (count === 0) return resolve({ brightness: 128, saturation: 128 });
        const avgR = totalR / count;
        const avgG = totalG / count;
        const avgB = totalB / count;
        const brightness = (avgR + avgG + avgB) / 3;
        const max = Math.max(avgR, avgG, avgB);
        const min = Math.min(avgR, avgG, avgB);
        const saturation = max === 0 ? 0 : (max - min) / max * 255;
        return resolve({ brightness, saturation });
      };
      img.src = src;
    });

    Promise.all([analyzeImage(circularPreviewURL), analyzeImage(mockupResults[selectedIdx])]).then(([preview, mockup]) => {
      const bRatio = preview.brightness > 0 ? mockup.brightness / preview.brightness : 1;
      const sRatio = preview.saturation > 0 ? mockup.saturation / preview.saturation : 1;
      const newB = Math.round(Math.max(70, Math.min(130, bRatio * 100)));
      const newS = Math.round(Math.max(70, Math.min(130, sRatio * 100)));
      setPrintBrightness(newB);
      setPrintContrast(100);
      setPrintSaturation(newS);
      pushToast('success', 'Auto-Analyzed', `Brightness: ${newB}%, Saturation: ${newS}%`);
    });
  }, [circularPreviewURL, mockupResults, selectedIdx, pushToast]);

  const downloadPrintPNG = async () => {
    if (!circularPreviewURL) return pushToast('error', 'No Image', 'Upload an image first.');
    setLoadingText('Building print-ready PNG...');
    setIsLoading(true);
    try {
      const pngData = await buildPrintPNG();
      if (!pngData) throw new Error('Failed to build print image.');
      const a = document.createElement('a');
      a.href = pngData;
      a.download = `Print_Ready_20cm_${Date.now()}.png`;
      a.click();
      pushToast('success', 'PNG Downloaded', `High-res transparent PNG (${DISC_PX}px) ready for print.`);
    } catch (err) {
      console.error(err);
      pushToast('error', 'Export Failed', err.message);
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  const resetAdjustments = () => {
    setImgZoom(1);
    setImgRotation(0);
    setImgPanX(0);
    setImgPanY(0);
  };

  return (
    <ToolShell
      title="Mockup Studio"
      subtitle="Generate 20cm MDF product mockups, print exports, and batch variations."
      aside={<Button variant="secondary" onClick={exportPresetsToJson}>Copy JSON</Button>}
    >
      <section className="mockup-layout">
        <div className="mockup-stage">
          <Card className="mockup-preview-card">
            {!originalImage ? (
              <button className="mockup-upload" type="button" onClick={() => fileInputRef.current?.click()}>
                <strong>Upload design</strong>
                <span>Recommended 2000 x 2000 px artwork.</span>
              </button>
            ) : mockupResults.length > 0 ? (
              <>
                <div className="mockup-result">
                  <img src={mockupResults[selectedIdx]} alt={`Mockup variation ${selectedIdx + 1}`} />
                  <span>Variation {selectedIdx + 1} of {mockupResults.length}</span>
                  {isLoading ? <div className="mockup-loading">{loadingText}</div> : null}
                </div>
                <div className="mockup-thumbs">
                  {mockupResults.map((url, index) => (
                    <button
                      className={index === selectedIdx ? 'active' : ''}
                      key={url}
                      type="button"
                      onClick={() => setSelectedIdx(index)}
                    >
                      <img src={url} alt={`Variation ${index + 1}`} loading="lazy" />
                      <span>V{index + 1}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="mockup-disc">
                {circularPreviewURL ? <img src={circularPreviewURL} alt="Circular preview" /> : null}
                {isLoading ? <div className="mockup-loading">{loadingText}</div> : null}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileUpload} />
          </Card>

          {originalImage && mockupResults.length === 0 ? (
            <Card className="mockup-controls-card">
              <div className="mockup-card-head">
                <h2>Image Adjustments</h2>
                <Button variant="secondary" onClick={resetAdjustments}>Reset</Button>
              </div>
              <Slider label="Zoom" value={imgZoom} min={0.3} max={2.5} step={0.01} onChange={setImgZoom} suffix={`${Math.round(imgZoom * 100)}%`} />
              <Slider label="Rotate" value={imgRotation} min={-180} max={180} step={0.5} onChange={setImgRotation} suffix={`${imgRotation} deg`} />
              <Slider label="Horizontal" value={imgPanX} min={-40} max={40} step={0.2} onChange={setImgPanX} suffix={imgPanX.toFixed(1)} />
              <Slider label="Vertical" value={imgPanY} min={-40} max={40} step={0.2} onChange={setImgPanY} suffix={imgPanY.toFixed(1)} />
            </Card>
          ) : null}

          {mockupResults.length > 0 ? (
            <Card className="mockup-controls-card">
              <div className="mockup-card-head">
                <h2>Print Polish</h2>
                <Button variant="secondary" onClick={autoAnalyzeMockup}>Auto Match</Button>
              </div>
              <div className="mockup-print-polish">
                <div className="mockup-print-preview">
                  {circularPreviewURL ? (
                    <img
                      src={circularPreviewURL}
                      alt="Print preview"
                      style={{ filter: `brightness(${printBrightness}%) contrast(${printContrast}%) saturate(${printSaturation}%)` }}
                    />
                  ) : null}
                </div>
                <div>
                  <Slider label="Bright" value={printBrightness} min={70} max={130} step={1} onChange={setPrintBrightness} suffix={`${printBrightness}%`} />
                  <Slider label="Contrast" value={printContrast} min={70} max={130} step={1} onChange={setPrintContrast} suffix={`${printContrast}%`} />
                  <Slider label="Saturate" value={printSaturation} min={70} max={130} step={1} onChange={setPrintSaturation} suffix={`${printSaturation}%`} />
                </div>
              </div>
            </Card>
          ) : null}

          {originalImage ? (
            <div className="mockup-actions">
              <Button variant="secondary" onClick={() => { setMockupResults([]); setSelectedIdx(0); }}>
                {mockupResults.length > 0 ? 'Back to Edit' : 'Change Design'}
              </Button>
              {mockupResults.length > 0 ? (
                <>
                  <Button variant="primary" onClick={() => downloadMockup()}>Download V{selectedIdx + 1}</Button>
                  <Button variant="primary" onClick={() => mockupResults.forEach((_, index) => downloadMockup(index))}>Download All</Button>
                </>
              ) : null}
              <Button variant="primary" onClick={downloadPrintPNG}>Print PNG</Button>
            </div>
          ) : null}
        </div>

        <Card className="mockup-settings">
          <h2>Product Settings</h2>
          <Segmented
            label="Geometry Format"
            value={discType}
            onChange={setDiscType}
            options={[
              { id: 'polos', label: 'Polos Full Print' },
              { id: 'dvd', label: 'DVD Center Hole' }
            ]}
          />
          <Segmented
            label="Display Placement"
            value={productType}
            onChange={setProductType}
            options={[
              { id: 'table_stand', label: 'Table Stand' },
              { id: 'wall_mount', label: 'Wall Mount' },
              { id: 'framed', label: 'Framed Box' },
              { id: 'both', label: 'Both Combo' }
            ]}
          />
          <Field label="Scene Environment">
            <select value={presetStyle} onChange={(event) => setPresetStyle(event.target.value)}>
              {SCENE_PRESETS.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
              <option value="custom">Custom Prompt</option>
            </select>
          </Field>
          {presetStyle === 'custom' ? (
            <Field label="Custom Scene">
              <textarea
                value={customScene}
                onChange={(event) => setCustomScene(event.target.value)}
                placeholder="Describe the background and lighting..."
                rows={5}
              />
            </Field>
          ) : null}
          <Button className="mockup-generate" variant="primary" disabled={isLoading || !originalImage} onClick={handleGenerate}>
            {isLoading ? 'Processing...' : 'Generate 3 Mockups'}
          </Button>
        </Card>
      </section>

      <div className="mockup-toasts">
        {toasts.map((toast) => (
          <div className={`mockup-toast ${toast.type}`} key={toast.id}>
            <strong>{toast.title}</strong>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToolShell>
  );
}

function Segmented({ label, options, value, onChange }) {
  return (
    <div className="mockup-segmented">
      <span>{label}</span>
      <div>
        {options.map((option) => (
          <button
            key={option.id}
            className={value === option.id ? 'active' : ''}
            type="button"
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, suffix }) {
  return (
    <label className="mockup-slider">
      <span>
        <strong>{label}</strong>
        <em>{suffix}</em>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(parseFloat(event.target.value))} />
    </label>
  );
}

createRoot(document.getElementById('root')).render(<MockupStudio />);
