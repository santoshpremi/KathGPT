import type { ApiOrganization } from "@apiTypes/Organization";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ModelOverride } from "@shared/api/chat/chatTypes";
import type { Department } from "@shared/api/organization/departmentTypes";
import type { KnowledgeCollection } from "@shared/api/rag/dataPool/dataPoolTypes";
import type { Workflow } from "@shared/api/workflow/workflowTypes";
import {
  LOCAL_ENABLED_MODELS,
  LOCAL_ORGANIZATION,
  LOCAL_PRODUCT_CONFIG,
} from "../local/seed";
import { SUPPORT_EMAIL } from "../../shared/constants/contact";
import * as rustWorkflows from "./rust/workflows";
import type { RustWorkflow } from "./rust/workflows";

function toAppWorkflow(w: RustWorkflow): Workflow {
  return {
    id: w.id,
    name: w.name,
    description: w.description,
    index: w.index,
    departmentId: w.departmentId,
    steps: w.steps.map((s) => ({
      id: s.id,
      order: s.order,
      promptTemplate: s.promptTemplate,
      modelOverride: s.modelOverride,
    })),
    createdAt: new Date(w.createdAt),
    updatedAt: new Date(w.updatedAt),
  };
}

export function useOrganizationQuery() {
  return useQuery<ApiOrganization>({
    queryKey: ["organization"],
    queryFn: async () => LOCAL_ORGANIZATION,
    staleTime: Infinity,
  });
}

export function useProductConfig() {
  return useQuery({
    queryKey: ["productConfig"],
    queryFn: async () => LOCAL_PRODUCT_CONFIG,
    staleTime: Infinity,
  });
}

export function useGuidelinesQuery() {
  return useQuery({
    queryKey: ["guidelines"],
    queryFn: async () => ({
      accepted: true,
      lastUpdated: new Date().toISOString(),
    }),
    staleTime: Infinity,
  });
}

export function useUpdateGuidelines() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_accepted: boolean) => true,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["guidelines"] }),
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const workflows = await rustWorkflows.listWorkflows();
      const personal: Department = {
        id: "personal",
        name: "Personal",
        workflows: workflows
          .filter((w) => w.departmentId === "personal")
          .map(toAppWorkflow),
        writePermission: true,
        isPersonal: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return [personal];
    },
    staleTime: 30_000,
  });
}

export function useFavoriteWorkflows() {
  return useQuery({
    queryKey: ["workflows", "favorites"],
    queryFn: async () => {
      const favorites = await rustWorkflows.listFavoriteWorkflows();
      return favorites.map(toAppWorkflow);
    },
    staleTime: 30_000,
  });
}

export function useToggleWorkflowFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workflowId: string) =>
      rustWorkflows.toggleWorkflowFavorite(workflowId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workflows"] });
      void queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useUpdateWorkflowDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      workflowId: string;
      departmentId: string;
      index: number;
    }) => {
      await rustWorkflows.updateWorkflow(input.workflowId, {
        departmentId: input.departmentId,
        index: input.index,
      });
      return true;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["departments"] });
      void queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useKnowledgeCollections() {
  return useQuery({
    queryKey: ["rag", "collections"],
    queryFn: async () => [] as KnowledgeCollection[],
    staleTime: Infinity,
  });
}

export function useUpdateRagMode() {
  return useMutation({
    mutationFn: async (_input: {
      chatId: string;
      ragMode: string;
      customSourceId?: string;
    }) => true,
  });
}

export function useMarkDataPoolSeen() {
  return useMutation({
    mutationFn: async (_id?: string) => true,
  });
}

export function useDeveloperApiKeys() {
  return useQuery({
    queryKey: ["developerApiKeys"],
    queryFn: async () => [] as { id: string; displayName: string }[],
    staleTime: Infinity,
  });
}

export function useCreateDeveloperApiKey() {
  return useMutation({
    mutationFn: async (_input: { displayName: string }) => ({
      id: "local_key",
      displayName: _input.displayName,
      key: "local-dev-key-not-available",
    }),
  });
}

export function useDeleteDeveloperApiKey() {
  return useMutation({
    mutationFn: async (_id: string) => true,
  });
}

export function useApiKeysEnabled() {
  return useQuery({
    queryKey: ["apiKeysEnabled"],
    queryFn: async () => true,
    staleTime: Infinity,
  });
}

export function useEnabledModelsList() {
  return useQuery({
    queryKey: ["model-config", "enabled-static"],
    queryFn: async () => LOCAL_ENABLED_MODELS as ModelOverride[],
    staleTime: Infinity,
  });
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: async (_input: unknown) => true,
  });
}

