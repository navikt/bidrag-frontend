import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBisysLink } from "./useBisysLink.ts";

const mocks = vi.hoisted(() => ({
    searchParams: "",
    storage: new Map<string, string>(),
}));

vi.mock("react-router", () => ({
    useSearchParams: () => [new URLSearchParams(mocks.searchParams)],
}));

/** Renders the hook with the current URL and session storage. */
function renderBisysLink() {
    let result: ReturnType<typeof useBisysLink> | undefined;
    function BisysLink() {
        result = useBisysLink();
        return null;
    }
    renderToStaticMarkup(createElement(BisysLink));
    if (!result) throw new Error("BisysLink did not render");
    return result;
}

describe("useBisysLink", () => {
    beforeEach(() => {
        mocks.searchParams = "sessionState=url-state&enhet=4806";
        mocks.storage.clear();
        vi.stubGlobal("window", {
            sessionStorage: {
                getItem: (key: string) => mocks.storage.get(key) ?? null,
                setItem: (key: string, value: string) => mocks.storage.set(key, value),
            },
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it.each([
        undefined,
        "oppgaveliste",
        "ukjent",
    ])("omits enhet and preserves sessionState for task list with stored target %s", (target) => {
        if (target) mocks.storage.set("bisys.linktarget", target);
        mocks.storage.set("bisys.linkParams", "enhet=2103&saksnr=test-sak");

        expect(renderBisysLink().bisysUrl).toBe("/bisys/oppgaveliste?saksnr=test-sak&sessionState=url-state");
    });

    it("preserves stored sessionState without adding stored enhet to the task list", () => {
        mocks.searchParams = "";
        mocks.storage.set("bisys.sessionState", "stored-state");
        mocks.storage.set("bisys.enhet", "4806");

        expect(renderBisysLink().bisysUrl).toBe("/bisys/oppgaveliste?sessionState=stored-state");
    });

    it.each(["sak", "sakshistorikk"])("preserves enhet, sessionState and saksnr for %s", (target) => {
        mocks.storage.set("bisys.linktarget", target);
        mocks.storage.set("bisys.linkParams", "saksnr=test-sak");

        expect(renderBisysLink().bisysUrl).toBe(`/bisys/${target}?saksnr=test-sak&sessionState=url-state&enhet=4806`);
    });

    it("omits enhet after switching to the task list without changing stored session parameters", () => {
        mocks.storage.set("bisys.linktarget", "sak");
        mocks.storage.set("bisys.enhet", "4806");
        mocks.storage.set("bisys.sessionState", "stored-state");
        const { setBisysLinkTarget } = renderBisysLink();

        setBisysLinkTarget("oppgaveliste");

        const result = renderBisysLink();
        expect(result.bisysUrl).toBe("/bisys/oppgaveliste?sessionState=url-state");
        expect(result.bisysSessionParams).toEqual({ sessionState: "url-state", enhet: "4806" });
        expect(mocks.storage.get("bisys.enhet")).toBe("4806");
        expect(mocks.storage.get("bisys.sessionState")).toBe("stored-state");
    });
});
