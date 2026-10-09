import { useQueries } from "@tanstack/react-query";
import {
    hentForeldreinformasjonForBarnQueryOptions,
    hentPersonMotpartBarnRelasjonQueryOptions,
} from "../../api/person.api";
import type { Barnkurv, BarnMedAlder } from "../skjema/opprett-sak-schema";
import { grupperBarnIKurver } from "./barnkurver";

export function useBarnkurverMedSøsken(barnkurver: Barnkurv[], valgteBarn: BarnMedAlder[]) {
    const manueltValgteBarn = valgteBarn.filter((barn) => barn.manuellLagtTil);
    const foreldreSøk = useQueries({
        queries: manueltValgteBarn.map((barn) => hentForeldreinformasjonForBarnQueryOptions({ ident: barn.ident })),
    });
    const foreldre = [
        ...new Map(
            foreldreSøk
                .flatMap((søk) => søk.data ?? [])
                .flatMap((forelder) => (forelder.ident ? [[forelder.ident, forelder] as const] : [])),
        ).values(),
    ];
    const relasjonerSøk = useQueries({
        queries: foreldre.map((forelder) => hentPersonMotpartBarnRelasjonQueryOptions({ ident: forelder.ident })),
    });
    const relasjonerPerForelder = new Map(
        foreldre.map((forelder, index) => [
            forelder.ident,
            relasjonerSøk[index]?.data?.personensMotpartBarnRelasjon ?? [],
        ]),
    );
    const foreldreparPerBarn = manueltValgteBarn.map((_, index) =>
        [
            ...new Set(
                (foreldreSøk[index]?.data ?? []).flatMap((forelder) => (forelder.ident ? [forelder.ident] : [])),
            ),
        ].sort(),
    );
    const søskenkurver = manueltValgteBarn.flatMap((barn, index) => {
        const foreldreForBarn = foreldreparPerBarn[index] ?? [];
        if (foreldreForBarn.length !== 2) return [];

        const relasjoner = foreldreForBarn.flatMap((forelder) =>
            (relasjonerPerForelder.get(forelder) ?? []).filter(
                (relasjon) =>
                    foreldreForBarn.includes(relasjon.motpart?.ident ?? "") &&
                    relasjon.fellesBarn.some((fellesBarn) => fellesBarn.ident === barn.ident),
            ),
        );
        return grupperBarnIKurver(relasjoner);
    });
    const kurverMedManuelleBarn: Barnkurv[] = [...søskenkurver];
    const grupperteManuelleBarn = new Set(kurverMedManuelleBarn.flatMap((kurv) => kurv.barn.map((barn) => barn.ident)));
    const ukjenteManuelleBarn = manueltValgteBarn.filter((barn) => !grupperteManuelleBarn.has(barn.ident));
    if (ukjenteManuelleBarn.length > 0) {
        kurverMedManuelleBarn.push({
            id: "UKJENT",
            motpart: null,
            forelderrolle: "UKJENT",
            barn: ukjenteManuelleBarn,
        });
    }

    return {
        barnkurver: slåSammenBarnkurver(barnkurver, kurverMedManuelleBarn, manueltValgteBarn.length > 0),
        feil: [...foreldreSøk, ...relasjonerSøk].some((søk) => søk.isError),
        laster: [...foreldreSøk, ...relasjonerSøk].some((søk) => søk.isPending),
    };
}

function slåSammenBarnkurver(barnkurver: Barnkurv[], søskenkurver: Barnkurv[], harManuelleBarn: boolean) {
    const resultat: Barnkurv[] = [];
    const grupper = new Map<string, Barnkurv>();
    const visteBarnPerGruppe = new Map<string, Set<string>>();
    const visteBarn = new Set<string>();

    const kurverFraForeldre = harManuelleBarn ? [] : barnkurver;

    for (const kurv of [...kurverFraForeldre, ...søskenkurver]) {
        const nøkkel = kurv.motpart ? `motpart-${kurv.motpart.ident}` : "ukjent-forelder";
        const settForGruppe = harManuelleBarn ? (visteBarnPerGruppe.get(nøkkel) ?? new Set<string>()) : visteBarn;
        const nyeBarn = kurv.barn.filter((barn) => {
            if (settForGruppe.has(barn.ident)) return false;
            settForGruppe.add(barn.ident);
            return true;
        });
        if (harManuelleBarn) visteBarnPerGruppe.set(nøkkel, settForGruppe);
        if (nyeBarn.length === 0) continue;

        const eksisterende = grupper.get(nøkkel);
        if (eksisterende) {
            eksisterende.barn.push(...nyeBarn);
        } else {
            const nyKurv = { ...kurv, id: kurv.motpart ? kurv.id : "UKJENT", barn: nyeBarn };
            grupper.set(nøkkel, nyKurv);
            resultat.push(nyKurv);
        }
    }

    return resultat;
}
