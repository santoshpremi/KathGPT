import { ApiUser } from "@apiTypes/User";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useParams } from "../../router";
import { rustFetch } from "./rust/client";
import { DEV_ORG_ID, LOCAL_USER } from "../local/seed";

interface RustUserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  locale: string;
  defaultModel: string;
  acceptedGuidelines: boolean;
}

function toApiUser(profile: RustUserProfile, organizationId: string): ApiUser {
  return ApiUser.parse({
    id: profile.id,
    firstName: profile.firstName ?? LOCAL_USER.firstName,
    lastName: profile.lastName ?? LOCAL_USER.lastName,
    email: profile.email ?? LOCAL_USER.email,
    organizationId,
    tourCompleted: true,
    roles: ["USER"],
    onboarded: true,
    acceptedGuidelines: profile.acceptedGuidelines,
  });
}

let lastOrganizationId: string | null = null;

export function useMe() {
  const params = useParams("/:organizationId");
  const organizationId = params.organizationId || DEV_ORG_ID;

  const { data, error, refetch } = useQuery({
    queryKey: ["user", "me", organizationId],
    queryFn: async () => {
      const profile = await rustFetch<RustUserProfile>("/user/me");
      return toApiUser(profile, organizationId);
    },
  });

  useEffect(() => {
    if (lastOrganizationId === null) {
      lastOrganizationId = organizationId;
      return;
    }
    if (organizationId === lastOrganizationId) return;
    lastOrganizationId = organizationId;
    void refetch();
  }, [organizationId, refetch]);

  if (error) {
    console.error("Error fetching user:", error);
    return LOCAL_USER;
  }

  return data;
}

export function useMutateMe() {
  return () => Promise.resolve();
}

export function useUser(userId: string | null): ApiUser | undefined | null {
  const me = useMe();
  if (!userId || userId === "me") return me;
  return null;
}

export function useOrganizationUsers() {
  return { data: [] as ApiUser[] };
}

export function useMutateOrganizationUsers() {
  return () => Promise.resolve();
}

export function useToggleUserPermissions() {
  return async (_userId: string) => undefined;
}

export function useUpdatePayloadApiKey() {
  return async (_payloadApiKey: string) => undefined;
}

export function useAcademyProfile() {
  return null;
}

export function useUpdateAcademyProfile() {
  return async (_profile: unknown) => undefined;
}
