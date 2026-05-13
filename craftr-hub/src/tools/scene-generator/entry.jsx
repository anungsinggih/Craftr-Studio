import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Card, Field, ToolShell } from '../../shared/ui.jsx';
import '../../shared/tool-template.css';
import './scene-tool.css';

const SINGLE_IMAGE_PRESETS = [
  {
    title: "Musician's Studio Vibe",
    id: 'single-musician',
    prompt: 'A photorealistic 3D render: Display the 6mm MDF art panel, standing on a glossy black tabletop plate display stand with curved front supports, on an aged wooden amp case next to a vintage electric guitar and some sheet music. The lighting is low and moody, coming from a single warm light bulb, creating a strong contrast and shadow.'
  },
  {
    title: 'Minimalist Office Credenza',
    id: 'single-office',
    prompt: 'A photorealistic 3D render: Showcase the 6mm MDF art panel, standing on a glossy black tabletop plate display stand with curved front supports, on a clean white marble credenza in a high-rise executive office. The background is a blurred city view. Use bright, even, professional daylighting.'
  },
  {
    title: 'Industrial Shelf Display',
    id: 'single-industrial',
    prompt: 'A photorealistic 3D render: Place the 6mm MDF art panel, standing on a glossy black tabletop plate display stand with curved front supports, on a black metal industrial shelving unit. The background is a light gray concrete wall. The scene is lit by warm overhead track lighting, focusing on texture and material contrast.'
  },
  {
    title: 'Neon Gaming Setup',
    id: 'single-gaming',
    prompt: 'A photorealistic 3D render: Place the 6mm MDF art panel, standing on a glossy black tabletop plate display stand with curved front supports, on a large matte black gaming desk next to a mechanical keyboard and a high-end monitor showing a blurred game screen. The room is dark with vibrant blue and magenta neon lighting, synthwave aesthetic.'
  },
  {
    title: 'Rustic Map Table',
    id: 'single-travel',
    prompt: 'A photorealistic 3D render: Showcase the 6mm MDF art panel, standing on a glossy black tabletop plate display stand with curved front supports, on a worn wooden table covered in old maps, a vintage compass, and a leather journal. The scene is lit by warm, diffused sunlight coming through a window.'
  },
  {
    title: 'Natural Spa/Meditation Corner',
    id: 'single-spa',
    prompt: 'A photorealistic 3D render: Display the 6mm MDF art panel, standing on a glossy black tabletop plate display stand with curved front supports, on a smooth light gray stone floor next to a small bonsai tree and a few polished river stones. The scene uses soft, uniform daylight and a clean Zen-like aesthetic.'
  },
  {
    title: 'Cozy Bookshelf Nook',
    id: 'single-bookshelf',
    prompt: 'A photorealistic 3D render: Display the uploaded 6mm MDF art panel, standing on a glossy black tabletop plate display stand with curved front supports, on a shelf within a rustic wooden bookshelf. The scene should be cozy with warm amber lighting, books, and a cup of coffee nearby. Natural, soft window light from the side.'
  }
];

const MULTI_IMAGE_PRESETS = [
  {
    title: 'Gallery Wall Trio',
    id: 'multi-gallery',
    prompt: 'A photorealistic 3D render: Create a modern minimalist gallery wall. All art pieces are identical in size and shape. Place Image 1, a 6mm MDF panel on a glossy black tabletop plate display stand with curved front supports, centrally and slightly larger. Flank it symmetrically with Image 2 and Image 3, both 6mm MDF panels on matching glossy black tabletop plate display stands, slightly smaller, creating an appealing art arrangement on a light grey wall. Soft, even gallery lighting.'
  },
  {
    title: 'Bookshelf Showcase (Stacked)',
    id: 'multi-stacked',
    prompt: 'A photorealistic 3D render: All art pieces are identical in size and shape. Display Image 1, Image 2, and Image 3 as 6mm MDF art panels, each on its own matching glossy black tabletop plate display stand with curved front supports. Arrange them artfully on different shelves of a chic modern wooden bookshelf. Image 1 is on the middle shelf, Image 2 on the top, and Image 3 on the bottom. The lighting is warm and inviting.'
  },
  {
    title: 'Creative Desk Spread',
    id: 'multi-desk',
    prompt: 'A photorealistic 3D render: All art pieces are identical in size and shape. Arrange Image 1, Image 2, and Image 3, all 6mm MDF panels on matching glossy black tabletop plate display stands with curved front supports, on a large stylish desk. Image 1 is prominent, standing slightly behind Image 2 and Image 3, which are positioned to the left and right front respectively. Add subtle office decor like a plant or a pen holder. Soft window light.'
  },
  {
    title: 'Lounge Side Table Collection',
    id: 'multi-lounge',
    prompt: 'A photorealistic 3D render: All art pieces are identical in size and shape. Group Image 1, Image 2, and Image 3, all 6mm MDF panels on matching glossy black tabletop plate display stands with curved front supports, only on a low contemporary lounge side table next to a comfortable armchair. Image 1 is the main piece, with Image 2 and Image 3 casually arranged around it on the table surface. Use moody, relaxed evening lighting.'
  }
];

