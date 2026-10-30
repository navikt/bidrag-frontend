import { HTTPStatus } from "../enum/HttpStatus";
import { PersonFamilierelasjonerResponse } from "../types/personsearch";

export const FAMILIERELASJONER_PATH = "/rtv-bidrag/api/v1/person/";

export default class PersonSearchService {
    /**
     * Henter familierelasjoner for en person via Bisys sin proxy.
     * @param fnr Fødselsnummer til personen
     * @returns Familierelasjoner, `undefined` hvis responsen ikke er OK, eller `null` ved nettverksfeil
     */
    async hentFamilierelasjoner(fnr: string): Promise<PersonFamilierelasjonerResponse> {
        return await fetch(FAMILIERELASJONER_PATH + fnr.trim(), { mode: "cors", credentials: "include" })
            .then(async (response) => {
                if (response.status === HTTPStatus.OK) {
                    return response.json();
                }
            })
            .catch((e) => {
                console.log("Det skjedde en feil ved henting av familierelasjoner", e);
                return null;
            });
    }
}
