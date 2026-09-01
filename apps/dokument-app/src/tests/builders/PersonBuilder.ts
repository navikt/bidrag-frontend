import type { PersonDto, PersonResponse } from "../../types/api/PersonTypes";

export default class PersonBuilder {
    static get Builder() {
        let person: PersonDto;

        class Builder {
            constructor(ident: string) {
                person = {
                    ident,
                    navn: "Navn Navnesen",
                };
            }

            withNavn(navn: string) {
                person.navn = navn;
                return this;
            }

            withDoedsdato(doedsdato: string) {
                person.doedsdato = doedsdato;
                return this;
            }

            withDiskresjonskode(diskresjonskode: string) {
                person.diskresjonskode = diskresjonskode;
                return this;
            }

            build(): PersonResponse {
                return person as PersonResponse;
            }
        }
        return Builder;
    }
}
