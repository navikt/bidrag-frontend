import { useEffect } from "react";
import { useSearchParams } from "react-router";

import { env } from "~/env.server.ts";
import type { Route } from "./+types/PersonSokPage.ts";

export const PERSONSOK_RESULT_EVENT = "personsok-result";

export function loader() {
    return { personsokUrl: env.PERSONSOK_URL };
}

/**
 * Åpnes i eget vindu. Uten `aktorid` sendes brukeren til PDL-søket, som kommer
 * tilbake hit med identen. Da kringkastes resultatet til vinduet som åpnet oss.
 */
export default function PersonSokPage({ loaderData }: Route.ComponentProps) {
    const [searchParams] = useSearchParams();
    const aktorid = searchParams.get("aktorid");
    const windowId = searchParams.get("windowId");
    const { personsokUrl } = loaderData;

    useEffect(() => {
        if (!personsokUrl) {
            return;
        }

        if (!aktorid) {
            const callbackurl = window.location.href;
            window.location.replace(`${personsokUrl}?callbackurl=${encodeURIComponent(callbackurl)}&systemnavn=Bidrag`);
            return;
        }

        if (!windowId) {
            return;
        }

        const kanal = new BroadcastChannel(PERSONSOK_RESULT_EVENT);
        kanal.postMessage(JSON.stringify({ id: windowId, ok: true, ident: aktorid }));
        kanal.close();
        window.close();
    }, [aktorid, personsokUrl, windowId]);

    if (!personsokUrl) {
        return <p>Personsøk er ikke konfigurert i dette miljøet.</p>;
    }

    return <p>Åpner personsøk …</p>;
}
