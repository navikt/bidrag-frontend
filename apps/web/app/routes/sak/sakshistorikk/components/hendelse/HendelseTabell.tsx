import type { SakshendelseDto } from "@bidrag/api/SakApi";
import { useBisysLink } from "@bidrag/common";
import { formaterDato, sortByDateAsc } from "@bidrag/utils";
import { Box, Heading, VStack } from "@navikt/ds-react";
import { DataGrid } from "@navikt/ds-react/PREVIEW/DataGrid";
import { useHarSkrivetilgang } from "~/api/useApi.ts";
import { useSort } from "../useSort";
import { BehandleLink } from "./BehandleLink";
import { BrevLink } from "./BrevLink";
import { NotatLink } from "./NotatLink";
import { ResultatLink } from "./ResultatLink";
import { SøknadsgruppeBeskrivelseCelle } from "./SøknadsgruppeBeskrivelseCelle";

export default function HendelseTabell({
    saksnummer,
    hendelser,
}: {
    saksnummer: string;
    hendelser: SakshendelseDto[];
}) {
    const { sort, handleSort, sortData } = useSort<SakshendelseDto>();
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

    return (
        <VStack gap={"space-16"}>
            <Heading size="medium">Sakslogg</Heading>
            <VStack maxHeight="32rem" overflowY="auto">
                <DataGrid
                    data={sortedData}
                    getRowId={(h) => h.hendelseId ?? `${h.opprettetTidspunkt}-${h.type}`}
                    settings={{
                        zebraStripes: true,
                        rowDensity: "tight",
                        textSize: "small",
                        truncateContent: true,
                        stickyColumns: {start: 1, end: 1}
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
                                handleSort(detail.columnId as Extract<keyof SakshendelseDto, string>);
                            },
                        }}
                    />
                </DataGrid>
            </VStack>
        </VStack>
    );
}
