import { assetUrl } from "./site";

export type FeatureId = "chat" | "image" | "research" | "translation" | "meeting";

export interface ProductFeature {
  id: FeatureId;
  label: string;
  shortLabel: string;
  title: string;
  description: string;
  bullets: string[];
  image: string;
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
    image: assetUrl("images/chats.png"),
  },
  {
    id: "image",
    label: "Image Generator",
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
    image: assetUrl("images/Research-assis.png"),
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
    image: assetUrl("images/Translate.png"),
  },
  {
    id: "meeting",
    label: "Meeting tools",
    shortLabel: "Meetings",
    title: "Turn meeting notes into action",
    description:
      "Paste a transcript or rough notes, then summarize the discussion or pull out action items with AI — without sending your data to a cloud workspace.",
    bullets: [
      "Summarize long transcripts in seconds",
      "Extract owners, deadlines, and next steps",
      "Dedicated tool workspace with chat history",
    ],
    image: assetUrl("images/Meeting-tools.png"),
  },
];
