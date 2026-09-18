import type { SakshendelseDto } from "@bidrag/api/SakApi";
import { useBisysLink } from "@bidrag/common";
import { formaterDato } from "@bidrag/utils";
import { Heading, HStack, Pagination, VStack } from "@navikt/ds-react";
import { DataGrid } from "@navikt/ds-react/PREVIEW/DataGrid";
import { useMemo, useState } from "react";
import { useHarSkrivetilgang } from "~/api/useApi.ts";
import { useSort } from "../useSort";
import { BehandleLink } from "./BehandleLink";
import { BrevLink } from "./BrevLink";
import { NotatLink } from "./NotatLink";
import { ResultatLink } from "./ResultatLink";
import { SøknadsgruppeBeskrivelseCelle } from "./SøknadsgruppeBeskrivelseCelle";

const ROWS_PER_PAGE = 6;

export default function SaksLogg({ saksnummer, hendelser }: { saksnummer: string; hendelser: SakshendelseDto[] }) {
    const { sort, handleSort, sortData } = useSort<SakshendelseDto>();
    const [page, setPage] = useState(1);
    const { bisysSessionParams } = useBisysLink();
    const { enhet, sessionState } = bisysSessionParams;

    const { data: kanSkrive = false } = useHarSkrivetilgang(saksnummer, enhet);

    const sortOrder: DataGrid.Table.SortEntry[] = sort
        ? [
              {
                  columnId: sort.orderBy,
                  direction: sort.direction === "ascending" ? ("asc" as const) : ("desc" as const),
              },
          ]
        : [];

    const sortedData = sortData(hendelser);
    const pageCount = Math.ceil(sortedData.length / ROWS_PER_PAGE);
    const currentPage = Math.min(page, pageCount || 1);
    const paginatedData = useMemo(
        () => sortedData.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE),
        [currentPage, sortedData],
    );

    return (
        <VStack gap={"space-16"}>
            <Heading size="medium">Sakslogg</Heading>

            <DataGrid
                data={paginatedData}
                getRowId={(h) => h.hendelseId ?? `${h.opprettetTidspunkt}-${h.type}`}
                settings={{
                    zebraStripes: true,
                    rowDensity: "tight",
                    textSize: "small",
                    truncateContent: true,
                    stickyColumns: { start: 1, end: 1 },
                }}
                columns={[
                    {
                        id: "behandle",
                        header: "",
                        bodyCell: (h) => (
                            <BehandleLink
                                saksnummer={saksnummer}
                                hendelse={h}
                                enhet={enhet}
                                sessionState={sessionState}
                                kanSkrive={kanSkrive}
                            />
                        ),
                    },
                    {
                        id: "forsendelelse",
                        header: "",
                        bodyCell: (h) => (
                            <BrevLink
                                saksnummer={saksnummer}
                                hendelse={h}
                                enhet={enhet}
                                sessionState={sessionState}
                                kanSkrive={kanSkrive}
                            />
                        ),
                    },
                    {
                        id: "notat",
                        header: "",
                        bodyCell: (h) => (
                            <NotatLink
                                saksnummer={saksnummer}
                                hendelse={h}
                                enhet={enhet}
                                sessionState={sessionState}
                                kanSkrive={kanSkrive}
                            />
                        ),
                    },
                    {
                        id: "opprettetTidspunkt",
                        header: "Dato",
                        isSortable: true,
                        bodyCell: (h) => formaterDato(h.opprettetTidspunkt),
                    },
                    {
                        id: "søknadsgruppeBeskrivelse",
                        header: "Søknadsgrupper",
                        isSortable: true,
                        bodyCell: (h) => <SøknadsgruppeBeskrivelseCelle beskrivelse={h.søknadsgruppeBeskrivelse} />,
                    },
                    {
                        id: "typeBeskrivelse",
                        header: "Hendelse",
                        isSortable: true,
                        bodyCell: (h) => h.typeBeskrivelse,
                    },
                    {
                        id: "enhet",
                        header: "Enhet",
                        isSortable: true,
                        bodyCell: (h) => h.enhet,
                    },
                    {
                        id: "resultat",
                        header: "Resultat",
                        bodyCell: (h) => (
                            <ResultatLink
                                saksnummer={saksnummer}
                                hendelse={h}
                                enhet={enhet}
                                sessionState={sessionState}
                            />
                        ),
                    },
                ]}
            >
                <DataGrid.Table
                    layout="auto"
                    stickyHeader
                    sorting={{
                        sortOrder: sortOrder,
                        onSortOrderChange: (_, detail) => {
                            setPage(1);
                            handleSort(detail.columnId as Extract<keyof SakshendelseDto, string>);
                        },
                    }}
                />
            </DataGrid>
            {sortedData.length > ROWS_PER_PAGE && (
                <HStack justify={"end"}>
                    <Pagination page={currentPage} onPageChange={setPage} count={pageCount} size="small" />
                </HStack>
            )}
        </VStack>
    );
}
