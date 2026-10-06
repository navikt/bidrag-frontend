import type { PersonAdresseDto, PersonDto } from "@bidrag/api/PersonApi";
import { capitalizeFirstLetterAndLowercaseRest } from "@bidrag/utils";
import { Box, Heading, HStack, Loader, Table, VStack } from "@navikt/ds-react";
import { useHentPersonAdresser, usePersonInformation } from "~/common/person/usePersonInformation.ts";
import { useBrukerContext } from "~/routes/bruker/personopplysninger/PersonLayout.tsx";
import styles from "../Personopplysninger.module.css";

export default function HistorikkPage() {
    const { ident, detaljer } = useBrukerContext();

    return (
        <VStack padding={"space-24"} gap={"space-16"}>
            <Heading size={"small"}>Personhistorikk</Heading>
            <HStack gap={"space-24"}>
                <PersonidenterHistorikk ident={ident} />
                <Navneendringer personhistorikk={[detaljer.person]} />
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
    const { personidenter, personidenterError, isPersonidenterLoading } = usePersonInformation({
        ident: ident,
        grupper: ["AKTORID", "FOLKEREGISTERIDENT", "NPID"],
        inkludereHistoriske: true,
    });

    if (isPersonidenterLoading) {
        return <Loader size={"medium"} />;
    }

    if (personidenterError || personidenter === undefined || personidenter === null || personidenter.length === 0) {
        return null;
    }

    return (
        <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
            <Heading size={"xsmall"}>PERSONIDENTER MED HISTORIKK</Heading>
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

function Navneendringer({ personhistorikk }: { personhistorikk: PersonDto[] }) {
    return (
        <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
            <Heading size={"xsmall"}>NAVNEENDRINGER</Heading>
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
                        {personhistorikk.map((person) => {
                            return (
                                <Table.Row>
                                    <Table.DataCell scope={"row"}>{person.fornavn}</Table.DataCell>
                                    <Table.DataCell scope={"row"}>{person.mellomnavn}</Table.DataCell>
                                    <Table.DataCell scope={"row"}>{person.etternavn}</Table.DataCell>
                                    {/* TODO ikke implementert henting av navnehistorikk, har satt opp med antatt PersonDto liste*/}
                                    <Table.DataCell scope={"row"}>Ikke implementert enda</Table.DataCell>
                                </Table.Row>
                            );
                        })}
                    </Table.Body>
                </Table>
            </Box>
        </VStack>
    );
}

function AdresseTabellerContainer({ ident }: { ident: string }) {
    const {
        personadresser: adresser,
        isPersonAdresserLoading,
        personadresserError,
    } = useHentPersonAdresser({
        personident: ident,
        "hente-postadresse": true,
    });

    if (isPersonAdresserLoading) {
        return <Loader size={"medium"} />;
    }

    if (personadresserError || adresser === undefined || adresser.length === 0) {
        return null;
    }

    return (
        <HStack gap={"space-24"}>
            <AdresserTabell
                tittel="BOSTEDSADRESSE"
                adresser={adresser.filter((a) => a.adressetype === "BOSTEDSADRESSE")}
            />
            <AdresserTabell
                tittel="KONTAKTADRESSE"
                adresser={adresser.filter((a) => a.adressetype === "KONTAKTADRESSE")}
            />
            <AdresserTabell
                tittel="OPPHOLDSADRESSE"
                adresser={adresser.filter((a) => a.adressetype === "OPPHOLDSADRESSE")}
            />
        </HStack>
    );
}

function AdresserTabell({ tittel, adresser }: { tittel: string; adresser: PersonAdresseDto[] }) {
    return (
        <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
            <Heading size={"xsmall"}>{tittel}</Heading>
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
                        {adresser.map(
                            ({ adresselinje1, adresselinje2, adresselinje3, postnummer, poststed }, index) => {
                                return (
                                    <Table.Row key={index}>
                                        <Table.DataCell scope={"row"}>
                                            {adresselinje1 || adresselinje2 || adresselinje3}
                                        </Table.DataCell>
                                        <Table.DataCell
                                            scope={"row"}
                                        >{`${postnummer}, ${capitalizeFirstLetterAndLowercaseRest(poststed || "")}`}</Table.DataCell>
                                        {/* TODO adresser har ikke datoer, oppdater her etter API er oppdatert */}
                                        <Table.DataCell scope={"row"}>Ikke implementert enda</Table.DataCell>
                                        <Table.DataCell scope={"row"}>Ikke implementert enda</Table.DataCell>
                                    </Table.Row>
                                );
                            },
                        )}
                    </Table.Body>
                </Table>
            </Box>
        </VStack>
    );
}
