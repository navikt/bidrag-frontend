import { useFlag } from "@unleash/proxy-client-react";
import { useBekreftelse } from "../bekreftelse/useBekreftelse.ts";

export const ANNEN_FORELDER_FLAGG = "bisys.annen_forelder_advarsel";

export type Relasjonsregler = ReturnType<typeof useRelasjonsregler>;

/**
 * Reglene for relasjonen mellom barn og foreldre, ved opprett og endring.
 * Feilet oppslag stopper alltid. Annen registrert forelder stopper, med mindre flagget tillater det med bekreftelse.
 * Ufullstendig relasjon og forelder saksbehandler ikke har tilgang til, krever hver sin bekreftelse.
 */
export function useRelasjonsregler({
    ufullstendige,
    annenForelder,
    harOppslagsfeil,
    skjultForelder = [],
}: {
    ufullstendige: string[];
    annenForelder: string[];
    harOppslagsfeil: boolean;
    skjultForelder?: string[];
}) {
    const annenForelderTillatt = useFlag(ANNEN_FORELDER_FLAGG);
    const relasjonsbekreftelse = useBekreftelse(ufullstendige);
    const annenForelderBekreftelse = useBekreftelse(annenForelderTillatt ? annenForelder : []);
    const skjultForelderBekreftelse = useBekreftelse(skjultForelder);
    const annenForelderStopper = !annenForelderTillatt && annenForelder.length > 0;

    return {
        relasjonsbekreftelse,
        annenForelderBekreftelse,
        skjultForelderBekreftelse,
        annenForelderStopper,
        harOppslagsfeil,
        kanFortsette: () => {
            const alleBekreftet = [relasjonsbekreftelse, annenForelderBekreftelse, skjultForelderBekreftelse]
                .map((bekreftelse) => bekreftelse.bekreftetEllerVisFeil())
                .every(Boolean);
            return !harOppslagsfeil && !annenForelderStopper && alleBekreftet;
        },
    };
}
