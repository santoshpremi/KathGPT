import { create } from "zustand";
import type { ModelOverride } from "@backend/api/chat/chatTypes";
import { type DocumentOutputFormat } from "@backend/document/documentTypes";

interface QueuedMessage {
  content: string;
  chatId: string;
  attachmentIds?: string[];
  ragMode?: boolean;
  modelOverride?: ModelOverride;
  outputFormat?: DocumentOutputFormat | null;
  workflowExecutionId?: string;
}

interface QueuedMessagesStore {
  queuedMessages: QueuedMessage[];
  addQueuedMessage: (message: QueuedMessage) => void;
  shiftQueuedMessage: (chatId: string) => void;
  clear: () => void;
}

export const useQueuedMessagesStore = create<QueuedMessagesStore>((set) => ({
  queuedMessages: [],
  addQueuedMessage: (message) =>
    set((state) => ({
      queuedMessages: [...state.queuedMessages, message],
    })),
  shiftQueuedMessage: (chatId) =>
    set((state) => {
      const index = state.queuedMessages.findIndex((m) => m.chatId === chatId);
      if (index === -1) return state;
      return {
        queuedMessages: [
          ...state.queuedMessages.slice(0, index),
          ...state.queuedMessages.slice(index + 1),
        ],
      };
    }),
  clear: () => set({ queuedMessages: [] }),
}));
