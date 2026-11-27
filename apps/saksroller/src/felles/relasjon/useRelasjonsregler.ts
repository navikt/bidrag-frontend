import { useFlag } from "@unleash/proxy-client-react";
import { useBekreftelse } from "../bekreftelse/useBekreftelse.ts";

export const ANNEN_FORELDER_FLAGG = "bisys.annen_forelder_advarsel";

export type Relasjonsregler = ReturnType<typeof useRelasjonsregler>;

/**
 * Reglene for relasjonen mellom barn og foreldre, ved opprett og endring.
 * Annen registrert forelder stopper, med mindre flagget tillater det med bekreftelse.
 * Tekniske oppslagsfeil og innloggingsfeil stopper flyten. Ufullstendig relasjon og skjult forelder krever bekreftelse.
 * Bekreftelsene gjelder barnet sammen med valgte foreldre, så nytt foreldrevalg krever ny bekreftelse.
 */
export function useRelasjonsregler({
    ufullstendige,
    annenForelder,
    oppslagsfeil,
    innloggingsfeil = [],
    foreldre,
    skjultForelder = [],
}: {
    ufullstendige: string[];
    annenForelder: string[];
    oppslagsfeil: string[];
    innloggingsfeil?: string[];
    foreldre: (string | undefined)[];
    skjultForelder?: string[];
}) {
    const medForeldre = (barnIdenter: string[]) => barnIdenter.map((ident) => [ident, ...foreldre].join("|"));
    const annenForelderTillatt = useFlag(ANNEN_FORELDER_FLAGG);
    const relasjonsbekreftelse = useBekreftelse(medForeldre(ufullstendige));
    const annenForelderBekreftelse = useBekreftelse(medForeldre(annenForelderTillatt ? annenForelder : []));
    const skjultForelderBekreftelse = useBekreftelse(skjultForelder);
    const annenForelderStopper = !annenForelderTillatt && annenForelder.length > 0;
    const harOppslagsfeil = oppslagsfeil.length > 0;
    const harInnloggingsfeil = innloggingsfeil.length > 0;

    return {
        relasjonsbekreftelse,
        annenForelderBekreftelse,
        skjultForelderBekreftelse,
        annenForelderStopper,
        harOppslagsfeil,
        harInnloggingsfeil,
        kanFortsette: () => {
            const alleBekreftet = [relasjonsbekreftelse, annenForelderBekreftelse, skjultForelderBekreftelse]
                .map((bekreftelse) => bekreftelse.bekreftetEllerVisFeil())
                .every(Boolean);
            return !annenForelderStopper && !harOppslagsfeil && !harInnloggingsfeil && alleBekreftet;
        },
    };
}
