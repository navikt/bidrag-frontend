import { redirectToBidragUi } from "./redirectToBidragUi.ts";

export async function loader({ request }: { request: Request }) {
    return redirectToBidragUi(request);
}
