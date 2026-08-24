import { useUpdateInntektBegrunnelse } from "./useApiData";

export const useOnSaveInntektBegrunnelse = () => {
    const mutation = useUpdateInntektBegrunnelse();

    return { mutation };
};
