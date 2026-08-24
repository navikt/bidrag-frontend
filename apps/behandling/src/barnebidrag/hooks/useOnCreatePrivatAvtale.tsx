import { useCreatePrivatAvtale } from "../../common/hooks/useApiData";

export const useOnCreatePrivatAvtale = () => {
    const mutation = useCreatePrivatAvtale();

    return { mutation };
};
