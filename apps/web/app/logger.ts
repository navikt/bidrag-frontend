import {Route} from "+/+types/logger.ts";

export async function action({request}: Route.ActionArgs) {
    console.log("logger", await request.json());
    return {}

}
