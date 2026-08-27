import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useSearchParams } from "react-router";
import behandlingQueryKeys from "../../common/constants/behandlingQueryKeys";
import { useBehandlingProvider } from "../../common/context/BehandlingContext";
import type { VirkningstidspunktFormValues } from "../../common/types/virkningstidspunktFormValues";

export const useGetActiveAndDefaultVirkningstidspunktTab = () => {
    const { getValues } = useFormContext<VirkningstidspunktFormValues>();
    const { selectedRoller } = useBehandlingProvider();
    const roller = getValues("roller");
    const [searchParams] = useSearchParams();
    const selectedTab = searchParams.get(behandlingQueryKeys.tab);

    const rollerForValgtSak = useMemo(() => {
        const visibleIds = new Set(selectedRoller?.map((rolle) => rolle.id));
        if (visibleIds.size === 0) {
            return roller;
        }
        const filtered = roller?.filter(({ rolle }) => visibleIds.has(rolle?.id));
        return filtered?.length > 0 ? filtered : roller;
    }, [roller, selectedRoller]);

    // Førstevalgt barn (brukes når ingen er valgt, eller kun ett barn finnes).
    const defaultTab = useMemo(() => {
        return rollerForValgtSak?.[0]?.rolle?.id?.toString();
    }, [rollerForValgtSak]);

    const activeTab = useMemo(() => {
        const matchesCurrentRoller = rollerForValgtSak?.some(({ rolle }) => rolle?.id?.toString() === selectedTab);
        return matchesCurrentRoller ? selectedTab : defaultTab;
    }, [selectedTab, rollerForValgtSak, defaultTab]);

    return [activeTab, defaultTab];
};
