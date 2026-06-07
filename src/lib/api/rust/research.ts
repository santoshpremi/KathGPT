import { rustFetch } from "./client";

export interface ResearchMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SearchResultItem {
  title: string;
  url: string;
  date?: string;
}

export interface ResearchResult {
  content: string;
  citations: string[];
  searchResults: SearchResultItem[];
  citedIndices: number[];
}

export function runResearchQuery(input: {
  model: string;
  messages: ResearchMessage[];
}): Promise<ResearchResult> {
  return rustFetch("/research/query", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
