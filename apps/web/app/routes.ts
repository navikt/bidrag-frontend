import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
    route("internal/health/liveness", "./server/liveness.ts"),
    route("internal/health/readiness", "./server/readiness.ts"),
    route("log/:type?", "./server/logger/logRoute.ts"),
    route("me", "./server/meRoute.ts"),
    route("proxy/:app/*", "./server/auth/proxy.ts"),
    route("bisys/:target", "./routes/bisys/BisysRedirect.ts"),
    route("modia/person", "./routes/modia/ModiaRedirect.ts"),
    route("aapnedokument", "./routes/dokument/ÅpneDokumentRedirect.ts"),
    route("aapnedokument/:journalpostId/:dokumentreferanse", "./routes/dokument/ÅpneDokumentMedReferanseRedirect.ts"),
    route("dokument/:journalpostId/:dokumentreferanse?", "./routes/dokument/journalpost/JournalpostPage.tsx"),

    index("routes/_index.tsx"),

    // Behandling (migrert fra den frittstående bidrag-behandling-ui)
    route("behandling/brukerveiledning/forskudd", "./routes/behandling/brukerveiledning/ForskuddBrukerveiledning.tsx"),
    route("behandling/brukerveiledning/bidrag", "./routes/behandling/brukerveiledning/BidragBrukerveiledning.tsx"),
    route(
        "behandling/brukerveiledning/sarbidrag",
        "./routes/behandling/brukerveiledning/SaerbidragBrukerveiledning.tsx",
    ),

    route("behandling/:behandlingId", "./routes/behandling/BehandlingPage.tsx", { id: "behandling" }),
    route("behandling/:behandlingId/notat", "./routes/behandling/NotatPage.tsx", { id: "behandling-notat" }),
    route("behandling/:behandlingId/begrunnelse/:broadcastChannel", "./routes/behandling/BegrunnelsePage.tsx", {
        id: "behandling-begrunnelse",
    }),

    route("sak/:saksnummer/behandling/:behandlingId", "./routes/behandling/BehandlingPage.tsx", {
        id: "sak-behandling",
    }),
    route("sak/:saksnummer/behandling/:behandlingId/notat", "./routes/behandling/NotatPage.tsx", {
        id: "sak-behandling-notat",
    }),
    route(
        "sak/:saksnummer/behandling/:behandlingId/begrunnelse/:broadcastChannel",
        "./routes/behandling/BegrunnelsePage.tsx",
        { id: "sak-behandling-begrunnelse" },
    ),

    route("vedtak/:vedtaksid", "./routes/behandling/BehandlingPage.tsx", { id: "vedtak" }),
    route("vedtak/:vedtaksid/notat", "./routes/behandling/NotatPage.tsx", { id: "vedtak-notat" }),

    route("admin/", "./routes/admin/AdminLayout.tsx", [
        index("./routes/admin/index.tsx"),
        route("endringslogg", "./routes/admin/endringslogg/EndringsloggLayout.tsx", [
            index("./routes/admin/endringslogg/index.tsx"),
            route("ny", "./routes/admin/endringslogg/EndringsloggCreatePage.tsx"),
            route(":id", "./routes/admin/endringslogg/EndringsloggEditPage.tsx"),
        ]),
        route("dokumentasjon", "./routes/admin/dokumentasjon/DokumentasjonPage.tsx"),
        route("vedtak/explorer", "./routes/admin/vedtak/explorer/VedtakExplorerPage.tsx"),
    ]),

    route("bruker/:brukerid", "./routes/bruker/BrukerLayout.tsx", [
        index("./routes/bruker/index.tsx"),
        route("reskontro", "./routes/bruker/reskontro/BrukerReskontroOversiktPage.tsx"),
    ]),

    route("sak/:saksnummer", "routes/sak/SakBaseLayout.tsx", [
        route("dokumenter", "routes/sak/dokumenter/SaksdokumenterPage.tsx"),

        layout("routes/sak/SakStandardLayout.tsx", [
            route("fogdhistorikk", "routes/sak/fogdhistorikk/FogdhistorikkPage.tsx"),
            route("belopshistorikk", "routes/sak/beløpshistorikk/BeløpshistorikkPage.tsx"),
            route("sakshistorikk", "routes/sak/sakshistorikk/SakshistorikkPage.tsx"),
            route("reskontro", "routes/sak/reskontro/SakReskontroOversiktPage.tsx"),
        ]),

        route("journal/:journalpostId", "routes/dokument/JournalRedirect.ts"),
        route("notat", "routes/forsendelse/NotatRedirect.ts"),
        route("forsendelse/*", "routes/forsendelse/ForsendelseRedirect.ts"),
        route("vedtak/:vedtaksid", "routes/behandling/VedtakRedirect.ts"),
    ]),
] satisfies RouteConfig;
