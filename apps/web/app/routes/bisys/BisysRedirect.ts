import { redirect } from "react-router";
import { env } from "~/env.server.ts";

const BISYS_PATHS = {
    sak: "Sak.do",
    sakForside: "Sak.do",
    sakHistorikk: "Sakshistorikk.do",
    oppgaveliste: "Oppgaveliste.do",
} as const;

type BisysTarget = keyof typeof BISYS_PATHS;

function isBisysTarget(value: string): value is BisysTarget {
    return Object.hasOwn(BISYS_PATHS, value);
}

export async function loader({ params, request }: { params: { target: string }; request: Request }) {
    const target = params.target;
    if (!isBisysTarget(target)) {
        throw new Response("Ukjent bisys-target", { status: 400 });
    }

    const url = new URL(request.url);
    const destination = new URL(BISYS_PATHS[target], env.BISYS_URL);
    destination.search = url.searchParams.toString();

    return redirect(destination.toString());
}
