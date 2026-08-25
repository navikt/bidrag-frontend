import { useMergeSamvær } from "../../common/hooks/useApiData";

export const useOnMergeSamvær = () => {
    const mutation = useMergeSamvær();

    return { mutation };
};
