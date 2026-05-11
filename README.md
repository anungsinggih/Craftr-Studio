# Craftr Studio

Premium AI-driven tools for circular wall decor products, bundled into a single Hub workspace.

## Active Modules

- **Craftr Hub**: Central portal, build orchestrator, shared theme, and API bridge.
- **Product Generator**: Imagen-powered circular art generator with center-lock print preparation.
- **Scene Generator**: Gemini-powered lifestyle, collection, and catalogue mockup generator.
- **Mockup Studio**: Product mockup and marketplace asset workflow.
- **Bobing Studio**: Fashion catalogue and recolor workspace.

## Project Structure

```text
Craftr-Studio/
├── craftr-hub/
│   ├── scripts/            # Build and scaffolding scripts
│   ├── src/
│   │   ├── shared/         # Shared JSX shell, UI primitives, and base CSS
│   │   ├── tools/          # Modular tool entries and configs
│   │   ├── hub-template.html
│   │   └── tool-theme.css
│   └── dist/               # Ignored build output
├── PRD.md
└── README.md
```

All active tool source lives in `craftr-hub/src/tools`.

## Build

```bash
cd craftr-hub
npm install
npm run build
```

Open `craftr-hub/dist/index.html` after building.

## Add A Tool

```bash
cd craftr-hub
npm run new:tool -- --id product-audit --label "Product Audit" --order 100
npm run build
```

Each active tool needs a `tool.config.json` under `craftr-hub/src/tools/<tool-id>/`.

## Production Standards

- Physical format: 200mm round MDF board, 6mm thickness.
- Export target: high-resolution print assets.
- Fidelity target: 90%+ print match through center-locked composition.

© 2026 Bobing Corp. All rights reserved.
