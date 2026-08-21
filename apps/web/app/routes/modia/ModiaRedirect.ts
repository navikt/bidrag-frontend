import { redirect } from "react-router";
import { env } from "~/env.server.ts";

export async function loader({ request }: { request: Request }) {
    const url = new URL(request.url);
    const destination = new URL(`${env.MODIA_URL.replace(/\/$/, "")}/person`);
    destination.search = url.searchParams.toString();

    return redirect(destination.toString());
}
