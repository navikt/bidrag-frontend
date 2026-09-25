import { useEffect } from "react";
import { useOpprettSak } from "~/api/useApi.ts";
import { lagOpprettSakRequest, type OpprettSakParter, type SaksrollerArbeidsfordeling } from "../opprett-sak-request";
import { useSaksrolleroversikt } from "../saksrolleroversiktContext";

/**
 * Sender opprett sak-requesten for alle flyter. Requesten bygges og kontrolleres i
 * `lagOpprettSakRequest`, så flytene trenger bare å oppgi partene.
 */
export function useOpprettSakHandling({
    enhet,
    arbeidsfordeling,
}: {
    enhet: string;
    arbeidsfordeling: SaksrollerArbeidsfordeling;
}) {
    const { data: saksnummer, error, isPending, mutateAsync, reset } = useOpprettSak();
    const { setIsLoadingOpprettSak } = useSaksrolleroversikt();

    useEffect(() => {
        setIsLoadingOpprettSak(isPending);
    }, [isPending, setIsLoadingOpprettSak]);

    const opprettSak = async (parter: OpprettSakParter) => {
        await mutateAsync(lagOpprettSakRequest(enhet, arbeidsfordeling, parter));
    };

    return {
        opprettSak,
        saksnummer: saksnummer || null,
        isLoading: isPending,
        error: error || null,
        nullstillResultat: reset,
    };
}
