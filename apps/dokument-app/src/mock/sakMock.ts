import { type RestHandler, type RestRequest, rest } from "msw";

import environment from "../environment";
import { personMap } from "../tests/mockdata/personMockData";
import { sakMap } from "../tests/mockdata/sakMockData";
import type { NySakResponse } from "../types/api/SakTypes";
import { mapToMockedResponse } from "./mockResponseMapper";

export default function sakMock(): RestHandler[] {
    const baseUrl = environment.url.bidragSak;
    return [
        rest.get(`${baseUrl}person/sak/:personId`, (req: RestRequest<unknown, { personId: string }>, res, ctx) => {
            const { personId } = req.params;
            const personResponse = personMap.get(personId);
            const sakResponse = Array.from(sakMap.values())
                .filter((sak) => sak.data.roller!.some((rolle) => rolle.foedselsnummer === personId))
                .map((sak) => sak.data);
            return mapToMockedResponse(res, ctx, { status: personResponse?.status ?? 200, data: sakResponse });
        }),
        rest.get(`${baseUrl}sak/:saksnummer`, (req: RestRequest<unknown, { saksnummer: string }>, res, ctx) => {
            const { saksnummer } = req.params;
            const sakResponse = sakMap.get(saksnummer);
            return mapToMockedResponse(res, ctx, sakResponse);
        }),
        rest.get(`${baseUrl}/sak/ny`, (req, res, ctx) => {
            const eierfogd = req.url.searchParams.get("eierfogd");
            const sakResponse: NySakResponse = {
                saksnummer: "1234567",
            };
            return mapToMockedResponse(res, ctx, sakResponse);
        }),
    ];
}
