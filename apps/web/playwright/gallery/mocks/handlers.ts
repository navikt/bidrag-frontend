import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { HttpResponse, http } from "msw";

/**
 * Standard-svar for API-kall stories i manuell galleri-visning (browse.html) kan
 * trigge på mount. Dekker de samme proxy-endepunktene som
 * `opprett-ny-sak/playwright/network.ts` sin `mockWizardApi`, men uten
 * scenario-spesifikke valg – automatiserte CT-spesifikasjoner styrer fortsatt
 * sine egne responser via Playwright sin `page.route()`.
 *
 * Statiske enhetsnavn-oppslag (`hent_enhet_info`) trenger ikke nettverksmock
 * her – de sås direkte i React Query-cachen av
 * `opprett-ny-sak/playwright/queryCacheSeed.ts`, brukt av alle wizard-stories.
 */
const persongalleri = {
    bidragspliktig: { ident: genererFnr(), visningsnavn: "Test Bidragspliktig", fødselsdato: "1985-02-14" },
    bidragsmottaker: { ident: genererFnr(), visningsnavn: "Test Bidragsmottaker", fødselsdato: "1987-06-21" },
};

export const galleryHandlers = [
    http.post("/proxy/bidrag-person/informasjon/", async ({ request }) => {
        const { ident } = (await request.json()) as { ident: string };
        const person = Object.values(persongalleri).find((p) => p.ident === ident);
        return HttpResponse.json(person ?? { ident, visningsnavn: "Test Ukjent Person" });
    }),
    http.post("/proxy/bidrag-person/forelderbarnrelasjon", () => HttpResponse.json({ forelderBarnRelasjon: [] })),
    http.post("/proxy/bidrag-person/motpartbarnrelasjon", () =>
        HttpResponse.json({ person: persongalleri.bidragspliktig, personensMotpartBarnRelasjon: [] }),
    ),
    http.post("/proxy/bidrag-sak/person/sak", () => HttpResponse.json([])),
    http.post("/proxy/bidrag-organisasjon/arbeidsfordeling/enhet/geografisktilknytning", () =>
        HttpResponse.json({ nummer: "4806", navn: "NAV Test" }),
    ),
    http.post("/proxy/bidrag-tilgangskontroll/v2/api/tilgang/opprettsakutenbm", () =>
        HttpResponse.json({ harTilgang: true }),
    ),
    http.post("/proxy/bidrag-samhandler/samhandler", () => HttpResponse.json({})),
    http.post("/proxy/bidrag-sak/sak", () => HttpResponse.json({ saksnummer: "1234567" })),
    http.post("/log/*", () => new HttpResponse(null, { status: 204 })),
];
