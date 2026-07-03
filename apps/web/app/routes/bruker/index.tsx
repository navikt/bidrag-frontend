import {useObfuscateFnr} from "~/common/person/useObfuscateFnr.ts";
import type {Route} from "./+types/index";

export default function BrukerIndex({params}: Route.ComponentProps) {
    const {decodeFnr} = useObfuscateFnr();
    const brukerId = params.brukerid;
    const fnr = decodeFnr(brukerId)

    return (
        <div>Hallo bruker {fnr}</div>

    );
}
