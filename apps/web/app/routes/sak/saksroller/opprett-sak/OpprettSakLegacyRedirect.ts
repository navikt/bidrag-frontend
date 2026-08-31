import { redirect } from "react-router";

/**
 * Legacy-kompatibilitet: bidrag-ui/Bisys lenket til
 * `/opprettsakmodal?ident=...&navn=...&eierfogd=...`. Denne ruten videresender
 * til den migrerte "Opprett ny sak"-siden med samme query-parametre bevart.
 */
export async function loader({ request }: { request: Request }) {
    const url = new URL(request.url);
    const destination = new URL("/sak/opprett", url.origin);
    destination.search = url.searchParams.toString();

    return redirect(destination.toString());
}
