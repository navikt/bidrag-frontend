import {
    type DodsboDto,
    type DodsboKontaktadresse,
    type PersonAdresseDto,
    type PersondetaljerDto,
    SivilstandskodePDL,
} from "@bidrag/api/PersonApi";
import { capitalize } from "@bidrag/common";
import { Box, Heading, HStack, InlineMessage, Loader, Table, VStack } from "@navikt/ds-react";
import {
    useHentGeografiskTilknytning,
    useHentPersonAdresser,
    useHentSivilstand,
} from "~/common/person/usePersonInformation.ts";
import { useBrukerContext } from "~/routes/bruker/personopplysninger/PersonLayout.tsx";
import styles from "../Personopplysninger.module.css";

export default function PersonaliaPage() {
    const { ident, detaljer } = useBrukerContext();

    return (
        <VStack padding={"space-24"} gap={"space-16"}>
            <Heading size={"small"}>Personopplysninger</Heading>
            <HStack gap={"space-24"}>
                <Personalia detaljer={detaljer} />
            </HStack>
            <Heading size={"small"}>Kontaktopplysninger</Heading>
            <HStack gap={"space-24"}>
                <Kontaktopplysninger detaljer={detaljer} />
                <Dødsbo dødsbo={detaljer.dødsbo} />
            </HStack>
            <AdresseTabellerContainer ident={ident} />
        </VStack>
    );
}

function formatSivilstandType(type: SivilstandskodePDL) {
    switch (type) {
        case SivilstandskodePDL.GIFT:
            return "Gift";
        case SivilstandskodePDL.ENKE_ELLER_ENKEMANN:
            return "Enke eller enkemann";
        case SivilstandskodePDL.SEPARERT:
            return "Separert";
        case SivilstandskodePDL.UGIFT:
            return "Ugift";
        case SivilstandskodePDL.UOPPGITT:
            return "Uoppgitt";
        case SivilstandskodePDL.SKILT:
            return "Skilt";
        case SivilstandskodePDL.REGISTRERT_PARTNER:
            return "Registrert partner";
        case SivilstandskodePDL.SEPARERT_PARTNER:
            return "Separert partner";
        case SivilstandskodePDL.SKILT_PARTNER:
            return "Skilt partner";
        case SivilstandskodePDL.GJENLEVENDE_PARTNER:
            return "Gjenlevende partner";
    }
}

function Personalia({ detaljer }: { detaljer: PersondetaljerDto }) {
    const { sivilstand, isSivilstandLoading } = useHentSivilstand({ ident: detaljer.person.ident });
    const { geografiskTilknytning, isGeografiskTilknytningLoading } = useHentGeografiskTilknytning({
        ident: detaljer.person.ident,
    });

    if (isSivilstandLoading || isGeografiskTilknytningLoading) {
        return <Loader />;
    }

    if (sivilstand === undefined || geografiskTilknytning === undefined) {
        return null;
    }

    const gjeldendeSivilstand = sivilstand.sivilstandPdlDto.find((s) => s.historisk === false);

    return (
        <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
            <Heading size={"xsmall"}>PERSONALIA</Heading>
            <Box background={"default"}>
                <Table>
                    <Table.Body>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Fornavn</Table.HeaderCell>
                            <Table.DataCell scope={"row"} className={"personnavn"}>
                                {detaljer.person.fornavn}
                            </Table.DataCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Mellomnavn</Table.HeaderCell>
                            <Table.DataCell scope={"row"} className={"personnavn"}>
                                {detaljer.person.mellomnavn}
                            </Table.DataCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Etternavn</Table.HeaderCell>
                            <Table.DataCell scope={"row"} className={"personnavn"}>
                                {detaljer.person.etternavn}
                            </Table.DataCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Sivilstand</Table.HeaderCell>
                            <Table.DataCell scope={"row"}>
                                {gjeldendeSivilstand?.type ? formatSivilstandType(gjeldendeSivilstand.type) : undefined}
                            </Table.DataCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Språk/målform</Table.HeaderCell>
                            <Table.DataCell scope={"row"}>{detaljer.språk}</Table.DataCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Statsborgerskap</Table.HeaderCell>
                            <Table.DataCell scope={"row"}>
                                {geografiskTilknytning.erUtland ? "Utland" : "Norge"}
                            </Table.DataCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Umyndiggjøring</Table.HeaderCell>
                            <Table.DataCell
                                // TODO: Utvid backend person med umyndiggjort og så oppdater her (evt lag ny tabell for det)
                                scope={"row"}
                            >
                                Ikke implementert enda
                            </Table.DataCell>
                        </Table.Row>
                    </Table.Body>
                </Table>
            </Box>
        </VStack>
    );
}

