import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { DokumentStatusDto as DokumentStatus, JournalpostStatus } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { formaterDato } from "@bidrag/utils";
import { ArrowCirclepathIcon, PaperclipIcon, TasklistSendIcon } from "@navikt/aksel-icons";
import { Button, Checkbox, CheckboxGroup, Heading, HStack, Link, List, VStack } from "@navikt/ds-react";
import { DataGrid } from "@navikt/ds-react/PREVIEW/DataGrid";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { useHentSak } from "~/api/useApi.ts";
import { useSort } from "../useSort";
import JournalpostStatusTag from "./JournalpostStatusTag";
import { journalstatusDisplayVerdi, standardSort } from "./journalpostUtils";
import PersonIdentMedRolle from "./PersonIdentMedRolle";

const scaledPx = (value: number) => `${value}px`;

function DokumentListe({ jp }: { jp: JournalpostDto }) {
    const dokumenter = jp.dokumenter ?? [];
    return (
        <List size="small">
            {dokumenter.map((dok, i) => (
                <List.Item key={dok.dokumentreferanse ?? i}>
                    {dok.status === DokumentStatus.FERDIGSTILT && dok.dokumentreferanse && jp.journalpostId ? (
                        <HStack gap="space-6" align="center">
                            <PaperclipIcon aria-hidden />
                            <Link href={`/aapnedokument/${jp.journalpostId}/${dok.dokumentreferanse}`}>
                                {dok.tittel ?? dok.dokumentreferanse}
                            </Link>
                        </HStack>
                    ) : (
                        (dok.tittel ?? "-")
                    )}
                </List.Item>
            ))}
        </List>
    );
}

