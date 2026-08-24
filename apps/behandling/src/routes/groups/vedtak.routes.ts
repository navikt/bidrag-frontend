import { type RouteConfig, relative } from "@react-router/dev/routes";

const { route } = relative(import.meta.dirname);

export default [route("vedtak/:vedtaksid", "../BehandlingRoute.tsx", { id: "vedtak" })] satisfies RouteConfig;
