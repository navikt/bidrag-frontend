import { useMemo } from "react";
import { dateOrNull } from "../../utils/date-utils";
import { useGetBehandlingV2 } from "./useApiData";

export const useVirkningsdato = (gjelderRolleId?: number) => {
    const { søktFomDato, virkningstidspunktV3: virkningstidspunkt, roller } = useGetBehandlingV2();
    const beregnFraDato = roller.find((rolle) => rolle.id === gjelderRolleId)?.beregnFraDato;
    const virkningsdato = useMemo(() => {
        const barnsBergneFraDatoOrEldsteVirkningsdato = gjelderRolleId
            ? beregnFraDato
            : virkningstidspunkt.eldsteVirkningstidspunkt;
        return dateOrNull(barnsBergneFraDatoOrEldsteVirkningsdato) ?? dateOrNull(søktFomDato);
    }, [gjelderRolleId, virkningstidspunkt.eldsteVirkningstidspunkt, søktFomDato, beregnFraDato]);

    return virkningsdato;
};