export function useWorkflowById(workflowId: string | undefined) {
  return useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: async () => {
      if (!workflowId) return null;
      try {
        return toAppWorkflow(await rustWorkflows.getWorkflow(workflowId));
      } catch {
        return null;
      }
    },
    enabled: !!workflowId,
  });
}

export function useAllOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: async () => [LOCAL_ORGANIZATION],
    staleTime: Infinity,
  });
}

export function useContactInfo() {
  return useQuery({
    queryKey: ["contactInfo"],
    queryFn: async () => ({
      email: SUPPORT_EMAIL,
      phone: null,
      name: "Support",
      additionalInfo: null,
      departmentName: null,
    }),
    staleTime: Infinity,
  });
}

export function usePhaseAnalytics() {
  return useQuery({
    queryKey: ["phaseAnalytics"],
    queryFn: async () => ({
      numPrompts: 0,
      totalMinutesSaved: 0,
      numWorkflowRuns: 0,
    }),
    staleTime: Infinity,
  });
}

export function useDocumentIntelligenceEnabled() {
  return useQuery({
    queryKey: ["documentIntelligence"],
    queryFn: async () => true,
    staleTime: Infinity,
  });
}

export function useConfiguredImageModels() {
  return useQuery({
    queryKey: ["imageModels", "ids"],
    queryFn: async () => {
      const { listImageModels } = await import("./rust/images");
      const models = await listImageModels();
      return models.map((m) => m.id);
    },
    staleTime: 60_000,
  });
}

export function useTechSupportEnabled() {
  return useQuery({
    queryKey: ["techSupportEnabled"],
    queryFn: async () => false,
    staleTime: Infinity,
  });
}

export function useTextTranslationEnabled() {
  return useQuery({
    queryKey: ["textTranslationEnabled"],
    queryFn: async () => LOCAL_PRODUCT_CONFIG.textTranslator,
    staleTime: Infinity,
  });
}

export function useDocumentTranslationEnabled() {
  return useQuery({
    queryKey: ["documentTranslationEnabled"],
    queryFn: async () => LOCAL_PRODUCT_CONFIG.documentTranslator,
    staleTime: Infinity,
  });
}

export function usePersonalDepartment() {
  return useQuery({
    queryKey: ["personalDepartment"],
    queryFn: async () => {
      const workflows = await rustWorkflows.listWorkflows();
      const personal: Department = {
        id: "personal",
        name: "Personal",
        workflows: workflows
          .filter((w) => w.departmentId === "personal")
          .map(toAppWorkflow),
        writePermission: true,
        isPersonal: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return personal;
    },
    staleTime: 30_000,
  });
}

export function useWorkflowTemplates(language: string) {
  return useQuery({
    queryKey: ["workflowTemplates", language],
    queryFn: async () =>
      [] as { id: string; name: string; description?: string }[],
    staleTime: Infinity,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      description?: string;
      departmentId?: string;
      index?: number;
      templateId?: string;
      steps?: Workflow["steps"];
    }) => {
      const { createId } = await import("@paralleldrive/cuid2");
      const w = await rustWorkflows.createWorkflow({
        id: input.id ?? createId(),
        name: input.name,
        description: input.description,
        departmentId: input.departmentId ?? "personal",
        steps: input.steps?.map((s) => ({
          id: s.id,
          order: s.order,
          promptTemplate: s.promptTemplate,
          modelOverride: s.modelOverride,
        })),
      });
      return w.id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["departments"] });
      void queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useGenerateWorkflow() {
  return useMutation({
    mutationFn: async (_input: unknown) => null as Workflow | null,
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string;
      departmentId?: string;
      index?: number;
      steps?: Workflow["steps"];
      updatedAt?: Date;
    }) => {
      await rustWorkflows.updateWorkflow(input.id, {
        name: input.name,
        description: input.description,
        departmentId: input.departmentId,
        index: input.index,
        steps: input.steps?.map((s) => ({
          id: s.id,
          order: s.order,
          promptTemplate: s.promptTemplate,
          modelOverride: s.modelOverride,
        })),
      });
      return true;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["departments"] });
      void queryClient.invalidateQueries({ queryKey: ["workflows"] });
      void queryClient.invalidateQueries({ queryKey: ["workflow", variables.id] });
    },
  });
}

export function useTechSupportAnalytics(from: string, to: string) {
  return useQuery({
    queryKey: ["techSupportAnalytics", from, to],
    queryFn: async () => ({
      totalRequests: 0,
      totalIssuesSolved: 0,
      unknownOutcome: 0,
      totalTicketsCreated: 0,
      solvedRequestsByDay: [] as Array<{
        day: string;
        solved_requests: number;
        tickets_created: number;
        unknown_outcome: number;
      }>,
    }),
    staleTime: Infinity,
    enabled: !!from && !!to,
  });
}
