import type { Route } from "./+types/DokumenterPage";
import { DokumenterFremviser } from "./DokumenterFremviser";

export async function loader({ request }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const dokumenter = url.searchParams.getAll("dokument").filter(Boolean);
    return { dokumenter };
}

export default function DokumenterPage({ loaderData }: Route.ComponentProps) {
    const { dokumenter } = loaderData;

    return (
        <>
            <title>Dokumenter</title>
            <DokumenterFremviser dokumenter={dokumenter} />
        </>
    );
}
