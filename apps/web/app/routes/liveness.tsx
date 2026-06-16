import type {Route} from "../../.react-router/types/app/routes/+types/liveness.ts";

export function loader(_: Route.LoaderArgs) {
    return new Response("ok", { status: 200 });
}
