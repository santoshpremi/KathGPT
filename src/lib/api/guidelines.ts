import { useGuidelinesQuery, useUpdateGuidelines } from "./localHooks";

export const useGuidelines = () => {
  const { data } = useGuidelinesQuery();
  const { mutateAsync: updateGuidelines } = useUpdateGuidelines();
  return {
    accepted: data?.accepted ?? true,
    lastUpdated: data?.lastUpdated,
    updateGuidelines,
  };
};
