# Product Requirements Document (PRD): Craftr Studio Ecosystem

## 1. Project Overview
**Craftr Studio** is a premium, AI-driven creative ecosystem designed for the e-commerce and home decor market. It specializes in the end-to-end workflow of creating, visualizing, and preparing high-fidelity circular wall decor (specifically 20cm MDF boards) for production and sale.

The ecosystem bridges the gap between AI-generated art and physical product reality, ensuring that what the user sees in a mockup is exactly what can be printed and shipped.

---

## 2. Problem Statement
E-commerce sellers face three major hurdles when selling custom printed products:
1. **Design Gap**: Creating "sellable" art that fits specific product shapes (like circles) without awkward cropping.
2. **Visualization Gap**: Creating realistic, high-quality mockups that don't look like cheap "photoshops."
3. **Production Gap**: Ensuring the digital asset is high-resolution and correctly formatted for physical printing (correct PPI, bleed, and color).

---

## 3. Goals & Objectives
- **Zero-Friction Design**: Use AI (Imagen 4.0) to generate marketplace-ready circular art.
- **Realistic Visualization**: Use AI (Gemini 2.5 Flash) to generate photorealistic product mockups in contextual scenes.
- **Print Fidelity**: Maintain a "Print Match" score of 90%+, ensuring pixel-perfect translation from screen to board.
- **Centralized Hub**: Provide a unified workspace (Craftr Hub) to manage multiple creative tools seamlessly.

---

## 4. Key Modules & Features

### 4.1 Craftr Studio V2 (Premium Mockup Engine)
*   **Contextual Rendering**: Generates realistic scenes (Minimalist, Retro, Neon, Industrial, Cozy) using `gemini-2.5-flash-image-preview`.
*   **Physical Constraints**: Specifically tuned for 20cm x 6mm MDF boards.
*   **Product Variants**: Supports "Polos" (flat board) and "DVD" style (with center hole and metallic ring).
*   **Interactive Adjustments**: Client-side zoom, rotation, and panning before AI generation.
*   **Print Polish**: Auto-analysis tool to match print brightness/saturation with the generated mockup lighting.

### 4.2 AI Craftr (Design Generator)
*   **Imagen 4.0 Integration**: Generates high-quality art from text prompts.
*   **Style Presets**: Flat Vector, Scandi, Watercolor, Line Art, Kids Cartoon, Japanese.
*   **Center-Lock Composition**: Specialized prompt engineering to ensure subjects are centered and no critical details are cropped by the circular edge.
*   **Prompt Refiner**: Uses Gemini to transform simple user ideas into professional art-directed prompts.

### 4.3 Craftr Hub (Workspace)
*   **Multi-App Orchestration**: A single-page portal that loads various Craftr tools into isolated, iframes.
*   **Secure API Proxy**: Handles communication with Google AI services (Gemini/Imagen) securely.
*   **Unified UI**: Shared light SaaS design language, responsive Hub navigation, and premium typography.

---

## 5. Technical Requirements
*   **Frontend**: 
    *   Framework: React 18.
    *   Styling: Tailwind CSS (Utility-first) + Vanilla CSS (Glassmorphism).
    *   Icons: Lucide React.
*   **AI Stack**:
    *   Vision/Prompting: Gemini 2.5 Flash.
    *   Image Generation: Imagen 4.0.
*   **Graphics**: HTML5 Canvas for real-time preview, cropping, and high-res export.
*   **Performance**: esbuild for lightning-fast builds and module bundling.

---

## 6. Success Metrics
*   **User Satisfaction**: High aesthetic appeal of generated mockups ("The WOW Factor").
*   **Accuracy**: 95% of generated designs are "center-locked" and ready for circular printing.
*   **Efficiency**: Reducing the time from "idea" to "marketplace listing" to under 2 minutes.

---

## 7. Future Roadmap
*   **3D Scene Support**: Extend the modular Scene Generator for true 3D spatial mockups.
*   **Custom Product Shapes**: Support for Hexagons, Hearts, and Custom Die-cuts.
*   **Batch Processing**: Generate entire collections (10+ designs) from a single theme.
