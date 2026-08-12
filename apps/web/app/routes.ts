import {index, layout, route, type RouteConfig} from "@react-router/dev/routes";

export default [
    route("internal/health/liveness", "./server/liveness.ts"),
    route("internal/health/readiness", "./server/readiness.ts"),
    route("log/:type?", "./server/logger/logRoute.ts"),
    route("proxy/:app/*", "./server/auth/proxy.ts"),
    route("bisys/:target", "./routes/bisys/BisysRedirect.ts"),
    route("aapnedokument", "./routes/dokument/ÅpneDokumentRedirect.ts"),
    route("aapnedokument/:journalpostId/:dokumentreferanse", "./routes/dokument/ÅpneDokumentMedReferanseRedirect.ts"),
    route("dokument/:journalpostId/:dokumentreferanse?", "./routes/dokument/journalpost/JournalpostPage.tsx"),

    index("routes/_index.tsx"),

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

    route("samhandler/søk", "./routes/samhandler/SamhandlerSøk.tsx"),
    route("samhandler/:samhandlerId", "./routes/samhandler/SamhandlerDetaljer.tsx"),


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
