import { PersonNavnIdent } from "@bidrag/common";
import { formaterDato, sisteDagFramTilDato } from "@bidrag/utils";
import { InformationSquareIcon } from "@navikt/aksel-icons";
import {
    InfoCard,
    Pagination,
    type SortState,
    Table,
    VStack,
} from "@navikt/ds-react";
import { hentVisningsnavnFraType } from "@shared/kodeverk";
import { useEffect, useMemo, useState } from "react";
import { useBeløphistorikkfilter } from "./useBelopshistorikkFilter";

import { VedtaksType } from "./VedtaksType";

const ROWS_PER_PAGE = 20;

interface BeløpshistorikkProps {
    saksnummer: string;
}

export function BeløpshistorikkTabell({ saksnummer }: BeløpshistorikkProps) {
    const { filtrertData: flateRader, totalCount } =
        useBeløphistorikkfilter(saksnummer);
    const [stønaderPage, setStønaderPage] = useState(1);
    const [sort, setSort] = useState<SortState | undefined>();

    useEffect(() => {
        setStønaderPage(1);
    }, [saksnummer]);

    const handleSortChange = (sortKey: string) => {
        setStønaderPage(1);
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

    const sortedData = useMemo(() => {
        if (!sort) {
            return flateRader;
        }
        return flateRader.sort((a, b) => {
            const dir = sort.direction === "ascending" ? 1 : -1;
            switch (sort.orderBy) {
                case "navn":
                    return dir * a.kravhaver.localeCompare(b.kravhaver);
                case "belopsgruppe":
                    return (
                        dir *
                        hentVisningsnavnFraType(
                            "stønadstype",
                            a.type,
                        ).localeCompare(
                            hentVisningsnavnFraType("stønadstype", b.type),
                        )
                    );
                case "vedtaksdato":
                    return (
                        dir *
                        (new Date(a.gyldigFra) <= new Date(b.gyldigFra)
                            ? 1
                            : -1)
                    );
                case "fom":
                    return (
                        dir *
                        (new Date(a.periode.fom) <= new Date(b.periode.fom)
                            ? 1
                            : -1)
                    );
                case "tom":
                    if (!a.periode.til || !b.periode.til) return 0;
                    return (
                        dir *
                        (new Date(a.periode.til) <= new Date(b.periode.til)
                            ? 1
                            : -1)
                    );
                case "belop":
                    return dir * ((a.beløp ?? 0) - (b.beløp ?? 0));
                default:
                    return 0;
            }
        });
    }, [flateRader, sort]);

    const paginertStønader = useMemo(
        () =>
            sortedData.slice(
                (stønaderPage - 1) * ROWS_PER_PAGE,
                stønaderPage * ROWS_PER_PAGE,
            ),
        [sortedData, stønaderPage, sort],
    );

    if (totalCount === 0) {
        return (
            <InfoCard data-color="info">
                <InfoCard.Message icon={<InformationSquareIcon aria-hidden />}>
                    Det finnes ingen bidrag eller forskudd som innkreves i
                    saken.
                </InfoCard.Message>
            </InfoCard>
        );
    }

    return (
        <VStack gap={"space-16"}>
            <Table
                zebraStripes
                size={"small"}
                sort={sort}
                onSortChange={handleSortChange}
            >
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader sortable sortKey={"navn"}>
                            Navn/fødselsnr
                        </Table.ColumnHeader>
                        <Table.ColumnHeader sortable sortKey={"belopsgruppe"}>
                            Beløpsgruppe
                        </Table.ColumnHeader>
                        <Table.HeaderCell>Hendelse</Table.HeaderCell>
                        <Table.ColumnHeader sortable sortKey={"vedtaksdato"}>
                            Vedtaksdato
                        </Table.ColumnHeader>

                        <Table.ColumnHeader sortable sortKey={"fom"}>
                            FOM
                        </Table.ColumnHeader>
                        <Table.ColumnHeader sortable sortKey={"tom"}>
                            TOM
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                            sortable
                            sortKey={"belop"}
                            align={"right"}
                        >
                            Beløp
                        </Table.ColumnHeader>
                        <Table.HeaderCell>Valuta</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {paginertStønader.map((rad) => (
                        <Table.Row key={`${rad.stønadsid}-${rad.periodeid}`}>
                            <Table.DataCell>
                                <PersonNavnIdent
                                    ident={rad.kravhaver}
                                    bareFornavn={true}
                                />
                            </Table.DataCell>
                            <Table.DataCell>
                                {hentVisningsnavnFraType(
                                    "stønadstype",
                                    rad.type,
                                )}
                            </Table.DataCell>
                            <Table.DataCell>
                                <VedtaksType vedtaksId={rad.vedtaksid} />
                            </Table.DataCell>
                            <Table.DataCell>
                                {formaterDato(rad.gyldigFra)}
                            </Table.DataCell>
                            <Table.DataCell>
                                {formaterDato(rad.periode.fom)}
                            </Table.DataCell>
                            <Table.DataCell>
                                {rad.periode.til ? sisteDagFramTilDato(rad.periode.til) ?? "" : ""}
                            </Table.DataCell>
                            <Table.DataCell align={"right"}>
                                {rad.beløp ?? ""}
                            </Table.DataCell>
                            <Table.DataCell>
                                {rad.valutakode ?? "NOK"}
                            </Table.DataCell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
            {flateRader.length > ROWS_PER_PAGE && (
                <Pagination
                    page={stønaderPage}
                    onPageChange={setStønaderPage}
                    count={Math.ceil(sortedData.length / ROWS_PER_PAGE)}
                    size={"small"}
                />
            )}
        </VStack>
    );
}
