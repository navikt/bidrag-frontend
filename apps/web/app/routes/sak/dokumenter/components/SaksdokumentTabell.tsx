import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { formaterDato } from "@bidrag/utils";
import { PaperclipIcon } from "@navikt/aksel-icons";
import { HStack, Tag } from "@navikt/ds-react";
import { DataGrid } from "@navikt/ds-react/PREVIEW/DataGrid";
import JournalpostStatusTag from "~/routes/sak/sakshistorikk/components/journalpost/JournalpostStatusTag.tsx";
import PersonIdentMedRolle from "../../sakshistorikk/components/journalpost/PersonIdentMedRolle";
import type { SaksDokument } from "../types";
import { DokumentKategoriTag } from "../utils/dokumentKategori";
import { finnDokumenterForJournalpost } from "../utils/saksdokumenterUtils";
import type { MenyState } from "./hooks/useDokumentState";

const scaledPx = (value: number) => `${value}px`;

interface DokumentRad {
    id: string;
    jp: JournalpostDto;
    dok: SaksDokument;
    erVedlegg: boolean;
    vedlegg: DokumentRad[];
}

export interface SaksdokumentTabellProps {
    journalposter: JournalpostDto[];
    dokumenter: SaksDokument[];
    sakRoller: RolleDto[];
    menyState: MenyState;
    /** Saken har både farskaps- og bidragsjournalposter – da vises tema-kolonnen. */
    harBlandingFarBid?: boolean;
}

