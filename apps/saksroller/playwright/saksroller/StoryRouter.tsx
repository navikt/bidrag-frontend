import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useMemo } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { TestFlagg } from "../felles/TestFlagg.tsx";
import { useTestQueryClient } from "./useTestQueryClient.ts";

export function SaksrollerStoryRouter({ content, flagg }: { content: React.ReactNode; flagg?: string[] }) {
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
                                <TestFlagg flagg={flagg}>
                                    <BidragCommonsProviderMock client={queryClient}>
                                        <Suspense fallback={<p>Laster...</p>}>{content}</Suspense>
                                    </BidragCommonsProviderMock>
                                </TestFlagg>
                            </QueryClientProvider>
                        ),
                    },
                ],
                { initialEntries: ["/sak/2024%2F1/saksroller"] },
            ),
        [content, queryClient, flagg],
    );

    return <RouterProvider router={router} />;
}
