import type { KodeverkHierarkiResponse, KodeverkKoderBetydningerResponse } from "@bidrag/api/BidragKodeverkApi";
import { StringUtils } from "@bidrag/common";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useBidragKodeverkApi } from "../api/api";
import KodeverkService from "../api/KodeverkService";
import { visAndreVedleggskoder, visVedleggskoder } from "../constants/ettersendingConstants";
import type { KodeBeskrivelse, LandkodeLand, PostnummerPoststed } from "../types/KodeverkTypes";
export const KodeverkQueryKeys = {
    landkoder: ["landkoder"],
    postnummere: ["postnummere"],
    navskjema: ["navskjema"],
    navBidragSkjema: ["navBidragSkjema"],
};

const postnummereQuery = {
    queryKey: KodeverkQueryKeys.postnummere,
    queryFn: () => new KodeverkService().getPostnummere(),
};

export const useHentLandkoder = (): LandkodeLand[] => {
    const { data: landkoder } = useSuspenseQuery({
        queryKey: KodeverkQueryKeys.landkoder,
        queryFn: () => new KodeverkService().getLandkoder(),
    });

    return landkoder;
};

export const useHentPostnummere = (): PostnummerPoststed[] => {
    const { data: postnummere } = useSuspenseQuery(postnummereQuery);

    return postnummere;
};

export const useHentNavSkjemaer = (): KodeBeskrivelse[] => {
    const bidragKodeverkApi = useBidragKodeverkApi();
    const { data } = useSuspenseQuery({
        queryKey: KodeverkQueryKeys.navskjema,
        queryFn: async () => {
            const response = await bidragKodeverkApi.kodeverk.hentKodeverk("NAVSkjema");
            return mapKodeverkResponseToCodeAndName(response.data);
        },
    });

    return data;
};

export const useHentVedleggskoder = (): KodeBeskrivelse[] => {
    const bidragKodeverkApi = useBidragKodeverkApi();
    const { data } = useSuspenseQuery({
        queryKey: KodeverkQueryKeys.navBidragSkjema,
        queryFn: async () => {
            const response = await bidragKodeverkApi.kodeverk.hentKodeverk("Vedleggskoder");
            return [
                ...visAndreVedleggskoder,
                ...mapKodeverkResponseToCodeAndName(response.data).filter((kodeBeskrivelse) =>
                    visVedleggskoder.includes(kodeBeskrivelse.kode),
                ),
            ];
        },
    });

    return data;
};

export const mapHierarkiResponseToCodeAndName = (kodeverk: KodeverkHierarkiResponse): KodeBeskrivelse[] =>
    Object.entries(kodeverk.noder)
        .filter(([kode, _]) => kode === "BID" || kode === "FAR")
        .flatMap(([_, node]) =>
            Object.entries(node.undernoder)
                .filter(([kode, _]) => !kode.startsWith("NAV 00") && !kode.startsWith("NAV 90"))
                .map(([kode, undernode]) => ({
                    kode: kode,
                    beskrivelse: undernode.termer.nb,
                })),
        );

export const mapKodeverkResponseToCodeAndName = (kodeverk: KodeverkKoderBetydningerResponse): KodeBeskrivelse[] =>
    Object.entries(kodeverk.betydninger)
        .map(([kode, betydninger]) => {
            if (!betydninger || betydninger.length === 0) {
                return null;
            }
            // Find the Betydning with the most recent gyldigFom date
            const latestBetydning = betydninger.reduce((latest, current) =>
                latest.gyldigFra > current.gyldigFra ? latest : current,
            );
            return { kode, betydning: latestBetydning };
        })
        .filter(Boolean) // Remove any null entries from empty betydninger
        .filter(({ betydning }) => {
            const gyldigTil = betydning.gyldigTil;
            if (!gyldigTil) {
                // ingen sluttdato = gyldig
                return true;
            }
            // parse YYYY-MM-DD into a Date at local midnight
            const [year, month, day] = gyldigTil.split("-").map(Number);
            const gyldigTilDate = new Date(year, month - 1, day);
            // dagens dato kl 00:00
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            // behold kun de som ikke er utløpt
            return gyldigTilDate >= today;
        })
        .map(({ kode, betydning }) => {
            const tekst = StringUtils.isEmpty(betydning.beskrivelser.nb.tekst)
                ? betydning.beskrivelser.nb.term
                : betydning.beskrivelser.nb.tekst;
            return {
                kode,
                beskrivelse: tekst,
            };
        });

export const usePrefetchPostnummere = (): void => {
    const queryClient = useQueryClient();
    useEffect(() => {
        queryClient.prefetchQuery(postnummereQuery);
    }, []);
};