export function SaksdokumentTabell({
    journalposter,
    dokumenter,
    sakRoller,
    menyState,
    harBlandingFarBid = false,
}: SaksdokumentTabellProps) {
    const {
        selectedId,
        handleSelectDocument,
        valgteDokumentreferanser,
        handleSettValgteRefs,
        velgDokumenterAktiv,
        tableExpandedIds,
        setTableExpandedIds,
        tabellSort: sort,
        handleTabellSort: handleSort,
        sortTabellData: sortData,
    } = menyState;

    const dataGridSort: DataGrid.Table.SortEntry[] = sort
        ? [
              {
                  columnId: sort.orderBy,
                  direction: sort.direction === "ascending" ? ("asc" as const) : ("desc" as const),
              },
          ]
        : [];

    const utvidRad = (radId: string) => {
        setTableExpandedIds((prev) => {
            if (prev.has(radId)) return prev;
            const neste = new Set(prev);
            neste.add(radId);
            return neste;
        });
    };

    const velgOgUtvidRad = (rad: DokumentRad) => {
        if (rad.dok.kanÅpnes) handleSelectDocument(rad.dok.id);
        // Klikk på rad/tittel skal alltid utvide (aldri kollapse) – kollaps skjer kun via
        // ekspander/kollaps-knappen som DataGrid rendrer i sub-rows-kolonnen.
        if (rad.vedlegg.length > 0) utvidRad(rad.id);
    };

    const tilRad = (
        jp: JournalpostDto,
        dok: SaksDokument,
        erVedlegg: boolean,
        vedlegg: DokumentRad[],
    ): DokumentRad => ({
        id: dok.id,
        jp,
        dok,
        erVedlegg,
        vedlegg,
    });

    const rader: DokumentRad[] = sortData(journalposter).flatMap((jp) => {
        const doksForJp = finnDokumenterForJournalpost(jp, dokumenter);
        const hoveddokument = doksForJp.find((dok) => dok.erHoveddokument);
        const vedlegg = doksForJp.filter((dok) => !dok.erHoveddokument);

        // Hvis hoveddokumentet er filtrert bort (f.eks. ved "Vis kun valgte" der bare vedlegg er
        // valgt), skal vedleggene vises som egne, uavhengige rader – ikke skjules under et
        // hoveddokument som ikke egentlig er valgt.
        if (!hoveddokument) {
            return vedlegg.map((v) => tilRad(jp, v, false, []));
        }

        return [
            tilRad(
                jp,
                hoveddokument,
                false,
                vedlegg.map((v) => tilRad(jp, v, true, [])),
            ),
        ];
    });

    // DataGrid-seleksjonen jobber på rad-id (SaksDokument.id), mens valgtilstanden lagres på dokumentreferanse.
    const idTilRef = new Map<string, string>();
    for (const rad of rader) {
        if (rad.dok.dokumentreferanse) idTilRef.set(rad.id, rad.dok.dokumentreferanse);
        for (const vedlegg of rad.vedlegg) {
            if (vedlegg.dok.dokumentreferanse) idTilRef.set(vedlegg.id, vedlegg.dok.dokumentreferanse);
        }
    }

    const valgteRadIder = Array.from(idTilRef.entries())
        .filter(([, ref]) => valgteDokumentreferanser.has(ref))
        .map(([id]) => id);

    const oppdaterValg = (radIder: string[]) => {
        const referanser = radIder.map((id) => idTilRef.get(id)).filter((ref): ref is string => Boolean(ref));
        handleSettValgteRefs(referanser);
    };

    const tittelCelle = (rad: DokumentRad) => {
        const erValgt = rad.dok.id === selectedId;

        // Aksel sin DataGrid støtter ikke en "indeterminate"-checkbox på hoveddokumentraden når kun
        // noen av vedleggene er valgt (checkboxen er hardkodet til `indeterminate: false` internt, og
        // gir ingen mulighet til å overstyre dette per rad). Vi viser derfor et eget "delvis valgt"-merke
        // i stedet, med samme antall-mønster som brukes for lest/utvidet i `DokumentTre`.
        const antallVedlegg = rad.vedlegg.length;
        const antallValgteVedlegg = rad.vedlegg.filter(
            (v) => v.dok.dokumentreferanse && valgteDokumentreferanser.has(v.dok.dokumentreferanse),
        ).length;
        const erHoveddokumentValgt = Boolean(
            rad.dok.dokumentreferanse && valgteDokumentreferanser.has(rad.dok.dokumentreferanse),
        );
        const erDelvisValgt =
            velgDokumenterAktiv &&
            !rad.erVedlegg &&
            !erHoveddokumentValgt &&
            antallValgteVedlegg > 0 &&
            antallValgteVedlegg < antallVedlegg;

        return (
            <HStack gap="space-1" align="center" wrap={false} style={{ maxWidth: scaledPx(300), minWidth: 0 }}>
                {rad.erVedlegg && <PaperclipIcon aria-hidden className="shrink-0 text-gray-500" />}
                {rad.dok.kanÅpnes ? (
                    <button
                        type="button"
                        title={rad.dok.tittel}
                        onClick={(e) => {
                            e.stopPropagation();
                            velgOgUtvidRad(rad);
                        }}
                        className={`min-w-0 flex-1 cursor-pointer truncate text-left ${
                            erValgt ? "font-semibold" : "text-text-action hover:text-text-action-on-hover underline"
                        }`}
                    >
                        {rad.dok.tittel}
                    </button>
                ) : (
                    <span
                        title={rad.dok.tittel}
                        className={`min-w-0 flex-1 truncate ${erValgt ? "font-semibold" : "text-gray-600"}`}
                    >
                        {rad.dok.tittel}
                    </span>
                )}
                {erDelvisValgt && (
                    <Tag
                        size="small"
                        variant="info"
                        className="shrink-0"
                        title={`${antallValgteVedlegg} av ${antallVedlegg} vedlegg valgt`}
                    >
                        {antallValgteVedlegg}/{antallVedlegg}
                    </Tag>
                )}
            </HStack>
        );
    };

    const columns = [
        {
            id: "tittel",
            header: "Beskrivelse",
            isSortable: true,
            width: { defaultValue: scaledPx(300) },
            bodyCell: tittelCelle,
        },
        {
            id: "dokumentType",
            header: "K",
            isSortable: false,
            width: { defaultValue: scaledPx(5) },
            bodyCell: (rad: DokumentRad) =>
                rad.erVedlegg ? "" : <DokumentKategoriTag dokumentType={rad.jp.dokumentType} />,
        },
        {
            id: "dokumentDato",
            header: "Dok.dato",
            isSortable: true,
            width: { defaultValue: scaledPx(110) },
            bodyCell: (rad: DokumentRad) =>
                rad.erVedlegg ? "" : rad.jp.dokumentDato ? formaterDato(rad.jp.dokumentDato) : "",
        },
        {
            id: "journalfortDato",
            header: "Jour.dato",
            isSortable: true,
            width: { defaultValue: scaledPx(110) },
            bodyCell: (rad: DokumentRad) =>
                rad.erVedlegg ? "" : rad.jp.journalfortDato ? formaterDato(rad.jp.journalfortDato) : "",
        },

        {
            id: "gjelderAktor",
            header: "Gjelder",
            isSortable: true,
            width: { defaultValue: scaledPx(150) },
            bodyCell: (rad: DokumentRad) =>
                rad.erVedlegg ? "" : <PersonIdentMedRolle gjelderAktor={rad.jp.gjelderAktor} sakRoller={sakRoller} />,
        },

        {
            id: "status",
            header: "Status",
            isSortable: true,
            width: { defaultValue: scaledPx(170) },
            bodyCell: (rad: DokumentRad) => (
                <span style={{ whiteSpace: "nowrap" }}>
                    <JournalpostStatusTag jp={rad.jp} />
                </span>
            ),
        },
        {
            id: "journalforendeEnhet",
            header: "Enhet",
            isSortable: true,
            width: { defaultValue: scaledPx(74) },
            bodyCell: (rad: DokumentRad) => (rad.erVedlegg ? "" : (rad.jp.journalforendeEnhet ?? "-")),
        },

        ...(harBlandingFarBid
            ? [
                  {
                      id: "fagomrade",
                      header: "Tema",
                      isSortable: true,
                      width: { defaultValue: scaledPx(60) },
                      bodyCell: (rad: DokumentRad) => (rad.erVedlegg ? "" : (rad.jp.fagomrade ?? "-")),
                  },
              ]
            : []),
    ];

    return (
        <DataGrid
            data={rader}
            getRowId={(rad) => rad.id}
            // Avkrysningskolonnen finnes kun for å filtrere dokumentlisten, og vises derfor først når
            // brukeren har slått på "Filtrer dokumenter".
            selection={
                velgDokumenterAktiv
                    ? {
                          mode: "multiple",
                          selectedRowIds: valgteRadIder,
                          onSelectedRowIdsChange: oppdaterValg,
                          enableRowSelection: ({ row }) => Boolean(row.dok.dokumentreferanse),
                      }
                    : undefined
            }
            settings={{
                zebraStripes: true,
                rowDensity: "tight",
                textSize: "small",
                truncateContent: true,
            }}
            columns={columns}
        >
            <DataGrid.Table<DokumentRad>
                layout="auto"
                selectionTrigger="control"
                sorting={{
                    sortOrder: dataGridSort,
                    onSortOrderChange: (_, detail) =>
                        handleSort(detail.columnId as Extract<keyof JournalpostDto, string>),
                }}
                onRowAction={({ row }) => velgOgUtvidRad(row)}
                subRows={{
                    getRows: (rad) => rad.vedlegg,
                    isRowExpandable: (rad) => rad.vedlegg.length > 0,
                    expandedRowIds: Array.from(tableExpandedIds),
                    onExpandedRowIdsChange: (ids) => setTableExpandedIds(new Set(ids)),
                }}
            />
        </DataGrid>
    );
}
