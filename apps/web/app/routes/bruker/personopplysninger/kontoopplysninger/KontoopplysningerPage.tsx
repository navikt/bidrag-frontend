import type { KontonummerDto } from "@bidrag/api/PersonApi";
import { Box, Heading, HStack, InlineMessage, Table, VStack } from "@navikt/ds-react";
import { useBrukerContext } from "~/routes/bruker/personopplysninger/PersonLayout.tsx";
import styles from "../Personopplysninger.module.css";

export default function KontoopplysningerPage() {
    const { detaljer } = useBrukerContext();

    return (
        <VStack padding={"space-24"} gap={"space-16"}>
            <Heading size={"small"}>Kontoopplysninger</Heading>
            <HStack gap={"space-24"}>
                <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
                    <Heading size={"xsmall"}>KONTONUMMER NORGE</Heading>
                    <KontonummerTabell konto={detaljer.kontonummer} />
                </VStack>

                <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
                    <Heading size={"xsmall"}>UTENLANDSK KONTO</Heading>
                    <KontonummerTabell konto={detaljer.kontonummer} utenlandsk={true} />
                </VStack>
            </HStack>
        </VStack>
    );
}

function KontonummerTabell({ konto, utenlandsk }: { konto?: KontonummerDto | null; utenlandsk?: boolean }) {
    const hasNorskKonto = konto?.norskKontonr !== null && konto?.norskKontonr !== undefined;
    const hasUtenlandskKonto = konto?.iban !== null && konto?.iban !== undefined;

    const isWrongTable = (utenlandsk && hasNorskKonto) || (!utenlandsk && hasUtenlandskKonto);

    return (
        <Box background={"default"}>
            <Table>
                <Table.Body>
                    {konto === null || konto === undefined || isWrongTable ? (
                        <Table.Row>
                            <Table.DataCell>
                                <InlineMessage status={"info"}>
                                    Ikke registrert {utenlandsk ? "utenlandsk" : "norsk"} kontonummer på bruker
                                </InlineMessage>
                            </Table.DataCell>
                        </Table.Row>
                    ) : (
                        <>
                            <Table.Row>
                                <Table.HeaderCell scope={"row"}>Type konto</Table.HeaderCell>
                                <Table.DataCell scope={"row"}>{utenlandsk ? "Utenlandsk" : "Norsk"}</Table.DataCell>
                            </Table.Row>
                            <Table.Row>
                                <Table.HeaderCell scope={"row"}>Kontonummer/IBAN</Table.HeaderCell>
                                <Table.DataCell scope={"row"}>
                                    {utenlandsk ? konto.iban : konto.norskKontonr}
                                </Table.DataCell>
                            </Table.Row>
                            <Table.Row>
                                <Table.HeaderCell scope={"row"}>Bankkode</Table.HeaderCell>
                                <Table.DataCell scope={"row"}>{konto.bankkode}</Table.DataCell>
                            </Table.Row>
                            <Table.Row>
                                <Table.HeaderCell scope={"row"}>Bankens navn</Table.HeaderCell>
                                <Table.DataCell scope={"row"}>{konto.banknavn}</Table.DataCell>
                            </Table.Row>
                            <Table.Row>
                                <Table.HeaderCell scope={"row"}>BIC/SWIFT-kode</Table.HeaderCell>
                                <Table.DataCell scope={"row"}>{konto.swift}</Table.DataCell>
                            </Table.Row>
                            <Table.Row>
                                <Table.HeaderCell scope={"row"}>Valuta</Table.HeaderCell>
                                <Table.DataCell scope={"row"}>{konto.valutakode}</Table.DataCell>
                            </Table.Row>
                            <Table.Row>
                                <Table.HeaderCell scope={"row"}>Adresse 1</Table.HeaderCell>
                                <Table.DataCell scope={"row"}>{konto.bankadresse1}</Table.DataCell>
                            </Table.Row>
                            <Table.Row>
                                <Table.HeaderCell scope={"row"}>Adresse 2</Table.HeaderCell>
                                <Table.DataCell scope={"row"}>{konto.bankadresse2}</Table.DataCell>
                            </Table.Row>
                            <Table.Row>
                                <Table.HeaderCell scope={"row"}>Adresse 3</Table.HeaderCell>
                                <Table.DataCell scope={"row"}>{konto.bankadresse3}</Table.DataCell>
                            </Table.Row>
                            <Table.Row>
                                <Table.HeaderCell scope={"row"}>Bankens landkode</Table.HeaderCell>
                                <Table.DataCell scope={"row"}>{konto.banklandkode}</Table.DataCell>
                            </Table.Row>
                        </>
                    )}
                </Table.Body>
            </Table>
        </Box>
    );
}
