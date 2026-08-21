import type { RolleDto } from "@bidrag/api/BidragBehandlingApiV1";
import { getFomAndTomForMonthPicker } from "../helpers/virkningstidspunktHelpers";
import { useGetBehandlingV2 } from "./useApiData";
import { useVirkningsdato } from "./useVirkningsdato";

const getLatestBeregnTilDato = (roller: RolleDto[]) => {
    return roller
        .filter((r) => r.beregnTilDato)
        .reduce(
            (oldest: Date | null, r) => {
                const date = new Date(r.beregnTilDato);
                return !oldest || date > oldest ? date : oldest;
            },
            null as Date | null,
        );
};

export const useFomTomDato = (_isDatepickerTom: boolean, datoFra?: Date, gjelderRolleId?: number): [Date, Date] => {
    const { roller } = useGetBehandlingV2();
    const virkningsOrSoktFraDato = useVirkningsdato(gjelderRolleId);
    const rolle = roller.find((r) => r.id === gjelderRolleId);

    const senesteBeregnTil = getLatestBeregnTilDato(roller);

    const beregnTilDato = rolle?.beregnTilDato
        ? new Date(rolle.beregnTilDato)
        : senesteBeregnTil
          ? new Date(senesteBeregnTil)
          : undefined;

    const [fom, baselineTom] = getFomAndTomForMonthPicker(datoFra ?? virkningsOrSoktFraDato, beregnTilDato);

    return [fom, baselineTom];
};
