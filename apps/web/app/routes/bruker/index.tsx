import {useObfusicateFnr} from "~/common/person/useObfusicateFnr.ts";
import type {Route} from "./+types/index";

export default function BrukerIndex({params}: Route.ComponentProps) {
    const {decodeFnr} = useObfusicateFnr();
    const brukerId = params.brukerid;
    const fnr = decodeFnr(brukerId)

    return (
        <div>Hallo bruker {fnr}</div>

    );
}
