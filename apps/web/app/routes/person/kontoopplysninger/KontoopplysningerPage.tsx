import type { KontonummerDto } from "@bidrag/api/PersonApi";
import { Box, Heading, HStack, InlineMessage, Table, VStack } from "@navikt/ds-react";
import { useHentPersoninformasjonDetaljer } from "~/api/useApi.ts";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr.ts";
import styles from "~/routes/person/PersonTable.module.css";
import type { Route } from "./+types/KontoopplysningerPage";

export default function KontoopplysningerPage({ params }: Route.ComponentProps) {
    const { decodeFnr } = useObfuscateFnr();
    const personId = params.personid;
    const ident = decodeFnr(personId);
    const { data: bruker } = useHentPersoninformasjonDetaljer({ ident });

    if (!bruker) {
        return null;
    }

    return (
        <VStack padding={"space-24"} gap={"space-16"}>
            <Heading size={"small"}>Kontoopplysninger</Heading>
            <HStack gap={"space-24"}>
                <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
                    <Heading size={"xsmall"}>KONTONUMMER NORGE</Heading>
                    <KontonummerTabell konto={bruker.kontonummer} />
                </VStack>

                <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
                    <Heading size={"xsmall"}>UTENLANDSK KONTO</Heading>
                    <KontonummerTabell konto={bruker.kontonummer} utenlandsk={true} />
                </VStack>
            </HStack>
        </VStack>
    );
}

function formatBankAddress(konto: KontonummerDto) {
    let address = "";
    if (konto.bankadresse1) {
        address = konto.bankadresse1;
    }
    if (konto.bankadresse2) {
        if (address !== "") {
            address += ", " + konto.bankadresse2;
        } else {
            address = konto.bankadresse2;
        }
    }
    if (konto.bankadresse3) {
        if (address !== "") {
            address += ", " + konto.bankadresse3;
        } else {
            address = konto.bankadresse3;
        }
    }
    return address;
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
                            <InlineMessage status={"info"}>
                                Ikke registrert {utenlandsk ? "utenlandsk" : "norsk"} kontonummer på bruker
                            </InlineMessage>
                        </Table.Row>
                    ) : (
                        <>
                            <Table.Row>
                                <Table.HeaderCell scope={"row"}>Type konto</Table.HeaderCell>
                                <Table.DataCell scope={"row"}>{utenlandsk ? "Utenlandsk" : "Norsk"}</Table.DataCell>
                            </Table.Row>
                            <Table.Row>
                                <Table.HeaderCell scope={"row"}>Utbetales til</Table.HeaderCell>
                                <Table.DataCell scope={"row"}>TODO Jeg vet ikke hva som går her</Table.DataCell>
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
                                <Table.HeaderCell scope={"row"}>Bankens adresse</Table.HeaderCell>
                                <Table.DataCell scope={"row"}>{formatBankAddress(konto)}</Table.DataCell>
                            </Table.Row>
                        </>
                    )}
                </Table.Body>
            </Table>
        </Box>
    );
}
