import { redirect } from "react-router";
import { env } from "~/env.server.ts";

export function redirectToBidragUi(request: Request) {
    const url = new URL(request.url);
    url.searchParams.set("from", "bidrag-frontend");
    const destination = new URL(`${url.pathname}${url.search}`, env.BIDRAG_UI_BASE_URL);

    return redirect(destination.toString());
}
