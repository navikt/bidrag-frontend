import type { PersonDto, PersondetaljerDto } from "@bidrag/api/PersonApi";
import { beregnAlderFraFnr } from "@bidrag/utils";
import { BodyShort, Box, CopyButton, Heading, HStack, Label, Search, VStack } from "@navikt/ds-react";

interface ISkjermbildeDetaljer {
    navn: string;
    referanse: string | number;
}

interface ISakHeaderProps {
    bruker: PersondetaljerDto;
}

export function PersonHeader({ bruker }: ISakHeaderProps) {
    return (
        <VStack marginBlock={"space-24 space-32"}>
            <Heading size={"medium"}>Personoversikt</Heading>
            <HStack justify={"space-between"}>
                <PersonDetaljer person={bruker.person} />
                <SearchPerson />
                {true && <Verge verge={bruker.person} />}
                <TilknyttetEnhet enhet={"Enhet 4806"} /> {/* TODO enhet */}
            </HStack>
        </VStack>
    );
}

function formatIdentToDateAndAge(ident: string) {
    if (ident.length === 11) {
        return `${ident.slice(0, 6)} ${ident.slice(6)} (${beregnAlderFraFnr(ident)} år)`;
    }
}

function formatIdentToDate(ident: string) {
    if (ident.length === 11) {
        return `${ident.slice(0, 6)} ${ident.slice(6)}`;
    }
}

function PersonDetaljer({ person }: { person: PersonDto }) {
    return (
        <Box
            borderRadius={"12"}
            borderWidth={"1"}
            marginBlock={"space-12 space-0"}
            maxWidth={"350px"}
            borderColor={"neutral-subtleA"}
        >
            <HStack justify={"space-between"} paddingBlock={"space-8"} paddingInline={"space-12"} gap={"space-32"}>
                <VStack gap={"space-4"}>
                    <BodyShort size={"small"} weight={"semibold"}>
                        {person.visningsnavn}
                    </BodyShort>
                    <BodyShort size={"small"} weight={"regular"}>
                        {formatIdentToDateAndAge(person.ident)}
                    </BodyShort>
                </VStack>
                {person.fødselsdato && (
                    <CopyButton size="small" copyText={person.fødselsdato} activeText="Kopierte ident" />
                )}
            </HStack>
        </Box>
    );
}

function SearchPerson() {
    return (
        <search>
            <Search
                label="Hent person/samhandler"
                variant="secondary"
                hideLabel={false}
                placeholder={"Personident. / samhandlerid."}
            >
                <Search.Button type="button">Hent</Search.Button>
            </Search>
        </search>
    );
}

function Verge({ verge }: { verge: PersonDto }) {
    {
        /* TODO verge*/
    }
    return (
        <VStack justify={"space-between"} paddingBlock={"space-8"} paddingInline={"space-12"} align={"end"}>
            <Label size={"small"} as={BodyShort}>
                Personen har verge:
            </Label>
            <Box
                borderRadius={"12"}
                borderWidth={"1"}
                paddingInline={"space-12"}
                asChild
                maxWidth={"350px"}
                borderColor={"neutral-subtleA"}
                paddingBlock={"space-8"}
            >
                <HStack gap={"space-16"} align="center">
                    <Box
                        borderRadius={"4"}
                        borderWidth={"1"}
                        paddingBlock={"space-0"}
                        paddingInline={"space-4"}
                        borderColor={"info"}
                        background={"info-moderate"}
                        width={"fit-content"}
                    >
                        <BodyShort size={"small"} weight={"regular"}>
                            VE
                        </BodyShort>{" "}
                        {/* TODO vil det stå VE for alle?*/}
                    </Box>
                    <HStack gap={"space-4"} align="center">
                        <BodyShort size={"small"} weight={"semibold"}>
                            {verge.visningsnavn}
                        </BodyShort>
                        <BodyShort size={"small"} weight={"regular"}>
                            {formatIdentToDate(verge.ident)}
                        </BodyShort>
                    </HStack>
                    {verge.fødselsdato && (
                        <CopyButton size="small" copyText={verge.fødselsdato} activeText="Kopierte ident" />
                    )}
                </HStack>
            </Box>
        </VStack>
    );
}

function TilknyttetEnhet({ enhet }: { enhet: string }) {
    return (
        <VStack justify={"space-between"} paddingBlock={"space-8"} paddingInline={"space-12"} align={"end"}>
            <Label size={"small"} as={BodyShort}>
                Person tilknyttet enhet:
            </Label>
            <Box
                borderRadius={"4"}
                borderWidth={"1"}
                paddingBlock={"space-4"}
                paddingInline={"space-8"}
                borderColor={"neutral"}
                background={"accent-moderate"}
                width={"fit-content"}
            >
                <BodyShort size={"small"} weight={"regular"}>
                    {enhet}
                </BodyShort>
            </Box>
        </VStack>
    );
}
