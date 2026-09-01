import type { RouteConfig } from "@react-router/dev/routes";
import dokumentRoutes from "./routes/groups/dokument.routes";

export { default as sakRoutes } from "./routes/groups/sak.routes";

export default [...dokumentRoutes] satisfies RouteConfig;
