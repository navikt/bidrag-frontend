import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { DokumentStatusDto, JournalpostStatus, Kanal } from "@bidrag/api/BidragDokumentApi";
import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { MemoryRouter } from "react-router";
import JournalpostTabell from "./JournalpostTabell";

const saksnummer = "2024/1234";
const gjelderIdent = genererFnr();

const dokument = (dokumentreferanse: string, tittel: string | null, status = DokumentStatusDto.FERDIGSTILT) => ({
    dokumentreferanse,
    tittel,
    metadata: {},
    status,
});

const journalpost = ({
    dokumenter,
    innhold = "Dokument",
    journalpostId = "BID-ukjent",
    ...overrides
}: Partial<JournalpostDto>): JournalpostDto => ({
    dokumenter: dokumenter ?? [dokument(`${journalpostId}-dok`, innhold)],
    innhold,
    journalpostId,
    sakstilknytninger: [saksnummer],
    ...overrides,
});

const journalposter: JournalpostDto[] = [
    journalpost({
        journalpostId: "BID-3001",
        dokumentType: "U",
        dokumentDato: "2024-05-10",
        journalfortDato: "2024-05-11",
        journalforendeEnhet: "4803",
        fagomrade: "BID",
        innhold: "Enkelt dokument",
        status: JournalpostStatus.FERDIGSTILT,
        kanal: Kanal.NAV_NO,
        dokumenter: [dokument("dok-3001", "Enkelt dokument")],
    }),
    journalpost({
        journalpostId: "BID-3002",
        dokumentType: "I",
        dokumentDato: "2024-05-12",
        journalfortDato: "2024-05-13",
        journalforendeEnhet: "4803",
        fagomrade: "FAR",
        innhold: "Ferdigstilt samlelenke",
        status: JournalpostStatus.FERDIGSTILT,
        gjelderAktor: { ident: gjelderIdent },
        dokumenter: [
            dokument("dok-3002", "Ferdigstilt hoveddokument"),
            dokument("vedlegg-3002", "Ferdigstilt vedlegg"),
        ],
    }),
    journalpost({
        journalpostId: "BID-3003",
        dokumentType: "X",
        dokumentDato: "2024-05-14",
        journalfortDato: "2024-05-15",
        fagomrade: "BID",
        innhold: "Samling med dokument under produksjon",
        status: JournalpostStatus.UNDER_PRODUKSJON,
        dokumenter: [
            dokument("dok-3003", "Dokument under redigering", DokumentStatusDto.UNDER_REDIGERING),
            dokument("vedlegg-3003", "Ferdigstilt vedlegg under produksjon"),
        ],
    }),
    journalpost({
        journalpostId: "BID-3004",
        innhold: "Enkelt dokument under produksjon",
        status: JournalpostStatus.UNDER_PRODUKSJON,
        dokumenter: [dokument("dok-3004", "Enkelt dokument under produksjon", DokumentStatusDto.UNDER_REDIGERING)],
    }),
    journalpost({
        journalpostId: "BID-1003",
        dokumentType: "X",
        dokumentDato: "2024-05-16",
        journalfortDato: "2024-05-17",
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
