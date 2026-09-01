import type { EnhetResponse, EnhetType } from "../../types/api/EnhetTypes";

export default class EnhetBuilder {
    static get Builder() {
        let enhet: EnhetResponse;

        class Builder {
            constructor(enhetIdent: string) {
                enhet = {
                    enhetIdent,
                };
            }

            withEnhetNavn(navn: string) {
                enhet.enhetNavn = navn;
                return this;
            }

            withEnhetType(enhetType: EnhetType) {
                enhet.enhetType = enhetType;
                return this;
            }

            build(): EnhetResponse {
                return enhet as EnhetResponse;
            }
        }
        return Builder;
    }
}
