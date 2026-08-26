import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useSearchParams } from "react-router";
import behandlingQueryKeys from "../../common/constants/behandlingQueryKeys";
import type { VirkningstidspunktFormValues } from "../../common/types/virkningstidspunktFormValues";

export const useGetActiveAndDefaultVirkningstidspunktTab = () => {
    const { getValues } = useFormContext<VirkningstidspunktFormValues>();
    const roller = getValues("roller");
    const [searchParams] = useSearchParams();
    const selectedTab = searchParams.get(behandlingQueryKeys.tab);

    const defaultTab = useMemo(() => {
        if (selectedTab) {
            return selectedTab;
        }
        return roller?.[0]?.rolle?.id?.toString();
    }, [selectedTab, roller]);

    const activeTab = selectedTab ?? defaultTab;

    return [activeTab, defaultTab];
};
