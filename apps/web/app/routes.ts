import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
    route("internal/health/liveness", "./server/liveness.ts"),
    route("internal/health/readiness", "./server/readiness.ts"),
    route("internal/config", "./server/configRoute.ts"),
    route("log/:type?", "./server/logger/logRoute.ts"),
    route("proxy/:app/*", "./server/auth/proxy.ts"),

    index("routes/_index.tsx"),
    route("bruker/:brukerid", "./routes/bruker/BrukerLayout.tsx", [
        index("./routes/bruker/index.tsx"),
        route("reskontro", "./routes/bruker/reskontro/BrukerReskontroOversiktPage.tsx"),
    ]),

    route("sak/:saksnummer", "routes/sak/SakLayout.tsx", [
        route(
            "fogdhistorikk",
            "routes/sak/fogdhistorikk/FogdhistorikkPage.tsx",
        ),
        route(
            "belopshistorikk",
            "routes/sak/beløpshistorikk/BeløpshistorikkPage.tsx",
        ),
        route("reskontro", "routes/sak/reskontro/SakReskontroOversiktPage.tsx"),
    ]),
] satisfies RouteConfig;
