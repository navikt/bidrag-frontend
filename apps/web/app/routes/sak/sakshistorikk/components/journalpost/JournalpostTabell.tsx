import type { DokumentDto, JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { DokumentStatusDto as DokumentStatus, JournalpostStatus } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { formaterDato } from "@bidrag/utils";
import { ArrowCirclepathIcon, FilesIcon, PaperclipIcon, TasklistSendIcon } from "@navikt/aksel-icons";
import { Button, Checkbox, CheckboxGroup, Heading, HStack, Link, VStack } from "@navikt/ds-react";
import { DataGrid } from "@navikt/ds-react/PREVIEW/DataGrid";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { useHentSak } from "~/api/useApi.ts";
import { useSort } from "../useSort";
import JournalpostStatusTag from "./JournalpostStatusTag";
import { journalstatusDisplayVerdi, standardSort } from "./journalpostUtils";
import PersonIdentMedRolle from "./PersonIdentMedRolle";

const scaledPx = (value: number) => `${value}px`;

interface JournalpostRad {
    id: string;
    jp: JournalpostDto;
    dok?: DokumentDto;
    erVedlegg: boolean;
    vedlegg: JournalpostRad[];
}

function byggRad(jp: JournalpostDto): JournalpostRad {
    const dokumenter = jp.dokumenter ?? [];
    const jpId =
        jp.journalpostId ??
        `missing-${dokumenter[0]?.dokumentreferanse ?? jp.journalfortDato ?? jp.dokumentDato ?? "0"}`;

    const vedlegg: JournalpostRad[] =
        dokumenter.length > 1
            ? dokumenter.map((dok, i) => ({
                  id: `${jpId}:${dok.dokumentreferanse ?? i}`,
                  jp,
                  dok,
                  erVedlegg: true,
                  vedlegg: [],
              }))
            : [];

    return { id: jpId, jp, erVedlegg: false, vedlegg };
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
    const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);

    const filtrerteJournalposter = journalposter.filter((jp) => {
        if (kunVedtak && !jp.innhold?.toLowerCase().includes("vedtak")) return false;
        if (!visFarskapUtelukket && jp.fagomrade === "FAR") return false;
        if (!visFeilregistrerte && jp.feilfort) return false;
        return true;
    });

    const harBlandingFarBid =
        journalposter.some((jp) => jp.fagomrade === "FAR") && journalposter.some((jp) => jp.fagomrade === "BID");

    const sorterteJournalposter = sortData(filtrerteJournalposter);
    const rader: JournalpostRad[] = sorterteJournalposter.map(byggRad);

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
        const hoveddokRef = jp.dokumenter?.[0]?.dokumentreferanse;
        return hoveddokRef ? `/dokument/${journalpostId}/${hoveddokRef}` : undefined;
    };

    const sakRoller = (sak?.roller ?? []) as RolleDto[];

    const toggleExpandedRad = (id: string) => {
        setExpandedRowIds((prev) => (prev.includes(id) ? prev.filter((expandedId) => expandedId !== id) : [...prev, id]));
    };

    const beskrivelseCelle = (rad: JournalpostRad) => {
        if (rad.erVedlegg && rad.dok) {
            const dok = rad.dok;
            const kanÅpnes = Boolean(
                dok.status === DokumentStatus.FERDIGSTILT && dok.dokumentreferanse && rad.jp.journalpostId,
            );

            return (
                <HStack gap="space-2" align="center" wrap={false} style={{ maxWidth: scaledPx(340), minWidth: 0 }}>
                    <PaperclipIcon aria-hidden className="shrink-0 text-gray-500" />
                    {kanÅpnes ? (
                        <Link
                            className="min-w-0 truncate"
                            target="_blank"
                            href={`/aapnedokument/${rad.jp.journalpostId}/${dok.dokumentreferanse}`}
                        >
                            {dok.tittel ?? dok.dokumentreferanse}
                        </Link>
                    ) : (
                        <span className="min-w-0 truncate">{dok.tittel ?? "-"}</span>
                    )}
                </HStack>
            );
        }

        const antall = rad.jp.dokumenter?.length ?? 0;
        const tekst = antall > 1 ? `(${antall}) ${rad.jp.innhold ?? ""}` : (rad.jp.innhold ?? "");
        const href = åpneDokumentHref(rad.jp);

        if (href) {
            return (
                <HStack gap="space-2" align="center" wrap={false} style={{ maxWidth: scaledPx(340), minWidth: 0 }}>
                    <PaperclipIcon aria-hidden className="shrink-0 text-gray-500" />
                    <Link className="min-w-0 truncate" target="_blank" href={href} title="Åpne dokument" aria-label="Åpne dokument">
                        {tekst}
                    </Link>
                </HStack>
            );
        }

        return (
            <span className="truncate" title={tekst}>
                {tekst}
            </span>
        );
    };

    const expandCelle = (rad: JournalpostRad) => {
        if (rad.erVedlegg || rad.vedlegg.length === 0) return null;

        const erUtvidet = expandedRowIds.includes(rad.id);

        // Egendefinert "disclosure"-knapp: oppfører seg semantisk som en <summary>-markør
        // (aria-expanded + rotasjon), men uten Aksel-knappens kant/bakgrunn.
        return (
            <button
                type="button"
                aria-expanded={erUtvidet}
                aria-label={erUtvidet ? "Skjul underdokumenter" : "Vis underdokumenter"}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleExpandedRad(rad.id);
                }}
                className="flex h-6 w-6 items-center justify-center rounded text-gray-600 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--a-border-focus,#0067c5)"
            >
                <span
                    aria-hidden
                    className={`inline-block text-xs transition-transform duration-150 ${
                        erUtvidet ? "rotate-90" : "rotate-0"
                    }`}
                >
                    ▶
                </span>
            </button>
        );
    };

    const basisKolonner = [
        {
            id: "expand",
            header: "",
            width: { defaultValue: scaledPx(48) },
            bodyCell: ()=>null,
        },
        {
            id: "journalpostId",
            header: "",
            width: { defaultValue: scaledPx(48) },
            bodyCell: (rad: JournalpostRad) =>
                !rad.erVedlegg && rad.jp.journalpostId ? (
                    <Link
                        href={`/sak/${saksnummer}/journal/${rad.jp.journalpostId}?${jpParams()}`}
                        aria-label="Vis journalpost"
                    >
                        <TasklistSendIcon aria-hidden />
                    </Link>
                ) : null,
        },
        {
            id: "dokumentType",
            header: "K",
            width: { defaultValue: scaledPx(48) },
            isSortable: true,
            bodyCell: (rad: JournalpostRad) => (rad.erVedlegg ? "" : rad.jp.dokumentType),
        },
        {
            id: "dokumentDato",
            header: "Dok.dato",
            width: { defaultValue: scaledPx(110) },
            isSortable: true,
            bodyCell: (rad: JournalpostRad) =>
                rad.erVedlegg ? "" : rad.jp.dokumentDato ? formaterDato(rad.jp.dokumentDato) : "",
        },
        {
            id: "journalfortDato",
            header: "Jour.dato",
            width: { defaultValue: scaledPx(110) },
            isSortable: true,
            bodyCell: (rad: JournalpostRad) =>
                rad.erVedlegg ? "" : rad.jp.journalfortDato ? formaterDato(rad.jp.journalfortDato) : "",
        },
        {
            id: "journalforendeEnhet",
            header: "Enhet",
            width: { defaultValue: scaledPx(75) },
            isSortable: true,
            bodyCell: (rad: JournalpostRad) => (rad.erVedlegg ? "" : (rad.jp.journalforendeEnhet ?? "-")),
        },
        {
            id: "gjelderAktor",
            header: "Gjelder",
            width: { defaultValue: scaledPx(150) },
            isSortable: true,
            bodyCell: (rad: JournalpostRad) =>
                rad.erVedlegg ? "" : <PersonIdentMedRolle gjelderAktor={rad.jp.gjelderAktor} sakRoller={sakRoller} />,
        },
        {
            id: "status",
            header: "Status",
            isSortable: true,
            width: { defaultValue: scaledPx(170) },
            bodyCell: (rad: JournalpostRad) =>
                rad.erVedlegg ? (
                    ""
                ) : (
                    <span style={{ whiteSpace: "nowrap" }}>
                        <JournalpostStatusTag jp={rad.jp} />
                    </span>
                ),
        },
        {
            id: "innhold",
            header: "Beskrivelse",
            isSortable: true,
            width: { defaultValue: scaledPx(474) },
            bodyCell: beskrivelseCelle,
        }
    ];

    const fagomradeKolonne = {
        id: "fagomrade",
        header: "Fag",
        isSortable: true,
        width: { defaultValue: scaledPx(60) },
        bodyCell: (rad: JournalpostRad) => (rad.erVedlegg ? "" : (rad.jp.fagomrade ?? "-")),
    };

    // "fagomrade" settes inn mellom "gjelderAktor" og "status" når saken har blanding av far/bidrag.
    const columnDefinitions = harBlandingFarBid
        ? [...basisKolonner.slice(0, 6), fagomradeKolonne, ...basisKolonner.slice(6)]
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
                <HStack gap="space-4">
                    <Button
                        as="a"
                        href={`/sak/${saksnummer}/dokumenter`}
                        variant="tertiary"
                        size="small"
                        icon={<FilesIcon aria-hidden />}
                    >
                        Åpne dokumentvisning
                    </Button>
                    <Button
                        variant="tertiary"
                        size="small"
                        icon={<ArrowCirclepathIcon aria-hidden />}
                        onClick={() => setSort(undefined)}
                    >
                        Tilbakestill
                    </Button>
                </HStack>
            </HStack>
            <DataGrid
                data={rader}
                getRowId={(rad) => rad.id}
                settings={{
                    zebraStripes: true,
                    rowDensity: "tight",
                    textSize: "small",
                    truncateContent: true,
                }}
                columns={columnDefinitions}
            >
                <DataGrid.Table<JournalpostRad>
                    layout="fixed"
                    onRowAction={rad => {
                        if (rad.row.erVedlegg || rad.row.vedlegg.length === 0) return null;
                        toggleExpandedRad(rad.id);
                    }}
                    sorting={{
                        sortOrder: dataGridSort,
                        onSortOrderChange: (_, detail) =>
                            handleSort(detail.columnId as Extract<keyof JournalpostDto, string>),
                    }}
                    subRows={{
                        getRows: (rad) => rad.vedlegg,
                        isRowExpandable: (rad) => rad.vedlegg.length > 0,
                        expandedRowIds,
                        onExpandedRowIdsChange: setExpandedRowIds,
                    }}
                />
            </DataGrid>
        </VStack>
    );
}
