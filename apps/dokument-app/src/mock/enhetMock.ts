import { type RestHandler, type RestRequest, rest } from "msw";

import environment from "../environment";
import { enhetList, enhetListJournalfoerende, geoEnhetMockDataMap } from "../tests/mockdata/enhetMockData";
import { norg2MockData } from "../tests/mockdata/norg2MockData";
import { mapToMockedResponse } from "./mockResponseMapper";

export default function enhetMock(): RestHandler[] {
    const baseUrl = environment.url.bidragOrganisasjon;
    return [
        rest.get(`${baseUrl}saksbehandler/enhetsliste/:saksbehandlerId`, (req, res, ctx) => {
            return mapToMockedResponse(res, ctx, enhetList);
        }),
        rest.get(`${baseUrl}arbeidsfordeling/enhetsliste/journalforende`, (req, res, ctx) => {
            return mapToMockedResponse(res, ctx, enhetListJournalfoerende);
        }),

        rest.get(
            `${baseUrl}arbeidsfordeling/enhetsliste/geografisktilknytning/:fnr`,
            (req: RestRequest<unknown, { fnr: string }>, res, ctx) => {
                const { fnr } = req.params;
                const geoEnhetResponse =
                    geoEnhetMockDataMap.get(fnr) ?? geoEnhetMockDataMap.get(geoEnhetMockDataMap.keys().next().value);
                return mapToMockedResponse(res, ctx, geoEnhetResponse);
            },
        ),

        rest.get(`${baseUrl}enhet/info/:enhetNr`, (req: RestRequest<unknown, { enhetNr: string }>, res, ctx) => {
            const { enhetNr } = req.params;
            const geoEnhetResponse =
                norg2MockData.get(enhetNr) ?? geoEnhetMockDataMap.get(geoEnhetMockDataMap.keys().next().value);
            return mapToMockedResponse(res, ctx, geoEnhetResponse);
        }),
    ];
}
