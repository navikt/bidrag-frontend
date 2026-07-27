import type { JournalpostDto } from "@bidrag/api/BidragDokumentApi";
import type { RolleDto } from "@bidrag/api/SakApi";
import { formaterDato } from "@bidrag/utils";
import { PaperclipIcon } from "@navikt/aksel-icons";
import { HStack } from "@navikt/ds-react";
import { DataGrid } from "@navikt/ds-react/PREVIEW/DataGrid";
import { standardSort } from "../../sakshistorikk/components/journalpost/journalpostUtils";
import PersonIdentMedRolle from "../../sakshistorikk/components/journalpost/PersonIdentMedRolle";
import { useSort } from "../../sakshistorikk/components/useSort";
import type { SaksDokument } from "../types";
import { DokumentKategoriTag } from "../utils/dokumentKategori";
import { finnDokumenterForJournalpost } from "../utils/saksdokumenterUtils";
import type { MenyState } from "./hooks/useDokumentState";
import JournalpostStatusTag from "~/routes/sak/sakshistorikk/components/journalpost/JournalpostStatusTag.tsx";

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
}

export function SaksdokumentTabell({ journalposter, dokumenter, sakRoller, menyState }: SaksdokumentTabellProps) {
    const {
        selectedId,
        handleSelectDocument,
        valgteDokumentreferanser,
        handleSettValgteRefs,
        tableExpandedIds,
        setTableExpandedIds,
    } = menyState;

    const { sort, handleSort, sortData } = useSort<JournalpostDto>({
        defaultUnsorted: standardSort,
        customComparators: {
            gjelderAktor: (a, b) => (a.gjelderAktor?.ident ?? "").localeCompare(b.gjelderAktor?.ident ?? ""),
        },
    });

    const dataGridSort: DataGrid.Table.SortEntry[] = sort
        ? [
              {
                  columnId: sort.orderBy,
                  direction: sort.direction === "ascending" ? ("asc" as const) : ("desc" as const),
              },
          ]
        : [];

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

        return (
            <HStack gap="space-1" align="center" wrap={false} style={{ maxWidth: scaledPx(300), minWidth: 0 }}>
                {rad.erVedlegg && <PaperclipIcon aria-hidden className="shrink-0 text-gray-500" />}
                {rad.dok.kanÅpnes ? (
                    <button
                        type="button"
                        title={rad.dok.tittel}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDocument(rad.dok.id);
                        }}
                        className={`min-w-0 cursor-pointer truncate text-left ${
                            erValgt ? "font-semibold" : "text-text-action hover:text-text-action-on-hover underline"
                        }`}
                    >
                        {rad.dok.tittel}
                    </button>
                ) : (
                    <span
                        title={rad.dok.tittel}
                        className={`min-w-0 truncate ${erValgt ? "font-semibold" : "text-gray-600"}`}
                    >
                        {rad.dok.tittel}
                    </span>
                )}
            </HStack>
        );
    };

    const columns = [
        {
            id: "tittel",
            header: "Dokument",
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
    ];

    return (
        <DataGrid
            data={rader}

            getRowId={(rad) => rad.id}
            selection={{
                mode: "multiple",
                selectedRowIds: valgteRadIder,
                onSelectedRowIdsChange: oppdaterValg,
                enableRowSelection: ({ row }) => Boolean(row.dok.dokumentreferanse),
            }}
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
                onRowAction={({ row }) => row.dok.kanÅpnes && handleSelectDocument(row.dok.id)}
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
