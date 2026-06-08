// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
  | `/`
  | `/:organizationId`
  | `/:organizationId/auth`
  | `/:organizationId/chats`
  | `/:organizationId/chats/:chatId`
  | `/:organizationId/learn/:workshopId`
  | `/:organizationId/onboarding`
  | `/:organizationId/tools/imageFactory`
  | `/:organizationId/tools/meetingTools`
  | `/:organizationId/tools/personalAssistant`
  | `/:organizationId/tools/researchAssistant`
  | `/:organizationId/tools/techSupport`
  | `/:organizationId/tools/translateContent`
  | `/:organizationId/workflows`
  | `/:organizationId/workflows/:workflowId`
  | `/organization-select`

export type Params = {
  '/:organizationId': { organizationId: string }
  '/:organizationId/auth': { organizationId: string }
  '/:organizationId/chats': { organizationId: string }
  '/:organizationId/chats/:chatId': { organizationId: string; chatId: string }
  '/:organizationId/learn/:workshopId': { organizationId: string; workshopId: string }
  '/:organizationId/onboarding': { organizationId: string }
  '/:organizationId/tools/imageFactory': { organizationId: string }
  '/:organizationId/tools/meetingTools': { organizationId: string }
  '/:organizationId/tools/personalAssistant': { organizationId: string }
  '/:organizationId/tools/researchAssistant': { organizationId: string }
  '/:organizationId/tools/techSupport': { organizationId: string }
  '/:organizationId/tools/translateContent': { organizationId: string }
  '/:organizationId/workflows': { organizationId: string }
  '/:organizationId/workflows/:workflowId': { organizationId: string; workflowId: string }
}

export type ModalPath = `/[organizationId]/tools/profileSettings` | `/[organizationId]/tools/techSupport/analytics` | `/addModels` | `/apiKeys` | `/feedback` | `/localModels`

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<Path, Params, ModalPath>()
export const { redirect } = utils<Path, Params>()
