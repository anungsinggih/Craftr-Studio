import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hubRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(hubRoot, '..');

const readProjectFile = (relativePath) => fs.readFile(path.join(projectRoot, relativePath), 'utf8');

const escapeForScriptJson = (value) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

const geminiFetchBridge = `
<script>
(() => {
  const nativeFetch = window.fetch.bind(window);
  let requestId = 0;
  const pending = new Map();

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (!message || message.type !== 'craftr-gemini-fetch-result') return;

    const callbacks = pending.get(message.id);
    if (!callbacks) return;

    pending.delete(message.id);

    if (!message.ok) {
      callbacks.reject(new Error(message.error || 'Gemini request failed'));
      return;
    }

    callbacks.resolve(
      new Response(message.response.body, {
        status: message.response.status,
        statusText: message.response.statusText,
        headers: message.response.headers,
      }),
    );
  });

  window.fetch = (input, options = {}) => {
    const url = typeof input === 'string' ? input : input?.url;

    if (!url || !url.startsWith('https://generativelanguage.googleapis.com/')) {
      return nativeFetch(input, options);
    }

    const id = ++requestId;

    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      window.parent.postMessage(
        {
          type: 'craftr-gemini-fetch',
          id,
          url,
          options: {
            method: options.method,
            headers: options.headers,
            body: options.body,
          },
        },
        '*',
      );
    });
  };
})();
</script>`;

const injectGeminiFetchBridge = (html) => {
  if (html.includes('craftr-gemini-fetch')) return html;

  return html.includes('</head>')
    ? html.replace('</head>', `${geminiFetchBridge}\n</head>`)
    : `${geminiFetchBridge}\n${html}`;
};

const buildProductApp = async () => {
  const bundle = await build({
    entryPoints: [path.join(hubRoot, 'src/product-entry.jsx')],
    absWorkingDir: hubRoot,
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'CraftrProductGen',
    minify: true,
    jsx: 'automatic',
    nodePaths: [path.join(hubRoot, 'node_modules')],
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx',
    },
  });

  const shell = await fs.readFile(path.join(hubRoot, 'src/product-shell.html'), 'utf8');
  return injectGeminiFetchBridge(shell.replace('__PRODUCT_BUNDLE__', () => bundle.outputFiles[0].text));
};

const main = async () => {
  const [productHtml, sceneHtml, studioHtml, bobingHtml] = await Promise.all([
    buildProductApp(),
    readProjectFile('craftr-scene/index.html'),
    readProjectFile('craftr-studio/index.html'),
    readProjectFile('bobing-studio/index.html'),
  ]);

  const apps = [
    { id: 'productGen', label: 'Product Generator', html: productHtml },
    { id: 'sceneGen', label: 'Scene Generator', html: injectGeminiFetchBridge(sceneHtml) },
    { id: 'mockupStudio', label: 'Mockup Studio', html: injectGeminiFetchBridge(studioHtml) },
    { id: 'bobingStudio', label: 'Bobing Studio', html: injectGeminiFetchBridge(bobingHtml) },
  ];

  const template = await fs.readFile(path.join(hubRoot, 'src/hub-template.html'), 'utf8');
  const output = template.replace('__APPS_JSON__', () => escapeForScriptJson(apps));

  await fs.mkdir(path.join(hubRoot, 'dist'), { recursive: true });
  await fs.writeFile(path.join(hubRoot, 'dist/index.html'), output, 'utf8');

  const bytes = Buffer.byteLength(output, 'utf8');
  console.log(`Built craftr-hub/dist/index.html (${bytes.toLocaleString()} bytes)`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
