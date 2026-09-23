import { requireEnvironmentVariable } from "./environment.ts";

export const testData = {
    brukerident: requireEnvironmentVariable("E2E_BRUKERIDENT"),
    saksnummer: requireEnvironmentVariable("E2E_SAKSNUMMER"),
    samhandlerId: requireEnvironmentVariable("E2E_SAMHANDLER_ID"),
    behandlingId: requireEnvironmentVariable("E2E_BEHANDLING_ID"),
    vedtakId: requireEnvironmentVariable("E2E_VEDTAK_ID"),
    journalpostId: requireEnvironmentVariable("E2E_JOURNALPOST_ID"),
    dokumentreferanse: requireEnvironmentVariable("E2E_DOKUMENTREFERANSE"),
    forsendelseId: requireEnvironmentVariable("E2E_FORSENDELSE_ID"),
    endringsloggId: requireEnvironmentVariable("E2E_ENDRINGSLOGG_ID"),
    broadcastChannel: requireEnvironmentVariable("E2E_BROADCAST_CHANNEL"),
    enhet: requireEnvironmentVariable("E2E_ENHET"),
    testpersonNavn: requireEnvironmentVariable("E2E_TESTPERSON_NAVN"),
} as const;
