import type { PersonDto } from "@bidrag/api/PersonApi";
import { MaskerSensitivInfo, PersonIdent } from "@bidrag/common";
import { beregnAlder } from "@bidrag/utils";
import { BodyShort, HStack, VStack } from "@navikt/ds-react";
import DiskresjonAlert from "../../felles/person/DiskresjonAlert";
import PersonInfo from "../../felles/person/PersonInfo";

export function ValgtPart({ person }: { person: PersonDto }) {
    return (
        <VStack gap="space-8">
            <PersonInfo
                truncate
                ident={person.ident}
                navn={person.visningsnavn}
                fødselsdato={person.fødselsdato ?? undefined}
                fallback={<ValgtPartPersonInfo person={person} />}
            />
            {person.diskresjonskode && <DiskresjonAlert diskresjonskode={person.diskresjonskode} />}
        </VStack>
    );
}

function ValgtPartPersonInfo({ person }: { person: PersonDto }) {
    const alder = person.fødselsdato ? beregnAlder(person.fødselsdato) : undefined;

    return (
        <MaskerSensitivInfo>
            <VStack>
                <BodyShort size="small" weight="semibold">
                    {person.visningsnavn}
                </BodyShort>
                <HStack align="center" gap="space-4">
                    <PersonIdent ident={person.ident} />
                    {alder !== undefined && (
                        <BodyShort size="small" textColor="subtle">
                            ({alder} år)
                        </BodyShort>
                    )}
                </HStack>
            </VStack>
        </MaskerSensitivInfo>
    );
}
