import type { Transaksjon } from "@bidrag/api/BidragReskontroApi";
import { PersonNavnIdent } from "@bidrag/common";
import { formaterBelop, formaterDato } from "@bidrag/utils";
import { Button, Table } from "@navikt/ds-react";
import { useState } from "react";
import { DUMMY_BARN } from "~/routes/sak/reskontro/konstanter.ts";
import { MotposterDialog } from "~/routes/sak/reskontro/MotposterDialog.tsx";

interface DetaljTransaksjonerTabellProps {
    transaksjoner: Transaksjon[];
    skjulMotposter?: boolean;
}

export function DetaljTransaksjonerTabell({ transaksjoner, skjulMotposter }: DetaljTransaksjonerTabellProps) {
    const [valgtMotpostId, setValgtMotpostId] = useState<number | null>(null);

    const renderValuta = (t: Transaksjon) => {
        const valutaKode = t.valutakode ?? "NOK";
        if (valutaKode !== "NOK") {
            return `${formaterBelop(t.beløpIOpprinneligValuta)} ${valutaKode}`;
        }
        return null;
        // return "-";
    };
    return (
        <>
            <Table size="small" stickyHeader>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Periode</Table.HeaderCell>
                        <Table.HeaderCell>Barn</Table.HeaderCell>
                        <Table.HeaderCell>Saksnummer</Table.HeaderCell>
                        <Table.HeaderCell>Skyldner</Table.HeaderCell>
                        <Table.HeaderCell>Mottaker</Table.HeaderCell>
                        <Table.HeaderCell>Orignal valuta</Table.HeaderCell>
                        <Table.HeaderCell align="right">Beløp</Table.HeaderCell>
                        <Table.HeaderCell align="right">Restbeløp</Table.HeaderCell>
                        {!skjulMotposter && <Table.HeaderCell>Motposter</Table.HeaderCell>}
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {transaksjoner.map((t) => (
                        <Table.Row key={`${t.transaksjonsid}-${t.delytelsesid}`}>
                            <Table.DataCell>{formaterDato(t.periode?.fom)}</Table.DataCell>
                            <Table.DataCell>
                                {t.barn !== DUMMY_BARN ? <PersonNavnIdent ident={t.barn} bareFornavn /> : "-"}
                            </Table.DataCell>
                            <Table.DataCell>{t.saksnummer}</Table.DataCell>
                            <Table.DataCell>
                                <PersonNavnIdent ident={t.skyldner} variant={"ident"} />
                            </Table.DataCell>
                            <Table.DataCell>
                                <PersonNavnIdent ident={t.mottaker} variant={"ident"} />
                            </Table.DataCell>
                            <Table.DataCell>{renderValuta(t)}</Table.DataCell>
                            <Table.DataCell align="right">{formaterBelop(t.beløp)}</Table.DataCell>
                            <Table.DataCell align="right">{formaterBelop(t.restBeløp)}</Table.DataCell>
                            {!skjulMotposter && (
                                <Table.DataCell>
                                    <Button
                                        variant="tertiary"
                                        size="xsmall"
                                        onClick={() => setValgtMotpostId(t.transaksjonsid ?? null)}
                                    >
                                        {t.transaksjonsid}
                                    </Button>
                                </Table.DataCell>
                            )}
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
            {!skjulMotposter && (
                <MotposterDialog transaksjonsid={valgtMotpostId} onClose={() => setValgtMotpostId(null)} />
            )}
        </>
    );
}
