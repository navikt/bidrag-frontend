import { redirect } from "react-router";
import { env } from "~/env.server.ts";

export async function loader() {
    return redirect(env.BISYS_URL, 307);
}
