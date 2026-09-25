import { BIDRAG_PERSON_API } from "@bidrag/api";
import { SecureLoggerService } from "@bidrag/common";
import { useQueries } from "@tanstack/react-query";
import { harUfullstendigRelasjon } from "./ufullstendig-relasjon-utils.ts";

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
}): string[] {
    const beggeForeldreKjent = Boolean(bidragsmottakerIdent && bidragspliktigIdent);

    return useQueries({
        queries: barnIdenter.map((ident) => ({
            queryKey: ["hent_forelder_barn_relasjon", ident],
            queryFn: async () => {
                const { data } = await BIDRAG_PERSON_API.forelderbarnrelasjon.hentForelderBarnRelasjon1({ ident });
                await SecureLoggerService.info(`Hentet forelder-barn relasjon for ident ${ident}`);
                return data;
            },
            enabled: harSak && beggeForeldreKjent,
        })),
        combine: (resultater) => {
            if (!harSak) return [];
            if (!bidragsmottakerIdent || !bidragspliktigIdent) return barnIdenter;
            return barnIdenter.filter((_, i) => {
                const relasjon = resultater[i]?.data;
                return (
                    relasjon !== undefined &&
                    harUfullstendigRelasjon(relasjon, bidragsmottakerIdent, bidragspliktigIdent)
                );
            });
        },
    });
}
