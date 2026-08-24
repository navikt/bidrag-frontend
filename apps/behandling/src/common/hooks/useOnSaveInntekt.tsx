import { useUpdateInntekt } from "./useApiData";

export const useOnSaveInntekt = () => {
    const mutation = useUpdateInntekt();

    return { mutation };
};
