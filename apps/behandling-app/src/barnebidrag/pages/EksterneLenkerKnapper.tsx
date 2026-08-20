import { LocalStorage } from "@bidrag/common";
import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Button } from "@navikt/ds-react";
import { useEffect, useState } from "react";

import elementIds from "../../common/constants/elementIds";
import { useBehandlingProvider } from "../../common/context/BehandlingContext";
import { useGetBehandlingV2 } from "../../common/hooks/useApiData";
import useFeatureToggle from "../../common/hooks/useFeatureToggle";
import environment from "../../environment";
import { BarnebidragStepper } from "../enum/BarnebidragStepper";

export default function EksterneLenkerKnapperFloating() {
    const { nyToolbar } = useFeatureToggle();

    if (nyToolbar) {
        return null;
    }
    return (
        <div className="agroup fixed bottom-0 right-0 p-2 flex items-end justify-end w-max h-0 flex-row gap-[5px]">
            <EksterneLenkerKnapperBidrag />
        </div>
    );
}
export function EksterneLenkerKnapperBidrag() {
    const nudgeEnabledName = "brukerveiledningShowNudge";
    const { activeStep } = useBehandlingProvider();
    const { erKlageEllerOmgjøring } = useGetBehandlingV2();
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
            case BarnebidragStepper.VIRKNINGSTIDSPUNKT:
                return elementIds.brukerveildning.tittel_virkningstidspunkt;
            case BarnebidragStepper.BOFORHOLD:
                return elementIds.brukerveildning.tittel_boforhold;
            case BarnebidragStepper.PRIVAT_AVTALE:
                return elementIds.brukerveildning.tittel_privat_avtale;
            case BarnebidragStepper.UNDERHOLDSKOSTNAD:
                return elementIds.brukerveildning.tittel_underholdskostnad;
            case BarnebidragStepper.GEBYR:
                return elementIds.brukerveildning.tittel_gebyr;
            case BarnebidragStepper.INNTEKT:
                return elementIds.brukerveildning.tittel_inntekt;
            case BarnebidragStepper.VEDTAK:
                return elementIds.brukerveildning.tittel_vedtak;
            case BarnebidragStepper.SAMVÆR:
                return elementIds.brukerveildning.tittel_samvær;
            case BarnebidragStepper.VEDTAK_ENDELIG:
                return elementIds.brukerveildning.tittel_vedtak;
            case BarnebidragStepper.KLAGEVEDTAK:
                return elementIds.brukerveildning.tittel_klagevedtak;
            default:
                return "";
        }
    }
    const url = erKlageEllerOmgjøring
        ? environment.url.bidragBrukerveiledningKlage
        : environment.url.bidragBrukerveiledning;
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
                    // faro.api.pushEvent("click.button.brukerveiledning", { type: TypeBehandling.BIDRAG });
                    window.open(url + "#" + renderHref(), "_blank");
                }}
            >
                Brukerveiledning
            </Button>
        </div>
    );
}
