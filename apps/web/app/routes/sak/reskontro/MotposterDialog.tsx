import { PersonNavnIdent } from "@bidrag/common";
import { formaterBelop } from "@bidrag/utils/belopUtils";
import { formaterDato } from "@bidrag/utils/datoUtils";
import { Alert, BodyShort, Dialog, Loader, Table } from "@navikt/ds-react";
import { useQuery } from "@tanstack/react-query";
import { hentTransaksjonerPaTransaksjonsid } from "~/api/query/reskontro.query";

import { TransaksjonType } from "./TransaksjonType";

interface MotposterDialogProps {
    transaksjonsid: number | null;
    onClose: () => void;
}

export function MotposterDialog({ transaksjonsid, onClose }: MotposterDialogProps) {
    // enabled styres av om dialogen faktisk er åpnet, slik at kallet
    // ikke gjøres før brukeren ber om det (lazy)
    const { data, isLoading, isError } = useQuery({
        ...hentTransaksjonerPaTransaksjonsid(transaksjonsid ?? 0),
        enabled: !!transaksjonsid,
    });

    const motposter = data?.transaksjoner ?? [];

    return (
        <Dialog open={!!transaksjonsid} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Popup width={"80%"}>
                <Dialog.Header>
                    <Dialog.Title>Motposter for transaksjon {transaksjonsid ?? ""}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    {isLoading && <Loader size="small" title="Henter motposter …" />}
                    {isError && (
                        <Alert variant="error" size="small">
                            Klarte ikke å hente motposter.
                        </Alert>
                    )}
                    {!isLoading && !isError && motposter.length === 0 && <BodyShort>Ingen motposter funnet.</BodyShort>}
                    {motposter.length > 0 && (
                        <Table size="small" stickyHeader>
                            <Table.Header>
                                <Table.Row>
                                    <Table.HeaderCell>Periode</Table.HeaderCell>
                                    <Table.HeaderCell>Barn</Table.HeaderCell>
                                    <Table.HeaderCell>Saksnummer</Table.HeaderCell>
                                    <Table.HeaderCell>Skyldner</Table.HeaderCell>
                                    <Table.HeaderCell>Mottaker</Table.HeaderCell>
                                    <Table.HeaderCell>Transaksjonstype</Table.HeaderCell>
                                    <Table.HeaderCell>Valuta</Table.HeaderCell>
                                    <Table.HeaderCell align="right">Beløp</Table.HeaderCell>
                                    <Table.HeaderCell align="right">Restbeløp</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {motposter.map((t) => (
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
                                        <Table.DataCell>
                                            <TransaksjonType kode={t.transaksjonskode} />
                                        </Table.DataCell>
                                        <Table.DataCell>{t.valutakode ?? "NOK"}</Table.DataCell>
                                        <Table.DataCell align="right">{formaterBelop(t.beløp)}</Table.DataCell>
                                        <Table.DataCell align="right">{formaterBelop(t.restBeløp)}</Table.DataCell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    )}
                </Dialog.Body>
            </Dialog.Popup>
        </Dialog>
    );
}
