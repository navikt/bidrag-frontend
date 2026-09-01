import { type ResponseComposition, type RestHandler, type RestRequest, rest } from "msw";

import environment from "../environment";
import { personMap } from "../tests/mockdata/personMockData";
import type { PersonAdresseDto } from "../types/api/PersonTypes";
import { mapToMockedResponse } from "./mockResponseMapper";

export default function personMock(): RestHandler[] {
    const baseUrl = environment.url.bidragPerson;
    return [
        rest.get(`${baseUrl}informasjon/:personId`, (req: RestRequest<unknown, { personId: string }>, res, ctx) => {
            const { personId } = req.params;
            const personResponse = personMap.get(personId);
            return mapToMockedResponse(res, ctx, { status: personResponse?.status ?? 204, data: personResponse?.data });
        }),
        rest.get(`${baseUrl}adresse/:personId`, (req, res: ResponseComposition<PersonAdresseDto>, ctx) => {
            return mapToMockedResponse(res, ctx, {
                adresselinje1: "Kallegata 2A",
                postnummer: "3024",
                poststed: "Drammen",
                land: "NO",
            });
        }),
    ];
}