function Kontaktopplysninger({ detaljer }: { detaljer: PersondetaljerDto }) {
    return (
        <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
            <Heading size={"xsmall"}>KONTAKTOPPLYSNINGER</Heading>
            <Box background={"default"}>
                <Table>
                    <Table.Body>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Telefonnummer</Table.HeaderCell>
                            {/* TODO: Utvid backend person med telefonnummer og så oppdater her */}
                            <Table.DataCell scope={"row"}>Ikke implementert enda</Table.DataCell>
                        </Table.Row>
                    </Table.Body>
                </Table>
            </Box>
        </VStack>
    );
}

function formatDødsboAdresse(adresse: DodsboKontaktadresse) {
    let address = adresse.adresselinje1;
    if (adresse.adresselinje2) {
        address += ", " + adresse.adresselinje2;
    }
    address += ", " + adresse.postnummer + " " + adresse.poststed;

    if (adresse.land3) {
        address += ", " + adresse.land3;
    }
    return address;
}

function Dødsbo({ dødsbo }: { dødsbo: DodsboDto | null | undefined }) {
    return (
        <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
            <Heading size={"xsmall"}>DØDSBO</Heading>
            <Box background={"default"}>
                <Table>
                    <Table.Body>
                        {dødsbo === null || dødsbo === undefined ? (
                            <Table.Row>
                                <Table.HeaderCell scope={"row"}>...</Table.HeaderCell>
                                <Table.DataCell scope={"row"}>...</Table.DataCell>
                            </Table.Row>
                        ) : (
                            <>
                                <Table.Row>
                                    <Table.HeaderCell scope={"row"}>Skifteform</Table.HeaderCell>
                                    <Table.DataCell scope={"row"}>{dødsbo.skifteform}</Table.DataCell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.HeaderCell scope={"row"}>Attestutstedelsesdato</Table.HeaderCell>
                                    <Table.DataCell scope={"row"}>{dødsbo.attestutstedelsesdato}</Table.DataCell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.HeaderCell scope={"row"}>Kontaktperson</Table.HeaderCell>
                                    <Table.DataCell scope={"row"}>{dødsbo.kontaktperson}</Table.DataCell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.HeaderCell scope={"row"}>Kontaktadresse</Table.HeaderCell>
                                    <Table.DataCell scope={"row"}>
                                        {formatDødsboAdresse(dødsbo.kontaktadresse)}
                                    </Table.DataCell>
                                </Table.Row>
                            </>
                        )}
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
            <AdresseTabell tittel="BOSTEDSADRESSE" adresse={adresser.find((a) => a.adressetype === "BOSTEDSADRESSE")} />
            <AdresseTabell tittel="KONTAKTADRESSE" adresse={adresser.find((a) => a.adressetype === "KONTAKTADRESSE")} />
            <AdresseTabell
                tittel="OPPHOLDSADRESSE"
                adresse={adresser.find((a) => a.adressetype === "OPPHOLDSADRESSE")}
            />
        </HStack>
    );
}

function AdresseTabell({ tittel, adresse }: { tittel: string; adresse?: PersonAdresseDto }) {
    return (
        <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
            <Heading size={"xsmall"}>{capitalize(tittel)}</Heading>
            <Box background={"default"}>
                <Table>
                    <Table.Body>
                        {adresse === undefined ? (
                            <Table.Row>
                                <Table.DataCell scope={"row"}>
                                    <InlineMessage status={"info"}>
                                        Ikke registrert {tittel.toLowerCase()} på bruker
                                    </InlineMessage>
                                </Table.DataCell>
                            </Table.Row>
                        ) : (
                            <>
                                {adresse.adresselinje1 && (
                                    <Table.Row>
                                        <Table.DataCell scope={"row"}>{adresse.adresselinje1}</Table.DataCell>
                                    </Table.Row>
                                )}
                                {adresse.adresselinje2 && (
                                    <Table.Row>
                                        <Table.DataCell scope={"row"}>{adresse.adresselinje2}</Table.DataCell>
                                    </Table.Row>
                                )}
                                {adresse.adresselinje3 && (
                                    <Table.Row>
                                        <Table.DataCell scope={"row"}>{adresse.adresselinje3}</Table.DataCell>
                                    </Table.Row>
                                )}
                                <Table.Row>
                                    <Table.DataCell scope={"row"}>{adresse.postnummer}</Table.DataCell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.DataCell scope={"row"}>{adresse.poststed}</Table.DataCell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.DataCell scope={"row"}>{adresse.land}</Table.DataCell>
                                </Table.Row>
                            </>
                        )}
                    </Table.Body>
                </Table>
            </Box>
        </VStack>
    );
}
