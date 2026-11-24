import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { journalposter } from "./DokumentTre.story";
import { useDokumentState } from "./hooks/useDokumentState";
import { SaksdokumentTabell } from "./SaksdokumentTabell";

function Tabell() {
    const { data, menyState } = useDokumentState(journalposter);

    return (
        <div style={{ width: 900 }}>
            <SaksdokumentTabell
                journalposter={data.journalposter}
                dokumenter={data.dokumenter}
                sakRoller={[]}
                menyState={menyState}
                harBlandingFarBid={data.harBlandingFarBid}
            />
        </div>
    );
}

export const TabellMedVedlegg = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    return (
        <MemoryRouter>
            <QueryClientProvider client={queryClient}>
                <BidragCommonsProviderMock>
                    <Tabell />
                </BidragCommonsProviderMock>
            </QueryClientProvider>
        </MemoryRouter>
    );
};
