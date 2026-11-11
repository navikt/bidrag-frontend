import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useMemo } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { useTestQueryClient } from "./useTestQueryClient.ts";

export function SaksrollerStoryRouter({ content }: { content: React.ReactNode }) {
    const queryClient = useTestQueryClient();
    const router = useMemo(
        () =>
            createMemoryRouter(
                [
                    {
                        id: "root",
                        path: "*",
                        loader: () => ({ bisysUrl: "" }),
                        element: (
                            <QueryClientProvider client={queryClient}>
                                <BidragCommonsProviderMock>
                                    <Suspense fallback={<p>Laster...</p>}>{content}</Suspense>
                                </BidragCommonsProviderMock>
                            </QueryClientProvider>
                        ),
                    },
                ],
                { initialEntries: ["/sak/2024%2F1/saksroller"] },
            ),
        [content, queryClient],
    );

    return <RouterProvider router={router} />;
}
