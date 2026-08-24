import { useGetBehandlingV2 } from "../../common/hooks/useApiData";

export const useGetSamværMedBarn = () => {
    const {
        samværV2: samvær,
        virkningstidspunktV3: { erVirkningstidspunktLiktForAlle },
    } = useGetBehandlingV2();

    return {
        ...samvær,
        erSammeForAlle: erVirkningstidspunktLiktForAlle && samvær.erSammeForAlle,
        erVirkningSammeForAlle: erVirkningstidspunktLiktForAlle,
        barn: samvær.barn,
    };
};
