import type { PersonDto } from "@bidrag/api/PersonApi";
import type { UseSuspenseQueryResult } from "@tanstack/react-query";

/**
 * Felles mock av `useHentPersonData` for Playwright component-testing (stories).
 * Brukes av både apps/web og @bidrag/common sine egne stories, slik at
 * mock-logikken kun finnes ett sted.
 */
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
