import { type ResponseComposition, type RestHandler, type RestRequest, rest } from "msw";

import environment from "../environment";
import { avvikMockDataMap, journalpostMap } from "../tests/mockdata/journalpostMockData";
import { AvvikType } from "../types/api/AvvikTypes";
import {
    type ArkiverJournalpostResponse,
    type DistribuerJournalpostResponse,
    DokumentType,
    type LagreJournalpostRequest,
} from "../types/api/JournalpostTypes";
import { mapToMockedResponse } from "./mockResponseMapper";

export default function journalpostMock(): RestHandler[] {
    const journalpostUrl = environment.url.bidragDokument;
    return [
        rest.get(`${journalpostUrl}journal/:jpId`, (req: RestRequest<unknown, { jpId: string }>, res, ctx) => {
            const { jpId } = req.params;
            const journalpostResponse =
                journalpostMap.get(jpId) ?? journalpostMap.get(journalpostMap.keys().next().value);
            return mapToMockedResponse(res, ctx, journalpostResponse);
        }),
        rest.get(`${journalpostUrl}journal/distribuer/:jpId/enabled`, (req, res, ctx) => {
            return mapToMockedResponse(res, ctx);
        }),
        rest.post(
            `${environment.url.bidragDokumentArkivering}api/v1/arkivere/journalpost/:jpId`,
            (req, res: ResponseComposition<ArkiverJournalpostResponse>, ctx) => {
                const { jpId } = req.params;
                return mapToMockedResponse(res, ctx, {
                    jpIdJoark: "JOARK-555555",
                    jpIdBidrag: jpId,
                    journalpostFerdigstilt: true,
                    journalstatus: "FERDIGSTILT",
                });
            },
        ),
        rest.post(
            `${journalpostUrl}journal/distribuer/:jpId`,
            (req, res: ResponseComposition<DistribuerJournalpostResponse>, ctx) => {
                const { jpId } = req.params;
                return mapToMockedResponse(res, ctx, {
                    bestillingsId: "XXXX bestillingId XXXXX",
                    journalpostId: jpId,
                });
            },
        ),
        rest.patch(
            `${journalpostUrl}journal/:jpId`,
            (req: RestRequest<LagreJournalpostRequest, { jpId: string }>, res, ctx) => {
                const { jpId } = req.params;
                if (journalpostMap.has(jpId)) {
                    journalpostMap.get(jpId)!.data.journalpost.innhold = req.body.tittel;
                    journalpostMap.get(jpId)!.data.journalpost.dokumentDato = req.body.dokumentDato;
                    journalpostMap.get(jpId)!.data.journalpost.journalfortDato = req.body.journaldato;
                    journalpostMap.get(jpId)!.data.journalpost.avsenderNavn = req.body.avsenderNavn;
                }
                const journalpostResponse =
                    journalpostMap.get(jpId) ?? journalpostMap.get(journalpostMap.keys().next().value);
                return mapToMockedResponse(res, ctx, journalpostResponse);
            },
        ),
        rest.get(`${journalpostUrl}journal/:jpId/avvik`, (req: RestRequest<unknown, { jpId: string }>, res, ctx) => {
            const { jpId } = req.params;
            const hentAvvikResponse =
                avvikMockDataMap.get(jpId) ?? avvikMockDataMap.get(avvikMockDataMap.keys().next().value);
            return mapToMockedResponse(res, ctx, hentAvvikResponse);
        }),

        rest.post(`${journalpostUrl}journal/:jpId/avvik`, async (req: RestRequest<any, { jpId: string }>, res, ctx) => {
            const { jpId } = req.params;
            if ((await req.json()).avvikType === AvvikType.INNG_TIL_UTG_DOKUMENT) {
                journalpostMap.get(jpId)!.data.journalpost.dokumentType = DokumentType.U;
            }
            return mapToMockedResponse(res, ctx, { status: 200, avvikType: req?.body?.avvikType });
        }),
    ];
}
