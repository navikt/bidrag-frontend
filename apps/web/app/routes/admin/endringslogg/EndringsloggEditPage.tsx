import EndringsloggEditPage from "@bidrag/admin-app/endringslogg/EndringsloggEditPage.tsx";
import type { Route } from "./+types/EndringsloggEditPage";

export default function EndringsloggEditPageWrapper({ params }: Route.ComponentProps){
    return <EndringsloggEditPage id={params.id} />
};
