import type { MotpartBarnRelasjon } from "@bidrag/api/PersonApi";

/** Samme motpart registrert med ulike forelderroller (f.eks. både mor og far) er en datafeil. */
export function harMotpartMedUlikeForelderroller(relasjoner: MotpartBarnRelasjon[]): boolean {
    return relasjoner.some((relasjon) =>
        relasjoner.some(
            (r) =>
                r.motpart?.ident === relasjon.motpart?.ident &&
                r.forelderrolleMotpart !== relasjon.forelderrolleMotpart,
        ),
    );
}
