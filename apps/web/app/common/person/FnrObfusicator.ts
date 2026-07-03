import Sqids from "sqids";

export class FnrObfusicator {
    private sqids: Sqids
    constructor(alphabet?: string){
        this.sqids=new Sqids({
            alphabet: alphabet,
        })
    }

    encode(fnr: string): string {
        if(!/^\d+$/.test(fnr)){
            throw new Error("Fnr must be a number")
        }
        const salt = Math.floor(Math.random() * 90) + 10; // random number between 10 and 99
        const saltedFnr = salt.toString() + fnr;
        const saltedFnrNumber = parseInt(saltedFnr, 10);
        return this.sqids.encode([saltedFnrNumber]);
    }

    decode(obfuscatedFnr: string): string {
        const decoded = this.sqids.decode(obfuscatedFnr);
        if(decoded.length === 0){
            throw new Error("Invalid obfuscated Fnr")
        }
        const saltedFnr = decoded[0]?.toString();
        if(!saltedFnr){
            throw new Error("Invalid obfuscated Fnr")
        }
        return saltedFnr.substring(2); // remove the first two digits (salt)
    }

}
