import type { PersonAdresseDto } from "../../../types/api/PersonTypes";
import type { Person } from "../../../types/person";
import { PERSON_ID_1 } from "../../mockdata/personMockData";

export function createPerson(ident = PERSON_ID_1, navn = "Navn Navnesen") {
    return new PersonBuilder.Builder(ident).withNavn(navn).build();
}

export function createPersonAdresse(): PersonAdresseDto {
    return {
        adresselinje1: "Pepperkakegata 15A",
        land: "NO",
        postnummer: "3000",
        poststed: "Kardemommeby",
    };
}

export class PersonBuilder {
    static get Builder() {
        let person: Person;

        class Builder {
            constructor(ident: string) {
                person = {
                    ident,
                    navn: "Navn Navnesen",
                    begrensetTilgang: false,
                } as Person;
            }

            withNavn(navn: string) {
                person.navn = navn;
                person.kortnavn = navn;
                person.visningsnavn = navn;
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

            withBegrensetTilgang(begrensetTilgang: boolean) {
                person.begrensetTilgang = begrensetTilgang;
                return this;
            }

            build() {
                return person;
            }
        }
        return Builder;
    }
}
