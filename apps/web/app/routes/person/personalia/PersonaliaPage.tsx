import {
    type DodsboDto,
    type PersonAdresseDto,
    type PersondetaljerDto,
    SivilstandskodePDL,
} from "@bidrag/api/PersonApi";
import { toISODateString } from "@bidrag/common";
import { Box, Heading, HStack, InlineMessage, Loader, Select, Table, VStack } from "@navikt/ds-react";
import {
    useHentGeografiskTilknytning,
    useHentHusstandsmedlemmer,
    useHentPersonAdresser,
    useHentPersoninformasjonDetaljer,
    useHentSivilstand,
    useHentSpraak,
} from "~/api/useApi.ts";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr.ts";
import styles from "../PersonTable.module.css";
import type { Route } from "./+types/PersonaliaPage";

export default function PersonaliaPage({ params }: Route.ComponentProps) {
    const { decodeFnr } = useObfuscateFnr();
    const personId = params.personid;
    const ident = decodeFnr(personId);
    const { data: bruker } = useHentPersoninformasjonDetaljer({ ident });

    if (!bruker) {
        return null;
    }

    return (
        <VStack padding={"space-24"} gap={"space-16"}>
            <Heading size={"small"}>Personopplysninger</Heading>
            <HStack gap={"space-24"}>
                <Personalia bruker={bruker} />
                <Statsborgerskap bruker={bruker} />
            </HStack>
            <Heading size={"small"}>Kontaktopplysninger</Heading>
            <HStack gap={"space-24"}>
                <Kontaktopplysninger bruker={bruker} />
                <Dødsbo dødsbo={bruker.dødsbo} />
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

function Personalia({ bruker }: { bruker: PersondetaljerDto }) {
    const {
        data: sivilstand,
        isLoading: isSivilstandLoading,
        error: sivilstandError,
    } = useHentSivilstand({ ident: bruker.person.ident });
    const {
        data: husstandsmedlemmer,
        isLoading: isHusstandLoading,
        error: husstandError,
    } = useHentHusstandsmedlemmer({
        personRequest: {
            ident: bruker.person.ident,
        },
    });
    const {
        data: spraak,
        isLoading: isSpraakLoading,
        error: spraakError,
    } = useHentSpraak({
        ident: bruker.person.ident,
    });

    if (isSivilstandLoading || isHusstandLoading || isSpraakLoading) {
        return <Loader />;
    }

    if (sivilstand === undefined || husstandsmedlemmer === undefined || spraak === undefined) {
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
                            <Table.DataCell scope={"row"}>{bruker.person.fornavn}</Table.DataCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Mellomnavn</Table.HeaderCell>
                            <Table.DataCell scope={"row"}>{bruker.person.mellomnavn}</Table.DataCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Etternavn</Table.HeaderCell>
                            <Table.DataCell scope={"row"}>{bruker.person.etternavn}</Table.DataCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Sivilstand</Table.HeaderCell>
                            <Table.DataCell scope={"row"}>
                                {gjeldendeSivilstand?.type ? formatSivilstandType(gjeldendeSivilstand.type) : undefined}
                            </Table.DataCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Samboer med</Table.HeaderCell>
                            <Table.DataCell scope={"row"}>{bruker.person.fornavn}</Table.DataCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Språk/målform</Table.HeaderCell>
                            <Table.DataCell scope={"row"}>
                                <Select
                                    label={"Språk"}
                                    hideLabel={true}
                                    defaultValue={spraak}
                                    onSelect={() => console.log("select")}
                                >
                                    <option value={""}>Udefinert</option>
                                    <option value="norsk">Norsk</option>
                                    <option value="svensk">Svensk</option>
                                    <option value="dansk">Dansk</option>
                                </Select>
                            </Table.DataCell>
                        </Table.Row>
                    </Table.Body>
                </Table>
            </Box>
        </VStack>
    );
}

function Statsborgerskap({ bruker }: { bruker: PersondetaljerDto }) {
    const {
        data: geografisktilknytning,
        isLoading: isGeografiskLoading,
        error: geografiskError,
    } = useHentGeografiskTilknytning({
        ident: bruker.person.ident,
    });

    if (isGeografiskLoading) {
        return <Loader />;
    }

    if (geografisktilknytning === undefined) {
        return null;
    }

    return (
        <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
            <Heading size={"xsmall"}>STATSBORGERSKAP</Heading>
            <Box background={"default"}>
                <Table>
                    <Table.Body>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Statsborgerskap</Table.HeaderCell>
                            <Table.DataCell scope={"row"}>{bruker.person.fornavn}</Table.DataCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Fra og med dato</Table.HeaderCell>
                            <Table.DataCell scope={"row"}>{bruker.person.mellomnavn}</Table.DataCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Til og med dato</Table.HeaderCell>
                            <Table.DataCell scope={"row"}>{bruker.person.etternavn}</Table.DataCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Faktisk bostedsland</Table.HeaderCell>
                            <Table.DataCell scope={"row"}></Table.DataCell>
                        </Table.Row>
                    </Table.Body>
                </Table>
            </Box>
        </VStack>
    );
}

function Kontaktopplysninger({ bruker }: { bruker: PersondetaljerDto }) {
    return (
        <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
            <Heading size={"xsmall"}>KONTAKTOPPLYSNINGER</Heading>
            <Box background={"default"}>
                <Table>
                    <Table.Body>
                        <Table.Row>
                            <Table.HeaderCell scope={"row"}>Telefonnummer</Table.HeaderCell>
                            <Table.DataCell scope={"row"}>TODO har ikke nummer</Table.DataCell>
                        </Table.Row>
                    </Table.Body>
                </Table>
            </Box>
        </VStack>
    );
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
                            <Table.Row>
                                <Table.HeaderCell scope={"row"}>{dødsbo.skifteform}</Table.HeaderCell>
                                <Table.DataCell scope={"row"}>
                                    {toISODateString(new Date(dødsbo.attestutstedelsesdato))}
                                </Table.DataCell>
                            </Table.Row>
                        )}
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
            <Bostedsadresse adresse={adresser.find((a) => a.adressetype === "BOSTEDSADRESSE")} />
            <Kontaktadresse adresse={adresser.find((a) => a.adressetype === "KONTAKTADRESSE")} />
            <Oppholdsadresse adresse={adresser.find((a) => a.adressetype === "OPPHOLDSADRESSE")} />
        </HStack>
    );
}

