import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { configQuery } from "~/routes/api/query/config.query.ts";
import { getBisysSessionParams } from "./bisys-params.ts";

const SESSION_BISYS_LINK_TARGET = "bisys.linktarget";
const SESSION_BISYS_LINK_PARAMS = "bisys.linkParams";

type BisysLinkTarget = "sak" | "sakForside" | "sakHistorikk";
type BisysParamName = "saksnr";

const bisysPaths: Record<BisysLinkTarget, string> = {
    sak: "Sak.do",
    sakForside: "Sak.do",
    sakHistorikk: "Sakshistorikk.do",
};

export function useBisysLink() {
    const {data: config} = useQuery(configQuery);
    const bisysBaseUrl = config?.bisysBaseUrl;
    const [searchParams] = useSearchParams();
    const bisysLinkTarget = sessionStorage.getItem(
        SESSION_BISYS_LINK_TARGET,
    ) as BisysLinkTarget;
    const bisysLinkParams =
        sessionStorage.getItem(SESSION_BISYS_LINK_PARAMS) ?? "";
    const bisysSessionParams = getBisysSessionParams(searchParams);
    const bisysQueryParams = new URLSearchParams(bisysLinkParams);
    if (bisysSessionParams.sessionState) {
        bisysQueryParams.set("sessionState", bisysSessionParams.sessionState);
    }
    if (bisysSessionParams.enhet) {
        bisysQueryParams.set("enhet", bisysSessionParams.enhet);
    }

    function getBisysUrl(baseUrl?: string) {
        if (!bisysBaseUrl || !bisysLinkTarget) {

            return null;
        }
        const path = bisysPaths[bisysLinkTarget];
        const url = new URL(path, baseUrl);
        url.search = bisysQueryParams.toString();
        return url.toString();
    }

    const bisysUrl = getBisysUrl(bisysBaseUrl);

    function setBisysLinkTarget(
        target: BisysLinkTarget,
        params: Partial<Record<BisysParamName, string>> = {},
    ) {
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
