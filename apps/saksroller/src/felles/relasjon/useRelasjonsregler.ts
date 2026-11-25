import { useFlag } from "@unleash/proxy-client-react";
import { useBekreftelse } from "../bekreftelse/useBekreftelse.ts";

export const ANNEN_FORELDER_FLAGG = "bisys.annen_forelder_advarsel";

export type Relasjonsregler = ReturnType<typeof useRelasjonsregler>;

/**
 * Reglene for relasjonen mellom barn og foreldre, ved opprett og endring.
 * Annen registrert forelder stopper, med mindre flagget tillater det med bekreftelse.
 * Feilet oppslag, ufullstendig relasjon og forelder saksbehandler ikke har tilgang til, krever hver sin bekreftelse.
 * Bekreftelsene gjelder barnet sammen med valgte foreldre, så nytt foreldrevalg krever ny bekreftelse.
 */
export function useRelasjonsregler({
    ufullstendige,
    annenForelder,
    oppslagsfeil,
    foreldre,
    skjultForelder = [],
}: {
    ufullstendige: string[];
    annenForelder: string[];
    oppslagsfeil: string[];
    foreldre: (string | undefined)[];
    skjultForelder?: string[];
}) {
    const medForeldre = (barnIdenter: string[]) => barnIdenter.map((ident) => [ident, ...foreldre].join("|"));
    const annenForelderTillatt = useFlag(ANNEN_FORELDER_FLAGG);
    const relasjonsbekreftelse = useBekreftelse(medForeldre(ufullstendige));
    const annenForelderBekreftelse = useBekreftelse(medForeldre(annenForelderTillatt ? annenForelder : []));
    const oppslagsfeilBekreftelse = useBekreftelse(medForeldre(oppslagsfeil));
    const skjultForelderBekreftelse = useBekreftelse(skjultForelder);
    const annenForelderStopper = !annenForelderTillatt && annenForelder.length > 0;

    return {
        relasjonsbekreftelse,
        annenForelderBekreftelse,
        oppslagsfeilBekreftelse,
        skjultForelderBekreftelse,
        annenForelderStopper,
        kanFortsette: () => {
            const alleBekreftet = [
                relasjonsbekreftelse,
                annenForelderBekreftelse,
                oppslagsfeilBekreftelse,
                skjultForelderBekreftelse,
            ]
                .map((bekreftelse) => bekreftelse.bekreftetEllerVisFeil())
                .every(Boolean);
            return !annenForelderStopper && alleBekreftet;
        },
    };
}
