import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { DokumentStatusDto, JournalpostStatus } from "@bidrag/api/BidragDokumentApi";
import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { DokumentTre } from "./DokumentTre";
import { useDokumentState } from "./hooks/useDokumentState";

const gjelderIdent = genererFnr();

const dokument = (dokumentreferanse: string, tittel: string) => ({
    dokumentreferanse,
    tittel,
    metadata: {},
    status: DokumentStatusDto.FERDIGSTILT,
});

// Søknaden ble mottatt 06.01.2025, men skannet og journalført 02.10.2026. Joark gir da dokumentDato
// 02.10.2026 og mottattDato 06.01.2025.
export const journalposter: JournalpostDto[] = [
    {
        journalpostId: "JOARK-6001",
        dokumentType: "I",
        innhold: "Søknad om barnebidrag",
        dokumentDato: "2026-10-02",
        mottattDato: "2025-01-06",
        journalfortDato: "2026-10-02",
        journalforendeEnhet: "4806",
        fagomrade: "BID",
        status: JournalpostStatus.JOURNALFORT,
        gjelderAktor: { ident: gjelderIdent },
        sakstilknytninger: ["2024/1234"],
        dokumenter: [dokument("6001-hoved", "Søknad om barnebidrag"), dokument("6001-vedlegg", "Inntektsopplysninger")],
    },
    {
        journalpostId: "BID-6002",
        dokumentType: "U",
        innhold: "Vedtak barnebidrag",
        dokumentDato: "2026-09-28",
        journalfortDato: "2026-09-28",
        journalforendeEnhet: "4806",
        fagomrade: "BID",
        status: JournalpostStatus.JOURNALFORT,
        gjelderAktor: { ident: gjelderIdent },
        sakstilknytninger: ["2024/1234"],
        dokumenter: [dokument("6002-hoved", "Vedtak barnebidrag")],
    },
];

function ListeMedValg() {
    const { data, menyState } = useDokumentState(journalposter);
    const valgt = data.dokumenter.find((dok) => dok.id === menyState.selectedId);

    return (
        <div style={{ width: 360 }}>
            <output data-testid="valgt-dokument">{valgt?.tittel ?? ""}</output>
            <DokumentTre data={data} menyState={menyState} sakRoller={[]} />
        </div>
    );
}

export const ListeMedVedlegg = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    return (
        <MemoryRouter>
            <QueryClientProvider client={queryClient}>
                <BidragCommonsProviderMock>
                    <ListeMedValg />
                </BidragCommonsProviderMock>
            </QueryClientProvider>
        </MemoryRouter>
    );
};