export default function JournalpostTabell({
    saksnummer,
    journalposter,
}: {
    saksnummer: string;
    journalposter: JournalpostDto[];
}) {
    const { sort, handleSort, sortData, setSort } = useSort<JournalpostDto>({
        defaultUnsorted: standardSort,
        customComparators: {
            status: (a, b) => journalstatusDisplayVerdi(a).localeCompare(journalstatusDisplayVerdi(b)),
            gjelderAktor: (a, b) => (a.gjelderAktor?.ident ?? "").localeCompare(b.gjelderAktor?.ident ?? ""),
        },
    });

    const [searchParams] = useSearchParams();
    const enhet = searchParams.get("enhet");
    const sessionState = searchParams.get("sessionState");
    const { data: sak } = useHentSak(saksnummer);

    const [visFarskapUtelukket, setVisFarskapUtelukket] = useState(false);
    const [visFeilregistrerte, setVisFeilregistrerte] = useState(false);
    const [kunVedtak, setKunVedtak] = useState(false);

    const filtrerteJournalposter = journalposter.filter((jp) => {
        if (kunVedtak && !jp.innhold?.toLowerCase().includes("vedtak")) return false;
        if (!visFarskapUtelukket && jp.fagomrade === "FAR") return false;
        if (!visFeilregistrerte && jp.feilfort) return false;
        return true;
    });

    const harBlandingFarBid =
        journalposter.some((jp) => jp.fagomrade === "FAR") && journalposter.some((jp) => jp.fagomrade === "BID");

    const sorterteJournalposter = sortData(filtrerteJournalposter);

    const dataGridSort: import("@navikt/ds-react/PREVIEW/DataGrid").DataGrid.Table.SortEntry[] = sort
        ? [
              {
                  columnId: sort.orderBy,
                  direction: sort.direction === "ascending" ? ("asc" as const) : ("desc" as const),
              },
          ]
        : [];

    const jpParams = () =>
        new URLSearchParams({
            ...(enhet && { enhet }),
            ...(sessionState && { sessionState }),
        });

    const åpneDokumentHref = (jp: JournalpostDto): string | undefined => {
        if (!jp.journalpostId) return undefined;
        const journalpostId = jp.journalpostId;
        if (jp.status === JournalpostStatus.UNDER_PRODUKSJON) return undefined;
        const harFlereDokumenter = (jp.dokumenter?.length ?? 0) > 1;
        if (harFlereDokumenter) {
            const params = new URLSearchParams();
            for (const dokument of jp.dokumenter ?? []) {
                if (dokument.dokumentreferanse) {
                    params.append("dokument", `${journalpostId}:${dokument.dokumentreferanse}`);
                }
            }
            return `/aapnedokument?${params.toString()}`;
        }
        const hoveddokRef = jp.dokumenter?.[0]?.dokumentreferanse;
        return hoveddokRef ? `/aapnedokument/${journalpostId}/${hoveddokRef}` : undefined;
    };

    const sakRoller = (sak?.roller ?? []) as RolleDto[];

    const basisKolonner = [
        {
            id: "journalpostId",
            header: "",
            width: { defaultValue: scaledPx(48) },
            bodyCell: (jp: JournalpostDto) =>
                jp.journalpostId ? (
                    <Link
                        href={`/sak/${saksnummer}/journal/${jp.journalpostId}?${jpParams()}`}
                        aria-label="Vis journalpost"
                    >
                        <TasklistSendIcon aria-hidden />
                    </Link>
                ) : null,
        },
        {
            id: "dokument",
            header: "",
            width: { defaultValue: scaledPx(48) },
            bodyCell: (jp: JournalpostDto) => {
                const href = åpneDokumentHref(jp);
                return href ? (
                    <Link href={href} title="Åpne dokument" aria-label="Åpne dokument">
                        <PaperclipIcon aria-hidden />
                    </Link>
                ) : null;
            },
        },
        {
            id: "dokumentType",
            header: "K",
            width: { defaultValue: scaledPx(48) },
            isSortable: true,
            bodyCell: (jp: JournalpostDto) => jp.dokumentType,
        },
        {
            id: "dokumentDato",
            header: "Dok.dato",
            width: { defaultValue: scaledPx(110) },
            isSortable: true,
            bodyCell: (jp: JournalpostDto) => (jp.dokumentDato ? formaterDato(jp.dokumentDato) : ""),
        },
        {
            id: "journalfortDato",
            header: "Jour.dato",
            width: { defaultValue: scaledPx(110) },
            isSortable: true,
            bodyCell: (jp: JournalpostDto) => (jp.journalfortDato ? formaterDato(jp.journalfortDato) : ""),
        },
        {
            id: "journalforendeEnhet",
            header: "Enhet",
            width: { defaultValue: scaledPx(75) },
            isSortable: true,
            bodyCell: (jp: JournalpostDto) => jp.journalforendeEnhet ?? "-",
        },
        {
            id: "gjelderAktor",
            header: "Gjelder",
            width: { defaultValue: scaledPx(150) },
            isSortable: true,
            bodyCell: (jp: JournalpostDto) => (
                <PersonIdentMedRolle gjelderAktor={jp.gjelderAktor} sakRoller={sakRoller} />
            ),
        },
        {
            id: "status",
            header: "Status",
            isSortable: true,
            width: { defaultValue: scaledPx(170) },
            bodyCell: (jp: JournalpostDto) => (
                <span style={{ whiteSpace: "nowrap" }}>
                    <JournalpostStatusTag jp={jp} />
                </span>
            ),
        },
        {
            id: "innhold",
            header: "Beskrivelse",
            isSortable: true,
            width: { defaultValue: scaledPx(374) },
            bodyCell: (jp: JournalpostDto) => {
                const antall = jp.dokumenter?.length ?? 0;
                const tekst = antall > 1 ? `(${antall}) ${jp.innhold ?? ""}` : (jp.innhold ?? "");
                return <span title={tekst}>{tekst}</span>;
            },
        },
    ];

    const fagomradeKolonne = {
        id: "fagomrade",
        header: "Fagområde",
        isSortable: true,
        bodyCell: (jp: JournalpostDto) => jp.fagomrade ?? "-",
    };

    const columnDefinitions = harBlandingFarBid
        ? [...basisKolonner.slice(0, 7), fagomradeKolonne, ...basisKolonner.slice(7)]
        : basisKolonner;

    return (
        <VStack gap={"space-16"}>
            <HStack justify={"space-between"}>
                <Heading size="medium">Journal</Heading>
                <HStack gap="space-32">
                    <Checkbox checked={kunVedtak} onChange={(e) => setKunVedtak(e.target.checked)} size="small">
                        Kun vedtak
                    </Checkbox>
                    <CheckboxGroup legend="Filtrer" hideLegend size="small">
                        <HStack gap={"space-8"}>
                            {harBlandingFarBid && (
                                <Checkbox
                                    disabled={kunVedtak}
                                    checked={!kunVedtak && visFarskapUtelukket}
                                    onChange={(e) => setVisFarskapUtelukket(e.target.checked)}
                                >
                                    Vis farskapsutelukket
                                </Checkbox>
                            )}
                            <Checkbox
                                disabled={kunVedtak}
                                checked={!kunVedtak && visFeilregistrerte}
                                onChange={(e) => setVisFeilregistrerte(e.target.checked)}
                            >
                                Vis feilregistrerte
                            </Checkbox>
                        </HStack>
                    </CheckboxGroup>
                </HStack>
                <Button
                    variant="tertiary"
                    size="small"
                    icon={<ArrowCirclepathIcon aria-hidden />}
                    onClick={() => setSort(undefined)}
                >
                    Tilbakestill
                </Button>
            </HStack>
            <DataGrid
                data={sorterteJournalposter}
                getRowId={(jp) =>
                    jp.journalpostId ??
                    `missing-${jp.dokumenter?.[0]?.dokumentreferanse ?? jp.journalfortDato ?? jp.dokumentDato ?? "0"}`
                }
                settings={{
                    zebraStripes: true,
                    rowDensity: "tight",
                    textSize: "small",
                    truncateContent: true,
                }}
                columns={columnDefinitions}
            >
                <DataGrid.Table<JournalpostDto>
                    layout="fixed"
                    sorting={{
                        sortOrder: dataGridSort,
                        onSortOrderChange: (_, detail) =>
                            handleSort(detail.columnId as Extract<keyof JournalpostDto, string>),
                    }}
                    detailsPanel={{
                        getContent: (jp) => <DokumentListe jp={jp} />,
                        isRowExpandable: (jp) => (jp.dokumenter?.length ?? 0) > 1,
                        showExpandAll: true,
                    }}
                />
            </DataGrid>
        </VStack>
    );
}
