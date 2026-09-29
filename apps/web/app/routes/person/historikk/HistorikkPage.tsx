import type { PersonAdresseDto } from "@bidrag/api/PersonApi";
import { Box, Heading, HStack, Loader, Table, VStack } from "@navikt/ds-react";
import { useHentPersonAdresser, useHentPersonidenter, useHentPersoninformasjonDetaljer } from "~/api/useApi.ts";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr.ts";
import styles from "../PersonTable.module.css";
import type { Route } from "./+types/HistorikkPage";

export default function HistorikkPage({ params }: Route.ComponentProps) {
    const { decodeFnr } = useObfuscateFnr();
    const personId = params.personid;
    const ident = decodeFnr(personId);
    return (
        <VStack padding={"space-24"} gap={"space-16"}>
            <Heading size={"small"}>Personhistorikk</Heading>
            <HStack gap={"space-24"}>
                <PersonidenterHistorikk ident={ident} />
                <Navneendringer ident={ident} />
            </HStack>
            <Heading size={"small"}>Adressehistorikk</Heading>
            <AdresseTabellerContainer ident={ident} />
        </VStack>
    );
}

function formaterGruppeNavn(gruppe: string) {
    switch (gruppe) {
        case "AKTORID":
            return "AktorID";
        case "FOLKEREGISTERIDENT":
            return "Folkeregisterident";
        case "NPID":
            return "NPID";
        default:
            return gruppe;
    }
}

function PersonidenterHistorikk({ ident }: { ident: string }) {
    const {
        data: personidenter,
        isLoading,
        error,
    } = useHentPersonidenter({
        ident: ident,
        grupper: ["AKTORID", "FOLKEREGISTERIDENT", "NPID"],
        inkludereHistoriske: true,
    });

    if (isLoading) {
        return <Loader size={"medium"} />;
    }

    if (error || personidenter === undefined || personidenter === null || personidenter.length === 0) {
        return null;
    }

    return (
        <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
            <Heading size={"xsmall"}>Personidenter med historikk</Heading>
            <Box background={"default"}>
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell scope="col">Ident</Table.HeaderCell>
                            <Table.HeaderCell scope="col">Type</Table.HeaderCell>
                            <Table.HeaderCell scope="col">Status</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {personidenter.map(({ ident, historisk, gruppe }) => {
                            return (
                                <Table.Row key={ident}>
                                    <Table.DataCell scope={"row"}>{ident}</Table.DataCell>
                                    <Table.DataCell scope={"row"}>{formaterGruppeNavn(gruppe)}</Table.DataCell>
                                    <Table.DataCell scope={"row"}>{historisk ? "Historisk" : "Aktiv"}</Table.DataCell>
                                </Table.Row>
                            );
                        })}
                    </Table.Body>
                </Table>
            </Box>
        </VStack>
    );
}

function Navneendringer({ ident }: { ident: string }) {
    const { data: bruker, isLoading, error } = useHentPersoninformasjonDetaljer({ ident });

    if (isLoading) {
        return <Loader size={"medium"} />;
    }

    if (error || bruker === undefined) {
        return null;
    }

    const person = bruker.person;

    return (
        <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
            <Heading size={"xsmall"}>Personidenter med historikk</Heading>
            <Box background={"default"}>
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell scope="col">Fornavn</Table.HeaderCell>
                            <Table.HeaderCell scope="col">Mellomnavn</Table.HeaderCell>
                            <Table.HeaderCell scope="col">Etternavn</Table.HeaderCell>
                            <Table.HeaderCell scope="col">Fra og med dato</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {
                            //person.m => {
                            // return (
                            <Table.Row>
                                <Table.DataCell scope={"row"}>{person.fornavn}</Table.DataCell>
                                <Table.DataCell scope={"row"}>{person.mellomnavn}</Table.DataCell>
                                <Table.DataCell scope={"row"}>{person.etternavn}</Table.DataCell>
                                <Table.DataCell scope={"row"}>12.01.2023</Table.DataCell>
                            </Table.Row>
                            //  );
                            /*})*/
                        }
                    </Table.Body>
                </Table>
            </Box>
        </VStack>
    );
}

