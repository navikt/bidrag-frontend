import { DefaultRestService } from "@navikt/bidrag-ui-common";

import { isEmpty } from "../common/utils/ObjectUtils";
import environment from "../environment";
import type { PersonAdresseDto, PersonResponse } from "../types/api/PersonTypes";
import { HTTPStatus } from "../types/enum/HttpStatus";
import type { Person } from "../types/person";

export default class PersonService extends DefaultRestService {
    constructor() {
        super("bidrag-person", environment.url.bidragPerson + "/bidrag-person", false, environment.system.environment);
    }
    async getPerson(personid: string): Promise<Person> {
        const defaultValue = { ident: personid, navn: "", visningsnavn: "" };
        if (isEmpty(personid)) {
            return defaultValue;
        }

        const personResponse = await this.post<PersonResponse>(`/informasjon`, JSON.stringify({ ident: personid }));
        if (personResponse.status === HTTPStatus.NO_CONTENT) {
            return { ...defaultValue, feil: true };
        }

        if (personResponse.status === HTTPStatus.FORBIDDEN) {
            return { ident: personid, begrensetTilgang: true, feil: true };
        }
        return personResponse.data;
    }

    async getPersonAdresse(personid: string): Promise<PersonAdresseDto | null> {
        if (personid == null || personid?.length == 0) return null;
        const personResponse = await this.post<PersonAdresseDto>(`/adresse/post`, JSON.stringify({ ident: personid }));
        if (personResponse.status === HTTPStatus.NO_CONTENT) {
            return null;
        }
        return personResponse.data;
    }
}
