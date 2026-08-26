import { Broadcast, useRQMutationState } from "@bidrag/common";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { notatBroadcastName } from "../../forskudd/constants/notat";
import { MutationKeys } from "./useApiData";

export const useMutationStatus = (behandlingId: string) => {
    const queryClient = useQueryClient();
    const listenToMutations = [
        MutationKeys.oppdaterBehandling(behandlingId),
        MutationKeys.updateBoforhold(behandlingId),
        MutationKeys.updateVirkningstidspunkt(behandlingId),
        MutationKeys.updateInntekter(behandlingId),
        MutationKeys.updateUtgifter(behandlingId),
        MutationKeys.oppretteUnderholdForBarn(behandlingId),
        MutationKeys.updateUtgifter(behandlingId),
        MutationKeys.updateStonadTilBarnetilsyn(behandlingId),
        MutationKeys.updateFaktiskeTilsynsutgifter(behandlingId),
        MutationKeys.updateTilleggstønad(behandlingId),
        MutationKeys.slettUnderholdsElement(behandlingId),
        MutationKeys.oppdatereTilsynsordning(behandlingId),
        MutationKeys.oppdatereUnderhold(behandlingId),
        MutationKeys.oppdaterManueltOverstyrtGebyr(behandlingId),
        MutationKeys.updateSamvær(behandlingId),
        MutationKeys.updateInntekterBegrunnelse(behandlingId),
        MutationKeys.oppdaterVirkningstidspunktBegrunnelse(behandlingId),
        MutationKeys.oppdaterePrivatAvtale(behandlingId),
    ];
    const mutationStatus = useRQMutationState(listenToMutations, queryClient);

    useEffect(() => {
        console.debug("Mutation status changed", JSON.stringify(mutationStatus));
        if (mutationStatus.status === "success") {
            console.debug("Sending broadcast", notatBroadcastName, behandlingId);
            Broadcast.sendBroadcast(notatBroadcastName, {
                id: behandlingId.toString(),
                payload: null,
            });
        }
    }, [mutationStatus]);

    return mutationStatus.status;
};
