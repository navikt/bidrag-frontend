import { BIDRAG_KODEVERK_API, BIDRAG_SAK_API, BIDRAG_SAMHANDLER_API } from "@bidrag/api";
import type { SamhandlerSakerDto } from "@bidrag/api/SakApi";
import type { SamhandlerDto, SamhandlerSok, SamhandlersokeresultatDto } from "@bidrag/api/SamhandlerApi";
import { LoggerService } from "@bidrag/common";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { sortInAlphabeticOrder } from "../utils/sorting";

interface SamhandlerErrorResponse {
    duplikatSamhandler: {
        feilmelding: string;
    };
    ugyldigInput: {
        [key: string]: string;
    };
}

export type SamhandlerAxiosError = AxiosError<SamhandlerErrorResponse>;

export const useHentSamhandler = () => {
    return useMutation({
        mutationFn: async (payload: SamhandlerSok): Promise<SamhandlersokeresultatDto> => {
            console.info("SamhandlerSok payload", payload);
            const { data } = await BIDRAG_SAMHANDLER_API.samhandlersok.samhandlerSok(payload);
            return data;
        },
        networkMode: "always",
        onError: (error) => {
            console.log("onError", error);
            LoggerService.error("Feil ved henting av samhandler", error);
        },
    });
};

export const useHentSamhandlerDetaljer = (samhandlerId: string) => {
    return useSuspenseQuery({
        queryKey: ["samhandler-detaljer", samhandlerId],
        queryFn: async (): Promise<SamhandlerDto> => {
            const { data } = await BIDRAG_SAMHANDLER_API.samhandler.hentSamhandler(JSON.stringify(samhandlerId));
            return data;
        },
    });
};

export const useOpprettSamhandler = () => {
    return useMutation({
        mutationFn: async (payload: SamhandlerDto): Promise<SamhandlerDto> => {
            const { data } = await BIDRAG_SAMHANDLER_API.opprettSamhandler.opprettSamhandler(payload);
            return data as SamhandlerDto;
        },
        networkMode: "always",
        onError: (error: SamhandlerAxiosError) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppretting av samhandler", error);
        },
    });
};

export const useOppdaterSamhandler = () => {
    return useMutation({
        mutationFn: async (payload: SamhandlerDto): Promise<SamhandlerDto> => {
            const { data } = await BIDRAG_SAMHANDLER_API.oppdaterSamhandler.oppdaterSamhandler(payload);
            return data as SamhandlerDto;
        },
        networkMode: "always",
        onError: (error: SamhandlerAxiosError) => {
            console.log("onError", error);
            LoggerService.error("Feil ved oppdatering av samhandler", error);
        },
    });
};

export const useHentSamhandlersSaker = (samhandlerId: string) => {
    return useSuspenseQuery({
        queryKey: ["samhandler-saker", samhandlerId],
        queryFn: async (): Promise<SamhandlerSakerDto> => {
            const { data } = await BIDRAG_SAK_API.samhandler.finnSamhandlerSaker({ samhandlerId });
            return data;
        },
    });
};

export const useHentVisningsnavn = () => {
    return useSuspenseQuery({
        queryKey: ["samhandler-visningsnavn"],
        queryFn: async (): Promise<Record<string, string>> => {
            const { data } = await BIDRAG_SAMHANDLER_API.visningsnavn.hentVisningsnavn();
            window.localStorage.setItem("visningsnavn", JSON.stringify(data));
            return data;
        },
    });
};

export const useHentLandkoder = () => {
    const { data: landkoder } = useSuspenseQuery({
        queryKey: ["landkoder"],
        queryFn: async () => {
            return await BIDRAG_KODEVERK_API.kodeverk.hentKodeverk("Landkoder").then((response) => {
                const responseData = Object.keys(response.data.betydninger).filter(
                    (d) => !["???", "9999", "XUK"].includes(d),
                );
                window.localStorage.setItem("landkoder", JSON.stringify(responseData));
                return responseData;
            });
        },
    });
    return landkoder;
};

export const kodeTilVisningsnavn = (kode?: string | null) => {
    if (!kode) return "";
    const visningsnavn = JSON.parse(window.localStorage.getItem("visningsnavn") ?? "{}");
    return visningsnavn[kode];
};

export const landkodeTilVisningsnavn = (landkode?: string | null) => {
    if (!landkode) return "";
    const visningsnavn = JSON.parse(window.localStorage.getItem("visningsnavn") ?? "{}");
    const landkoder = JSON.parse(window.localStorage.getItem("landkoder") ?? "[]");

    interface LandkodeItem {
        landkode: string;
        visningsnavn: string;
    }

    const visningsnavnLandkoder: LandkodeItem[] = landkoder
        .map(
            (item: string): LandkodeItem => ({
                landkode: item,
                visningsnavn: visningsnavn[item],
            }),
        )
        .filter((item: LandkodeItem) => !!item.visningsnavn)
        .sort((a: LandkodeItem, b: LandkodeItem) => sortInAlphabeticOrder(a.visningsnavn, b.visningsnavn));

    const landnavn = visningsnavnLandkoder.find((l: LandkodeItem) => l.landkode === landkode)?.visningsnavn;
    if (!landnavn) return "";

    return landnavn.charAt(0).toUpperCase() + landnavn.slice(1).toLowerCase();
};
