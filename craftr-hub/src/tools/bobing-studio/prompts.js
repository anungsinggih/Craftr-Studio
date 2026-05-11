// ============================================================================
// BOBING STUDIO — FROZEN PROMPT CONSTANTS
// Do NOT modify these prompts. They are tested and stable.
// ============================================================================

export const CATALOG_SUBJECTS = {
  ai_model: 'a highly photorealistic modest fashion model suitable for Muslim fashion marketplace catalog, neat hijab styling when appropriate and not hiding garment details',
  mannequin: 'a realistic studio mannequin with no face, no hair, no skin, and no distracting features',
  original: 'the same original subject from the uploaded image, preserving identity and body proportions',
  product_only: 'the product only, no human model, no mannequin, arranged professionally',
};

export const CATALOG_SCENES = {
  white: 'pure white seamless studio background, front-facing full-body product catalog composition, soft even studio softbox lighting, camera at chest height, small clean margin around the product',
  gray: 'plain neutral light gray studio background, soft diffused lighting, full-body front or slight three-quarter catalog pose, clean premium marketplace look',
  detail: 'close-up detail catalog shot focused on fabric texture, stitching, embroidery, buttons, sleeve, cuff, collar, hem, or unique construction details',
  flatlay: 'top-down flat lay catalog photo on pure white surface, garment arranged symmetrically and neatly, even overhead lighting, no model',
};

export const CATALOG_POSES = {
  market_front: 'POSE: simple front-facing stance, standing straight, shoulders relaxed, hands naturally down or lightly relaxed, trustworthy marketplace fit view.',
  three_quarter: 'POSE: subtle three-quarter angle, one shoulder slightly angled toward camera, shows front and side silhouette while keeping garment details clear.',
  soft_hand: 'POSE: one hand gently highlights sleeve, cuff, pocket, collar, or fabric fall without covering key product details; other hand relaxed.',
  walking: 'POSE: gentle walking step with natural modest movement, fabric drapes and flows realistically, face/body calm, no exaggerated editorial action.',
  hands_relaxed: 'POSE: clean premium pose with both hands relaxed at sides or lightly joined, elegant posture, calm expression, product remains dominant.',
  side_back: 'POSE: side or slight back angle for 360 catalog view, garment back/side construction visible, posture straight and commercial.',
};

export function catalogScene(overrides = {}) {
  const { style = 'white', subject: subjectValue = 'ai_model', pose: poseValue = 'market_front', shotInstruction = '' } = overrides;

  const subject = CATALOG_SUBJECTS[subjectValue] || CATALOG_SUBJECTS.ai_model;
  const scene = CATALOG_SCENES[style] || CATALOG_SCENES.white;
  const pose = CATALOG_POSES[poseValue] || '';

  const shouldUsePose = ['ai_model', 'original'].includes(subjectValue) && !['flatlay', 'detail'].includes(style);

  return [
    `SUBJECT: ${subject}.`,
    `SCENE: ${scene}.`,
    shotInstruction ? `SHOT: ${shotInstruction}` : '',
    shouldUsePose ? pose : 'POSE: product-only, mannequin, flat lay, or detail composition should stay simple and strictly product-focused.',
  ].filter(Boolean).join('\n');
}

export function sharedMarketplaceRules() {
  return `
GOAL: Generate a professional product catalog photo for modest Muslim fashion marketplace listings.
PRODUCT ACCURACY IS TOP PRIORITY:
- Preserve the uploaded garment exactly: color family, motif, print placement, embroidery, fabric texture, seam lines, panel construction, buttons, cuffs, collar, pocket placement, label, hem length, silhouette, and fit.
- Do not redesign the garment. Do not add or remove pockets, buttons, pattern elements, panels, zippers, logos, labels, or trims.
- If there is conflict between beauty and product accuracy, choose product accuracy.
MARKETPLACE STYLE:
- Clean professional studio photo, photorealistic, high resolution, natural realistic fabric drape.
- Modest styling, respectful posture, no revealing pose, no exaggerated glamour, no editorial drama.
- Pose must help sell the garment: clear fit, visible silhouette, natural fabric fall, and no hands or accessories blocking product details.
- Product must be the main focus and fully visible unless this is a detail shot.
- No props, text, watermark, price tag, UI, graphic overlay, hanger, bag, jewelry focus, or distracting accessories.
- Soft even lighting, true-to-life color, controlled shadows.
OUTPUT: 1:1 square PNG, realistic unedited studio catalog photo, ready for Shopee/Tokopedia/marketplace listing.
  `.trim();
}

export function buildCatalogPrompt({ style, subject, pose, productName, productHint, shotInstruction }) {
  const scene = catalogScene({ style, subject, pose, shotInstruction });
  const rules = sharedMarketplaceRules();

  return [
    scene,
    rules,
    productName ? `PRODUCT NAME: ${productName}` : '',
    productHint ? `USER PRODUCT NOTE: ${productHint}` : '',
  ].filter(Boolean).join('\n\n');
}

export function buildRecolorPrompt({ targetHex, colorName, productName, recolorRegion, detectedRegionsText }) {
  return `
TASK: Create a new marketplace color variant from the uploaded fashion product image.
${productName ? `PRODUCT NAME: ${productName}.` : ''}
RECOLOR TARGET:
- Change the selected garment fabric area to ${colorName || targetHex} (${targetHex}).
- ${recolorRegion || 'Change only the main garment fabric color.'}
${detectedRegionsText ? `SMART DETECTED REGIONS TO RECOLOR:\n${detectedRegionsText}` : 'SMART DETECTED REGIONS TO RECOLOR: none selected; infer the main garment fabric only.'}
PRESERVE:
- Keep the exact garment design, motif layout, embroidery, seams, buttons, trims, label, pockets, fabric texture, folds, shadows, highlights, silhouette, and camera angle.
- Preserve model/mannequin identity or product display, background, lighting direction, composition, and realism.
- Do not recolor skin, face, hijab unless it is the garment being edited, background, props, labels, buttons, embroidery, or printed motifs unless explicitly requested.
- For multi-color products, recolor ONLY the selected detected region(s). Keep all unselected colors unchanged.
QUALITY:
- The new color must look naturally dyed into the fabric, with realistic texture and lighting.
- Result must look like a real unedited product photo for marketplace color variants.
OUTPUT: 1:1 square PNG, photorealistic, high-resolution, no text, no watermark, no graphics.
  `.trim();
}

export const DETECT_COLORS_PROMPT = `
Analyze the uploaded fashion product image for recolor preparation.
Identify the dominant editable garment color regions only.
Return JSON only, no markdown, as an array of 1 to 6 objects.
Each object must have:
- originalColor: short color name
- originalHex: closest 6-digit HEX color
- partDescription: specific garment area, for example "main body panel", "sleeves", "outer layer", "inner panel", "collar trim", "hijab fabric", "skirt panel"
- editable: true if this region is garment fabric suitable for recolor
Exclude skin, face, hands, background, floor, shadows, jewelry, buttons, labels, price tags, and non-garment props.
For products with 2 or more color combinations, separate each color region clearly.
`.trim();
