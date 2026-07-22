import { useSearchParams } from "react-router";
import { getBisysSessionParams } from "./bisys-params.ts";

const SESSION_BISYS_LINK_TARGET = "bisys.linktarget";
const SESSION_BISYS_LINK_PARAMS = "bisys.linkParams";
const BISYS_LINK_TARGETS = ["sak", "sakForside", "sakHistorikk", "oppgaveliste"] as const;

type BisysLinkTarget = (typeof BISYS_LINK_TARGETS)[number];
type BisysParamName = "saksnr";

function isBisysLinkTarget(value: string | null): value is BisysLinkTarget {
    return value !== null && BISYS_LINK_TARGETS.includes(value as BisysLinkTarget);
}

export function useBisysLink() {
    const [searchParams] = useSearchParams();
    const storage = typeof window !== "undefined" ? window.sessionStorage : null;
    const storedTarget = storage?.getItem(SESSION_BISYS_LINK_TARGET) ?? null;
    const bisysLinkTarget = isBisysLinkTarget(storedTarget) ? storedTarget : null;
    const bisysLinkParams = storage?.getItem(SESSION_BISYS_LINK_PARAMS) ?? "";
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
        if (!storage) {
            return;
        }

        storage.setItem(SESSION_BISYS_LINK_TARGET, target);
        const urlString = new URLSearchParams(params).toString();
        storage.setItem(SESSION_BISYS_LINK_PARAMS, urlString);
    }

    return {
        setBisysLinkTarget,
        bisysUrl,
        bisysLinkTarget,
    };
}
