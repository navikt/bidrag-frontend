import PersonSearchService from "../service/PersonSearchService";

export class PersonValidator {
    static async validatePerson(ident: string[]): Promise<string[]> {
        const list = ident.filter((i) => i !== undefined);
        let invalidNumber = [];
        for (const fnr of list) {
            const response = await new PersonSearchService().hentPersonInformasjon(fnr);
            if (response === null) {
                invalidNumber = [...invalidNumber, fnr];
            }
        }
        return invalidNumber;
    }
}
