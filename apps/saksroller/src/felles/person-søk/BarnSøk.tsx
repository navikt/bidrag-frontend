import type { PersonDto } from "@bidrag/api/PersonApi";
import { PersonTallShortIcon, PlusIcon } from "@navikt/aksel-icons";
import { Box, Button, InlineMessage } from "@navikt/ds-react";
import { type ReactNode, useState } from "react";

import { BarnKortInnhold } from "../person/BarnKort.tsx";
import PersonInfo from "../person/PersonInfo.tsx";
import { KortRamme } from "../person/PersonRolleKort.tsx";
import RedigeringsRamme from "../RedigeringsRamme.tsx";
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

function LeggTilBarnKnapp({ onClick }: { onClick: () => void }) {
    return (
        <Box marginBlock="space-16 space-0">
            <Button type="button" variant="secondary" size="small" icon={<PlusIcon aria-hidden />} onClick={onClick}>
                Legg til nytt barn
            </Button>
        </Box>
    );
}

const barnSøkTittel = "Legg til nytt barn i saken";

function BarnSøkIkon() {
    return <PersonTallShortIcon aria-hidden fontSize="1.5rem" />;
}

/**
 * «Legg til nytt barn»-knapp som åpner barnesøket i en `RedigeringsRamme`.
 * `children` vises over søkefeltet, for eksempel forslag til barn.
 */
export function LeggTilBarnSøk({
    søk,
    visSøk,
    onÅpne,
    innholdPåFunnetBarn,
    children,
}: {
    søk: ReturnType<typeof useBarnSøk>;
    visSøk: boolean;
    onÅpne: () => void;
    innholdPåFunnetBarn?: ReactNode;
    children?: ReactNode;
}) {
    if (!visSøk) {
        return <LeggTilBarnKnapp onClick={onÅpne} />;
    }

    return (
        <RedigeringsRamme
            tittel={barnSøkTittel}
            ikon={<BarnSøkIkon />}
            onAvbryt={søk.lukk}
            actions={<BarnSøkHandlinger søk={søk} />}
        >
            <BarnSøkInnhold søk={søk} innholdPåFunnetBarn={innholdPåFunnetBarn}>
                {children}
            </BarnSøkInnhold>
        </RedigeringsRamme>
    );
}

function BarnSøkInnhold({
    søk,
    innholdPåFunnetBarn,
    children,
}: {
    søk: ReturnType<typeof useBarnSøk>;
    innholdPåFunnetBarn?: ReactNode;
    children?: ReactNode;
}) {
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
                        <KortRamme>
                            <BarnKortInnhold
                                barn={{
                                    ident: søk.funnetBarn.person.ident,
                                    navn: søk.funnetBarn.person.visningsnavn,
                                    fødselsdato: søk.funnetBarn.person.fødselsdato,
                                    alder: søk.funnetBarn.alder,
                                    diskresjonskode: søk.funnetBarn.person.diskresjonskode,
                                }}
                            >
                                {innholdPåFunnetBarn}
                            </BarnKortInnhold>
                        </KortRamme>
                    )}
                </>
            }
        >
            {children}
        </PersonSøkInnhold>
    );
}

function BarnSøkHandlinger({ søk }: { søk: ReturnType<typeof useBarnSøk> }) {
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
            truncate
            navn={person.visningsnavn}
            ident={person.ident}
            rolle="BA"
            alder={alder}
            fødselsdato={person.fødselsdato || ""}
        />
    );
}
