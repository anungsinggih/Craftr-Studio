import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hubRoot = path.resolve(__dirname, '..');
const toolsRoot = path.join(hubRoot, 'src/tools');
const starterRoot = path.join(toolsRoot, '_starter-jsx');

const usage = `
Usage:
  npm run new:tool -- --id product-audit --label "Product Audit" [--order 100]

Rules:
  --id     kebab-case folder id. Example: product-audit
  --label  display name shown in Craftr Hub
  --order  optional nav order. Default: 100
`.trim();

const args = process.argv.slice(2);

const readArg = (name) => {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return null;
  return args[index + 1] || null;
};

const toPascalCase = (value) =>
  value
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const id = readArg('id');
const label = readArg('label');
const order = Number(readArg('order') || 100);

if (!id || !label) {
  console.error(usage);
  process.exit(1);
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
  console.error(`Invalid --id "${id}". Use kebab-case, e.g. product-audit.`);
  process.exit(1);
}

if (!Number.isFinite(order)) {
  console.error(`Invalid --order "${readArg('order')}". Use a number.`);
  process.exit(1);
}

const toolDir = path.join(toolsRoot, id);
const globalName = `Craftr${toPascalCase(id)}Tool`;

try {
  await fs.mkdir(toolDir, { recursive: false });
} catch (error) {
  if (error.code === 'EEXIST') {
    console.error(`Tool "${id}" already exists at ${path.relative(hubRoot, toolDir)}.`);
    process.exit(1);
  }
  throw error;
}

const starterEntry = await fs.readFile(path.join(starterRoot, 'entry.jsx'), 'utf8');
const entry = starterEntry
  .replaceAll('StarterTool', `${toPascalCase(id)}Tool`)
  .replace('title="Starter Tool"', `title="${label}"`)
  .replace('subtitle="Use this as the baseline for new JSX tools."', 'subtitle="New modular Craftr tool."');

const config = {
  id,
  label,
  type: 'jsx',
  order,
  entry: 'entry.jsx',
  globalName,
};

await fs.writeFile(path.join(toolDir, 'entry.jsx'), entry, 'utf8');
await fs.writeFile(path.join(toolDir, 'tool.config.json'), `${JSON.stringify(config, null, 2)}\n`, 'utf8');

console.log(`Created ${path.relative(hubRoot, toolDir)}`);
console.log(`Next: npm run build`);
