import { BIDRAG_PERSON_API } from "@bidrag/api";
import { SecureLoggerService } from "@bidrag/common";
import { useQueries } from "@tanstack/react-query";
import { harUfullstendigRelasjon } from "../beregninger/ufullstendig-relasjon.ts";

export function useBarnMedUfullstendigRelasjon({
    barnIdenter,
    bidragsmottakerIdent,
    bidragspliktigIdent,
    harSak,
}: {
    barnIdenter: string[];
    bidragsmottakerIdent?: string;
    bidragspliktigIdent?: string;
    harSak: boolean;
}): {
    barnMedUfullstendigRelasjon: string[];
    isLoading: boolean;
    isError: boolean;
} {
    const beggeForeldreKjent = Boolean(bidragsmottakerIdent && bidragspliktigIdent);

    const relasjonsoppslag = useQueries({
        queries: barnIdenter.map((ident) => ({
            queryKey: ["hent_forelder_barn_relasjon", ident, bidragsmottakerIdent, bidragspliktigIdent],
            queryFn: async () => {
                const { data } = await BIDRAG_PERSON_API.forelderbarnrelasjon.hentForelderBarnRelasjon1({ ident });
                await SecureLoggerService.info(`Hentet forelder-barn relasjon for ident ${ident}`);
                return data;
            },
            enabled: harSak && beggeForeldreKjent,
        })),
    });

    const barnMedUfullstendigRelasjon = !harSak
        ? []
        : !bidragsmottakerIdent || !bidragspliktigIdent
          ? barnIdenter
          : barnIdenter.filter((_, i) => {
                const relasjon = relasjonsoppslag[i]?.data;
                return (
                    relasjon !== undefined &&
                    harUfullstendigRelasjon(relasjon, bidragsmottakerIdent, bidragspliktigIdent)
                );
            });

    const aktivtOppslag = harSak && beggeForeldreKjent;

    return {
        barnMedUfullstendigRelasjon,
        isLoading: aktivtOppslag && relasjonsoppslag.some((resultat) => resultat.isFetching),
        isError: aktivtOppslag && relasjonsoppslag.some((resultat) => resultat.isError),
    };
}