function AdresseTabellerContainer({ ident }: { ident: string }) {
    const {
        data: adresser,
        isLoading,
        error,
    } = useHentPersonAdresser({
        personident: ident,
        "hente-postadresse": true,
    });

    if (isLoading) {
        return <Loader size={"medium"} />;
    }

    if (error || adresser === undefined || adresser.length === 0) {
        return null;
    }

    return (
        <HStack gap={"space-24"}>
            <Bostedsadresse adresser={adresser.filter((a) => a.adressetype === "BOSTEDSADRESSE")} />
            <Kontaktadresse adresser={adresser.filter((a) => a.adressetype === "KONTAKTADRESSE")} />
            <Oppholdsadresse adresser={adresser.filter((a) => a.adressetype === "OPPHOLDSADRESSE")} />
        </HStack>
    );
}

function Bostedsadresse({ adresser }: { adresser: PersonAdresseDto[] }) {
    return (
        <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
            <Heading size={"xsmall"}>Bostedsadresse</Heading>
            <Box background={"default"}>
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell scope="col">Adresse</Table.HeaderCell>
                            <Table.HeaderCell scope="col">Sted</Table.HeaderCell>
                            <Table.HeaderCell scope="col">Fra og med</Table.HeaderCell>
                            <Table.HeaderCell scope="col">Til og med</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {adresser.map(({ adresselinje1, adresselinje2, adresselinje3, poststed }, index) => {
                            return (
                                <Table.Row key={index}>
                                    <Table.DataCell scope={"row"}>
                                        {adresselinje1 || adresselinje2 || adresselinje3}
                                    </Table.DataCell>
                                    <Table.DataCell scope={"row"}>{poststed}</Table.DataCell>
                                    <Table.DataCell scope={"row"}>12.12.2012</Table.DataCell>
                                    <Table.DataCell scope={"row"}>12.12.2022</Table.DataCell>
                                </Table.Row>
                            );
                        })}
                    </Table.Body>
                </Table>
            </Box>
        </VStack>
    );
}

function Kontaktadresse({ adresser }: { adresser: PersonAdresseDto[] }) {
    return (
        <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
            <Heading size={"xsmall"}>Kontaktadresse</Heading>
            <Box background={"default"}>
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell scope="col">Adresse</Table.HeaderCell>
                            <Table.HeaderCell scope="col">Sted</Table.HeaderCell>
                            <Table.HeaderCell scope="col">Fra og med</Table.HeaderCell>
                            <Table.HeaderCell scope="col">Til og med</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {adresser.map(({ adresselinje1, adresselinje2, adresselinje3, poststed }, index) => {
                            return (
                                <Table.Row key={index}>
                                    <Table.DataCell scope={"row"}>
                                        {adresselinje1 || adresselinje2 || adresselinje3}
                                    </Table.DataCell>
                                    <Table.DataCell scope={"row"}>{poststed}</Table.DataCell>
                                    <Table.DataCell scope={"row"}>12.12.2012</Table.DataCell>
                                    <Table.DataCell scope={"row"}>12.12.2022</Table.DataCell>{" "}
                                </Table.Row>
                            );
                        })}
                    </Table.Body>
                </Table>
            </Box>
        </VStack>
    );
}

function Oppholdsadresse({ adresser }: { adresser: PersonAdresseDto[] }) {
    return (
        <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
            <Heading size={"xsmall"}>Oppholdsadresse</Heading>
            <Box background={"default"}>
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell scope="col">Adresse</Table.HeaderCell>
                            <Table.HeaderCell scope="col">Sted</Table.HeaderCell>
                            <Table.HeaderCell scope="col">Fra og med</Table.HeaderCell>
                            <Table.HeaderCell scope="col">Til og med</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {adresser.map(({ adresselinje1, adresselinje2, adresselinje3, poststed }, index) => {
                            return (
                                <Table.Row key={index}>
                                    <Table.DataCell scope={"row"}>
                                        {adresselinje1 || adresselinje2 || adresselinje3}
                                    </Table.DataCell>
                                    <Table.DataCell scope={"row"}>{poststed}</Table.DataCell>
                                    <Table.DataCell scope={"row"}>12.12.2012</Table.DataCell>
                                    <Table.DataCell scope={"row"}>12.12.2022</Table.DataCell>
                                </Table.Row>
                            );
                        })}
                    </Table.Body>
                </Table>
            </Box>
        </VStack>
    );
}
