import { assetUrl } from "./site";

export type FeatureId = "chat" | "image" | "research" | "translation";

export interface ProductFeature {
  id: FeatureId;
  label: string;
  shortLabel: string;
  title: string;
  description: string;
  bullets: string[];
  image: string;
  accent: string;
}

export const PRODUCT_FEATURES: ProductFeature[] = [
  {
    id: "chat",
    label: "Chat",
    shortLabel: "Chat",
    title: "Multi-model chat that stays on your machine",
    description:
      "Stream from GPT, Claude, Gemini, and more with a familiar interface. Switch models mid-conversation, attach documents, and keep every thread in local SQLite.",
    bullets: [
      "Bring your own API keys — OpenRouter, OpenAI, Anthropic, Google",
      "Document uploads with drag-and-drop",
      "Prompt library and reusable workflows",
    ],
    image: assetUrl("images/chat.png"),
    accent: "from-indigo-500/20 to-violet-500/10",
  },
  {
    id: "image",
    label: "Image Generate",
    shortLabel: "Images",
    title: "Generate images without leaving the app",
    description:
      "Describe what you want, pick a style and aspect ratio, and get results in seconds. Improve prompts with one click and download outputs locally.",
    bullets: [
      "Auto Router or pick a specific image model",
      "Square, landscape, and portrait formats",
      "History and one-click download",
    ],
    image: assetUrl("images/image-generator.png"),
    accent: "from-fuchsia-500/20 to-pink-500/10",
  },
  {
    id: "research",
    label: "Research",
    shortLabel: "Research",
    title: "Research assistant with cited answers",
    description:
      "Ask complex questions and get structured reports with inline citations. Powered by Perplexity Sonar models through your own API key.",
    bullets: [
      "Web-grounded answers with source numbers",
      "Summary, key points, and detailed sections",
      "Tab history for parallel research threads",
    ],
    image: assetUrl("images/research.png"),
    accent: "from-cyan-500/20 to-blue-500/10",
  },
  {
    id: "translation",
    label: "Translation",
    shortLabel: "Translate",
    title: "Translate whole files — PDFs included",
    description:
      "Upload a document, preview the original side-by-side with the translation, and save the result in the same format. Academic layouts stay readable.",
    bullets: [
      "Translate text or entire PDF files",
      "Side-by-side scrollable previews",
      "Save as… with native file picker",
    ],
    image: assetUrl("images/translation.png"),
    accent: "from-emerald-500/20 to-teal-500/10",
  },
];
