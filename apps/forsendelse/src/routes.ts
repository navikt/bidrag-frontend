import type { RouteConfig } from "@react-router/dev/routes";
import forsendelseRoutes from "./routes/groups/forsendelse.routes";

export { default as sakRoutes } from "./routes/groups/sak.routes";

export default [...forsendelseRoutes] satisfies RouteConfig;
