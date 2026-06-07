import { useEffect } from "react";
import { useNavigate } from "../../router";
import { useOrganizationQuery } from "./localHooks";

export function useOrganization({ skip }: { skip: boolean } = { skip: false }) {
  const { data } = useOrganizationQuery();
  return skip ? undefined : data;
}

export function usePartOfCurrentOrganization() {
  const navigate = useNavigate();
  const { data: org, isError, isFetched } = useOrganizationQuery();

  useEffect(() => {
    if (isFetched && (isError || !org)) {
      void navigate("/", { replace: true });
    }
  }, [isError, org, navigate, isFetched]);
}
