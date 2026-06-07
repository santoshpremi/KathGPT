// backend/src/api/rag/dataPool/dataPoolTypes.ts
import { z } from "zod";

export const KnowledgeCollection = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type KnowledgeCollection = z.infer<typeof KnowledgeCollection>;