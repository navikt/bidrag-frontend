import { redirect } from "react-router";

/**
 * Bisys lenker alltid til samme URL-mal for rollebildet, uansett om saken finnes eller ikke:
 * - Sak finnes: `/sak/rolle?saksnummer={saksnr}&enhet={enhet}&sessionState=...&from=bisys`
 * - Ny sak: `/sak/rolle?enhet={enhet}&sessionState=...&from=bisys` (uten saksnummer)
 */
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
