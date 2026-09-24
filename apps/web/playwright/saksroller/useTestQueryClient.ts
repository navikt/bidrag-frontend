import { QueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

export function useTestQueryClient() {
    return useMemo(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: { retry: false, staleTime: Infinity },
                    mutations: { retry: false },
                },
            }),
        [],
    );
}
