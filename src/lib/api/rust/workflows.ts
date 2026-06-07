import { rustFetch } from "./client";

export interface RustWorkflowStep {
  id: string;
  order: number;
  promptTemplate: string;
  modelOverride: string | null;
}

export interface RustWorkflow {
  id: string;
  name: string;
  description?: string;
  index: number;
  departmentId: string;
  steps: RustWorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export function listWorkflows(): Promise<RustWorkflow[]> {
  return rustFetch("/workflows");
}

export function getWorkflow(id: string): Promise<RustWorkflow> {
  return rustFetch(`/workflows/${id}`);
}

export function createWorkflow(input: {
  id: string;
  name: string;
  description?: string;
  departmentId?: string;
  steps?: RustWorkflowStep[];
}): Promise<RustWorkflow> {
  return rustFetch("/workflows", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateWorkflow(
  id: string,
  body: Partial<{
    name: string;
    description: string;
    departmentId: string;
    index: number;
    steps: RustWorkflowStep[];
  }>,
): Promise<RustWorkflow> {
  return rustFetch(`/workflows/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteWorkflow(id: string): Promise<{ success: boolean }> {
  return rustFetch(`/workflows/${id}`, { method: "DELETE" });
}

export function listFavoriteWorkflows(): Promise<RustWorkflow[]> {
  return rustFetch("/workflows/favorites");
}

export function toggleWorkflowFavorite(
  id: string,
): Promise<{ favorited: boolean }> {
  return rustFetch(`/workflows/${id}/favorite`, { method: "POST" });
}

export function exportData(): Promise<Record<string, unknown>> {
  return rustFetch("/data/export");
}

export function importData(
  snapshot: Record<string, unknown>,
): Promise<{ chats: number; messages: number; workflows: number }> {
  return rustFetch("/data/import", {
    method: "POST",
    body: JSON.stringify(snapshot),
  });
}
