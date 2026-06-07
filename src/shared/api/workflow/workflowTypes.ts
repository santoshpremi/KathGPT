// backend/src/api/workflow/workflowTypes.ts
import { z } from "zod";

export const WorkflowStep = z.object({
  id: z.string(),
  order: z.number(),
  promptTemplate: z.string(),
  modelOverride: z.string().nullable()
});

export type WorkflowStep = z.infer<typeof WorkflowStep>;

export const WorkflowInput = z.object({
  key: z.string(),
  name: z.string(),
  type: z.string(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string()
  }))
});

export type WorkflowInput = z.infer<typeof WorkflowInput>;

export const Workflow = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  index: z.number(),
  departmentId: z.string(),
  templateId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  steps: z.array(WorkflowStep),
  inputs: z.array(WorkflowInput).optional(),
  modelOverride: z.string().nullable().optional(),
  outputFormat: z.string().optional(),
  allowDocumentUpload: z.boolean().optional(),
  includedDocuments: z.array(z.object({
    id: z.string()
  })).optional()
});

export type Workflow = z.infer<typeof Workflow>;

export const WorkflowCreateInput = Workflow.omit({ 
  id: true,
  createdAt: true,
  updatedAt: true 
});

export const WorkflowUpdateInput = Workflow.partial();

export const WorkflowGetAllInput = z.object({
  departmentId: z.string()
});