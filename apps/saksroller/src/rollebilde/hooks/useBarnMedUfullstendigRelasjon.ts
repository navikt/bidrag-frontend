import { BIDRAG_PERSON_API } from "@bidrag/api";
import { SecureLoggerService } from "@bidrag/common";
import { useQueries } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { harAnnenRegistrertForelder } from "../../felles/relasjon/annen-forelder.ts";
import { harUfullstendigRelasjon, registrerteForeldre } from "../beregninger/ufullstendig-relasjon.ts";

/**
 * Kontrollerer relasjonen mellom barna og partene.
 * Mangler BP eller BM, regnes alle barna som ufullstendige. Feilet oppslag regnes ikke som ufullstendig, men sperrer videre valg.
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
    barnMedOppslagsfeil: string[];
    barnMedInnloggingsfeil: string[];
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
            retry: (failureCount: number, error: unknown) =>
                !(error instanceof AxiosError && error.response?.status === 401) && failureCount < 3,
            enabled: aktivtOppslag,
        })),
    });

    const barnMedAnnenForelder = !aktivtOppslag
        ? []
        : barnIdenter.filter((_, i) => {
              if (relasjonsoppslag[i]?.isError) return false;
              const relasjon = relasjonsoppslag[i]?.data;
              return (
                  relasjon !== undefined &&
                  harAnnenRegistrertForelder(registrerteForeldre(relasjon), [bidragspliktigIdent, bidragsmottakerIdent])
              );
          });

    const barnMedUfullstendigRelasjon = !harSak
        ? []
        : !bidragsmottakerIdent || !bidragspliktigIdent
          ? barnIdenter.filter((ident, i) => !relasjonsoppslag[i]?.isError && !barnMedAnnenForelder.includes(ident))
          : barnIdenter.filter((ident, i) => {
                if (relasjonsoppslag[i]?.isError) return false;
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
        barnMedOppslagsfeil: aktivtOppslag
            ? barnIdenter.filter((_, i) => {
                  const resultat = relasjonsoppslag[i];
                  return (
                      resultat?.isError &&
                      !(resultat.error instanceof AxiosError && resultat.error.response?.status === 401)
                  );
              })
            : [],
        barnMedInnloggingsfeil: aktivtOppslag
            ? barnIdenter.filter((_, i) => {
                  const resultat = relasjonsoppslag[i];
                  return (
                      resultat?.isError &&
                      resultat.error instanceof AxiosError &&
                      resultat.error.response?.status === 401
                  );
              })
            : [],
        isLoading: aktivtOppslag && relasjonsoppslag.some((resultat) => resultat.isFetching),
    };
}
