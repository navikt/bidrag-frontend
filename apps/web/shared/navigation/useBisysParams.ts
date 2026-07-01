import { useSearchParams } from "react-router";

/**
   @deprecated
    * Henter ut enhet og sessionState fra URL, som blir lagt til av Bisys ved videresending til forsendelse-ui.
    @return { enhet: string | null, sessionState: string | null }
*/
export function useBisysParams() {
    const [searchParams] = useSearchParams();
    const enhet = searchParams.get("enhet");
    const sessionState = searchParams.get("sessionState");

    const getQueryString = () => {
        const params = new URLSearchParams();
        if (enhet) params.append("enhet", enhet);
        if (sessionState) params.append("sessionState", sessionState);
        return params.toString();
    };

    return { enhet, sessionState, bisysQueryString: getQueryString() };
}
