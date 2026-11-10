import type { PersonDto } from "@bidrag/api/PersonApi";
import { useState } from "react";
import { useRelasjonsregler } from "../../../felles/relasjon/useRelasjonsregler";
import type { ForelderPart } from "../../skjema/opprett-sak-schema";
import { barnMedAnnenForelder, barnMedUfullstendigRelasjon, type ForeldreTilBarn } from "./barnebidrag-forelderforslag";

type Barn = ForeldreTilBarn["barn"];

/** Husker alle foreldre som har vært tilbudt, også etter at barnet de ble funnet via er fjernet. */
export function useTilgjengeligeForeldre(kandidater: PersonDto[], valgte: ForelderPart[]): PersonDto[] {
    const [samlet, setSamlet] = useState<ReadonlyMap<string, PersonDto>>(new Map());
    const valgteSomPersoner = valgte.flatMap((part): PersonDto[] =>
        part.erKjent && part.ident && part.navn
            ? [{ ident: part.ident, visningsnavn: part.navn, diskresjonskode: part.diskresjonskode }]
            : [],
    );
    const nye = [...kandidater, ...valgteSomPersoner].filter(
        (person, index, alle) =>
            !samlet.has(person.ident) && alle.findIndex((annen) => annen.ident === person.ident) === index,
    );
    if (nye.length > 0) {
        setSamlet(new Map([...samlet, ...nye.map((person): [string, PersonDto] => [person.ident, person])]));
    }
    return [...samlet.values(), ...nye];
}

export function useBarnebidragRelasjonsregler({
    foreldreTilBarn,
    bidragspliktig,
    bidragsmottaker,
    barnMedSkjultForelder,
    barnMedOppslagsfeil,
}: {
    foreldreTilBarn: ForeldreTilBarn[];
    bidragspliktig: ForelderPart;
    bidragsmottaker: ForelderPart;
    barnMedSkjultForelder: Barn[];
    barnMedOppslagsfeil: string[];
}) {
    const foreldreTilBarnUtenFeil = foreldreTilBarn.filter(({ barn }) => !barnMedOppslagsfeil.includes(barn.ident));
    const annenForelder = barnMedAnnenForelder(foreldreTilBarnUtenFeil, [bidragspliktig.ident, bidragsmottaker.ident]);
    const ufullstendigRelasjon = (
        barnMedUfullstendigRelasjon(foreldreTilBarnUtenFeil, bidragspliktig.ident, bidragsmottaker.ident) ?? []
    ).filter(
        (barn) =>
            !annenForelder.some((annet) => annet.ident === barn.ident) &&
            !barnMedSkjultForelder.some((skjult) => skjult.ident === barn.ident),
    );
    const relasjonsregler = useRelasjonsregler({
        ufullstendige: ufullstendigRelasjon.map((barn) => barn.ident),
        annenForelder: annenForelder.map((barn) => barn.ident),
        harOppslagsfeil: barnMedOppslagsfeil.length > 0,
        skjultForelder: barnMedSkjultForelder.map((barn) => barn.ident),
    });

    return { relasjonsregler, ufullstendigRelasjon, annenForelder };
}
