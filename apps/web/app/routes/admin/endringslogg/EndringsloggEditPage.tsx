import { default as EndringsloggEditPage } from "@bidrag/admin-app/endringslogg/EndringsloggEditPage";
import type { Route } from "./+types/EndringsloggEditPage";

export default function EndringsloggEditPageWrapper({ params }: Route.ComponentProps) {
    return <EndringsloggEditPage id={params.id} />;
}
