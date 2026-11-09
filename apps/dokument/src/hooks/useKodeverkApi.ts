import { KodeverkService } from "@bidrag/api";
import { useSuspenseQuery } from "@tanstack/react-query";

export const useHentPostnummer = () => {
    const { data: postnummer } = useSuspenseQuery({
        queryKey: ["postnummer"],
        queryFn: async () => {
            return await new KodeverkService().getPostnummere();
        },
    });
    return postnummer;
};
export const useHentLandkoder = () => {
    const { data: landkoder } = useSuspenseQuery({
        queryKey: ["landkoder"],
        queryFn: async () => {
            return await new KodeverkService().getLandkoder();
        },
    });
    return landkoder;
};
