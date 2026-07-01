import {
    index,
    layout,
    type RouteConfig,
    route,
} from "@react-router/dev/routes";

export default [
    route("internal/health/liveness", "./server/liveness.tsx"),
    route("internal/health/readiness", "./server/readiness.tsx"),
    route("internal/config", "./server/configRoute.ts"),
    route("log/:type?", "./server/logger/logRoute.ts"),
    route("proxy/:app/*", "./server/auth/proxy.ts"),

    index("routes/_index.tsx"),
    layout("routes/sak/SakLayout.tsx", [
        route(
            "sak/:saksnummer/fogdhistorikk",
            "routes/sak/fogdhistorikk/FogdhistorikkPage.tsx",
        ),
    ]),
] satisfies RouteConfig;
