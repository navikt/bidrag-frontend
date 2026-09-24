import type { PersonDto } from "@bidrag/api/PersonApi";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { useHentPersonMotpartBarnRelasjon } from "~/api/useApi.ts";
import { useMotpartHandling } from "../../hooks/useMotpartHandling";
import type { ForelderPartRolle, ForelderUtenBarnSkjemaData } from "../../opprett-sak-schema";
import type { ForeslåttForelder } from "./forelder-uten-barn-visningsmodell";

/**
 * Holder styr på hvilken motpart som er valgt, foreslått eller satt som ukjent,
 * og hvilken motpart som skal brukes til å hente søsken.
 */
export function useMotpartValg(
    form: UseFormReturn<ForelderUtenBarnSkjemaData>,
    motsattRolle: ForelderPartRolle,
    settInfoMelding: (melding: string) => void,
) {
    const [foreslåttMotpart, settForeslåttMotpart] = useState<ForeslåttForelder[]>([]);
    const [motpartErManueltValgt, settMotpartErManueltValgt] = useState(false);
    const [motpartIdentForSøskenSøk, settMotpartIdentForSøskenSøk] = useState<string | null>(null);

    const { data: motpartBarnRelasjon } = useHentPersonMotpartBarnRelasjon(
        motpartIdentForSøskenSøk ? { ident: motpartIdentForSøskenSøk } : null,
        !!motpartIdentForSøskenSøk,
    );

    const { settMotpartUkjent: settMotpartUkjentBase, leggTilMotpartManuell } = useMotpartHandling(form);

    const settMotpartUkjent = () => {
        settMotpartUkjentBase();
        settMotpartIdentForSøskenSøk(null);
        settMotpartErManueltValgt(false);
        settInfoMelding("Motpart satt som ukjent. Du kan nå legge til barn fra forskjellige medforeldre.");
    };

    const settMotpartManuelt = (person: PersonDto) => {
        leggTilMotpartManuell(person);
        settMotpartIdentForSøskenSøk(person.ident);
        settMotpartErManueltValgt(true);
        settInfoMelding("");
    };

    const brukForeslåttMotpart = (forelder: ForeslåttForelder) => {
        form.setValue("motpart", {
            ident: forelder.ident,
            navn: forelder.visningsnavn,
            erKjent: true,
            rolle: motsattRolle,
            diskresjonskode: forelder.diskresjonskode,
        });
        settMotpartIdentForSøskenSøk(forelder.ident);
        settMotpartErManueltValgt(false);
        settInfoMelding("");
    };

    const nullstillMotpart = () => {
        settForeslåttMotpart([]);
        settMotpartErManueltValgt(false);
        form.setValue("motpart", {
            ident: "",
            navn: "",
            erKjent: false,
            rolle: motsattRolle,
            diskresjonskode: undefined,
        });
    };

    return {
        foreslåttMotpart,
        settForeslåttMotpart,
        motpartErManueltValgt,
        settMotpartErManueltValgt,
        settMotpartIdentForSøskenSøk,
        motpartBarnRelasjon,
        settMotpartUkjent,
        settMotpartManuelt,
        brukForeslåttMotpart,
        nullstillMotpart,
    };
}
