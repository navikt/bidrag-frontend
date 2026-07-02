import type { Transaksjon } from "@bidrag/api/BidragReskontroApi";
import { PersonNavnIdent } from "@bidrag/common";
import { formaterBelop } from "@bidrag/utils/belopUtils";
import { formaterDato, sortByDateAsc } from "@bidrag/utils/datoUtils";
import {
    Box,
    Pagination,
    type SortState,
    Table,
    VStack,
} from "@navikt/ds-react";
import { useMemo, useState } from "react";

import { FiltrertTransaksjonSummer } from "./FiltrertTransaksjonSummer";
import { visningsnavnForSøknadstype } from "./søknadstyper";
import { aggregerTransaksjoner } from "./TransaksjonAggregat";
import { TransaksjonType } from "./TransaksjonType";

interface TransaksjonerAggregertTabellProps {
    transaksjoner: Transaksjon[];
    totalTransCount: number;
}

const ROWS_PER_PAGE = 50;

function SubTabell({ transaksjoner }: { transaksjoner: Transaksjon[] }) {
    return (
        <Table size="small" stickyHeader>
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell>Periode</Table.HeaderCell>
                    <Table.HeaderCell>Barn</Table.HeaderCell>
                    <Table.HeaderCell>Saksnummer</Table.HeaderCell>
                    <Table.HeaderCell>Skyldner</Table.HeaderCell>
                    <Table.HeaderCell>Mottaker</Table.HeaderCell>
                    <Table.HeaderCell>Valuta</Table.HeaderCell>
                    <Table.HeaderCell align="right">Beløp</Table.HeaderCell>
                    <Table.HeaderCell align="right">Restbeløp</Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {transaksjoner.map((t) => (
                    <Table.Row key={`${t.transaksjonsid}-${t.delytelsesid}`}>
                        <Table.DataCell>
                            {formaterDato(t.periode?.fom) ?? "–"}
                        </Table.DataCell>
                        <Table.DataCell>
                            <PersonNavnIdent ident={t.barn} bareFornavn />
                        </Table.DataCell>
                        <Table.DataCell>{t.saksnummer}</Table.DataCell>
                        <Table.DataCell>
                            <PersonNavnIdent
                                ident={t.skyldner}
                                variant={"ident"}
                            />
                        </Table.DataCell>
                        <Table.DataCell>
                            <PersonNavnIdent
                                ident={t.mottaker}
                                variant={"ident"}
                            />
                        </Table.DataCell>
                        <Table.DataCell>{t.valutakode ?? "NOK"}</Table.DataCell>
                        <Table.DataCell align="right">
                            {formaterBelop(t.beløp)}
                        </Table.DataCell>
                        <Table.DataCell align="right">
                            {formaterBelop(t.restBeløp)}
                        </Table.DataCell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    );
}

export default function TransaksjonerAggregertTabell({
    transaksjoner,
    totalTransCount,
}: TransaksjonerAggregertTabellProps) {
    const aggregater = useMemo(
        () =>
            aggregerTransaksjoner(transaksjoner)
                .sort((a, b) => sortByDateAsc(a.dato, b.dato))
                .reverse(),
        [transaksjoner],
    );
    const [sort, setSort] = useState<SortState | undefined>();
    const [page, setPage] = useState(1);

    const sortertData = useMemo(() => {
        if (!sort) return aggregater;
        return [...aggregater].sort((a, b) => {
            const dir = sort.direction === "ascending" ? 1 : -1;
            switch (sort.orderBy) {
                case "dato":
                    return dir * sortByDateAsc(a.dato, b.dato);
                case "transaksjonskode":
                    return (
                        dir *
                        (a.transaksjonskode ?? "").localeCompare(
                            b.transaksjonskode ?? "",
                        )
                    );
                case "mottaker":
                    return (
                        dir * (a.mottaker ?? "").localeCompare(b.mottaker ?? "")
                    );
                case "sumBeløp":
                    return dir * (a.sumBeløp - b.sumBeløp);
                case "sumRestBeløp":
                    return dir * (a.sumRestBeløp - b.sumRestBeløp);
                default:
                    return 0;
            }
        });
    }, [aggregater, sort?.orderBy, sort?.direction]);

    const paginertData = useMemo(
        () =>
            sortertData.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
        [sortertData, page],
    );

    const handleSortChange = (sortKey: string) => {
        setPage(1);
        setSort((prevSort) =>
            prevSort &&
            sortKey === prevSort.orderBy &&
            prevSort.direction === "descending"
                ? undefined
                : {
                      orderBy: sortKey,
                      direction:
                          prevSort &&
                          sortKey === prevSort.orderBy &&
                          prevSort.direction === "ascending"
                              ? "descending"
                              : "ascending",
                  },
        );
    };

    if (aggregater.length === 0) {
        return <p>Ingen transaksjoner funnet.</p>;
    }

    return (
        <VStack gap="space-16">
            <FiltrertTransaksjonSummer
                totalTransCount={totalTransCount}
                aggregater={aggregater}
            />
            <Table
                zebraStripes
                size="small"
                stickyHeader={true}
                sort={sort}
                onSortChange={handleSortChange}
            >
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader sortKey="dato" sortable>
                            Posteringsdato
                        </Table.ColumnHeader>
                        <Table.ColumnHeader sortKey="transaksjonskode" sortable>
                            Transaksjonstype
                        </Table.ColumnHeader>
                        <Table.HeaderCell>Søknadstype</Table.HeaderCell>
                        <Table.ColumnHeader
                            sortKey="sumBeløp"
                            sortable
                            align="right"
                        >
                            Beløp
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                            sortKey="sumRestBeløp"
                            sortable
                            align="right"
                        >
                            Restbeløp
                        </Table.ColumnHeader>
                        <Table.HeaderCell colSpan={2}>
                            Transaksjoner
                        </Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {paginertData.map((aggregat) => (
                        <Table.ExpandableRow
                            key={aggregat.nøkkel}
                            togglePlacement="right"
                            expandOnRowClick
                            content={
                                <Box padding="space-4">
                                    <SubTabell
                                        transaksjoner={aggregat.transaksjoner}
                                    />
                                </Box>
                            }
                        >
                            <Table.DataCell>
                                {formaterDato(aggregat.dato)}
                            </Table.DataCell>
                            <Table.DataCell>
                                <TransaksjonType
                                    kode={aggregat.transaksjonskode}
                                />
                            </Table.DataCell>
                            <Table.DataCell>
                                {visningsnavnForSøknadstype(aggregat.søknadstype)}
                            </Table.DataCell>
                            <Table.DataCell align="right">
                                {formaterBelop(aggregat.sumBeløp)}
                            </Table.DataCell>
                            <Table.DataCell align="right">
                                {formaterBelop(aggregat.sumRestBeløp)}
                            </Table.DataCell>
                            <Table.DataCell align="right">
                                {aggregat.antall}
                            </Table.DataCell>
                        </Table.ExpandableRow>
                    ))}
                </Table.Body>
            </Table>
            {aggregater.length > ROWS_PER_PAGE && (
                <Pagination
                    page={page}
                    onPageChange={setPage}
                    count={Math.ceil(sortertData.length / ROWS_PER_PAGE)}
                    size="small"
                />
            )}
        </VStack>
    );
}
