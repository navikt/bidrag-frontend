import { TilgangsFeilError } from "@bidrag/api";

import type { BidragssakDto } from "@bidrag/api/SakApi";
import { useMemo } from "react";
import { useHentSakForPerson } from "~/api/useApi.ts";
import type { ForelderPartRolle } from "../opprett-sak-schema";

type EksisterendeSakSjekkParams = {
    partISaken: {
        ident: string;
        navn: string;
        erKjent: boolean | undefined;
        rolle: ForelderPartRolle | string;
    };
    motpart: {
        ident: string;
        rolle: ForelderPartRolle | string;
        erKjent: boolean | undefined;
        navn: string;
    };
    erEktefellebidrag?: boolean;
};

type EksisterendeSakSjekkResult = {
    harEksisterendeSak: boolean;
    eksisterendeSak: BidragssakDto | null;
    isLoading: boolean;
    infoMelding: InfoMelding | null;
};

type InfoMelding = {
    type: "info" | "error" | "warning";
    melding: string;
};

type EksisterendeSakSjekkGrunnlag = {
    partISaken: EksisterendeSakSjekkParams["partISaken"];
    motpart: EksisterendeSakSjekkParams["motpart"];
    erEktefellebidrag?: boolean;
    skalHente: boolean;
    isLoading: boolean;
    error: unknown;
    sakForPartISaken: BidragssakDto[] | undefined;
};

/**
 * Ren funksjon som utleder resultatet av useEksisterendeSakSjekk fra rådata
 * (query-status og saker). Trukket ut fra hooken slik at logikken kan
 * enhetstestes uten React-rendering, se useEksisterendeSakSjekk.test.ts.
 */
export function beregnEksisterendeSakSjekk({
    partISaken,
    motpart,
    erEktefellebidrag,
    skalHente,
    isLoading,
    error,
    sakForPartISaken,
}: EksisterendeSakSjekkGrunnlag): Omit<EksisterendeSakSjekkResult, "isLoading"> {
    const ingenTreff = { harEksisterendeSak: false, eksisterendeSak: null, infoMelding: null };

    if (!skalHente) {
        return ingenTreff;
    }

    if (error) {
        return {
            ...ingenTreff,
            infoMelding:
                error instanceof TilgangsFeilError
                    ? { type: "error", melding: error.message }
                    : { type: "warning", melding: "Feil ved henting av eksisterende sak. Kontakt support." },
        };
    }

    if (isLoading) {
        return ingenTreff;
    }

    if (!sakForPartISaken || sakForPartISaken.length === 0) {
        return {
            ...ingenTreff,
            infoMelding: {
                type: "info",
                melding: `Ingen eksisterende sak funnet for ${partISaken.navn} (${partISaken.ident}). Du kan opprette en ny sak.`,
            },
        };
    }

    const partISakenRolle = partISaken.rolle === "bidragspliktig" ? "BP" : "BM";
    const motpartRolle = motpart.rolle === "bidragspliktig" ? "BP" : "BM";
    const harUkjentMotpart = motpart?.erKjent === false;

    if (harUkjentMotpart) {
        const sakerMedUkjentMotpart = sakForPartISaken
            .filter((sak) => {
                const harPartISaken = sak.roller.some(
                    (rolle) => rolle.fodselsnummer === partISaken.ident && rolle.type === partISakenRolle,
                );
                const harMotpart = sak.roller.some((rolle) => rolle.type === motpartRolle);

                return harPartISaken && !harMotpart;
            })
            .map((sak) => sak.saksnummer);

        if (sakerMedUkjentMotpart.length === 0) {
            return ingenTreff;
        }

        const sakstekst =
            sakerMedUkjentMotpart.length === 1
                ? `sak ${sakerMedUkjentMotpart[0]}`
                : `sakene ${sakerMedUkjentMotpart.join(", ")}`;

        return {
            ...ingenTreff,
            infoMelding: {
                type: "warning",
                melding: `Det finnes allerede ${sakstekst} hvor ${partISaken.navn} er registrert som ${partISakenRolle} uten motpart. Vurder om denne nye saken skal opprettes.`,
            },
        };
    }

    const funnetSak = sakForPartISaken.find((sak) => {
        const partISakenRolleISak = sak.roller.find(
            (rolle) => rolle.fodselsnummer === partISaken.ident && rolle.type === partISakenRolle,
        );
        const motpartRolleISak = sak.roller.find(
            (rolle) => rolle.fodselsnummer === motpart.ident && rolle.type === motpartRolle,
        );

        const harBeggeRoller = !!partISakenRolleISak && !!motpartRolleISak;
        const harBarn = sak.roller.some((rolle) => rolle.type === "BA");

        if (erEktefellebidrag) {
            return harBeggeRoller && !harBarn;
        }

        return harBeggeRoller && harBarn;
    });

    if (!funnetSak) {
        return {
            ...ingenTreff,
            infoMelding: {
                type: "info",
                melding: "Ingen sak funnet mellom disse to partene med samme roller. Du kan opprette en ny sak.",
            },
        };
    }

    return { harEksisterendeSak: true, eksisterendeSak: funnetSak, infoMelding: null };
}

/**
 * Hook for å sjekke om det finnes en eksisterende sak mellom to parter med samme roller
 *
 * Brukes i alle flyts: ForelderMedBarn, ForelderUtenBarn, BarnBeggForeldre, BarnMedManglendeForeldre
 *
 * @example
 * ```typescript
 * const { harEksisterendeSak, eksisterendeSak, isLoading } = useEksisterendeSakSjekk({
 *     partISaken: { ident: "12345678910", rolle: "bidragspliktig" },
 *     motpart: { ident: "10987654321", rolle: "bidragsmottaker", erKjent: true }
 * });
 *
 * if (harEksisterendeSak) {
 *     console.log("Eksisterende sak funnet:", eksisterendeSak.saksnummer);
 * }
 * ```
 */
export function useEksisterendeSakSjekk({
    partISaken,
    motpart,
    erEktefellebidrag,
}: EksisterendeSakSjekkParams): EksisterendeSakSjekkResult {
    const partISakenOppgitt = !!partISaken?.ident?.trim();
    const harMotpartEllerUkjent = typeof motpart?.erKjent === "boolean";
    const skalHente = partISakenOppgitt && harMotpartEllerUkjent;

    const { data: sakForPartISaken, isLoading, error } = useHentSakForPerson(partISaken?.ident || "", skalHente);

    const { harEksisterendeSak, eksisterendeSak, infoMelding } = useMemo(
        () =>
            beregnEksisterendeSakSjekk({
                partISaken,
                motpart,
                erEktefellebidrag,
                skalHente,
                isLoading,
                error,
                sakForPartISaken,
            }),
        [partISaken, motpart, erEktefellebidrag, skalHente, isLoading, error, sakForPartISaken],
    );

    return {
        harEksisterendeSak,
        eksisterendeSak,
        isLoading,
        infoMelding,
    };
}
