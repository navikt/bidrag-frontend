import { Button, HStack } from "@navikt/ds-react";
import type React from "react";

import { AdminPanel } from "../../../barnebidrag/admin/AdminPanel";
import { useBehandlingProvider } from "../../context/BehandlingContext";
import useFeatureToggle from "../../hooks/useFeatureToggle";

export interface FloatingBottomToolbarTab {
    id: string;
    label?: string;
}

interface FloatingBottomToolbarProps {
    BrukerveiledningKnapper: () => React.ReactNode;
}

/**
 * Floating bottom toolbar component that stays visible while scrolling.
 * Shows action buttons on the left and navigation controls on the right.
 *
 * @param onNext - Callback function for the next step button
 * @param tabs - Optional array of tab objects for multi-person navigation
 * @param currentTabId - Current active tab ID
 */
export const FloatingBottomToolbar = ({ BrukerveiledningKnapper }: FloatingBottomToolbarProps) => {
    // const { onNavigateToTab } = useBehandlingProvider();
    const { nyToolbar, isAdminEnabled } = useFeatureToggle();
    const {
        onStepChange,
        activeStep,
        getNextStep,
        getPreviousStep,
        // pageTabs: tabs,
        // currentTab,
    } = useBehandlingProvider();

    // const onNextPerson = () => {
    //     if (!tabs || tabs.length <= 1 || !currentTab) return;

    //     const currentIndex = tabs.findIndex((tab) => tab.id.toString() === currentTab.id.toString());
    //     const nextIndex = (currentIndex + 1) % tabs.length;
    //     const nextTabId = tabs[nextIndex].id;

    //     console.log("Navigating to next tab:", nextTabId, currentTab);
    //     onNavigateToTab(nextTabId.toString());
    // };

    // const hasMultipleTabs = tabs && tabs.length > 1;

    const nextStepAvailable = getNextStep(activeStep) !== undefined;
    const previousStepAvailable = getPreviousStep(activeStep) !== undefined;

    if (nyToolbar === false) {
        return null;
    }
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[white] border-t border-solid border-ax-neutral-300 p-2 z-40">
            <div className="relative m-auto max-w-[1272px] min-[1440px]:max-w-[1920px] w-full min-h-8 flex items-center justify-center">
                <AdminPanel />

                <HStack gap="space-2" align="center" className={`mx-auto ${isAdminEnabled ? "ml-[10%]" : "ml-[20%]"}`}>
                    {previousStepAvailable ? (
                        <PreviousStepButton onPrevious={() => onStepChange(getPreviousStep(activeStep))} />
                    ) : (
                        <div className="w-[141px]"></div>
                    )}
                    {nextStepAvailable && <NextStepButton onNext={() => onStepChange(getNextStep(activeStep))} />}
                    {/* {hasMultipleTabs && <NextPersonButton onClick={onNextPerson} />} */}
                </HStack>
                <div className="absolute right-0 top-1/2 -translate-y-1/2">{<BrukerveiledningKnapper />}</div>
            </div>
        </div>
    );
};

interface PreviousStepButtonProps {
    onPrevious: () => void;
}

const PreviousStepButton = ({ onPrevious }: PreviousStepButtonProps) => {
    return (
        <Button
            type="button"
            onClick={onPrevious}
            variant="tertiary"
            iconPosition="right"
            className="w-max"
            size="small"
        >
            Gå til forrige steg
        </Button>
    );
};

interface NextStepButtonProps {
    onNext: () => void;
}

const NextStepButton = ({ onNext }: NextStepButtonProps) => {
    return (
        <Button type="button" onClick={onNext} variant="primary" iconPosition="right" className="w-max" size="small">
            Gå til neste steg
        </Button>
    );
};

// interface NextPersonButtonProps {
//     onClick: () => void;
// }

// const NextPersonButton = ({ onClick }: NextPersonButtonProps) => {
//     return (
//         <Button type="button" onClick={onClick} variant="secondary" className="w-max" size="small">
//             Neste person
//         </Button>
//     );
// };

export default FloatingBottomToolbar;
