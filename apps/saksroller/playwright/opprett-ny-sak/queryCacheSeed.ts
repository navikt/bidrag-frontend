import type { QueryClient } from "@tanstack/react-query";

/**
 * Enhetsnumre og -navn brukt av `useBestemEnhet` for oppslag av kontaktinfo
 * (`useHentEnhetInfomasjon`). Disse svarene er alltid statiske uansett scenario
 * – ingen CT-test overstyrer dem, og de fanges ikke opp i noen
 * request-assertion. Derfor kan de sås direkte i React Query-cachen i stedet
 * for å mockes over nettverk, både for CT-tester og manuell galleri-browsing.
 *
 * Geografisk-tilknytning-oppslaget (`hent_person_geografisk_enhet`) og
 * eksisterende-sak-sjekken (`hent_sak_person`) sås bevisst IKKE her: de
 * asserters/overstyres per scenario i flere CT-spesifikasjoner (f.eks.
 * `requests.unit` i Farskap/Oppfostringsbidrag, og en runtime `page.route()`-
 * overstyring i BarnBeggeForeldre), så de må fortsatt gå via ekte
 * nettverksmocking (`network.ts`/`mocks/handlers.ts`).
 */
const STATISKE_ENHETER: Record<string, { nummer: string; navn: string }> = {
    "4806": { nummer: "4806", navn: "NAV Test" },
    "2103": { nummer: "2103", navn: "NAV Vikafossen" },
    "4883": { nummer: "4883", navn: "NAV Test" },
    "4865": { nummer: "4865", navn: "NAV Test" },
};

export function seedStatiskEnhetsinfo(queryClient: QueryClient) {
    for (const enhet of Object.values(STATISKE_ENHETER)) {
        queryClient.setQueryData(["hent_enhet_info", enhet.nummer], enhet);
    }
}
