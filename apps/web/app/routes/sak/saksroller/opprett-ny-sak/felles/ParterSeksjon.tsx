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
    forslag?: PersonDto[];
    kanSettesUkjent?: boolean;
    feil?: string;
    /** Parten kan ikke endres, fordi flyten ble åpnet for denne personen. */
    låst?: boolean;
    onVelg: (person: PersonDto) => void;
    onUkjent: () => void;
    onEndre: () => void;
};

/**
 * Felles partsseksjon med ett redigerbart kort per part, uansett hvem saken ble startet fra.
 */
export default function ParterSeksjon({
    kort,
    tittel = "Bidragspliktig og bidragsmottaker",
    beskrivelse,
}: {
    kort: ForelderKortProps[];
    tittel?: string;
    beskrivelse?: string;
}) {
    return (
        <SkjemaSeksjon tittel={tittel} beskrivelse={beskrivelse}>
            <HGrid columns={{ xs: 1, md: 2 }} gap="space-16" align="start">
                {kort.map((props) => (
                    <ForelderKort key={props.rolle} {...props} />
                ))}
            </HGrid>
        </SkjemaSeksjon>
    );
}

function ForelderKort(props: ForelderKortProps) {
    const { rolle, part } = props;

    return (
        <VStack role="group" aria-label={hentForelderRolleLabel(rolle)}>
            <RollePersonKort person={{ ...part, rolle }}>{!props.låst && <Handlinger {...props} />}</RollePersonKort>
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
