import { BidragCommonsProvider } from "@bidrag/common";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import * as React from "react";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 3,
            retryDelay: 2000,
        },
    },
});

export function QueryClientWrapper({ children }: PropsWithChildren) {
    return (
        <QueryClientProvider client={queryClient}>
            <BidragCommonsProvider client={queryClient}>{children}</BidragCommonsProvider>
        </QueryClientProvider>
    );
}
