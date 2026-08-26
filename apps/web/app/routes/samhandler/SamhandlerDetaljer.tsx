import { SamhandlerDetaljer } from "@bidrag/samhandler";
import type { Route } from "./+types/SamhandlerDetaljer";

export default function SamhandlerDetaljerWrapper({ params }: Route.ComponentProps) {
    return <SamhandlerDetaljer samhandlerId={params.samhandlerId} />;
}
