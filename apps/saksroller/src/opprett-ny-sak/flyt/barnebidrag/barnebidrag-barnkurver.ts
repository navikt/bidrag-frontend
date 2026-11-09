import type { MotpartBarnRelasjon } from "@bidrag/api/PersonApi";
import { erUnderMaksAlder } from "../../../felles/barn/barn-regler";

function slåSammenUnikeBarn(eksisterende: MotpartBarnRelasjon["fellesBarn"], nye: MotpartBarnRelasjon["fellesBarn"]) {
    const identer = new Set(eksisterende.map((barn) => barn.ident));
    return [
        ...eksisterende,
        ...nye.filter((barn) => {
            if (identer.has(barn.ident)) return false;
            identer.add(barn.ident);
            return true;
        }),
    ];
}

/**
 * 🔴 Barn BP har sammen med valgt BM, som valgbare barn i saken. Bare relasjonen med BM brukes,
 * så barn fra andre forhold vises aldri. Barn som er lagt til manuelt, vises også her når de
 * er felles barn, sammen med søsknene sine.
 */
export function utledFellesBarn(
    relasjonerTilBp: MotpartBarnRelasjon[] | undefined,
    bidragsmottakerIdent: string | undefined,
): MotpartBarnRelasjon | null {
    const relasjon = relasjonerTilBp?.find((r) => !!bidragsmottakerIdent && r.motpart?.ident === bidragsmottakerIdent);
    const fellesBarn = relasjon?.fellesBarn.filter(erUnderMaksAlder) ?? [];
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
        if (eksisterende) eksisterende.fellesBarn = slåSammenUnikeBarn(eksisterende.fellesBarn, fellesBarn);
        else barnkurver.push({ ...relasjon, fellesBarn: slåSammenUnikeBarn([], fellesBarn) });
    }
    return barnkurver;
}
