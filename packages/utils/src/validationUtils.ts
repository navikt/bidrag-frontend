export interface PersonLookupService {
    hentPersonInformasjon(fnr: string): Promise<unknown>;
}

// biome-ignore lint/complexity/noStaticOnlyClass: tt
export class PersonValidator {
    static async validatePerson(ident: string[], service: PersonLookupService): Promise<string[]> {
        const list = ident.filter((i) => i !== undefined);
        const invalidNumber: string[] = [];
        for (const fnr of list) {
            const response = await service.hentPersonInformasjon(fnr);
            if (response === null) {
                invalidNumber.push(fnr);
            }
        }
        return invalidNumber;
    }
}
