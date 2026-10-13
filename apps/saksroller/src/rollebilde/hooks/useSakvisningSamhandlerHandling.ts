import type { SamhandlerBroadcastMessage } from "@bidrag/common";
import { useCallback, useState } from "react";

type SamhandlerData = {
    ident: string;
    navn: string;
} | null;

type SamhandlerContext = {
    barnIndex: number | null;
    isLeggTilBarn: boolean;
} | null;

/**
 * Hook for å håndtere samhandler-søk popup og data-flyt i sakvisning.
 *
 * - Når flere barn kan redigeres samtidig, må vi vite hvilket barn som venter på samhandler-data
 * - Samhandler-data fra popup må gå til riktig komponent (enten LeggTilBarn eller spesifikt BarnVisning)
 * - `hentOgNullstillSamhandler()` henter data for spesifikt barn og nullstiller for å unngå gjenbruk
 */
export function useSakvisningSamhandlerHandling() {
    const [visSamhandlerSøk, setVisSamhandlerSøk] = useState(false);
    const [samhandlerData, setSamhandlerData] = useState<SamhandlerData>(null);
    const [context, setContext] = useState<SamhandlerContext>(null);

    const leggTilSamhandler = useCallback((reellMottaker: SamhandlerBroadcastMessage | null) => {
        setVisSamhandlerSøk(false);

        if (reellMottaker === null) {
            setSamhandlerData(null);
            setContext(null);
            return;
        }

        setSamhandlerData({
            ident: reellMottaker?.samhandlerId ?? reellMottaker?.offentligId ?? "",
            navn: reellMottaker?.navn ?? "",
        });
    }, []);

    const åpneSamhandlerSøk = useCallback((barnIndex?: number, isLeggTilBarn: boolean = false) => {
        setSamhandlerData(null);
        setContext({
            barnIndex: barnIndex ?? null,
            isLeggTilBarn,
        });
        setVisSamhandlerSøk(true);
    }, []);

    const resetSamhandlerSøk = useCallback(() => {
        setVisSamhandlerSøk(false);
        setSamhandlerData(null);
        setContext(null);
    }, []);

    const hentOgNullstillSamhandler = useCallback(
        (barnIndex: number, isLeggTilBarn: boolean) => {
            if (samhandlerData && context?.barnIndex === barnIndex && context?.isLeggTilBarn === isLeggTilBarn) {
                const data = samhandlerData;
                setSamhandlerData(null);
                setContext(null);
                return data;
            }
            return null;
        },
        [samhandlerData, context],
    );

    return {
        visSamhandlerSøk,
        samhandlerData,
        context,
        leggTilSamhandler,
        åpneSamhandlerSøk,
        resetSamhandlerSøk,
        hentOgNullstillSamhandler,
    };
}
