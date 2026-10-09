import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { VStack } from "@navikt/ds-react";
import type { PartRolle } from "../skjema/opprett-sak-schema";
import SkjemaSeksjon, { SkjemaSeksjonKort } from "../skjema/SkjemaSeksjon";
import SaksrolleVelger from "./SaksrolleVelger";
import { ValgtPart } from "./StartpartVelger";

/**
 * Rollevalg i modalen når skjermbildet ikke sendte med rolle. Personen er gitt av
 * skjermbildet og kan ikke byttes, så her finnes ikke søk.
 */
export default function ModalRolleVelger({
    person,
    onVelg,
}: {
    person: PersonDto;
    onVelg: (rolle: PartRolle) => void;
}) {
    return (
        <SkjemaSeksjon tittel="Velg rolle" beskrivelse="Velg hvilken rolle personen har i saken.">
            <SkjemaSeksjonKort>
                <VStack gap="space-16" align="start">
                    <ValgtPart person={person} />
                    <SaksrolleVelger
                        navn={person.visningsnavn}
                        alder={beregnAlderForPerson(person)}
                        sakstype="BARNEBIDRAG"
                        rolle={null}
                        readOnly={false}
                        onVelg={onVelg}
                    />
                </VStack>
            </SkjemaSeksjonKort>
        </SkjemaSeksjon>
    );
}
