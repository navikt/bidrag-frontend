import type { SakshendelseDto } from "@bidrag/api/SakApi";
import { formaterDato, sortByDateAsc } from "@bidrag/utils";
import { Heading, HStack, Label, Pagination, Select, VStack } from "@navikt/ds-react";
import { DataGrid } from "@navikt/ds-react/PREVIEW/DataGrid";
import { type ChangeEvent, useState } from "react";
import { useSearchParams } from "react-router";
import { useHarSkrivetilgang } from "~/api/useApi.ts";
import { useSort } from "../useSort";
import { BehandleLink } from "./BehandleLink";
import { BrevLink } from "./BrevLink";
import { NotatLink } from "./NotatLink";
import { ResultatLink } from "./ResultatLink";

export default function HendelseTabell({
    saksnummer,
    hendelser,
}: {
    saksnummer: string;
    hendelser: SakshendelseDto[];
}) {
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const { sort, handleSort, sortData } = useSort<SakshendelseDto>({
        defaultUnsorted: (a, b) => sortByDateAsc(b.opprettetTidspunkt, a.opprettetTidspunkt),
    });
    const [searchParams] = useSearchParams();
    const enhet = searchParams.get("enhet");
    const sessionState = searchParams.get("sessionState");
    const { data: kanSkrive = false } = useHarSkrivetilgang(saksnummer, enhet);

    const onRowsPerPageChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setPage(1);
    };

    const sortOrder: DataGrid.Table.SortEntry[] = sort
        ? [
              {
                  columnId: sort.orderBy,
                  direction: sort.direction === "ascending" ? ("asc" as const) : ("desc" as const),
              },
          ]
        : [];

    const sortedData = sortData(hendelser).slice((page - 1) * rowsPerPage, page * rowsPerPage);

    return (
        <VStack gap={"space-16"}>
            <Heading size="medium">Sakslogg</Heading>
            <DataGrid
                data={sortedData}
                getRowId={(h) => h.hendelseId ?? `${h.opprettetTidspunkt}-${h.type}`}
                settings={{
                    zebraStripes: true,
                    rowDensity: "tight",
                    textSize: "small",
                    truncateContent: true,
                }}
                columns={[
                    {
                        id: "behandle",
                        header: "Behandle",
                        bodyCell: (h) => (
                            <HStack gap={"space-8"} justify={"center"}>
                                <div style={{ minWidth: "8ch" }}>
                                    <BehandleLink
                                        saksnummer={saksnummer}
                                        hendelse={h}
                                        enhet={enhet}
                                        sessionState={sessionState}
                                        kanSkrive={kanSkrive}
                                    />
                                </div>
                                <BrevLink
                                    saksnummer={saksnummer}
                                    hendelse={h}
                                    enhet={enhet}
                                    sessionState={sessionState}
                                    kanSkrive={kanSkrive}
                                />
                                <NotatLink
                                    saksnummer={saksnummer}
                                    hendelse={h}
                                    enhet={enhet}
                                    sessionState={sessionState}
                                    kanSkrive={kanSkrive}
                                />
                            </HStack>
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
                        bodyCell: (h) => h.søknadsgruppeBeskrivelse,
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
                    sorting={{
                        sortOrder: sortOrder,
                        onSortOrderChange: (_, detail) => {
                            handleSort(detail.columnId as Extract<keyof SakshendelseDto, string>);
                            setPage(1);
                        },
                    }}
                />
            </DataGrid>
            <HStack align={"center"}>
                <HStack flexGrow="1" flexBasis="0" />
                <HStack flexGrow="1" flexBasis="0" justify="center">
                    {hendelser.length > rowsPerPage && (
                        <Pagination
                            page={page}
                            onPageChange={setPage}
                            count={Math.ceil(hendelser.length / rowsPerPage)}
                            size="xsmall"
                        />
                    )}
                </HStack>
                <HStack align="center" gap={"space-8"} flexGrow="1" flexBasis="0" justify="end">
                    <Label size="small" htmlFor="antall-rader">
                        Antall rader
                    </Label>
                    <Select
                        id="antall-rader"
                        label="Antall rader"
                        hideLabel
                        size="small"
                        value={rowsPerPage}
                        onChange={onRowsPerPageChange}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </Select>
                </HStack>
            </HStack>
        </VStack>
    );
}
