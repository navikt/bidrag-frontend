import { useUpdateBoforhold } from "./useApiData";

export const useOnSaveBoforhold = () => {
    const mutation = useUpdateBoforhold();

    return { mutation };
};
