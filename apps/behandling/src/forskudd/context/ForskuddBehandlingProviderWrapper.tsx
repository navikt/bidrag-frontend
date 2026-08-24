import { Vedtakstype } from "@bidrag/api/BidragBehandlingApiV1";
import React, { type PropsWithChildren, useState } from "react";
import { useParams } from "react-router";
import text from "../../common/constants/texts";
import { BehandlingProvider } from "../../common/context/BehandlingContext";
import { useBehandlingV2 } from "../../common/hooks/useApiData";
import type { InntektTables } from "../../common/types/inntektTableTypes";

import { STEPS as ForskuddSteps, STEPS } from "../constants/steps";
import { ForskuddStepper } from "../enum/ForskuddStepper";

type HusstandsbarnTables = "andreVoksneIHusstanden" | "sivilstand" | "newBarn" | `husstandsmedlem.${string}`;

export type PageErrorsOrUnsavedState = {
    virkningstidspunkt: { error: boolean };
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

function ForskuddBehandlingProviderWrapper({ children }: PropsWithChildren) {
    const { behandlingId, vedtakId } = useParams<{
        behandlingId?: string;
        vedtakId?: string;
    }>();
    const behandling = useBehandlingV2(behandlingId, vedtakId);
    const [pageErrorsOrUnsavedState, setPageErrorsOrUnsavedState] = useState<PageErrorsOrUnsavedState>({
        virkningstidspunkt: { error: false },
        boforhold: { error: false },
        inntekt: { error: false },
    });
    const formSteps = { defaultStep: ForskuddStepper.VIRKNINGSTIDSPUNKT, steps: ForskuddSteps };

    function getPageErrorTexts(): { title: string; description: string } {
        if (pageErrorsOrUnsavedState.virkningstidspunkt.error) {
            return {
                title: "Det er ikke lagt inn dato på virkningstidspunkt",
                description: "Hvis det ikke settes inn en dato vil virkningsdatoen settes til forrige lagrede dato",
            };
        } else {
            return {
                title: text.varsel.statusIkkeLagret,
                description: text.varsel.statusIkkeLagretDescription,
            };
        }
    }

    const sideMenu = [
        {
            step: ForskuddStepper.VIRKNINGSTIDSPUNKT,
            visible: true,
            interactive: true,
        },
        {
            step: ForskuddStepper.BOFORHOLD,
            visible: true,
            interactive:
                !behandling.virkningstidspunktV3.erAvslagForAlle && behandling.vedtakstype !== Vedtakstype.OPPHOR,
        },
        {
            step: ForskuddStepper.INNTEKT,
            visible: true,
            interactive:
                !behandling.virkningstidspunktV3.erAvslagForAlle && behandling.vedtakstype !== Vedtakstype.OPPHOR,
        },
        {
            step: ForskuddStepper.VEDTAK,
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
            JSON.stringify(sideMenu),
            behandling.virkningstidspunktV3.erAvslagForAlle,
            behandling.vedtakstype,
        ],
    );

    return <BehandlingProvider props={value}>{children}</BehandlingProvider>;
}

export { ForskuddBehandlingProviderWrapper };
