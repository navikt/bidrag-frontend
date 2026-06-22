import {layout, type RouteConfig} from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

export default [
    index("routes/_index.tsx"),
    route("internal/health/liveness", "routes/liveness.tsx"),
    route("internal/health/readiness", "routes/readiness.tsx"),
    route("token", "auth/token.ts"),
    route("log/*", "logger.ts"),
    route("proxy/:app/*", "auth/proxy.ts"),

    layout( "routes/sak/SakLayout.tsx" , [
        route("sak/:saksnummer/fogdhistorikk", "routes/sak/fogdhistorikk/FogdhistorikkPage.tsx"),
    ]),

] satisfies RouteConfig;
