import type { Transaksjon } from "@bidrag/api/BidragReskontroApi";
import { PersonNavnIdent } from "@bidrag/common";
import { formaterBelop, formaterDato } from "@bidrag/utils";
import { Button, Table } from "@navikt/ds-react";
import { useState } from "react";
import { MotposterDialog } from "~/routes/sak/reskontro/MotposterDialog.tsx";

export function DetaljTransaksjonerTabell({ transaksjoner }: { transaksjoner: Transaksjon[] }) {
    const [valgtMotpostId, setValgtMotpostId] = useState<number | null>(null);

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
                        <Table.HeaderCell>Valuta</Table.HeaderCell>
                        <Table.HeaderCell align="right">Beløp</Table.HeaderCell>
                        <Table.HeaderCell align="right">Restbeløp</Table.HeaderCell>
                        <Table.HeaderCell>Motposter</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {transaksjoner.map((t) => (
                        <Table.Row key={`${t.transaksjonsid}-${t.delytelsesid}`}>
                            <Table.DataCell>{formaterDato(t.periode?.fom)}</Table.DataCell>
                            <Table.DataCell>
                                <PersonNavnIdent ident={t.barn} bareFornavn />
                            </Table.DataCell>
                            <Table.DataCell>{t.saksnummer}</Table.DataCell>
                            <Table.DataCell>
                                <PersonNavnIdent ident={t.skyldner} variant={"ident"} />
                            </Table.DataCell>
                            <Table.DataCell>
                                <PersonNavnIdent ident={t.mottaker} variant={"ident"} />
                            </Table.DataCell>
                            <Table.DataCell>{t.valutakode ?? "NOK"}</Table.DataCell>
                            <Table.DataCell align="right">{formaterBelop(t.beløp)}</Table.DataCell>
                            <Table.DataCell align="right">{formaterBelop(t.restBeløp)}</Table.DataCell>
                            <Table.DataCell>
                                <Button
                                    variant="tertiary"
                                    size="xsmall"
                                    onClick={() => setValgtMotpostId(t.transaksjonsid ?? null)}
                                >
                                    {t.transaksjonsid}
                                </Button>
                            </Table.DataCell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
            <MotposterDialog transaksjonsid={valgtMotpostId} onClose={() => setValgtMotpostId(null)} />
        </>
    );
}
