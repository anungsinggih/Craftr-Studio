# Craftr Hub Modular Roadmap

## Phase 1: Manifest Modular Build
Status: Done.

- Support `type: "jsx"`.
- Support `type: "html"`.
- Keep all existing tools running as-is.

## Phase 2: Standard JSX Tool Template
Status: Foundation done.

- Create starter JSX tool structure.
- Add shared layout primitives: Button, Card, Field, Toolbar, UploadZone.
- Add shared Gemini bridge helper.
- Require all new tools to use JSX.

## Phase 3: Gradual Legacy Migration
Status: Done.

- Migrate Scene Generator to JSX. Done.
- Migrate Mockup Studio to JSX. Done.
- Migrate Bobing Studio to JSX. Done via JSX legacy adapter; DOM logic preserved for feature parity.
- Migrate one tool at a time and verify generate, upload, and download before moving on.

## Phase 4: Modern Global Theme Normalize
Status: Done.

- Use one shared Inter font stack across Hub and all JSX tool shells.
- Normalize global form controls, buttons, focus rings, upload zones, cards, shadows, text colors, and status surfaces.
- Keep Canva-like cyan/violet accent system across Hub and tools.
- Override legacy dark-mode tokens/utilities so Bobing, Product Generator, and old Tailwind class names render in the same light SaaS theme.
- Keep tool logic, prompt constants, API URLs, and request payloads unchanged.

## Phase 5: New Tool Developer Kit
Status: Done.

- Add `npm run new:tool` scaffolder for future JSX tools.
- Generate standard `entry.jsx` and `tool.config.json` from `_starter-jsx`.
- Keep `_starter-jsx` excluded from build output.
