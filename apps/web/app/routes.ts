import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
    route("internal/health/liveness", "./server/liveness.ts"),
    route("internal/health/readiness", "./server/readiness.ts"),
    route("log/:type?", "./server/logger/logRoute.ts"),
    route("proxy/:app/*", "./server/auth/proxy.ts"),
    route("bisys/:target", "./routes/bisys/BisysRedirect.ts"),
    route("aapnedokument", "./routes/dokument-ui/AapneDokumentRedirect.ts"),
    route(
        "aapnedokument/:journalpostId/:dokumentreferanse",
        "./routes/dokument-ui/AapneDokumentMedReferanseRedirect.ts",
    ),

    index("routes/_index.tsx"),
    route("bruker/:brukerid", "./routes/bruker/BrukerLayout.tsx", [
        index("./routes/bruker/index.tsx"),
        route("reskontro", "./routes/bruker/reskontro/BrukerReskontroOversiktPage.tsx"),
    ]),

    route("sak/:saksnummer", "routes/sak/SakLayout.tsx", [
        route("fogdhistorikk", "routes/sak/fogdhistorikk/FogdhistorikkPage.tsx"),
        route("belopshistorikk", "routes/sak/beløpshistorikk/BeløpshistorikkPage.tsx"),
        route("sakshistorikk", "routes/sak/sakshistorikk/SakshistorikkPage.tsx"),
        route("journal/:journalpostId", "routes/dokument-ui/JournalRedirect.ts"),
        route("notat", "routes/forsendelse-ui/NotatRedirect.ts"),
        route("forsendelse", "routes/forsendelse-ui/ForsendelseRedirect.ts"),
        route("vedtak/:vedtaksid", "routes/behandling-ui/VedtakRedirect.ts"),
        route("reskontro", "routes/sak/reskontro/SakReskontroOversiktPage.tsx"),
    ]),
] satisfies RouteConfig;
