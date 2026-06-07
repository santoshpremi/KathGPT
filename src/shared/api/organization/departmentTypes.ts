// backend/src/api/organization/departmentTypes.ts
import { z } from "zod";
import { Workflow } from "../workflow/workflowTypes";


export const Department = z.object({
  id: z.string(),
  name: z.string(),
  workflows: z.array(Workflow),
  writePermission: z.boolean(),
  isPersonal: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Department = z.infer<typeof Department>;