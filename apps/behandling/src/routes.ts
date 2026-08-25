import type { RouteConfig } from "@react-router/dev/routes";
import behandlingRoutes from "./routes/groups/behandling.routes";
import brukerveiledningRoutes from "./routes/groups/brukerveiledning.routes";

export { default as sakRoutes } from "./routes/groups/sak.routes";

export default [...brukerveiledningRoutes, ...behandlingRoutes] satisfies RouteConfig;
