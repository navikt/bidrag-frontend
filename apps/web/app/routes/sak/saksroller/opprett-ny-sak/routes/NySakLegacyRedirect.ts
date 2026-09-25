import { redirect } from "react-router";

/** Gammel adresse for ny sak. Videresender til `/sak/ny` med query-parametrene bevart. */
export async function loader({ request }: { request: Request }) {
    const url = new URL(request.url);
    const destination = new URL("/sak/ny", url.origin);
    destination.search = url.searchParams.toString();

    return redirect(destination.toString());
}
