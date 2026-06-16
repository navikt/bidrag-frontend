import type { RouteConfig } from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

export default [
    index("routes/_index.tsx"),
    route("/internal/health/liveness", "routes/liveness.tsx"),
    route("/internal/health/readiness", "routes/readiness.tsx"),

] satisfies RouteConfig;
