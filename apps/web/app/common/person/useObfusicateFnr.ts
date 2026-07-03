import {FnrObfusicator} from "~/common/person/FnrObfusicator.ts";

export function useObfusicateFnr() {
    const obfuscator = new FnrObfusicator();
    const encodeFnr = (fnr: string) => {
       return  obfuscator.encode(fnr)
    }

    const decodeFnr = (fnr: string) => {
        return obfuscator.decode(fnr)
    }
    return {
        encodeFnr,
        decodeFnr
    }
}
