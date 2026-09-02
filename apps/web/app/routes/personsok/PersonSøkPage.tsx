import { BIDRAG_PERSON_API } from "@bidrag/api";
import { useEffect } from "react";

import { env } from "~/env.server.ts";
import type { Route } from "./+types/PersonSøkPage.ts";

export const PERSONSOK_RESULT_EVENT = "personsok-result";

export function loader() {
    return { personsokUrl: env.PERSONSOK_URL };
}

/**
 * PDL-personsøket kringkaster `aktorid` tilbake ved å sette den sammen med
 * callback-URL-en som `.../?aktorid=<verdi>` i stedet for å legge den til med `&`.
 * Det gjør at hele spørrestrengen (f.eks. `windowId=<uuid>/?aktorid=<verdi>`) blir
 * ett eneste ugyldig query-par som `URLSearchParams` ikke klarer å dele opp. Vi
 * må derfor hente ut `windowId` og `aktorid` med regex direkte fra hele URL-en,
 * uavhengig av om `&` eller `/?` er brukt som skille.
 */
function hentParamFraHref(href: string, navn: string): string | null {
    const treff = new RegExp(`${navn}=([^&/?]+)`).exec(href);
    return treff ? decodeURIComponent(treff[1]!) : null;
}

/**
 * Åpnes i eget vindu. Uten `aktorid` sendes brukeren til PDL-søket, som kommer
 * tilbake hit med identen. Da kringkastes resultatet til vinduet som åpnet denne.
 */
export default function PersonSøkPage({ loaderData }: Route.ComponentProps) {
    const href = typeof window !== "undefined" ? window.location.href : "";
    const aktorid = hentParamFraHref(href, "aktorid");
    const windowId = hentParamFraHref(href, "windowId");
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

        void (async () => {
            const kanal = new BroadcastChannel(PERSONSOK_RESULT_EVENT);

            try {
                const { data } = await BIDRAG_PERSON_API.informasjon.hentPersonPost({ ident: aktorid });
                kanal.postMessage(JSON.stringify({ id: windowId, ok: true, ident: data.ident }));
            } catch {
                kanal.postMessage(JSON.stringify({ id: windowId, ok: false }));
            } finally {
                kanal.close();
                window.close();
            }
        })();
    }, [aktorid, personsokUrl, windowId]);

    if (!personsokUrl) {
        return <p>Personsøk er ikke konfigurert i dette miljøet.</p>;
    }

    return <p>Åpner personsøk …</p>;
}
