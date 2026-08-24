import type { RouteConfig } from "@react-router/dev/routes";
import behandlingRoutes from "./routes/groups/behandling.routes";
import brukerveiledningRoutes from "./routes/groups/brukerveiledning.routes";
import notatRoutes from "./routes/groups/notat.routes";
import sakRoutes from "./routes/groups/sak.routes";
import vedtakRoutes from "./routes/groups/vedtak.routes";

export default [
    ...brukerveiledningRoutes,
    ...behandlingRoutes,
    ...sakRoutes,
    ...vedtakRoutes,
    ...notatRoutes,
] satisfies RouteConfig;
