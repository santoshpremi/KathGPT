import { useMutation } from "@tanstack/react-query";
import { translateText } from "../translate";

export function useTranslateText() {
  return useMutation({
    mutationFn: translateText,
  });
}
