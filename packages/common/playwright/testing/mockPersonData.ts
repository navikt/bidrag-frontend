import type { PersonDto } from "@bidrag/api/PersonApi";
import type { UseSuspenseQueryResult } from "@tanstack/react-query";

export function mockUseHentPersonData(personer: Record<string, Partial<PersonDto>>) {
    return (ident?: string) => {
        const ukjentPerson = { ident: ident ?? "", visningsnavn: "Ukjent person" };
        const person = (ident && personer[ident]) || ukjentPerson;
        return {
            data: person as PersonDto,
            isSuccess: true,
            isError: false,
            error: null,
        } as unknown as UseSuspenseQueryResult<PersonDto, unknown>;
    };
}
