import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { JournalpostStatus, Kanal } from "@bidrag/api/BidragDokumentApi";
import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { MemoryRouter } from "react-router";
import JournalpostTabell from "./JournalpostTabell";

const saksnummer = "2024/1234";
const gjelderIdent = genererFnr();

const dokument = (dokumentreferanse: string, tittel: string) => ({
    dokumentreferanse,
    tittel,
    metadata: {},
});

const journalpost = (overrides: Partial<JournalpostDto>): JournalpostDto => ({
    dokumenter: [],
    sakstilknytninger: [saksnummer],
    ...overrides,
});

const journalposter: JournalpostDto[] = [
    journalpost({
        journalpostId: "BID-1001",
        dokumentType: "U",
        dokumentDato: "2024-05-10",
        journalfortDato: "2024-05-11",
        journalforendeEnhet: "4803",
        fagomrade: "BID",
        innhold: "Vedtak om barnebidrag",
        status: JournalpostStatus.FERDIGSTILT,
        kanal: Kanal.NAV_NO,
        dokumenter: [dokument("dok-1001", "Vedtak om barnebidrag")],
    }),
    journalpost({
        journalpostId: "BIF-1002",
        dokumentType: "I",
        dokumentDato: "2024-05-12",
        journalfortDato: "2024-05-13",
        journalforendeEnhet: "4803",
        fagomrade: "FAR",
        innhold: "Svar fra part",
        status: JournalpostStatus.UNDER_PRODUKSJON,
        gjelderAktor: { ident: gjelderIdent },
        dokumenter: [dokument("dok-1002", "Svar fra part"), dokument("vedlegg-1002", "Vedlegg til svar")],
    }),
    journalpost({
        journalpostId: "BID-1003",
        dokumentType: "X",
        dokumentDato: "2024-05-14",
        journalfortDato: "2024-05-15",
        fagomrade: "BID",
        innhold: "Feilregistrert journalpost",
        status: JournalpostStatus.FEILREGISTRERT,
        feilfort: true,
    }),
];

const farskapUtelukkedeJournalposter: JournalpostDto[] = [
    journalpost({
        journalpostId: "BID-2001",
        dokumentType: "I",
        dokumentDato: "2024-06-01",
        journalfortDato: "2024-06-02",
        fagomrade: "FAR",
        innhold: "Farskapsdokument",
        status: JournalpostStatus.JOURNALFORT,
    }),
];

function StoryWrapper({ children }: PropsWithChildren) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    return (
        <MemoryRouter>
            <QueryClientProvider client={queryClient}>
                <BidragCommonsProviderMock>{children}</BidragCommonsProviderMock>
            </QueryClientProvider>
        </MemoryRouter>
    );
}

function Scenario({
    data = journalposter,
    farskapData = [],
}: {
    data?: JournalpostDto[];
    farskapData?: JournalpostDto[];
}) {
    return (
        <StoryWrapper>
            <JournalpostTabell
                saksnummer={saksnummer}
                journalposter={data}
                farskapUtelukkedeJournalposter={farskapData}
            />
        </StoryWrapper>
    );
}

export const TomListe = () => <Scenario data={[]} />;

export const BlandedeJournalposter = () => <Scenario />;

export const MedFarskapsutelukkede = () => <Scenario farskapData={farskapUtelukkedeJournalposter} />;
