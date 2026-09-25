import type { PersonDto } from "@bidrag/api/PersonApi";
import { Alert, Button, HGrid, VStack } from "@navikt/ds-react";
import SøkPerson from "../../components/SøkPerson";
import type { ForelderPart, ForelderPartRolle } from "../opprett-sak-schema";
import { hentForelderRolleLabel } from "../utils";
import { RollePersonKort } from "./RollePersonKort";
import SkjemaSeksjon from "./SkjemaSeksjon";

export type ForelderKortProps = {
    rolle: ForelderPartRolle;
    part: ForelderPart;
    låst?: boolean;
    forslag?: PersonDto[];
    kanSettesUkjent?: boolean;
    feil?: string;
    onVelg: (person: PersonDto) => void;
    onUkjent: () => void;
    onEndre: () => void;
};

/**
 * Felles partsseksjon: alltid ett kort for bidragspliktig og ett for bidragsmottaker,
 * uansett hvem saken ble startet fra. Kortet til den oppsøkte personen er låst.
 */
export default function ParterSeksjon({ kort, beskrivelse }: { kort: ForelderKortProps[]; beskrivelse?: string }) {
    return (
        <SkjemaSeksjon tittel="Kontroller bidragspliktig og bidragsmottaker" beskrivelse={beskrivelse}>
            <HGrid columns={{ xs: 1, md: 2 }} gap="space-16" align="start">
                {kort.map((props) => (
                    <ForelderKort key={props.rolle} {...props} />
                ))}
            </HGrid>
        </SkjemaSeksjon>
    );
}

function ForelderKort(props: ForelderKortProps) {
    const { rolle, part, låst = false } = props;

    return (
        <VStack role="group" aria-label={hentForelderRolleLabel(rolle)}>
            <RollePersonKort person={{ ...part, rolle }}>{!låst && <Handlinger {...props} />}</RollePersonKort>
        </VStack>
    );
}

function Handlinger({
    rolle,
    part,
    forslag = [],
    kanSettesUkjent = true,
    feil,
    onVelg,
    onUkjent,
    onEndre,
}: ForelderKortProps) {
    const erKjent = part.erKjent === true && !!part.ident;

    return (
        <VStack gap="space-8" align="start">
            {erKjent ? (
                <Button type="button" size="small" variant="tertiary" onClick={onEndre}>
                    Endre {rolle}
                </Button>
            ) : (
                <VelgForelder
                    rolle={rolle}
                    forslag={forslag}
                    kanSettesUkjent={kanSettesUkjent && part.erKjent !== false}
                    onVelg={onVelg}
                    onUkjent={onUkjent}
                />
            )}
            {feil && (
                <Alert variant="error" size="small">
                    {feil}
                </Alert>
            )}
        </VStack>
    );
}

function VelgForelder({
    rolle,
    forslag,
    kanSettesUkjent,
    onVelg,
    onUkjent,
}: Pick<ForelderKortProps, "rolle" | "onVelg" | "onUkjent"> & { forslag: PersonDto[]; kanSettesUkjent: boolean }) {
    return (
        <>
            {forslag.map((person) => (
                <Button
                    key={person.ident}
                    type="button"
                    size="small"
                    variant="secondary"
                    onClick={() => onVelg(person)}
                >
                    Bruk {person.visningsnavn}
                </Button>
            ))}
            <SøkPerson label={`Søk etter ${rolle}`} personInformasjon={onVelg} compact />
            {kanSettesUkjent && (
                <Button type="button" size="small" variant="secondary-neutral" onClick={onUkjent}>
                    Registrer {rolle} som ukjent
                </Button>
            )}
        </>
    );
}
