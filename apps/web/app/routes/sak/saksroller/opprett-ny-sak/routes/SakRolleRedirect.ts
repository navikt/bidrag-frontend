import { redirect } from "react-router";

export async function loader({ request }: { request: Request }) {
    const url = new URL(request.url);
    const saksnummer = url.searchParams.get("saksnummer");
    const destination = saksnummer
        ? new URL(`/sak/${saksnummer}/saksroller`, url.origin)
        : new URL("/sak/ny/saksroller", url.origin);

    const gjenværendeParams = new URLSearchParams(url.searchParams);
    gjenværendeParams.delete("saksnummer");
    destination.search = gjenværendeParams.toString();

    return redirect(destination.toString());
}
