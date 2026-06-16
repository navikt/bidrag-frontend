import {Route} from "../../.react-router/types/app/routes/+types/readiness.ts";

export function loader(_: Route.LoaderArgs) {
    return new Response("ok", { status: 200 });
}
