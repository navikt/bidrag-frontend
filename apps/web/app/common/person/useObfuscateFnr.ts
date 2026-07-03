import { useMemo } from "react";
import { FnrObfuscator } from "~/common/person/FnrObfuscator.ts";

export function useObfuscateFnr() {
    const obfuscator = useMemo(() => new FnrObfuscator(), []);
    const encodeFnr = (fnr: string) => {
        return obfuscator.encode(fnr);
    };

    const decodeFnr = (fnr: string) => {
        return obfuscator.decode(fnr);
    };
    return {
        encodeFnr,
        decodeFnr,
    };
}
