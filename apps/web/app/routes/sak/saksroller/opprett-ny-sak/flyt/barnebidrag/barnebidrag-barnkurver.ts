import type { MotpartBarnRelasjon } from "@bidrag/api/PersonApi";
import { erUnderMaksAlder } from "../../../felles/barn/barn-regler";

/**
 * 🔴 Barn BP har sammen med valgt BM, som valgbare barn i saken. Bare relasjonen med BM brukes,
 * så barn fra andre forhold vises aldri. Barn som allerede er lagt til manuelt, utelates.
 */
export function utledFellesBarn(
    relasjonerTilBp: MotpartBarnRelasjon[] | undefined,
    bidragsmottakerIdent: string | undefined,
    manueltLagtTil: string[],
): MotpartBarnRelasjon | null {
    const relasjon = relasjonerTilBp?.find((r) => !!bidragsmottakerIdent && r.motpart?.ident === bidragsmottakerIdent);
    const fellesBarn =
        relasjon?.fellesBarn.filter((barn) => erUnderMaksAlder(barn) && !manueltLagtTil.includes(barn.ident)) ?? [];
    return relasjon && fellesBarn.length > 0 ? { ...relasjon, fellesBarn } : null;
}

/** Barnkurver for en forelder: bare barn opp til og med 24 år, slått sammen per motpart og forelderrolle. */
export function utledBarnkurverForForelder(relasjoner: MotpartBarnRelasjon[]): MotpartBarnRelasjon[] {
    const barnkurver: MotpartBarnRelasjon[] = [];
    for (const relasjon of relasjoner) {
        const fellesBarn = relasjon.fellesBarn.filter(erUnderMaksAlder);
        if (fellesBarn.length === 0) continue;
        const eksisterende = barnkurver.find(
            (r) =>
                r.motpart?.ident === relasjon.motpart?.ident &&
                r.forelderrolleMotpart === relasjon.forelderrolleMotpart,
        );
        if (eksisterende) eksisterende.fellesBarn = [...eksisterende.fellesBarn, ...fellesBarn];
        else barnkurver.push({ ...relasjon, fellesBarn });
    }
    return barnkurver;
}
