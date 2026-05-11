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

/**
 * Format a single detected region entry.
 * Matches HTML format: "N. <color name> (<hex>) on <part description>"
 */
function formatRegion(item, index) {
  const color = item.originalColor || item.colorName || `color ${index + 1}`;
  const hex = (item.originalHex || item.hex || '').toLowerCase();
  const part = item.partDescription || item.area || 'garment region';
  return `${index + 1}. ${color} (${hex}) on ${part}`;
}

/**
 * Build an explicit region-aware recolor prompt.
 *
 * When the user has detected regions AND made explicit selections, the prompt
 * splits into two unambiguous sections:
 *   - RECOLOR THESE REGIONS ONLY: <selected>
 *   - MUST KEEP UNCHANGED: <unselected>
 *
 * This prevents the AI from misinterpreting "change the main fabric" as a
 * global recolor when the user actually wants a surgical change to a specific
 * detected area only.
 *
 * `selectedRegions` and `unselectedRegions` are arrays of
 *   { originalColor, originalHex, partDescription }
 * Pass both so the prompt can build opposing preserve/recolor instructions.
 *
 * `recolorRegion` is kept as optional user-supplied free-text (extra note).
 */
export function buildRecolorPrompt({
  targetHex,
  colorName,
  productName,
  recolorRegion,
  selectedRegions = [],
  unselectedRegions = [],
}) {
  const targetLabel = colorName ? `${colorName} (${targetHex})` : targetHex;
  const hasDetected = selectedRegions.length > 0 || unselectedRegions.length > 0;

  // Build region instructions depending on what the user has selected.
  let regionBlock;

  if (selectedRegions.length > 0 && unselectedRegions.length > 0) {
    // Mixed case: some regions are selected, others must be preserved.
    // This is the multi-color product case and needs the strictest isolation.
    const recolorList = selectedRegions.map(formatRegion).join('\n');
    const preserveList = unselectedRegions.map(formatRegion).join('\n');

    regionBlock = `
RECOLOR THESE REGIONS ONLY — change to ${targetLabel}:
${recolorList}

MUST KEEP UNCHANGED (preserve the exact original color pixel-faithful, do NOT tint, do NOT shift hue):
${preserveList}

STRICT ISOLATION RULES:
- Only the regions listed under "RECOLOR THESE REGIONS ONLY" may change color.
- Every region listed under "MUST KEEP UNCHANGED" must retain its original hex color exactly.
- Do NOT apply the new color globally across the whole garment.
- Do NOT let the new color bleed into preserved regions, even along the boundary between them.
- Keep the spatial boundary between recolored and preserved regions sharp and accurate.
- If you are uncertain where a boundary lies, prefer preserving the original color over over-applying the new color.
`.trim();
  } else if (selectedRegions.length > 0) {
    // All detected regions are selected — recolor all of them to target.
    const recolorList = selectedRegions.map(formatRegion).join('\n');
    regionBlock = `
RECOLOR THESE REGIONS — change to ${targetLabel}:
${recolorList}

PRESERVE everything not listed above: skin, face, hijab styling (unless part of the listed region), hair, model identity, background, props, buttons, labels, embroidery, print motifs, stitching, and all non-garment elements.
`.trim();
  } else if (unselectedRegions.length > 0) {
    // Smart-detect ran but user unchecked everything. Nothing to recolor.
    // This should ideally be blocked in UI, but guard anyway.
    regionBlock = `
NO RECOLOR TARGET SELECTED.
The user deselected every detected region. Return the image unchanged.
`.trim();
  } else {
    // No Smart Detect was used. Fall back to the original free-text behavior.
    regionBlock = `
RECOLOR TARGET:
- Change the selected garment fabric area to ${targetLabel}.
- ${recolorRegion || 'Change only the main garment fabric color.'}
SMART DETECTED REGIONS TO RECOLOR: none; infer the main garment fabric only.
`.trim();
  }

  const userNote = hasDetected && recolorRegion && recolorRegion.trim()
    ? `\nADDITIONAL USER NOTE: ${recolorRegion.trim()}\n`
    : '';

  return `
TASK: Create a new marketplace color variant from the uploaded fashion product image by performing a precise, region-scoped color swap.
${productName ? `PRODUCT NAME: ${productName}.` : ''}

${regionBlock}
${userNote}
PRESERVE (apply to the entire image):
- Keep the exact garment design, motif layout, embroidery, seams, buttons, trims, label, pockets, fabric texture, folds, shadows, highlights, silhouette, and camera angle.
- Preserve model/mannequin identity or product display, background, lighting direction, composition, and realism.
- Do not recolor skin, face, hair, hijab (unless the hijab is the explicitly listed region), background, props, labels, buttons, embroidery, or printed motifs.
- For multi-color products, recolor ONLY the selected regions. Every unselected color stays identical to the source.

QUALITY:
- The new color must look naturally dyed into the fabric, with realistic texture and lighting.
- Result must look like a real unedited product photo for marketplace color variants.

OUTPUT: 1:1 square PNG, photorealistic, high-resolution, no text, no watermark, no graphics.
  `.trim();
}

export const DETECT_COLORS_PROMPT = `
Analyze the uploaded fashion product image for region-aware recolor preparation.
Identify every dominant, visually distinct garment color region that could be recolored independently.

Return JSON ONLY, no markdown, as an array of 1 to 6 objects sorted from largest region to smallest.

Each object must have:
- originalColor: short human color name (e.g. "charcoal grey", "sage green", "dusty pink", "off white")
- originalHex: the closest 6-digit HEX color of the fabric in that region
- partDescription: a specific spatial description of WHERE this region is on the garment, so a downstream editor can target it precisely. Examples:
    "upper body / torso front panel"
    "lower body / skirt section"
    "left sleeve from shoulder to cuff"
    "outer layer / abaya overcoat"
    "inner dress visible under the outer layer"
    "collar and neckline trim"
    "hijab / headscarf fabric"
    "hem band at the bottom edge"
    "yoke panel across the chest"
  Always describe the ACTUAL spatial location, never a generic "main color".
- editable: true if this region is garment fabric suitable for a clean fabric recolor (false for skin/face/accessories/background).

For products with 2 or more color combinations (e.g. grey top + black skirt), list EACH color block as its own object with its own spatial region — do not merge them into one. Different visible color blocks MUST become different entries so the user can pick one at a time.

Exclude skin, face, hands, background, floor, shadows, jewelry, buttons, hardware, labels, price tags, watermarks, and non-garment props.
`.trim();
