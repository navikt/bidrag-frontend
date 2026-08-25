import { useOppdatereVirkningstidspunktBegrunnelse } from "./useApiData";

export const useOnSaveVirkningstidspunktBegrunnelse = () => {
    const mutation = useOppdatereVirkningstidspunktBegrunnelse();

    return { mutation };
};
