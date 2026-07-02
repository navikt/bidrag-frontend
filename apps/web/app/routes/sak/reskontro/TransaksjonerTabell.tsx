import { Pagination, SortState, Table, VStack } from "@navikt/ds-react";
import { useMemo, useState } from "react";

import { Transaksjon } from "../../api/BidragReskontroApi";
import { formaterBelop } from "../../utils/belopUtils";
import { formaterDato, sortByDateAsc } from "../../utils/datoUtils";

interface TransaksjonerTabellProps {
    transaksjoner: Transaksjon[];
}

const ROWS_PER_PAGE = 50;

export default function TransaksjonerTabell({ transaksjoner }: TransaksjonerTabellProps) {
    const [sort, setSort] = useState<SortState | undefined>();
    const [page, setPage] = useState(1);

    const sortertData = useMemo(() => {
        if (!sort) return transaksjoner;
        return [...transaksjoner].sort((a, b) => {
            const dir = sort.direction === "ascending" ? 1 : -1;
            switch (sort.orderBy) {
                case "dato":
                    return dir * sortByDateAsc(a.dato, b.dato);
                case "transaksjonskode":
                    return dir * (a.transaksjonskode ?? "").localeCompare(b.transaksjonskode ?? "");
                case "beløp":
                    return dir * ((a.beløp ?? 0) - (b.beløp ?? 0));
                case "restBeløp":
                    return dir * ((a.restBeløp ?? 0) - (b.restBeløp ?? 0));
                case "periodeFom":
                    return dir * (a.periode?.fom ?? "").localeCompare(b.periode?.fom ?? "");
                case "mottaker":
                    return dir * (a.mottaker ?? "").localeCompare(b.mottaker ?? "");
                default:
                    return 0;
            }
        });
    }, [transaksjoner, sort?.direction, sort?.orderBy]);

    const paginertData = useMemo(
        () => sortertData.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
        [sortertData, page]
    );

    const handleSortChange = (sortKey: string) => {
        setPage(1);
        setSort((prevSort) =>
            prevSort && sortKey === prevSort.orderBy && prevSort.direction === "descending"
                ? undefined
                : {
                      orderBy: sortKey,
                      direction:
                          prevSort && sortKey === prevSort.orderBy && prevSort.direction === "ascending"
                              ? "descending"
                              : "ascending",
                  }
        );
    };

    if (transaksjoner.length === 0) {
        return <p>Ingen transaksjoner funnet.</p>;
    }

    return (
        <VStack gap="space-16">
            <Table zebraStripes size="small" sort={sort} onSortChange={handleSortChange}>
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader sortKey="dato" sortable>
                            Posteringsdato
                        </Table.ColumnHeader>
                        <Table.ColumnHeader sortKey="transaksjonskode" sortable>
                            Kode
                        </Table.ColumnHeader>
                        <Table.HeaderCell>Beskrivelse</Table.HeaderCell>
                        <Table.HeaderCell>Skyldner</Table.HeaderCell>
                        <Table.ColumnHeader sortKey="mottaker" sortable>
                            Gjelder
                        </Table.ColumnHeader>
                        <Table.ColumnHeader sortKey="periodeFom" sortable>
                            Periode
                        </Table.ColumnHeader>
                        <Table.ColumnHeader sortKey="beløp" sortable align="right">
                            Beløp
                        </Table.ColumnHeader>
                        <Table.ColumnHeader sortKey="restBeløp" sortable align="right">
                            Restbeløp
                        </Table.ColumnHeader>
                        <Table.HeaderCell>Valuta</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {paginertData.map((transaksjon) => (
                        <Table.Row key={transaksjon.transaksjonsid + transaksjon.delytelsesid}>
                            <Table.DataCell>{transaksjon.dato ? formaterDato(transaksjon.dato) : "–"}</Table.DataCell>
                            <Table.DataCell>{transaksjon.transaksjonskode ?? "–"}</Table.DataCell>
                            <Table.DataCell>{transaksjon.beskrivelse ?? "–"}</Table.DataCell>
                            <Table.DataCell>{transaksjon.skyldner ?? "–"}</Table.DataCell>
                            <Table.DataCell>{transaksjon.mottaker ?? "–"}</Table.DataCell>
                            <Table.DataCell>
                                {transaksjon.periode?.fom ? formaterDato(transaksjon.periode.fom) : "–"}
                            </Table.DataCell>
                            <Table.DataCell align="right">{formaterBelop(transaksjon.beløp)}</Table.DataCell>
                            <Table.DataCell align="right">{formaterBelop(transaksjon.restBeløp)}</Table.DataCell>
                            <Table.DataCell>{transaksjon.valutakode ?? "NOK"}</Table.DataCell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
            {transaksjoner.length > ROWS_PER_PAGE && (
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
