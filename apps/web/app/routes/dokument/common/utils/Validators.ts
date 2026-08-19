import validateFnr from "./fnrValidator";
import { isEmpty } from "./ObjectUtils";

export default class Validator {
    static isValidFnr(value: string) {
        return validateFnr(value);
    }

    static isValidSaksnummer(saksnummer: string | number) {
        return !isEmpty(saksnummer) && saksnummer.toString().length === 7;
    }
}
