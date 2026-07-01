import type { EngangsbelopDto } from "@bidrag/api/BelopshistorikkApi";
import { PersonNavnIdent } from "@bidrag/common";
import { formaterDato } from "@bidrag/utils";
import { InformationSquareIcon } from "@navikt/aksel-icons";
import { InfoCard, Pagination, Table, VStack } from "@navikt/ds-react";
import { hentVisningsnavnFraType } from "@shared/kodeverk";
import { useMemo, useState } from "react";

import { VedtaksType } from "./VedtaksType";

interface EngangsbetalingTabellProps {
    engangsbelop: EngangsbelopDto[];
    erGebyrTabell?: boolean;
}

const ROWS_PER_PAGE = 10;

export default function EngangsbetalingTabell({
    engangsbelop,
    erGebyrTabell,
}: EngangsbetalingTabellProps) {
    const [engangsPage, setEngangsPage] = useState(1);
    const paginertEngangser = useMemo(
        () =>
            engangsbelop.slice(
                (engangsPage - 1) * ROWS_PER_PAGE,
                engangsPage * ROWS_PER_PAGE,
            ),
        [engangsbelop, engangsPage],
    );

    if (engangsbelop.length === 0) {
        return (
            <InfoCard data-color="info">
                <InfoCard.Message icon={<InformationSquareIcon aria-hidden />}>
                    Det finnes særbidrag som innkreves i saken.
                </InfoCard.Message>
            </InfoCard>
        );
    }

    return (
        <VStack gap={"space-16"}>
            <Table zebraStripes size={"small"}>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>
                            {erGebyrTabell ? "Skyldner" : "Navn/fødselsnr"}
                        </Table.HeaderCell>
                        <Table.HeaderCell>Beløpsgruppe</Table.HeaderCell>
                        <Table.HeaderCell>Hendelse</Table.HeaderCell>
                        <Table.HeaderCell>Vedtaksdato</Table.HeaderCell>
                        <Table.HeaderCell align={"right"}>
                            Beløp
                        </Table.HeaderCell>
                        <Table.HeaderCell>Valuta</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {paginertEngangser.map((engangsbetaling) => (
                        <Table.Row key={engangsbetaling.engangsbeløpsid}>
                            <Table.DataCell>
                                <PersonNavnIdent
                                    ident={
                                        erGebyrTabell
                                            ? engangsbetaling.skyldner
                                            : engangsbetaling.kravhaver
                                    }
                                    bareFornavn
                                />
                            </Table.DataCell>
                            <Table.DataCell>
                                {hentVisningsnavnFraType(
                                    "engangsbeløptype",
                                    engangsbetaling.type,
                                )}
                            </Table.DataCell>
                            <Table.DataCell>
                                <VedtaksType
                                    vedtaksId={engangsbetaling.vedtaksid}
                                />
                            </Table.DataCell>
                            <Table.DataCell>
                                {formaterDato(engangsbetaling.gyldigFra)}
                            </Table.DataCell>
                            <Table.DataCell align={"right"}>
                                {engangsbetaling.beløp ?? "-"}
                            </Table.DataCell>
                            <Table.DataCell>
                                {engangsbetaling.valutakode ?? "NOK"}
                            </Table.DataCell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
            {engangsbelop.length > ROWS_PER_PAGE && (
                <Pagination
                    page={engangsPage}
                    onPageChange={setEngangsPage}
                    count={Math.ceil(engangsbelop.length / ROWS_PER_PAGE)}
                    size={"small"}
                />
            )}
        </VStack>
    );
}
