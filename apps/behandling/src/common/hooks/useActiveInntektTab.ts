import { type InntekterDtoRolle, Rolletype } from "@bidrag/api/BidragBehandlingApiV1";
import { useMemo } from "react";
import { useSearchParams } from "react-router";
import urlSearchParams from "../constants/behandlingQueryKeys";

export const useActiveInntektTab = (inntektRoller: InntekterDtoRolle[]) => {
    const [searchParams] = useSearchParams();
    const tabParam = searchParams.get(urlSearchParams.tab);

    const defaultRolle = useMemo(
        () => inntektRoller.find((r) => r.gjelder.rolletype === Rolletype.BM) ?? inntektRoller[0],
        [inntektRoller],
    );

    const selectedRolle = useMemo(() => {
        if (tabParam && inntektRoller.some((r) => r.gjelder.id.toString() === tabParam)) {
            return inntektRoller.find((r) => r.gjelder.id === Number(tabParam)) ?? defaultRolle;
        }
        return defaultRolle;
    }, [tabParam, inntektRoller, defaultRolle]);

    const defaultTab = defaultRolle?.gjelder?.id?.toString();
    const selectedTab = selectedRolle?.gjelder?.id?.toString() ?? defaultTab;

    return { selectedRolle, selectedTab, defaultTab };
};
