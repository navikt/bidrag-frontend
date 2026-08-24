import { TypeBehandling } from "@bidrag/api/BidragBehandlingApiV1";
import { BodyShort, Button, Loader } from "@navikt/ds-react";
import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { Suspense, useEffect } from "react";
import { formatterBeløp } from "../../../utils/number-utils";
import { useBehandlingProvider } from "../../context/BehandlingContext";
import { QueryKeys, useGetBehandlingV2, useGetBeregningInnteksgrenseSærbidrag } from "../../hooks/useApiData";
import useFeatureToogle from "../../hooks/useFeatureToggle";

export function AdminButtons() {
    const { isAdminEnabled } = useFeatureToogle();
    const { behandlingId, vedtakId } = useBehandlingProvider();
    const { type } = useGetBehandlingV2();
    if (!isAdminEnabled) return null;

    return (
        <div className="flex flex-row gap-5 border-t border-b-0 border-r-0 border-l-0 border-solid">
            <Button
                variant="tertiary-neutral"
                size="small"
                onClick={() => {
                    if (vedtakId) {
                        window.open(
                            `${window.location.origin}/admin/vedtak/explorer/?erBehandlingId=false&id=${vedtakId}&graftype=flowchart`,
                        );
                    } else {
                        window.open(
                            `${window.location.origin}/admin/vedtak/explorer/?erBehandlingId=true&id=${behandlingId}&graftype=flowchart`,
                        );
                    }
                }}
            >
                Vis vedtaksgraf
            </Button>
            {type === TypeBehandling.SAeRBIDRAG && <BPsLavesteInntektForEvneWrapper />}
        </div>
    );
}

const BPsLavesteInntektForEvneWrapper: React.FC = () => {
    return (
        <Suspense
            fallback={
                <BodyShort size="small" className="flex flex-row gap-4 self-center">
                    Henter BPs laveste inntekt for evne
                    <Loader size="xsmall" />
                </BodyShort>
            }
        >
            <BPsLavesteInntektForEvne />
        </Suspense>
    );
};
const BPsLavesteInntektForEvne: React.FC = () => {
    const { data: innteksgrense } = useGetBeregningInnteksgrenseSærbidrag();
    const { activeStep } = useBehandlingProvider();
    const queryClient = useQueryClient();
    useEffect(() => {
        queryClient.refetchQueries({ queryKey: QueryKeys.beregningInnteksgrenseSærbidrag() });
    }, [activeStep]);
    return (
        <BodyShort size="small" className="self-center">
            BPs laveste inntekt for evne: {formatterBeløp(innteksgrense, true)}
        </BodyShort>
    );
};
