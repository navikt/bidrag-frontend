import type { PersonDto } from "@bidrag/api/PersonApi";
import { PersonTallShortIcon, PlusIcon } from "@navikt/aksel-icons";
import { Box, Button, InlineMessage } from "@navikt/ds-react";
import { type ReactNode, useState } from "react";

import PersonInfo from "../person/PersonInfo.tsx";
import { PersonSøkInnhold } from "./PersonSøkWrapper.tsx";

type FunnetBarn = { person: PersonDto; alder: number };

/**
 * `valider` kaster med en feilmelding når barnet ikke kan legges til, og gir ellers alderen.
 * Søkekomponenten viser den kastede feilen selv.
 */
export function useBarnSøk({
    valider,
    onLeggTil,
    onLukk,
}: {
    valider: (person: PersonDto) => number;
    onLeggTil: (barn: FunnetBarn) => void | Promise<void>;
    onLukk: () => void;
}) {
    const [funnetBarn, setFunnetBarn] = useState<FunnetBarn>();
    const [feil, setFeil] = useState<string>();

    const nullstill = () => {
        setFunnetBarn(undefined);
        setFeil(undefined);
    };

    return {
        funnetBarn,
        feil,
        setFeil,
        nullstill,
        håndterSøk: (person: PersonDto) => {
            nullstill();
            setFunnetBarn({ person, alder: valider(person) });
        },
        lukk: () => {
            nullstill();
            onLukk();
        },
        leggTil: async () => {
            if (!funnetBarn) {
                setFeil("Søk opp barnet med fødselsnummer eller D-nummer først");
                return;
            }
            await onLeggTil(funnetBarn);
        },
    };
}

export function LeggTilBarnKnapp({ onClick }: { onClick: () => void }) {
    return (
        <Box marginBlock="space-16 space-0">
            <Button type="button" variant="secondary" size="small" icon={<PlusIcon aria-hidden />} onClick={onClick}>
                Legg til nytt barn
            </Button>
        </Box>
    );
}

export const barnSøkTittel = "Legg til nytt barn i saken";

export function BarnSøkIkon() {
    return <PersonTallShortIcon aria-hidden fontSize="1.5rem" />;
}

/** Innholdet i barnesøket. Legges i `PersonSøkModal` eller inline i `PersonSøkWrapper`. */
export function BarnSøkInnhold({ søk, children }: { søk: ReturnType<typeof useBarnSøk>; children?: ReactNode }) {
    return (
        <PersonSøkInnhold
            beskrivelse="Søk opp barnet som skal legges til i saken"
            søkeLabel="Søk etter barn"
            onPersonValgt={søk.håndterSøk}
            onQueryChange={søk.nullstill}
            resultat={
                <>
                    {søk.feil && (
                        <InlineMessage status="warning" size="small">
                            {søk.feil}
                        </InlineMessage>
                    )}
                    {søk.funnetBarn && (
                        <Box padding="space-16" borderRadius="8" background="neutral-soft">
                            <BarnPersonInfo {...søk.funnetBarn} />
                        </Box>
                    )}
                </>
            }
        >
            {children}
        </PersonSøkInnhold>
    );
}

export function BarnSøkHandlinger({ søk }: { søk: ReturnType<typeof useBarnSøk> }) {
    return (
        <>
            <Button type="button" size="small" onClick={søk.leggTil}>
                Legg til
            </Button>
            <Button type="button" size="small" variant="secondary" onClick={søk.lukk}>
                Avbryt
            </Button>
        </>
    );
}

export function BarnPersonInfo({ person, alder }: FunnetBarn) {
    return (
        <PersonInfo
            navn={person.visningsnavn}
            ident={person.ident}
            rolle="BA"
            alder={alder}
            fødselsdato={person.fødselsdato || ""}
        />
    );
}
