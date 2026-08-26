import adminroutes from "@bidrag/admin-app/routes";
import behandlingroutes, { sakRoutes as behandlingSakRoutes } from "@bidrag/behandling/routes";
import { index, layout, prefix, type RouteConfig, route } from "@react-router/dev/routes";

export default [
    route("internal/health/liveness", "./server/liveness.ts"),
    route("internal/health/readiness", "./server/readiness.ts"),
    route("log/:type?", "./server/logger/logRoute.ts"),
    route("me", "./server/meRoute.ts"),
    route("proxy/:app/*", "./server/auth/proxy.ts"),
    route("unleash/proxy/*", "./server/unleash/unleashProxyRoute.ts"),
    route("bisys/:target", "./routes/bisys/BisysRedirect.ts"),
    route("samhandler/*", "./routes/samhandler/SamhandlerRedirect.ts"),
    route("modia/person", "./routes/modia/ModiaRedirect.ts"),
    route("aapnedokument", "./routes/dokument/ÅpneDokumentRedirect.ts"),
    route("aapnedokument/:journalpostId/:dokumentreferanse", "./routes/dokument/ÅpneDokumentMedReferanseRedirect.ts"),
    route("dokument/:journalpostId/:dokumentreferanse?", "./routes/dokument/journalpost/JournalpostPage.tsx"),

    index("routes/_index.tsx"),
    ...prefix("admin", adminroutes),

    // Behandling (migrert fra den frittstående bidrag-behandling-ui)
    ...behandlingroutes,

    route("bruker/:brukerid", "./routes/bruker/BrukerLayout.tsx", [
        index("./routes/bruker/index.tsx"),
        route("reskontro", "./routes/bruker/reskontro/BrukerReskontroOversiktPage.tsx"),
    ]),

    route("samhandler/søk", "./routes/samhandler/SamhandlerSøk.tsx"),
    route("samhandler/:samhandlerId", "./routes/samhandler/SamhandlerDetaljer.tsx"),

    route("sak/:saksnummer", "routes/sak/SakBaseLayout.tsx", [
        ...behandlingSakRoutes,
        route("dokumenter", "routes/sak/dokumenter/SaksdokumenterPage.tsx"),

        layout("routes/sak/SakStandardLayout.tsx", [
            route("fogdhistorikk", "routes/sak/fogdhistorikk/FogdhistorikkPage.tsx"),
            route("belopshistorikk", "routes/sak/beløpshistorikk/BeløpshistorikkPage.tsx"),
            route("sakshistorikk", "routes/sak/sakshistorikk/SakshistorikkPage.tsx"),
            route("reskontro", "routes/sak/reskontro/SakReskontroOversiktPage.tsx"),
        ]),

        route("journal/:journalpostId", "routes/dokument/JournalRedirect.ts"),
        route("notat", "routes/forsendelse/NotatRedirect.ts"),
        // route("forsendelse/*", "routes/forsendelse/ForsendelseRedirect.ts"),
        route("saksroller", "routes/sak/saksroller/SaksrollerPage.tsx"),
    ]),
] satisfies RouteConfig;
