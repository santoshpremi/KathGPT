import { useMutation } from "@tanstack/react-query";
import { runResearchQuery } from "../research";

export function useResearchQuery() {
  return useMutation({
    mutationFn: runResearchQuery,
  });
}