function Bostedsadresse({ adresse }: { adresse?: PersonAdresseDto }) {
    return (
        <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
            <Heading size={"xsmall"}>BOSTEDSADRESSE</Heading>
            <Box background={"default"}>
                <Table>
                    <Table.Body>
                        {adresse === undefined ? (
                            <Table.Row>
                                <InlineMessage status={"info"}>Ikke registrert bostedsadresse på bruker</InlineMessage>
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

function Kontaktadresse({ adresse }: { adresse?: PersonAdresseDto }) {
    return (
        <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
            <Heading size={"xsmall"}>KONTAKTADRESSE</Heading>
            <Box background={"default"}>
                <Table>
                    <Table.Body>
                        {adresse === undefined ? (
                            <Table.Row>
                                <InlineMessage status={"info"}>Ikke registrert kontaktadresse på bruker</InlineMessage>
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

function Oppholdsadresse({ adresse }: { adresse?: PersonAdresseDto }) {
    return (
        <VStack gap={"space-16"} marginBlock={"space-12"} className={styles.table}>
            <Heading size={"xsmall"}>OPPHOLDSADRESSE</Heading>
            <Box background={"default"}>
                <Table>
                    <Table.Body>
                        {adresse === undefined ? (
                            <Table.Row>
                                <InlineMessage status={"info"}>Ikke registrert oppholdsadresse på bruker</InlineMessage>
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
