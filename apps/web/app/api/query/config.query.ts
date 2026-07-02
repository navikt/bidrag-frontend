import type { ConfigResponse } from "~/server/configRoute.ts";

export const configQuery = {
    queryKey: ["internal/config"],
    queryFn: async () => {
        const response = await fetch("/internal/config");
        if (!response.ok) {
            throw new Error("Failed to get config");
        }
      return (await response.json()) as ConfigResponse;
    },
    staleTime: Infinity,

}
