import { Vedtakstype } from "@bidrag/api/BidragBehandlingApiV1";
import React, { type PropsWithChildren, useRef, useState } from "react";
import { useParams } from "react-router";
import text from "../../common/constants/texts";
import { BehandlingProvider } from "../../common/context/BehandlingContext";
import { useBehandlingV2 } from "../../common/hooks/useApiData";
import useFeatureToogle from "../../common/hooks/useFeatureToggle";

import { STEPS as BarnebidragSteps, STEPS } from "../constants/steps";
import { BarnebidragStepper } from "../enum/BarnebidragStepper";

export type InntektTables =
    | `småbarnstillegg.${string}`
    | `utvidetBarnetrygd.${string}`
    | `årsinntekter.${string}`
    | `barnetillegg.${string}`
    | `kontantstøtte.${string}`;

export type UnderholdskostnadTables =
    | `underholdskostnaderMedIBehandling.${number}.stønadTilBarnetilsyn`
    | `underholdskostnaderMedIBehandling.${number}.faktiskTilsynsutgift`
    | `underholdskostnaderMedIBehandling.${number}.tilleggsstønad`
    | `underholdskostnaderAndreBarn.${number}.faktiskTilsynsutgift`;

type HusstandsbarnTables = "andreVoksneIHusstanden" | "sivilstand" | "newBarn" | `husstandsmedlem.${string}`;

export type BarnebidragPageErrorsOrUnsavedState = {
    boforhold: {
        error: boolean;
        openFields?: {
            [_key in HusstandsbarnTables]: boolean;
        };
    };
    samvær: {
        error: boolean;
        openFields?: boolean;
    };
    inntekt: {
        error: boolean;
        openFields?: {
            [_key in InntektTables]: boolean;
        };
    };
    underholdskostnad: {
        error: boolean;
        openFields?: {
            [_key: UnderholdskostnadTables]: boolean;
        };
    };
    privatAvtale: {
        error: boolean;
        openFields?: boolean;
    };
};

