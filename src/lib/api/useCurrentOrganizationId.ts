import { useParams } from "../../router";

export function useCurrentOrganizationId() {
  const id = useParams("/:organizationId").organizationId;
  if (!id) {
    throw new Error("Organization ID not found in URL");
  }
  return id;
}

export function useCurrentOrganizationIdSafe() {
  const id = useParams("/:organizationId").organizationId;
  return id ?? null;
}
