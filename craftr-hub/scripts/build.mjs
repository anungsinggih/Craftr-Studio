import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hubRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(hubRoot, '..');

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

const readToolThemeCss = () => fs.readFile(path.join(hubRoot, 'src/tool-theme.css'), 'utf8');

const injectToolTheme = (html, css) => {
  if (html.includes('id="craftr-tool-theme"') || !css.trim()) return html;

  const style = `<style id="craftr-tool-theme">\n${css}\n</style>`;

  return html.includes('</head>')
    ? html.replace('</head>', `${style}\n</head>`)
    : `${style}\n${html}`;
};

const injectGeminiFetchBridge = (html) => {
  if (html.includes('craftr-gemini-fetch')) return html;

  return html.includes('</head>')
    ? html.replace('</head>', `${geminiFetchBridge}\n</head>`)
    : `${geminiFetchBridge}\n${html}`;
};

const resolveToolPath = (toolDir, relativePath) => path.resolve(toolDir, relativePath);

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

const listToolConfigs = async () => {
  const toolsRoot = path.join(hubRoot, 'src/tools');
  const entries = await fs.readdir(toolsRoot, { withFileTypes: true });
  const configs = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const toolDir = path.join(toolsRoot, entry.name);
    const configPath = path.join(toolDir, 'tool.config.json');

    try {
      await fs.access(configPath);
    } catch {
      continue;
    }

    const config = await readJson(configPath);
    configs.push({ ...config, configPath, toolDir });
  }

  return configs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

const assertToolConfig = (config) => {
  const required = ['id', 'label', 'type'];
  const missing = required.filter((key) => !config[key]);

  if (missing.length) {
    throw new Error(`${config.configPath} is missing required field(s): ${missing.join(', ')}`);
  }

  if (!['html', 'jsx'].includes(config.type)) {
    throw new Error(`${config.configPath} has unsupported type "${config.type}"`);
  }

  if (config.type === 'html' && !config.source) {
    throw new Error(`${config.configPath} is type "html" but has no source`);
  }

  if (config.type === 'jsx' && !config.entry) {
    throw new Error(`${config.configPath} is type "jsx" but needs entry`);
  }
};

const buildJsxApp = async ({ entry, shell, globalName, themeCss }) => {
  const bundle = await build({
    entryPoints: [entry],
    absWorkingDir: hubRoot,
    bundle: true,
    write: false,
    outdir: 'out',
    entryNames: '[name]',
    format: 'iife',
    globalName,
    minify: true,
    jsx: 'automatic',
    nodePaths: [path.join(hubRoot, 'node_modules')],
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx',
    },
  });

  const jsOutput = bundle.outputFiles.find((file) => file.path.endsWith('.js'));
  const cssOutput = bundle.outputFiles.find((file) => file.path.endsWith('.css'));
  const mergedCss = [cssOutput?.text, themeCss].filter(Boolean).join('\n');

  if (!jsOutput) {
    throw new Error(`No JavaScript output generated for ${entry}`);
  }

  return injectGeminiFetchBridge(
    shell
      .replace('__TOOL_THEME_CSS__', () => mergedCss)
      .replace('__PRODUCT_BUNDLE__', () => jsOutput.text)
      .replace('__APP_BUNDLE__', () => jsOutput.text),
  );
};

const buildHtmlTool = async (config, themeCss) => {
  const html = await fs.readFile(resolveToolPath(config.toolDir, config.source), 'utf8');
  return injectGeminiFetchBridge(injectToolTheme(html, themeCss));
};

const buildJsxTool = async (config, themeCss) => {
  const shellPath = config.shell
    ? resolveToolPath(config.toolDir, config.shell)
    : path.join(hubRoot, 'src/shared/jsx-tool-shell.html');
  const shell = await fs.readFile(shellPath, 'utf8');
  return buildJsxApp({
    entry: resolveToolPath(config.toolDir, config.entry),
    shell,
    globalName: config.globalName || `${config.id}App`,
    themeCss,
  });
};

const buildTool = async (config, themeCss) => {
  assertToolConfig(config);

  const html = config.type === 'jsx'
    ? await buildJsxTool(config, themeCss)
    : await buildHtmlTool(config, themeCss);

  return {
    id: config.id,
    label: config.label,
    html,
  };
};

const main = async () => {
  const toolThemeCss = await readToolThemeCss();
  const toolConfigs = await listToolConfigs();
  const apps = await Promise.all(toolConfigs.map((config) => buildTool(config, toolThemeCss)));

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
