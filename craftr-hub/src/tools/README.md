# Craftr Hub Tools

Every active tool lives in its own folder with a `tool.config.json`.

New tools should use JSX:

```json
{
  "id": "newTool",
  "label": "New Tool",
  "type": "jsx",
  "order": 100,
  "entry": "entry.jsx",
  "globalName": "NewToolApp"
}
```

Build behavior:
- `type: "jsx"` bundles the entry with esbuild.
- `type: "html"` keeps legacy HTML tools running during migration.
- If a JSX tool does not provide `shell`, the build uses `src/shared/jsx-tool-shell.html`.
- The final output remains a single `dist/index.html` for Gemini Canvas compatibility.

Use the scaffolder for new JSX tools:

```bash
npm run new:tool -- --id product-audit --label "Product Audit" --order 100
```

This creates:
- `src/tools/product-audit/entry.jsx`
- `src/tools/product-audit/tool.config.json`

Use `_starter-jsx` as the baseline template. It is not built because it has no `tool.config.json`.

After creating a tool, run:

```bash
npm run build
```
