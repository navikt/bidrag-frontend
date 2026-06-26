import {layout, type RouteConfig} from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

export default [
    index("routes/_index.tsx"),
    route("internal/health/liveness", "./server/liveness.tsx"),
    route("internal/health/readiness", "./server/readiness.tsx"),
    route("log/:type?", "./server/logger/logRoute.ts"),
    route("proxy/:app/*", "./server/auth/proxy.ts"),

    layout( "routes/sak/SakLayout.tsx" , [
        route("sak/:saksnummer/fogdhistorikk", "routes/sak/fogdhistorikk/FogdhistorikkPage.tsx"),
    ]),

] satisfies RouteConfig;
