import type { DokumentDto, JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import { DokumentStatusDto as DokumentStatus, JournalpostStatus } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { formaterDato } from "@bidrag/utils";
import {
    ArrowCirclepathIcon,
    FilePdfIcon,
    FilterIcon,
    PaperclipIcon,
    TasklistSendIcon,
    TrashIcon,
} from "@navikt/aksel-icons";
import {
    BodyShort,
    Button,
    Checkbox,
    CheckboxGroup,
    Heading,
    HStack,
    Link,
    Modal,
    Popover,
    Tag,
    VStack,
} from "@navikt/ds-react";
import { DataGrid } from "@navikt/ds-react/PREVIEW/DataGrid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { utførSlettForsendelseMutationFn } from "~/api/query/forsendelse.query.ts";
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
            ? dokumenter.slice(1).map((dok, i) => ({
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
    const queryClient = useQueryClient();

    const { mutate: slettForsendelse, isPending: sletterForsendelse } = useMutation<unknown, Error, string>({
        mutationKey: ["utførSlettForsendelse"],
        mutationFn: (forsendelseId) => utførSlettForsendelseMutationFn(forsendelseId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["hent_journalposter", saksnummer] });
            lukkSlettBekreftelse();
        },
    });

    const slettModalRef = useRef<HTMLDialogElement>(null);
    const [journalpostIdTilSletting, setJournalpostIdTilSletting] = useState<string | null>(null);

    const åpneSlettBekreftelse = (journalpostId: string) => {
        setJournalpostIdTilSletting(journalpostId);
        slettModalRef.current?.showModal();
    };

    const lukkSlettBekreftelse = () => {
        slettModalRef.current?.close();
        setJournalpostIdTilSletting(null);
    };

    const bekreftSletting = () => {
        if (journalpostIdTilSletting) slettForsendelse(journalpostIdTilSletting);
    };

    const [visFarskapUtelukket, setVisFarskapUtelukket] = useState(false);
    const [visFeilregistrerte, setVisFeilregistrerte] = useState(false);
    const [kunVedtak, setKunVedtak] = useState(false);
    const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
    const [filterÅpen, setFilterÅpen] = useState(false);
    const filterKnappRef = useRef<HTMLButtonElement>(null);

    const filtrerteJournalposter = journalposter.filter((jp) => {
        if (kunVedtak && !jp.innhold?.toLowerCase().includes("vedtak")) return false;
        if (!visFarskapUtelukket && jp.fagomrade === "FAR") return false;
        if (!visFeilregistrerte && jp.feilfort) return false;
        return true;
    });

    const harBlandingFarBid =
        journalposter.some((jp) => jp.fagomrade === "FAR") && journalposter.some((jp) => jp.fagomrade === "BID");

    const harDokumenterUnderOpprettelse = journalposter.some((jp) => jp.status === JournalpostStatus.UNDER_OPPRETTELSE);
    const antallAktiveFiltre = (harBlandingFarBid && visFarskapUtelukket ? 1 : 0) + (visFeilregistrerte ? 1 : 0);

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
        setExpandedRowIds((prev) =>
            prev.includes(id) ? prev.filter((expandedId) => expandedId !== id) : [...prev, id],
        );
    };

    const beskrivelseCelle = (rad: JournalpostRad) => {
        if (rad.erVedlegg && rad.dok) {
            const dok = rad.dok;
            const kanÅpnes = Boolean(
                dok.status === DokumentStatus.FERDIGSTILT && dok.dokumentreferanse && rad.jp.journalpostId,
            );

            return (
                <HStack gap="space-2" align="center" wrap={false} style={{ maxWidth: scaledPx(720), minWidth: 0 }}>
                    <PaperclipIcon aria-hidden className="shrink-0 text-gray-500" />
                    {kanÅpnes ? (
                        <Link
                            className="min-w-0 truncate"
                            target="_blank"
                            title={dok.tittel ?? dok.dokumentreferanse ?? ""}
                            href={`/dokument/${rad.jp.journalpostId}/${dok.dokumentreferanse}?dok=${dok.dokumentreferanse}`}
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
                <HStack gap="space-2" align="center" wrap={false} style={{ maxWidth: scaledPx(720), minWidth: 0 }}>
                    <PaperclipIcon aria-hidden className="shrink-0 text-gray-500" />
                    <Link
                        className="min-w-0 truncate"
                        target="_blank"
                        href={href}
                        title={tekst}
                        aria-label="Åpne dokument"
                    >
                        {tekst}
                    </Link>
                </HStack>
            );
        }

        return (
            <span className="truncate" title={tekst} style={{ maxWidth: scaledPx(720), display: "inline-block" }}>
                {tekst}
            </span>
        );
    };

    const basisKolonner = [
        {
            id: "expand",
            header: "",
            width: { resizable: false, value: scaledPx(54) },
            bodyCell: () => null,
        },
        harDokumenterUnderOpprettelse && {
            id: "slett",
            header: "",
            width: { resizable: false, autoResizeOnce: true },
            bodyCell: (rad: JournalpostRad) =>
                !rad.erVedlegg && rad.jp.status === JournalpostStatus.UNDER_OPPRETTELSE && rad.jp.journalpostId ? (
                    <Button
                        variant="tertiary"
                        size="xsmall"
                        icon={<TrashIcon aria-hidden />}
                        aria-label="Slett forsendelse"
                        title="Slett forsendelse"
                        iconPosition={"left"}
                        onClick={() => åpneSlettBekreftelse(rad.jp.journalpostId as string)}
                    />
                ) : null,
        },
        {
            id: "journalpostId",
            header: "",
            width: { resizable: false, value: scaledPx(52) },
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
            width: { resizable: false, value: scaledPx(32) },
            isSortable: true,
            bodyCell: (rad: JournalpostRad) => (rad.erVedlegg ? "" : rad.jp.dokumentType),
        },
        {
            id: "dokumentDato",
            header: "Dok.dato",
            width: { resizable: false, value: scaledPx(108) },
            isSortable: true,
            bodyCell: (rad: JournalpostRad) =>
                rad.erVedlegg ? "" : rad.jp.dokumentDato ? formaterDato(rad.jp.dokumentDato) : "",
        },
        {
            id: "journalfortDato",
            header: "Jour.dato",
            width: { resizable: false, value: scaledPx(108) },
            isSortable: true,
            bodyCell: (rad: JournalpostRad) =>
                rad.erVedlegg ? "" : rad.jp.journalfortDato ? formaterDato(rad.jp.journalfortDato) : "",
        },
        {
            id: "journalforendeEnhet",
            header: "Enhet",
            width: { resizable: false, value: scaledPx(74) },
            isSortable: true,
            bodyCell: (rad: JournalpostRad) => (rad.erVedlegg ? "" : (rad.jp.journalforendeEnhet ?? "-")),
        },
        {
            id: "gjelderAktor",
            header: "Gjelder",
            width: { resizable: false, value: scaledPx(150) },
            isSortable: true,
            bodyCell: (rad: JournalpostRad) =>
                rad.erVedlegg ? "" : <PersonIdentMedRolle gjelderAktor={rad.jp.gjelderAktor} sakRoller={sakRoller} />,
        },
        {
            id: "status",
            header: "Status",
            isSortable: true,
            width: { resizable: false, value: scaledPx(175) },
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
            width: { resizable: false, autoResizeOnce: true },
            bodyCell: beskrivelseCelle,
        },
    ];

    const fagomradeKolonne = {
        id: "fagomrade",
        header: "Fag",
        isSortable: true,
        width: { resizable: false, value: scaledPx(60) },
        bodyCell: (rad: JournalpostRad) => (rad.erVedlegg ? "" : (rad.jp.fagomrade ?? "-")),
    };

    // "fagomrade" settes inn mellom "gjelderAktor" og "status" når saken har blanding av far/bidrag.
    const synligeBasisKolonner = basisKolonner.filter(
        (kolonne): kolonne is Exclude<typeof kolonne, false> => kolonne !== false,
    );
    const columnDefinitions = harBlandingFarBid
        ? [...synligeBasisKolonner.slice(0, 6), fagomradeKolonne, ...synligeBasisKolonner.slice(6)]
        : synligeBasisKolonner;

    return (
        <VStack gap={"space-16"}>
            <HStack justify="space-between" align="center">
                <HStack gap="space-16" align="center">
                    <Heading size="medium">Journal</Heading>
                    <Button
                        ref={filterKnappRef}
                        variant="tertiary"
                        size="small"
                        icon={<FilterIcon aria-hidden />}
                        onClick={() => setFilterÅpen((forrige) => !forrige)}
                    >
                        Filter
                        {antallAktiveFiltre > 0 && (
                            <Tag variant="info" size="small" className="ml-1">
                                {antallAktiveFiltre}
                            </Tag>
                        )}
                    </Button>
                    <Popover
                        open={filterÅpen}
                        onClose={() => setFilterÅpen(false)}
                        anchorEl={filterKnappRef.current}
                        placement="bottom-start"
                    >
                        <Popover.Content>
                            <CheckboxGroup legend="Filtrer" hideLegend size="small">
                                <VStack gap={"space-8"}>
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
                                </VStack>
                            </CheckboxGroup>
                        </Popover.Content>
                    </Popover>
                    <Checkbox checked={kunVedtak} onChange={(e) => setKunVedtak(e.target.checked)} size="small">
                        Kun vedtak
                    </Checkbox>
                    <Button
                        variant="tertiary"
                        size="xsmall"
                        icon={<ArrowCirclepathIcon aria-hidden />}
                        onClick={() => setSort(undefined)}
                    >
                        Tilbakestill sortering
                    </Button>
                </HStack>
                <HStack gap="space-4">
                    <Button
                        as="a"
                        href={`/sak/${saksnummer}/dokumenter`}
                        target="_blank"
                        variant="tertiary"
                        size="xsmall"
                        icon={<FilePdfIcon aria-hidden />}
                    >
                        Dokumentvisning (åpnes i egen vindu)
                    </Button>
                </HStack>
            </HStack>
            <VStack maxHeight="60vh" overflowY="auto" >
                <DataGrid
                    data={rader}
                    // className={"[&_.aksel-data-table\\\\_\\\\_cell-content]:p-0"}
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
                        stickyHeader
                        onRowAction={(rad) => {
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
            <Modal
                ref={slettModalRef}
                header={{ heading: "Slett forsendelse", closeButton: false }}
                onClose={lukkSlettBekreftelse}
                onCancel={(e) => e.preventDefault()}
                closeOnBackdropClick={false}
            >
                <Modal.Body>
                    <BodyShort>Er du sikker på at du vil slette denne forsendelsen?</BodyShort>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" size="small" loading={sletterForsendelse} onClick={bekreftSletting}>
                        Slett
                    </Button>
                    <Button
                        variant="tertiary"
                        size="small"
                        disabled={sletterForsendelse}
                        onClick={lukkSlettBekreftelse}
                    >
                        Avbryt
                    </Button>
                </Modal.Footer>
            </Modal>
        </VStack>
    );
}
