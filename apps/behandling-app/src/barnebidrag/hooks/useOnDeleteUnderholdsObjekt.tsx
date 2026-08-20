import type { BehandlingDtoV2 } from "@bidrag/api/BidragBehandlingApiV1";
import { useQueryClient } from "@tanstack/react-query";
import { useBehandlingProvider } from "../../common/context/BehandlingContext";
import { QueryKeys, useDeleteUnderholdsObjekt } from "../../common/hooks/useApiData";

export const useOnDeleteUnderholdsObjekt = () => {
    const queryClient = useQueryClient();
    const { behandlingId } = useBehandlingProvider();
    const mutation = useDeleteUnderholdsObjekt();
    const queryClientUpdater = (updateFn: (currentData: BehandlingDtoV2) => BehandlingDtoV2) =>
        queryClient.setQueryData<BehandlingDtoV2>(QueryKeys.behandlingV2(behandlingId), updateFn);

    return { mutation, queryClientUpdater };
};
