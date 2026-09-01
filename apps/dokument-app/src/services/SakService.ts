import { DefaultRestService } from "@navikt/bidrag-ui-common";

import { isEmpty } from "../common/utils/ObjectUtils";
import environment from "../environment";
import type { InternalRolleDto, NySakResponse } from "../types/api/SakTypes";
import type { Enhet } from "../types/enhet";
import type { Sak } from "../types/sak";
import EnhetService from "./EnhetService";
import PersonService from "./PersonService";

export default class SakService extends DefaultRestService {
    constructor() {
        super("bidrag-sak", environment.url.bidragSak, false, environment.system.environment);
    }

    async opprettNySak(paloggetenhet: string): Promise<NySakResponse | null> {
        const response = await this.post<NySakResponse>(
            "/sak/ny?eierfogd=" + paloggetenhet,
            JSON.stringify({ eierfogd: paloggetenhet }),
            this.createHeaders(paloggetenhet),
        );
        if (response.status !== 201) {
            throw new Error(`Det skjedde en feil ved registrering av sak. Fikk respons ${response.status}`);
        }
        return response.data;
    }
    async hentSak(saksnummer: string): Promise<Sak> {
        const defaultSak = { saksnummer, roller: [] };
        if (isEmpty(saksnummer)) {
            return defaultSak;
        }
        const response = await this.get<Sak>(`/sak/${saksnummer}`);

        if (response.status === 404) {
            return {
                ...defaultSak,
                erIkkeBidragSak: true,
            };
        }
        if (!response.ok) {
            return defaultSak;
        }

        const sak = response.data;
        await this.updateRollerWithPerson(sak.roller);
        return sak;
    }

    async hentSakerForPerson(personid: string): Promise<Sak[]> {
        if (isEmpty(personid)) {
            return [];
        }

        const response = await this.get<Sak[]>(`/person/sak/${personid}`);

        if (!response.ok) {
            return [];
        }

        const saker = response.data;
        await Promise.all(saker.map((sak) => this.updateRollerWithPerson(sak.roller)));
        return response.data;
    }

    async hentSakWithRoleAndEnhetInformation(saksnummer: string): Promise<Sak> {
        const sak = await this.hentSak(saksnummer);
        sak.enhetInformasjon = (await new EnhetService().hentEnhetInfo(sak.eierfogd)).enhetNavn;

        if (sak.roller) {
            // @ts-expect-error
            sak.roller = await Promise.all(
                sak.roller.map(async (rolle) => {
                    const person = await new PersonService().getPerson(rolle.foedselsnummer);
                    return { ...rolle, person };
                }),
            );
        }
        return sak;
    }

    async hentSakerEnhetsInfo(saker: Sak[]): Promise<Enhet[]> {
        const eierfogdList = Array.from(
            new Set(
                saker.filter((sak) => sak.eierfogd !== undefined || sak.eierfogd !== "null").map((sak) => sak.eierfogd),
            ),
        );

        return await Promise.all(eierfogdList.map((eierfogd) => new EnhetService().hentEnhetInfo(eierfogd)));
    }

    updateRollerWithPerson(roller: InternalRolleDto[]) {
        return Promise.all(
            roller.map((rolle: InternalRolleDto) =>
                new PersonService()
                    .getPerson(rolle.foedselsnummer)
                    .then((person) => {
                        rolle.navn = person.navn;
                        rolle.visningsnavn = person.visningsnavn;
                        rolle.person = person;
                    })
                    .catch((e) => console.error("Det skjedde en feil ved henting av person", e)),
            ),
        );
    }
}
