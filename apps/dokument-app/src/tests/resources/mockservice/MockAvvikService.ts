import sinon, { type SinonSandbox } from "sinon";

export function mockSendAvvik(okResponse: boolean, sinonSandbox: SinonSandbox = sinon.createSandbox()) {
    // return (
    //     // sinonSandbox
    //     //     .stub(AvvikService.prototype, "sendAvvik")
    //     //     // @ts-expect-error
    //     //     .callsFake((avvik: Avvik, journalpostId: string, paloggetEnhet: string, saksnummer?: string) => {
    //     //         return Promise.resolve({ ok: okResponse, status: okResponse ? 200 : 400, data: null });
    //     //     })
    // );
}

export function mockHentAvvik(sinonSandbox: SinonSandbox = sinon.createSandbox()) {
    // return sinonSandbox
    //     .stub(AvvikService.prototype, "hentAvvik")
    //     .callsFake((journalpostId: string, paloggetEnhet: string, saksnummer?: string) => {
    //         return Promise.resolve([
    //             AvvikType.SLETT_JOURNALPOST,
    //             AvvikType.SEND_TIL_FAGOMRADE,
    //             AvvikType.TREKK_JOURNALPOST,
    //             AvvikType.ENDRE_FAGOMRADE,
    //             AvvikType.FEILFORE_SAK,
    //             AvvikType.INNG_TIL_UTG_DOKUMENT,
    //             AvvikType.BESTILL_ORIGINAL,
    //             AvvikType.BESTILL_RESKANNING,
    //             AvvikType.BESTILL_SPLITTING,
    //             AvvikType.OVERFOR_TIL_ANNEN_ENHET,
    //             AvvikType.MANGLER_ADRESSE,
    //             AvvikType.BESTILL_NY_DISTRIBUSJON,
    //             AvvikType.KOPIER_FRA_ANNEN_FAGOMRADE,
    //             AvvikType.REGISTRER_RETUR,
    //         ]);
    //     });
}
