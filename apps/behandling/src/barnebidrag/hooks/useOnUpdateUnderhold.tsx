import { useUpdateUnderholdBegrunnelse } from "../../common/hooks/useApiData";

export const useOnUpdateUnderholdBegrunnelse = () => {
    const mutation = useUpdateUnderholdBegrunnelse();

    return { mutation };
};
