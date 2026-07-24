import { redirectToBidragUi } from "../shared/redirectToBidragUi.ts";

export async function loader({ request }: { request: Request }) {
    return redirectToBidragUi(request);
}
