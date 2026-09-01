import { type RouteConfig, relative } from "@react-router/dev/routes";

const { route } = relative(import.meta.dirname);

/**
 * Dokument i sakskontekst. Nestes som barn av web-appens `sak/:saksnummer`-layout
 * (`SakBaseLayout`), derfor relative stier uten `sak/:saksnummer`-prefiks.
 */
export default [
    route("journal/:journalpostId", "../VisJournalpostRoute.tsx", { id: "sak-vis-journalpost" }),
    route("registrer/:journalpostId", "../RegistrerJournalpostRoute.tsx", { id: "sak-registrer-journalpost" }),
] satisfies RouteConfig;