function BarnebidragProviderWrapper({ children }: PropsWithChildren) {
    const { isBidragV2Enabled } = useFeatureToogle();
    const { behandlingId, vedtakId } = useParams<{
        behandlingId?: string;
        vedtakId?: string;
    }>();
    const behandling = useBehandlingV2(behandlingId, vedtakId);
    const gebyrRef = useRef(behandling.gebyrV3);
    const [pageErrorsOrUnsavedState, setPageErrorsOrUnsavedState] = useState<BarnebidragPageErrorsOrUnsavedState>({
        underholdskostnad: { error: false },
        boforhold: { error: false },
        samvær: { error: false },
        inntekt: { error: false },
        privatAvtale: { error: false },
    });
    const [vurderSeparatSamværPerSak, setVurderSeparatSamværPerSak] = useState<Record<string, boolean>>(() => {
        const perSak = behandling.samværV2?.erSammeForAlleSaker ?? [];
        const barn = behandling.samværV2?.barn ?? [];
        const saksnummerListe = new Set([
            ...perSak.map((sak) => sak.saksnummer),
            ...barn.map((b) => b.barn.saksnummer),
        ]);
        const result: Record<string, boolean> = {};
        for (const saksnummer of saksnummerListe) {
            const sak = perSak.find((s) => s.saksnummer === saksnummer);
            result[saksnummer] = sak ? !sak.erLikForAlle : !behandling.samværV2?.erSammeForAlle;
        }
        return result;
    });
    const [vurderSeparatVirkningstidspunktPerSak, setVurderSeparatVirkningstidspunktPerSak] = useState<
        Record<string, boolean>
    >(() => {
        const perSak = behandling.virkningstidspunktV3?.erLikForAlleBasertPåSak ?? [];
        const barn = behandling.virkningstidspunktV3?.barn ?? [];
        const saksnummerListe = new Set([
            ...perSak.map((sak) => sak.saksnummer),
            ...barn.map((b) => b.rolle.saksnummer),
        ]);
        const result: Record<string, boolean> = {};
        for (const saksnummer of saksnummerListe) {
            const sak = perSak.find((s) => s.saksnummer === saksnummer);
            result[saksnummer] = sak ? !sak.erLikForAlle : !behandling.virkningstidspunktV3?.erLikForAlle;
        }
        return result;
    });
    const formSteps = { defaultStep: BarnebidragStepper.VIRKNINGSTIDSPUNKT, steps: BarnebidragSteps };

    const erAvvist = behandling.lesemodus?.erAvvist || false;
    const orkestrertVedtak =
        behandling.lesemodus != null ? behandling.lesemodus.erOrkestrertVedtak : behandling.erKlageEllerOmgjøring;
    const sideMenu = [
        {
            step: BarnebidragStepper.VIRKNINGSTIDSPUNKT,
            visible:
                !(
                    behandling.vedtakstype === Vedtakstype.ALDERSJUSTERING &&
                    behandling.lesemodus &&
                    behandling.lesemodus?.opprettetAvBatch &&
                    (behandling.erVedtakUtenBeregning || !behandling.erBisysVedtak)
                ) && behandling.vedtakstype !== Vedtakstype.INDEKSREGULERING,
            interactive: true,
        },
        {
            step: BarnebidragStepper.PRIVAT_AVTALE,
            visible:
                isBidragV2Enabled &&
                behandling.vedtakstype !== Vedtakstype.ALDERSJUSTERING &&
                !(behandling.erVedtakUtenBeregning && behandling.lesemodus) &&
                !erAvvist,
            interactive:
                !behandling.erBisysVedtak &&
                !behandling.virkningstidspunktV3?.erAvslagForAlle &&
                behandling.vedtakstype !== Vedtakstype.OPPHOR,
        },
        {
            step: BarnebidragStepper.UNDERHOLDSKOSTNAD,
            visible:
                behandling.vedtakstype !== Vedtakstype.INNKREVING &&
                !(
                    behandling.erVedtakUtenBeregning &&
                    behandling.lesemodus &&
                    behandling.vedtakstype !== Vedtakstype.ALDERSJUSTERING
                ) &&
                !(
                    behandling.vedtakstype === Vedtakstype.ALDERSJUSTERING &&
                    behandling.erVedtakUtenBeregning &&
                    behandling.lesemodus &&
                    (behandling.lesemodus?.opprettetAvBatch || behandling.lesemodus?.erAvvist)
                ) &&
                !erAvvist,
            interactive:
                !behandling.virkningstidspunktV3?.erAvslagForAlle &&
                behandling.vedtakstype !== Vedtakstype.OPPHOR &&
                !behandling.erVedtakUtenBeregning,
        },
        {
            step: BarnebidragStepper.INNTEKT,
            visible:
                behandling.vedtakstype !== Vedtakstype.INNKREVING &&
                behandling.vedtakstype !== Vedtakstype.ALDERSJUSTERING &&
                !(behandling.erVedtakUtenBeregning && behandling.lesemodus) &&
                !erAvvist,
            interactive:
                !behandling.virkningstidspunktV3?.erAvslagForAlle && behandling.vedtakstype !== Vedtakstype.OPPHOR,
        },
        {
            step: BarnebidragStepper.GEBYR,
            visible:
                !erAvvist &&
                ((behandling.lesemodus?.erAvvist && !!behandling.gebyrV3) ||
                    (behandling.vedtakstype !== Vedtakstype.INNKREVING &&
                        ((behandling.lesemodus?.erAvvist && !!behandling.gebyrV3) ||
                            (!behandling.erKlageEllerOmgjøring &&
                                behandling.vedtakstype !== Vedtakstype.ALDERSJUSTERING &&
                                !(behandling.erVedtakUtenBeregning && behandling.lesemodus))))),
            interactive: !!behandling.gebyrV3?.saker.length,
        },
        {
            step: BarnebidragStepper.BOFORHOLD,
            visible:
                !erAvvist &&
                behandling.vedtakstype !== Vedtakstype.INNKREVING &&
                behandling.vedtakstype !== Vedtakstype.ALDERSJUSTERING &&
                !(behandling.erVedtakUtenBeregning && behandling.lesemodus),
            interactive:
                !behandling.virkningstidspunktV3?.erAvslagForAlle && behandling.vedtakstype !== Vedtakstype.OPPHOR,
        },
        {
            step: BarnebidragStepper.SAMVÆR,
            visible:
                !erAvvist &&
                behandling.vedtakstype !== Vedtakstype.INNKREVING &&
                behandling.vedtakstype !== Vedtakstype.ALDERSJUSTERING &&
                !(behandling.erVedtakUtenBeregning && behandling.lesemodus),
            interactive:
                !behandling.virkningstidspunktV3?.erAvslagForAlle && behandling.vedtakstype !== Vedtakstype.OPPHOR,
        },
        {
            step: BarnebidragStepper.VEDTAK,
            visible: !orkestrertVedtak,
            interactive: true,
        },
        {
            step: BarnebidragStepper.KLAGEVEDTAK,
            visible: orkestrertVedtak,
            interactive: true,
        },
        {
            step: BarnebidragStepper.VEDTAK_ENDELIG,
            visible: orkestrertVedtak,
            interactive: true,
        },
    ];

    function getPageErrorTexts(): { title: string; description: string } {
        return {
            title: text.varsel.statusIkkeLagret,
            description: text.varsel.statusIkkeLagretDescription,
        };
    }

    const value = React.useMemo(
        () => ({
            formSteps,
            getPageErrorTexts,
            pageErrorsOrUnsavedState,
            setPageErrorsOrUnsavedState,
            sideMenu,
            stepsIndex: STEPS,
            vurderSeparatSamværPerSak,
            setVurderSeparatSamværPerSak,
            vurderSeparatVirkningstidspunktPerSak,
            setVurderSeparatVirkningstidspunktPerSak,
        }),
        [
            JSON.stringify(pageErrorsOrUnsavedState),
            gebyrRef,
            behandling.vedtakstype,
            behandling.virkningstidspunktV3?.erAvslagForAlle,
            behandling.erVedtakUtenBeregning,
            behandling.lesemodus,
            behandling.lesemodus?.opprettetAvBatch,
            behandling.lesemodus?.erAvvist,
            behandling.erBisysVedtak,
            vurderSeparatSamværPerSak,
            vurderSeparatVirkningstidspunktPerSak,
        ],
    );

    return <BehandlingProvider props={value}>{children}</BehandlingProvider>;
}

export { BarnebidragProviderWrapper };
