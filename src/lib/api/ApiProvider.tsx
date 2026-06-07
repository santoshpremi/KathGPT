import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const MAX_RETRIES = 3;

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount) => failureCount < MAX_RETRIES,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
