import { useUpdateGebyr } from "../../common/hooks/useApiData";

export const useOnUpdateGebyr = () => {
    const mutation = useUpdateGebyr();

    return { mutation };
};
