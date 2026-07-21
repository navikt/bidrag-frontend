import { useSearchParams } from "react-router";
import { getBisysSessionParams } from "./bisys-params.ts";

const SESSION_BISYS_LINK_TARGET = "bisys.linktarget";
const SESSION_BISYS_LINK_PARAMS = "bisys.linkParams";

type BisysLinkTarget = "sak" | "sakForside" | "sakHistorikk" | "oppgaveliste";
type BisysParamName = "saksnr";

export function useBisysLink() {
    const [searchParams] = useSearchParams();
    const bisysLinkTarget = sessionStorage.getItem(SESSION_BISYS_LINK_TARGET) as BisysLinkTarget;
    const bisysLinkParams = sessionStorage.getItem(SESSION_BISYS_LINK_PARAMS) ?? "";
    const bisysSessionParams = getBisysSessionParams(searchParams);
    const bisysQueryParams = new URLSearchParams(bisysLinkParams);
    if (bisysSessionParams.sessionState) {
        bisysQueryParams.set("sessionState", bisysSessionParams.sessionState);
    }
    if (bisysSessionParams.enhet) {
        bisysQueryParams.set("enhet", bisysSessionParams.enhet);
    }

    function getBisysUrl() {
        if (!bisysLinkTarget) {
            return null;
        }
        const params = bisysQueryParams.toString();
        return params ? `/bisys/${bisysLinkTarget}?${params}` : `/bisys/${bisysLinkTarget}`;
    }

    const bisysUrl = getBisysUrl();

    function setBisysLinkTarget(target: BisysLinkTarget, params: Partial<Record<BisysParamName, string>> = {}) {
        sessionStorage.setItem(SESSION_BISYS_LINK_TARGET, target);
        const urlString = new URLSearchParams(params).toString();
        sessionStorage.setItem(SESSION_BISYS_LINK_PARAMS, urlString);
    }

    return {
        setBisysLinkTarget,
        bisysUrl,
        bisysLinkTarget,
    };
}
