import { useMemo } from "react";
import { useHentSakForPerson } from "~/api/useApi.ts";
import type { ForelderPartRolle } from "../opprett-sak-schema";
import { beregnEksisterendeSakSjekk } from "./eksisterende-sak-utils.ts";

type Params = {
    partISaken: { ident: string; navn: string; erKjent: boolean | undefined; rolle: ForelderPartRolle | string };
    motpart: { ident: string; rolle: ForelderPartRolle | string; erKjent: boolean | undefined; navn: string };
    erEktefellebidrag?: boolean;
};

export function useEksisterendeSakSjekk({ partISaken, motpart, erEktefellebidrag }: Params) {
    const skalHente = !!partISaken?.ident?.trim() && typeof motpart?.erKjent === "boolean";
    const { data: sakForPartISaken, isLoading, error } = useHentSakForPerson(partISaken?.ident || "", skalHente);
    const resultat = useMemo(
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
    return { ...resultat, isLoading };
}
