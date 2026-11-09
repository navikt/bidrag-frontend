import { BIDRAG_PERSON_API } from "@bidrag/api";
import { SecureLoggerService } from "@bidrag/common";
import { useQueries } from "@tanstack/react-query";
import { harAnnenRegistrertForelder } from "../../felles/relasjon/annen-forelder.ts";
import { harUfullstendigRelasjon, registrerteForeldre } from "../beregninger/ufullstendig-relasjon.ts";

/**
 * Kontrollerer relasjonen mellom nye barn og partene.
 * Mangler BP eller BM, regnes alle barna som ufullstendige. Feilet oppslag er ikke ufullstendig, men stopper lagring.
 */
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
    barnMedAnnenForelder: string[];
    harOppslagsfeil: boolean;
    isLoading: boolean;
} {
    const aktivtOppslag = harSak && Boolean(bidragsmottakerIdent || bidragspliktigIdent);

    const relasjonsoppslag = useQueries({
        queries: barnIdenter.map((ident) => ({
            queryKey: ["hent_forelder_barn_relasjon", ident, bidragsmottakerIdent, bidragspliktigIdent],
            queryFn: async () => {
                const { data } = await BIDRAG_PERSON_API.forelderbarnrelasjon.hentForelderBarnRelasjon1({ ident });
                await SecureLoggerService.info(`Hentet forelder-barn relasjon for ident ${ident}`);
                return data;
            },
            enabled: aktivtOppslag,
        })),
    });

    const barnMedAnnenForelder = !aktivtOppslag
        ? []
        : barnIdenter.filter((_, i) => {
              const relasjon = relasjonsoppslag[i]?.data;
              return (
                  relasjon !== undefined &&
                  harAnnenRegistrertForelder(registrerteForeldre(relasjon), [bidragspliktigIdent, bidragsmottakerIdent])
              );
          });

    const barnMedUfullstendigRelasjon = !harSak
        ? []
        : !bidragsmottakerIdent || !bidragspliktigIdent
          ? barnIdenter.filter((ident) => !barnMedAnnenForelder.includes(ident))
          : barnIdenter.filter((ident, i) => {
                const relasjon = relasjonsoppslag[i]?.data;
                return (
                    relasjon !== undefined &&
                    !barnMedAnnenForelder.includes(ident) &&
                    harUfullstendigRelasjon(relasjon, bidragsmottakerIdent, bidragspliktigIdent)
                );
            });

    return {
        barnMedUfullstendigRelasjon,
        barnMedAnnenForelder,
        harOppslagsfeil: aktivtOppslag && relasjonsoppslag.some((resultat) => resultat.isError),
        isLoading: aktivtOppslag && relasjonsoppslag.some((resultat) => resultat.isFetching),
    };
}
