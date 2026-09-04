import { useSuspenseQuery } from "@tanstack/react-query";

import { useBidragTilgangskontrollApi } from "../api/api";

export default function useHarTilgangTilTemaFar() {
    const bidragTilgangskontrollApi = useBidragTilgangskontrollApi();
    return useSuspenseQuery({
        queryKey: ["tilgang", "FAR"],
        queryFn: async (): Promise<boolean> => {
            return (await bidragTilgangskontrollApi.v2.sjekkTilgangTema({ tema: "FAR" })).data?.harTilgang;
        },
        retry: 2,
    });
}
