import { testData } from "../config/testData.ts";

const encode = encodeURIComponent;

function withQuery(path: string, entries: Record<string, string>) {
    return `${path}?${new URLSearchParams(entries)}`;
}

export const routes = {
    admin: "/admin",
    adminEndringslogg: "/admin/endringslogg",
    adminEndringsloggNy: "/admin/endringslogg/ny",
    adminEndringsloggRediger: `/admin/endringslogg/${encode(testData.endringsloggId)}`,
    adminDokumentasjon: "/admin/dokumentasjon",
    adminVedtakExplorer: withQuery("/admin/vedtak/explorer", {
        id: testData.vedtakId,
        erBehandlingId: "false",
    }),
    brukerveiledningForskudd: "/behandling/brukerveiledning/forskudd",
    brukerveiledningBidrag: "/behandling/brukerveiledning/bidrag",
    brukerveiledningSaerbidrag: "/behandling/brukerveiledning/sarbidrag",
    forsendelseBrukerveiledning: "/forsendelse/brukerveiledning",
    opprettSak: withQuery("/sak/opprett", {
        ident: testData.brukerident,
        navn: testData.testpersonNavn,
        eierfogd: testData.enhet,
    }),
    nySaksroller: "/sak/ny/saksroller",
    bruker: `/bruker/${encode(testData.brukerident)}`,
    brukerReskontro: `/bruker/${encode(testData.brukerident)}/reskontro`,
    brukerSumPrSak: `/bruker/${encode(testData.brukerident)}/sumprsak`,
    brukerInnkreving: `/bruker/${encode(testData.brukerident)}/innkreving`,
    samhandlerSok: "/samhandler/søk",
    samhandlerDetaljer: `/samhandler/${encode(testData.samhandlerId)}`,
    sakDokumenter: `/sak/${encode(testData.saksnummer)}/dokumenter`,
    sakFogdhistorikk: `/sak/${encode(testData.saksnummer)}/fogdhistorikk`,
    sakBelopshistorikk: `/sak/${encode(testData.saksnummer)}/belopshistorikk`,
    sakshistorikk: `/sak/${encode(testData.saksnummer)}/sakshistorikk`,
    sakReskontro: `/sak/${encode(testData.saksnummer)}/reskontro`,
    saksroller: `/sak/${encode(testData.saksnummer)}/saksroller`,
    sakBehandling: `/sak/${encode(testData.saksnummer)}/behandling/${encode(testData.behandlingId)}`,
    sakBehandlingNotat: `/sak/${encode(testData.saksnummer)}/behandling/${encode(testData.behandlingId)}/notat`,
    sakBegrunnelse: withQuery(
        `/sak/${encode(testData.saksnummer)}/behandling/${encode(testData.behandlingId)}/begrunnelse/${encode(testData.broadcastChannel)}`,
        { label: "Begrunnelse", description: "Playwright-regresjonstest", value: "", prefilledHtml: "" },
    ),
    sakVedtak: `/sak/${encode(testData.saksnummer)}/vedtak/${encode(testData.vedtakId)}`,
    sakOpprettForsendelse: withQuery(`/sak/${encode(testData.saksnummer)}/forsendelse`, {
        enhet: testData.enhet,
    }),
    sakOpprettNotat: withQuery(`/sak/${encode(testData.saksnummer)}/notat`, { enhet: testData.enhet }),
    sakForsendelse: withQuery(`/sak/${encode(testData.saksnummer)}/forsendelse/${encode(testData.forsendelseId)}`, {
        enhet: testData.enhet,
    }),
    sakVisJournalpost: `/sak/${encode(testData.saksnummer)}/journal/${encode(testData.journalpostId)}`,
    sakRegistrerJournalpost: `/sak/${encode(testData.saksnummer)}/journalpost/${encode(testData.journalpostId)}`,
    behandlingNotat: `/behandling/${encode(testData.behandlingId)}/notat`,
    behandlingBegrunnelse: withQuery(
        `/behandling/${encode(testData.behandlingId)}/begrunnelse/${encode(testData.broadcastChannel)}`,
        { label: "Begrunnelse", description: "Playwright-regresjonstest", value: "", prefilledHtml: "" },
    ),
    vedtakNotat: `/vedtak/${encode(testData.vedtakId)}/notat`,
    forsendelse: withQuery(`/forsendelse/${encode(testData.forsendelseId)}`, { enhet: testData.enhet }),
    visJournalpost: `/journal/${encode(testData.journalpostId)}`,
    registrerJournalpost: `/journalpost/${encode(testData.journalpostId)}`,
    dokument: `/dokument/${encode(testData.journalpostId)}/${encode(testData.dokumentreferanse)}`,
    redigerDokument: `/rediger/${encode(testData.journalpostId)}/${encode(testData.dokumentreferanse)}`,
    maskerDokument: `/rediger/masker/${encode(testData.forsendelseId)}/${encode(testData.dokumentreferanse)}`,
    fyllUtSkjema: `/rediger/skjemautfylling/${encode(testData.forsendelseId)}/${encode(testData.dokumentreferanse)}`,
} as const;
