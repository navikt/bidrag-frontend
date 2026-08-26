import { useUpdatePrivatAvtale, useUpdatePrivatAvtaleBegrunnelse } from "../../common/hooks/useApiData";

export const useOnUpdatePrivatAvtale = (privatAvtale: number) => {
    const mutation = useUpdatePrivatAvtale(privatAvtale);
    return { mutation };
};
export const useOnUpdatePrivatAvtaleBegrunnelse = () => {
    const mutation = useUpdatePrivatAvtaleBegrunnelse();
    return { mutation };
};
