import { EndringsloggTilhorerSkjermbilde } from "@bidrag/api/BidragAdminApi";
import { TypeBehandling } from "@bidrag/api/BidragBehandlingApiV1";
import { Loader } from "@navikt/ds-react";
import { useFlagsStatus } from "@unleash/proxy-client-react";
import { type PropsWithChildren, useEffect } from "react";
import { BidragProgressbarFullScreen } from "./barnebidrag/components/BidragProgressbar";
import { BarnebidragProviderWrapper } from "./barnebidrag/context/BarnebidragProviderWrapper";
import { BarnebidragPage } from "./barnebidrag/pages/BarnebidragPage";
import { BidragBehandlingHeader } from "./common/components/header/BidragBehandlingHeader";
import { ErrorModal } from "./common/components/modal/ErrorModal";
import text from "./common/constants/texts";
import { useBehandlingV2 } from "./common/hooks/useApiData";
import useFeatureToogle from "./common/hooks/useFeatureToggle";
import { prefetchVisningsnavn } from "./common/hooks/useVisningsnavn";
import { ForskuddBehandlingProviderWrapper } from "./forskudd/context/ForskuddBehandlingProviderWrapper";
import { ForskuddPage } from "./forskudd/pages/forskudd/ForskuddPage";
import { NewForskuddPage } from "./forskudd/pages/forskudd/NewForskuddPage";
import { SærligeugifterProviderWrapper } from "./særbidrag/context/SærligeugifterProviderWrapper";
import { NewSærbidragPage } from "./særbidrag/pages/NewSaerbidragPage";
import { SærbidragPage } from "./særbidrag/pages/SærbidragPage";
import "./styles.css";
export type BehandlingPageProps = {
    behandlingId?: string;
    vedtakId?: string;
};

function dispatchSkjermbilde(skjermbilde: EndringsloggTilhorerSkjermbilde) {
    window.dispatchEvent(
        new CustomEvent<EndringsloggTilhorerSkjermbilde>("skjermbildeSet", {
            detail: skjermbilde,
        }),
    );
}

function getSkjermbilde(type: TypeBehandling) {
    switch (type) {
        case TypeBehandling.FORSKUDD:
            return EndringsloggTilhorerSkjermbilde.BEHANDLING_FORSKUDD;
        case TypeBehandling.SAeRBIDRAG:
            return EndringsloggTilhorerSkjermbilde.BEHANDLINGSAeRBIDRAG;
        default:
            return EndringsloggTilhorerSkjermbilde.BEHANDLING_BIDRAG;
    }
}

function ForskuddBehandling() {
    const { isbehandlingVesntremenyEnabled } = useFeatureToogle();
    useEffect(() => dispatchSkjermbilde(EndringsloggTilhorerSkjermbilde.BEHANDLING_FORSKUDD), []);

    return (
        <ForskuddBehandlingProviderWrapper>
            <BidragBehandlingHeader />
            {isbehandlingVesntremenyEnabled ? <NewForskuddPage /> : <ForskuddPage />}
            <ErrorModal />
        </ForskuddBehandlingProviderWrapper>
    );
}

function SærligeutgifterBehandling() {
    const { isbehandlingVesntremenyEnabled } = useFeatureToogle();
    useEffect(() => dispatchSkjermbilde(EndringsloggTilhorerSkjermbilde.BEHANDLINGSAeRBIDRAG), []);

    return (
        <SærligeugifterProviderWrapper>
            <BidragBehandlingHeader />
            {isbehandlingVesntremenyEnabled ? <NewSærbidragPage /> : <SærbidragPage />}
            <ErrorModal />
        </SærligeugifterProviderWrapper>
    );
}

function BarnebidragBehandling({ behandlingId, vedtakId }: BehandlingPageProps) {
    const { type } = useBehandlingV2(behandlingId, vedtakId);
    useEffect(() => {
        if (type) dispatchSkjermbilde(getSkjermbilde(type));
    }, [type]);

    return (
        <BarnebidragProviderWrapper>
            <BidragBehandlingHeader />
            <BarnebidragPage />
            <ErrorModal />
        </BarnebidragProviderWrapper>
    );
}

/**
 * Venter på at Unleash-flaggene er lastet før behandlingen rendres.
 * Unleash-klienten settes opp i apps/web (root.tsx).
 */
export function BehandlingPageWrapper({ children }: PropsWithChildren) {
    prefetchVisningsnavn();
    const { flagsReady, flagsError } = useFlagsStatus();

    if (!flagsReady && flagsError === false) {
        return (
            <div className="flex justify-center overflow-hidden">
                <Loader size="3xlarge" title={text.loading} variant="interaction" />
            </div>
        );
    }

    return <>{children}</>;
}

/**
 * Rendrer riktig behandlingsskjermbilde basert på behandlingstypen som hentes
 * fra bidrag-behandling. Brukes av rutene i apps/web.
 */
export function BehandlingPage({ behandlingId, vedtakId }: BehandlingPageProps) {
    const { type } = useBehandlingV2(behandlingId, vedtakId);

    return (
        <BehandlingPageWrapper>
            {(() => {
                switch (type) {
                    case TypeBehandling.FORSKUDD:
                        return <ForskuddBehandling />;
                    case TypeBehandling.SAeRBIDRAG:
                        return <SærligeutgifterBehandling />;
                    case TypeBehandling.BIDRAG:
                    case TypeBehandling.BIDRAG18AR:
                        return <BarnebidragBehandling behandlingId={behandlingId} vedtakId={vedtakId} />;
                    default:
                        return (
                            <div className="flex justify-center overflow-hidden">
                                <Loader size="3xlarge" title={text.loading} variant="interaction" />
                            </div>
                        );
                }
            })()}
        </BehandlingPageWrapper>
    );
}

export function BehandlingPageLoader() {
    return (
        <div className="flex justify-center overflow-hidden">
            <BidragProgressbarFullScreen />
        </div>
    );
}
