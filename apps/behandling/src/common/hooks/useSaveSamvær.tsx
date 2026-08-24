import { useDeleteSamværsperiode, useUpdateSamvær } from "./useApiData";

export const useOnSaveSamvær = () => {
    const mutation = useUpdateSamvær();

    return { mutation };
};

export const useOnDeleteSamværsperiode = () => {
    const mutation = useDeleteSamværsperiode();

    return { mutation };
};
