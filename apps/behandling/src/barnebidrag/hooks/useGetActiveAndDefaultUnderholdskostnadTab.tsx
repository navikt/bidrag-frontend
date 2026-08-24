import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useSearchParams } from "react-router";
import behandlingQueryKeys, { toUnderholdskostnadTabQueryParameter } from "../../common/constants/behandlingQueryKeys";

import type { UnderholdskostnadFormValues } from "../types/underholdskostnadFormValues";

type UnderholdTabCandidate = {
    id: number;
    gjelderBarn: {
        id?: number;
    };
};

export const useGetActiveAndDefaultUnderholdskostnadTab = (visibleUnderholdskostnader?: UnderholdTabCandidate[]) => {
    const { getValues } = useFormContext<UnderholdskostnadFormValues>();
    const søknadsBarnUnderholdskostnader = getValues("underholdskostnaderMedIBehandling");
    const [searchParams] = useSearchParams();
    const selectedTab = searchParams.get(behandlingQueryKeys.tab);
    const visibleTabs = visibleUnderholdskostnader ?? søknadsBarnUnderholdskostnader;

    const defaultTab = useMemo(() => {
        if (selectedTab) {
            const isValidSpecificTab = visibleTabs.some(
                (tab) => toUnderholdskostnadTabQueryParameter(tab.gjelderBarn.id, tab.id, true) === selectedTab,
            );
            const isGenericTab = selectedTab === "underholdskostnaderAndreBarn";

            if (isValidSpecificTab || isGenericTab) {
                return selectedTab;
            }
        }

        const firstTab = visibleTabs[0];
        return toUnderholdskostnadTabQueryParameter(firstTab?.gjelderBarn?.id, firstTab?.id, true);
    }, [selectedTab, visibleTabs]);

    const activeTab = selectedTab ?? defaultTab;

    return [activeTab, defaultTab];
};
