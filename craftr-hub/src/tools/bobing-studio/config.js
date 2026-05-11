// ============================================================================
// BOBING STUDIO — APP CONFIGURATION & CONSTANTS
// ============================================================================

export const API_MODEL = 'gemini-2.5-flash-image-preview';
export const OPTIMIZER_MODEL = 'gemini-2.5-flash-preview-05-20';
export const API_KEY = '';
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const QUICK_COLORS = [
  ['Sage', '#7d8b6f'],
  ['Army', '#4f5a3a'],
  ['Khaki', '#b7a57a'],
  ['Putih', '#f7f4ec'],
  ['Abu', '#8a8d8f'],
  ['Biru Muda', '#9fc7df'],
  ['Beige', '#d8c4a3'],
  ['Dusty Pink', '#c98f98'],
  ['Navy', '#1e2f4f'],
  ['Maroon', '#7b2530'],
  ['Mocca', '#8a6a55'],
  ['Black', '#111111'],
  ['Ivory', '#eee7d8'],
  ['Olive', '#606847'],
  ['Lilac', '#a89bc7'],
  ['Taupe', '#9b8b7b'],
  ['Sky', '#8db5d5'],
  ['Emerald', '#236b57'],
];

export const CATALOG_STYLES = [
  { value: 'white', label: 'White Studio' },
  { value: 'gray', label: 'Clean Gray' },
  { value: 'detail', label: 'Detail Shot' },
  { value: 'flatlay', label: 'Flat Lay' },
];

export const SUBJECT_TYPES = [
  { value: 'ai_model', label: 'AI model' },
  { value: 'mannequin', label: 'Mannequin' },
  { value: 'original', label: 'Original' },
  { value: 'product_only', label: 'Product only' },
];

export const MODEL_POSES = [
  { value: 'market_front', label: 'Front trust' },
  { value: 'three_quarter', label: 'Three-quarter fit' },
  { value: 'soft_hand', label: 'Sleeve/detail hand' },
  { value: 'walking', label: 'Gentle walking' },
  { value: 'hands_relaxed', label: 'Clean relaxed' },
  { value: 'side_back', label: 'Side/back 360' },
];

export const CATALOG_SET_VARIANTS = [
  { style: 'white', subject: 'ai_model', pose: 'market_front', shotInstruction: 'Full-body front-facing marketplace hero shot.' },
  { style: 'white', subject: 'ai_model', pose: 'three_quarter', shotInstruction: 'Three-quarter angle showing fit and silhouette.' },
  { style: 'detail', subject: 'product_only', pose: 'market_front', shotInstruction: 'Close-up fabric texture and stitching detail.' },
  { style: 'gray', subject: 'ai_model', pose: 'side_back', shotInstruction: 'Side or back angle for full 360 coverage.' },
];

export const QUICK_RECOLOR_COLORS = [
  ['Sage', '#7d8b6f'],
  ['Navy', '#1e2f4f'],
  ['Dusty Pink', '#c98f98'],
  ['Black', '#111111'],
  ['Maroon', '#7b2530'],
  ['Mocca', '#8a6a55'],
];

export const STORAGE_KEY = 'bobingStudioFavoriteColors';