const CATALOGUE_PRESETS = [
  {
    title: 'Product Angle Showcase (Minimal)',
    id: 'catalogue-minimal',
    prompt: 'A photorealistic product photography render: Focus on the 6mm MDF art panel. Display three views: Image 1 is a direct front view on the glossy black tabletop plate display stand, Image 2 is a 45-degree angle showing thickness and side profile, and Image 3 is a slightly top-down corner view, arranged neatly on a plain white surface with studio lighting. Treat Image 1, Image 2, and Image 3 as different angles of the same product.'
  },
  {
    title: 'Detailed Catalogue Shot (Wood)',
    id: 'catalogue-wood',
    prompt: 'A detailed, photorealistic product shot: Display the 6mm MDF art panel on a simple light wood grain surface. Image 1 shows the full front on the glossy black tabletop plate display stand, Image 2 shows a close-up of the print texture, and Image 3 shows the back with the same black stand and the 6mm thickness profile. Use soft, warm studio lighting.'
  },
  {
    title: 'Lifestyle Angles (Dark)',
    id: 'catalogue-dark',
    prompt: 'A high-contrast lifestyle product shot against a dark background. Image 1 shows the product in a dimly lit high-end office on the glossy black tabletop plate display stand. Image 2 is a dramatic close-up showing texture. Image 3 shows the product from a low angle on the same curved black stand. Treat Image 1, Image 2, and Image 3 as different angles of the same product.'
  }
];

const PRODUCT_STAND_DESCRIPTION = [
  'Use the exact same stand style in every generated mockup:',
  'a glossy black tabletop plate display stand for a round MDF panel, not a tripod easel.',
  'The stand has two visible front supports shaped like curved S-hooks, short sturdy feet, and a small rear support/brace behind the panel.',
  'The round MDF panel sits upright in the stand cradle, with the lower edge resting securely in the black stand slots.',
  'Keep the stand black, compact, symmetrical, and consistent across all scenes.',
  'If a scene preset mentions "black easel", replace it with this exact glossy black tabletop plate display stand.'
].join(' ');

const withStandLock = (scenePrompt) => `
      ${scenePrompt}

      MANDATORY STAND CONSISTENCY:
      ${PRODUCT_STAND_DESCRIPTION}
      Do not generate a tripod easel, wooden easel, metal wire stand, transparent acrylic stand, frame stand, or any alternate support shape.
      The product must look like a round MDF art panel displayed on the same black curved plate stand shown in the product reference.
    `;

const modes = ['Single', 'Multi', 'Catalogue'];

const getMaxFiles = (mode) => mode === 'Single' ? 1 : 3;
const getMinFiles = (mode) => mode === 'Single' ? 1 : 2;
const getPresets = (mode) => {
  if (mode === 'Single') return SINGLE_IMAGE_PRESETS;
  if (mode === 'Multi') return MULTI_IMAGE_PRESETS;
  return CATALOGUE_PRESETS;
};

const getModeDescription = (mode) => {
  if (mode === 'Single') return 'One product, one lifestyle scene';
  if (mode === 'Multi') return 'Collection display with 2-3 pieces';
  return 'Catalogue view with product angles';
};

const truncate = (text, length = 92) => text.length > length ? `${text.slice(0, length)}...` : text;

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const withBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i += 1) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return null;
};

