import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { HenvendelseSeksjon } from "./HenvendelseTabell";

const ident = genererFnr();

/** Dataene kommer fra nettverksmockene i spec-fila, så én story dekker alle tilstandene. */
export const Seksjon = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    return (
        <MemoryRouter>
            <QueryClientProvider client={queryClient}>
                <HenvendelseSeksjon ident={ident} />
            </QueryClientProvider>
        </MemoryRouter>
    );
};
