# Craftr Studio 🎨✨

> **The Premium AI-Driven Ecosystem for Circular Wall Decor**

Craftr Studio is an advanced suite of tools designed to streamline the workflow for creating, visualizing, and preparing high-fidelity circular art (MDF Boards) for the modern marketplace.

---

## 🚀 Key Modules

### 🛠️ Craftr Hub
The central cockpit. A unified workspace that orchestrates all Craftr tools in a single, high-performance interface. 
- **Features:** Secure API proxy, unified design system, and multi-tool iframe management.

### 🖼️ Craftr Studio V2 (Mockup Engine)
Turn your designs into photorealistic product photos instantly.
- **AI Engine:** Gemini 2.5 Flash.
- **Scenes:** Minimalist, Retro, Industrial, Neon, and Cozy Nook.
- **Accuracy:** Tuned for 20cm MDF boards with optional DVD/CD geometry.
- **Polish:** Integrated auto-analysis to sync design brightness with mockup lighting.

### 🎨 AI Craftr (Design Generator)
Generate sellable, print-ready art from a single prompt.
- **AI Engine:** Imagen 4.0.
- **Center-Lock:** Proprietary prompt engineering ensures your subject is perfectly centered and never cropped.
- **Styles:** Flat Vector, Scandi, Watercolor, Line Art, and more.
- **Refiner:** AI-powered art direction to level up your simple ideas.

---

## 📦 Project Structure

```text
Craftr-Studio/
├── craftr-hub/             # Central portal & build orchestrator
│   ├── src/                # Hub templates and entry points
│   ├── scripts/            # esbuild build scripts
│   └── dist/               # Final bundled output
```

---

## 🛠️ Tech Stack

- **Core:** React 18, HTML5 Canvas, Tailwind CSS.
- **AI Integration:** Google Gemini 2.5 Flash, Google Imagen 4.0.
- **Build Engine:** esbuild (Custom build pipeline).
- **Architecture:** Iframe-based micro-frontends with a unified API bridge.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Google AI API Key

### Build & Run
1. Install dependencies:
   ```bash
   cd craftr-hub
   npm install
   ```
2. Build the unified hub:
   ```bash
   npm run build
   ```
3. Open `craftr-hub/dist/index.html` in your browser.

---

## 📐 Production Standards

- **Physical Specs:** 200mm Diameter, 6mm Thickness.
- **Print Resolution:** 300 PPI Export.
- **Fidelity:** 90%+ Print Match Score guaranteed via Center-Lock composition.

---

## 📄 License
© 2026 Bobing Corp. All rights reserved. Built with ❤️ for the creative community.
