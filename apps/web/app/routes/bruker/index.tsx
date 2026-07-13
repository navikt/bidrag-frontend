import {useObfuscateFnr} from "~/common/person/useObfuscateFnr.ts";
import type {Route} from "./+types/index";

export default function BrukerIndex({params}: Route.ComponentProps) {
    const {decodeFnr, encodeFnr} = useObfuscateFnr();
    const brukerId = params.brukerid;
    const fnr = decodeFnr(brukerId);
    const enc = Number(brukerId) ? encodeFnr(brukerId) : brukerId;

    return (
        <div>Hallo bruker {fnr}, encoded: {enc}</div>

    );
}
