import { Vedtakstype } from "@bidrag/api/BidragBehandlingApiV1";
import React, { type PropsWithChildren, useState } from "react";
import { useParams } from "react-router";
import text from "../../common/constants/texts";
import { BehandlingProvider } from "../../common/context/BehandlingContext";
import { useBehandlingV2 } from "../../common/hooks/useApiData";

import { STEPS, STEPS as SærligeutgifterSteps } from "../constants/steps";
import { SærligeutgifterStepper } from "../enum/SærligeutgifterStepper";

export type InntektTables =
    | `småbarnstillegg.${string}`
    | `utvidetBarnetrygd.${string}`
    | `årsinntekter.${string}`
    | `barnetillegg.${string}`
    | `kontantstøtte.${string}`;

type HusstandsbarnTables = "andreVoksneIHusstanden" | "sivilstand" | "newBarn" | `husstandsmedlem.${string}`;

export type PageErrorsOrUnsavedState = {
    utgifter: {
        error: boolean;
        openFields?: {
            utgifterList: boolean;
        };
    };
    boforhold: {
        error: boolean;
        openFields?: { [_key in HusstandsbarnTables]: boolean };
    };
    inntekt: {
        error: boolean;
        openFields?: {
            [_key in InntektTables]: boolean;
        };
    };
};

function SærligeugifterProviderWrapper({ children }: PropsWithChildren) {
    const { behandlingId, vedtakId } = useParams<{
        behandlingId?: string;
        vedtakId?: string;
    }>();
    const behandling = useBehandlingV2(behandlingId, vedtakId);
    const [pageErrorsOrUnsavedState, setPageErrorsOrUnsavedState] = useState<PageErrorsOrUnsavedState>({
        utgifter: { error: false },
        boforhold: { error: false },
        inntekt: { error: false },
    });
    const formSteps = { defaultStep: SærligeutgifterStepper.UTGIFT, steps: SærligeutgifterSteps };

    function getPageErrorTexts(): { title: string; description: string } {
        return {
            title: text.varsel.statusIkkeLagret,
            description: text.varsel.statusIkkeLagretDescription,
        };
    }

    const sideMenu = [
        {
            step: SærligeutgifterStepper.UTGIFT,
            visible: true,
            interactive: true,
        },
        {
            step: SærligeutgifterStepper.INNTEKT,
            visible: true,
            interactive:
                behandling.vedtakstype !== Vedtakstype.OPPHOR &&
                (behandling.utgift.avslag === undefined || behandling.utgift.avslag === null),
        },
        {
            step: SærligeutgifterStepper.BOFORHOLD,
            visible: true,
            interactive:
                behandling.vedtakstype !== Vedtakstype.OPPHOR &&
                (behandling.utgift.avslag === undefined || behandling.utgift.avslag === null),
        },

        {
            step: SærligeutgifterStepper.VEDTAK,
            visible: true,
            interactive: true,
        },
    ];

    const value = React.useMemo(
        () => ({
            formSteps,
            getPageErrorTexts,
            pageErrorsOrUnsavedState,
            setPageErrorsOrUnsavedState,
            sideMenu,
            stepsIndex: STEPS,
        }),
        [
            JSON.stringify(pageErrorsOrUnsavedState),
            behandling.vedtakstype,
            behandling.utgift.avslag,
            JSON.stringify(sideMenu),
        ],
    );

    return <BehandlingProvider props={value}>{children}</BehandlingProvider>;
}

export { SærligeugifterProviderWrapper };
