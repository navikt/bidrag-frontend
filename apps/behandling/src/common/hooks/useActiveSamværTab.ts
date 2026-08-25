import type { SamvaerBarnDto } from "@bidrag/api/BidragBehandlingApiV1";
import { useMemo } from "react";
import { useSearchParams } from "react-router";
import urlSearchParams from "../constants/behandlingQueryKeys";

export const useActiveSamværTab = (samværBarn: SamvaerBarnDto[]) => {
    const [searchParams] = useSearchParams();
    const tabParam = searchParams.get(urlSearchParams.tab);

    const defaultBarn = samværBarn[0];

    const selectedBarn = useMemo(() => {
        if (tabParam && samværBarn.some((b) => b.id.toString() === tabParam)) {
            return samværBarn.find((b) => b.id === Number(tabParam)) ?? defaultBarn;
        }
        return defaultBarn;
    }, [tabParam, samværBarn, defaultBarn]);

    const defaultTab = defaultBarn?.id?.toString();
    const selectedTab = selectedBarn?.id?.toString() ?? defaultTab;

    return { selectedBarn, selectedTab, defaultTab };
};
