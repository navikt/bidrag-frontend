import { useState } from "react";

export type Bekreftelse = ReturnType<typeof useBekreftelse>;

/**
 * Bekreftelse av en advarsel om personene i `identer`. Bekreftelsen huskes per person, så endringer i listen
 * krever ny bekreftelse bare når en person som ikke er bekreftet før, kommer med.
 */
export function useBekreftelse(identer: string[]) {
    const [bekreftedeIdenter, setBekreftedeIdenter] = useState<ReadonlySet<string>>(new Set());
    const [harForsøktUtenBekreftelse, setHarForsøktUtenBekreftelse] = useState(false);
    const ubekreftede = identer.filter((ident) => !bekreftedeIdenter.has(ident));
    const bekreftet = ubekreftede.length === 0;

    return {
        måBekrefte: identer.length > 0,
        bekreftet,
        visFeil: harForsøktUtenBekreftelse && !bekreftet,
        settBekreftet: (verdi: boolean) => {
            if (verdi) setHarForsøktUtenBekreftelse(false);
            setBekreftedeIdenter((forrige) => {
                const neste = new Set(forrige);
                for (const ident of identer) {
                    if (verdi) neste.add(ident);
                    else neste.delete(ident);
                }
                return neste;
            });
        },
        /** `true` når handlingen kan fortsette. Viser feil i bekreftelsen ellers. */
        krevBekreftelse: () => {
            if (!bekreftet) setHarForsøktUtenBekreftelse(true);
            return bekreftet;
        },
    };
}