function SceneGenerator() {
  const [mode, setModeState] = React.useState('Single');
  const [uploadedFiles, setUploadedFiles] = React.useState([]);
  const [selectedPreset, setSelectedPreset] = React.useState(SINGLE_IMAGE_PRESETS[0]);
  const [selectedScene, setSelectedScene] = React.useState(SINGLE_IMAGE_PRESETS[0].prompt);
  const [generatedImageUrl, setGeneratedImageUrl] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const fileInputRef = React.useRef(null);
  const uploadedFilesRef = React.useRef([]);

  const presets = React.useMemo(() => getPresets(mode), [mode]);
  const minFiles = getMinFiles(mode);
  const maxFiles = getMaxFiles(mode);
  const hasEnoughUploads = uploadedFiles.length >= minFiles && uploadedFiles.length <= maxFiles;
  const sceneReady = hasEnoughUploads && Boolean(selectedScene.trim());

  React.useEffect(() => {
    uploadedFilesRef.current = uploadedFiles;
  }, [uploadedFiles]);

  React.useEffect(() => () => {
    uploadedFilesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, []);

  const setMode = (nextMode) => {
    uploadedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    const nextPreset = getPresets(nextMode)[0];
    setModeState(nextMode);
    setUploadedFiles([]);
    setGeneratedImageUrl(null);
    setError(null);
    setSelectedPreset(nextPreset);
    setSelectedScene(nextPreset.prompt);
  };

  const addFile = async (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(`File "${file.name}" is too large. Max size is 5MB.`);
      return;
    }

    if (uploadedFiles.length >= maxFiles) {
      setError(`You can only upload up to ${maxFiles} images in ${mode} mode.`);
      return;
    }

    setError(null);
    setGeneratedImageUrl(null);

    try {
      const base64 = await fileToBase64(file);
      const item = {
        file,
        base64,
        id: Date.now() + Math.random(),
        previewUrl: URL.createObjectURL(file)
      };

      setUploadedFiles((current) => {
        if (mode === 'Single') {
          current.forEach((oldItem) => URL.revokeObjectURL(oldItem.previewUrl));
          return [item];
        }
        return [...current, item];
      });
    } catch {
      setError(`Could not read file "${file.name}".`);
    }
  };

  const handleFileInput = (event) => {
    const file = event.target.files?.[0];
    addFile(file);
    event.target.value = '';
  };

  const removeFile = (id) => {
    setUploadedFiles((current) => {
      const item = current.find((file) => file.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return current.filter((file) => file.id !== id);
    });
    setGeneratedImageUrl(null);
    setError(null);
  };

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    setSelectedScene(preset.prompt);
    setGeneratedImageUrl(null);
  };

  const generateScene = async () => {
    if (uploadedFiles.length < minFiles || uploadedFiles.length > maxFiles || !selectedScene) {
      setError(`Please upload between ${minFiles} and ${maxFiles} images for ${mode} mode.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    const apiKey = ''; // Canvas provides this key at runtime
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
    const isMulti = mode === 'Multi' || mode === 'Catalogue';
    const standLockedScene = withStandLock(selectedScene);

    let promptDescription;
    if (mode === 'Catalogue') {
      promptDescription = `Task: You are a professional product photographer. Integrate the following ${uploadedFiles.length} uploaded images as different angles/views of the SAME round 6mm MDF art panel product displayed on the consistent glossy black tabletop plate display stand described below. The purpose is detailed product presentation. Scene description: ${standLockedScene}`;
    } else if (mode === 'Multi') {
      promptDescription = `Task: You are an image editor and scene generator. Integrate the following ${uploadedFiles.length} uploaded art pieces as round 6mm MDF panels on identical glossy black tabletop plate display stands into the scene described. Refer to them as Image 1, Image 2, Image 3 as they appear in the prompt. Scene description: ${standLockedScene}`;
    } else {
      promptDescription = `Task: You are an image editor and scene generator. Integrate the following uploaded art piece as a round 6mm MDF panel on the consistent glossy black tabletop plate display stand described below into the scene described. Scene description: ${standLockedScene}`;
    }

    const parts = [{ text: promptDescription }];
    uploadedFiles.forEach((item, index) => {
      parts.push({
        inlineData: {
          mimeType: item.file.type,
          data: item.base64
        }
      });

      if (isMulti) {
        parts.push({ text: `This is Image ${index + 1}.` });
      }
    });

    const payload = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['IMAGE']
      }
    };

    try {
      const response = await withBackoff(async () => {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          let message = 'Unknown error';
          try {
            const errorBody = await res.json();
            message = errorBody.error?.message || message;
          } catch {
            message = await res.text();
          }
          throw new Error(`API Request Failed: ${res.status} - ${message}`);
        }

        return res.json();
      });

      const base64Data = response?.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData?.data;

      if (base64Data) {
        setGeneratedImageUrl(`data:image/png;base64,${base64Data}`);
      } else {
        setError('Generation failed. The model did not return a valid image.');
      }
    } catch (err) {
      console.error('Error during image generation:', err);
      setError(`Failed to generate scene: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const title = selectedPreset?.title || 'mockup';
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `product-mockup-${title.replace(/\s+/g, '-')}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ToolShell
      title="Scene Generator"
      subtitle="Create lifestyle, collection, and catalogue mockups for round MDF products."
      aside={<span className="scene-chip">{getModeDescription(mode)}</span>}
    >
      <Card className="scene-mode-card">
        <div className="scene-tabs" role="tablist" aria-label="Scene modes">
          {modes.map((item) => (
            <button
              key={item}
              className={`scene-tab ${mode === item ? 'active' : ''}`}
              type="button"
              aria-pressed={mode === item}
              onClick={() => setMode(item)}
            >
              <strong>{item}</strong>
              <span>{item === 'Single' ? '1 image' : '2-3 images'}</span>
            </button>
          ))}
        </div>
      </Card>

      <section className="scene-grid">
        <div className="scene-stack">
          <Card className="scene-card scene-upload-card">
            <div className="scene-section-head">
              <div>
                <p className="scene-kicker">Step 1</p>
                <h2>Upload Product Art</h2>
              </div>
              <span className={hasEnoughUploads ? 'scene-status good' : 'scene-status'}>
                {uploadedFiles.length}/{maxFiles}
              </span>
            </div>

            <div
              className="scene-upload-zone"
              role="button"
              tabIndex={0}
              aria-label={`Upload ${minFiles} to ${maxFiles} product images`}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click();
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addFile(event.dataTransfer.files?.[0]);
              }}
            >
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileInput} />
              <strong>Drop image or browse</strong>
              <span>Required {minFiles}-{maxFiles} images. Max 5MB per file.</span>
            </div>

            <div className="scene-file-list">
              {uploadedFiles.length === 0 ? (
                <p className="scene-empty">No image uploaded yet.</p>
              ) : uploadedFiles.map((item, index) => (
                <article className="scene-file" key={item.id}>
                  <img src={item.previewUrl} alt={`Uploaded ${index + 1}`} loading="lazy" />
                  <div>
                    <strong>Image {index + 1}</strong>
                    <span>{truncate(item.file.name, 34)}</span>
                  </div>
                  <button type="button" onClick={() => removeFile(item.id)} aria-label={`Remove image ${index + 1}`}>
                    Remove
                  </button>
                </article>
              ))}
            </div>
          </Card>

          <Card className="scene-card scene-prompt-card">
            <div className="scene-section-head">
              <div>
                <p className="scene-kicker">Step 2</p>
                <h2>Choose Scene Direction</h2>
              </div>
              <span className="scene-status">{presets.length} presets</span>
            </div>

            <Field label="Scene Preset" hint={selectedPreset ? truncate(selectedPreset.prompt, 130) : ''}>
              <select
                className="scene-preset-select"
                value={selectedPreset?.id || ''}
                onChange={(event) => {
                  const preset = presets.find((item) => item.id === event.target.value);
                  if (preset) handlePresetSelect(preset);
                }}
              >
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.title}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Scene Prompt" hint={`${selectedScene.length} characters`}>
              <textarea
                value={selectedScene}
                onChange={(event) => {
                  setSelectedScene(event.target.value);
                  setGeneratedImageUrl(null);
                }}
                rows={7}
              />
            </Field>

            <Button variant="secondary" onClick={() => setSelectedScene(selectedPreset.prompt)}>
              Reset to selected preset
            </Button>
          </Card>
        </div>

        <Card className="scene-card scene-result-card">
          <div className="scene-section-head">
            <div>
              <p className="scene-kicker">Step 3</p>
              <h2>Generated Product Mockup</h2>
            </div>
            {generatedImageUrl ? (
              <Button variant="secondary" onClick={handleDownload}>
                Download PNG
              </Button>
            ) : null}
          </div>

          <div className="scene-workflow">
            <span className={hasEnoughUploads ? 'done' : ''}>Upload</span>
            <span className={sceneReady ? 'done' : ''}>Scene</span>
            <span className={generatedImageUrl ? 'done' : ''}>Generate</span>
          </div>

          {error ? <div className="scene-error">{error}</div> : null}

          <div className="scene-preview" aria-live="polite">
            {isLoading ? (
              <div className="scene-loading">
                <strong>Generating scene...</strong>
                <span>Keeping stand consistency and original product artwork.</span>
              </div>
            ) : generatedImageUrl ? (
              <img src={generatedImageUrl} alt="Generated product mockup" />
            ) : (
              <div className="scene-placeholder">
                <strong>Preview will appear here</strong>
                <span>Upload product art, choose a scene, then generate.</span>
              </div>
            )}
          </div>

          <Button
            className="scene-generate"
            variant="primary"
            disabled={isLoading || !sceneReady}
            onClick={generateScene}
          >
            {isLoading ? 'Generating...' : 'Generate Scene'}
          </Button>
        </Card>
      </section>
    </ToolShell>
  );
}

createRoot(document.getElementById('root')).render(<SceneGenerator />);
