import type { BehandlingDtoV2 } from "@bidrag/api/BidragBehandlingApiV1";
import { useQueryClient } from "@tanstack/react-query";
import { useBehandlingProvider } from "../context/BehandlingContext";
import { QueryKeys, useAktiverGrunnlagsdata } from "./useApiData";

export const useOnActivateGrunnlag = () => {
    const queryClient = useQueryClient();
    const { behandlingId } = useBehandlingProvider();
    const mutation = useAktiverGrunnlagsdata();
    const queryClientUpdater = (updateFn: (currentData: BehandlingDtoV2) => BehandlingDtoV2) =>
        queryClient.setQueryData<BehandlingDtoV2>(QueryKeys.behandlingV2(behandlingId), updateFn);

    return { mutation, queryClientUpdater };
};
