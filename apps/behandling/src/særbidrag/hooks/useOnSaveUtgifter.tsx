import { useUpdateUtgifter } from "../../common/hooks/useApiData";

export const useOnSaveUtgifter = () => {
    const mutation = useUpdateUtgifter();

    return { mutation };
};
