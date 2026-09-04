import { type RouteConfig, relative } from "@react-router/dev/routes";

const { route } = relative(import.meta.dirname);

/**
 * Toppnivåruter for dokument (utenfor sakskontekst). Nestes direkte i
 * web-appens rot-rutetre, på samme måte som forsendelsens toppnivåruter.
 */
export default [
    route("journal/:journalpostId", "../VisJournalpostRoute.tsx", { id: "dokument-vis-journalpost" }),
    route("journalpost/:journalpostId", "../RegistrerJournalpostRoute.tsx", { id: "dokument-registrer-journalpost" }),
] satisfies RouteConfig;
