import { type RouteConfig, relative } from "@react-router/dev/routes";

const { route } = relative(import.meta.dirname);

/**
 * Toppnivåruter for redigering (dokumentredigering, -maskering og
 * skjemautfylling), migrert fra den frittstående bidrag-redigering-ui.
 * Ingen av rutene er nestet under `sak/:saksnummer`.
 */
export default [
    route("rediger", "../DokumentRedigeringRoute.tsx", { id: "rediger-index" }),
    route("rediger/:journalpostId", "../DokumentRedigeringRoute.tsx", { id: "rediger-journalpost" }),
    route("rediger/:journalpostId/:dokumentreferanse", "../DokumentRedigeringRoute.tsx", {
        id: "rediger-dokument",
    }),
    route("rediger/masker/:forsendelseId/:dokumentreferanse", "../DokumentMaskeringRoute.tsx"),
    route("rediger/skjemautfylling/:forsendelseId/:dokumentreferanse", "../SkjemaUtfyllingRoute.tsx"),
    route("rediger/debug/:forsendelseId/:dokumentreferanse", "../DebugRoute.tsx"),
] satisfies RouteConfig;
