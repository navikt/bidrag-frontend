import { LocalStorage } from "@bidrag/common";
import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Button } from "@navikt/ds-react";
import { useEffect, useState } from "react";

import elementIds from "../../common/constants/elementIds";
import { useBehandlingProvider } from "../../common/context/BehandlingContext";
import useFeatureToggle from "../../common/hooks/useFeatureToggle";
import environment from "../../environment";
import { SærligeutgifterStepper } from "../enum/SærligeutgifterStepper";

export default function EksterneLenkerKnapperFloating() {
    const { nyToolbar } = useFeatureToggle();

    if (nyToolbar) {
        return null;
    }
    return (
        <div className="agroup fixed bottom-0 right-0 p-2 flex items-end justify-end w-max h-0 flex-row gap-[5px]">
            <BrukerveiledningKnappSærbidrag />
        </div>
    );
}
export function BrukerveiledningKnappSærbidrag() {
    const nudgeEnabledName = "brukerveiledningShowNudge";
    const { activeStep } = useBehandlingProvider();
    const [nudge, setNudge] = useState(LocalStorage.get(nudgeEnabledName) !== "false");

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setNudge(false);
            LocalStorage.set(nudgeEnabledName, "false");
        }, 5000);
        return () => clearTimeout(timeoutId);
    }, []);
    function renderHref() {
        switch (activeStep) {
            case SærligeutgifterStepper.BOFORHOLD:
                return elementIds.brukerveildning.tittel_boforhold;
            case SærligeutgifterStepper.INNTEKT:
                return elementIds.brukerveildning.tittel_inntekt;
            case SærligeutgifterStepper.VEDTAK:
                return elementIds.brukerveildning.tittel_vedtak;
            case SærligeutgifterStepper.UTGIFT:
                return elementIds.brukerveildning.tittel_utgift;
            default:
                return "";
        }
    }
    return (
        <div>
            <Button
                title="Brukerveiledning"
                variant="tertiary"
                className={`rounded-xl border-solid ${
                    nudge ? "animate-bounce border-[var(--ax-border-success)] border-[2px]" : "border"
                } `}
                size="xsmall"
                icon={<ExternalLinkIcon />}
                onClick={() => {
                    // faro.api.pushEvent("click.button.brukerveiledning", { type: TypeBehandling.SAeRBIDRAG });
                    window.open(environment.url.særbidragBrukerveiledning + "#" + renderHref(), "_blank");
                }}
            >
                Brukerveiledning
            </Button>
        </div>
    );
}
