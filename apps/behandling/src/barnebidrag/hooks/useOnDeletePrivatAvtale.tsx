import type { BehandlingDtoV2 } from "@bidrag/api/BidragBehandlingApiV1";
import { useQueryClient } from "@tanstack/react-query";
import { useBehandlingProvider } from "../../common/context/BehandlingContext";
import { QueryKeys, useDeletePrivatAvtale } from "../../common/hooks/useApiData";

export const useOnDeletePrivatAvtale = () => {
    const queryClient = useQueryClient();
    const { behandlingId } = useBehandlingProvider();
    const mutation = useDeletePrivatAvtale();
    const queryClientUpdater = (updateFn: (currentData: BehandlingDtoV2) => BehandlingDtoV2) =>
        queryClient.setQueryData<BehandlingDtoV2>(QueryKeys.behandlingV2(behandlingId), updateFn);

    return { mutation, queryClientUpdater };
};
