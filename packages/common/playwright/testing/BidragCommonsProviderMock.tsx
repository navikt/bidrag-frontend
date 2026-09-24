import type { PersonDto } from "@bidrag/api/PersonApi";
import type { QueryClient } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { BidragCommonsProvider } from "../../src/api/BidragCommonsContext.tsx";
import { mockUseHentPersonData } from "./mockPersonData.ts";

type Props = PropsWithChildren<{
    client?: QueryClient;
    personer?: Record<string, Partial<PersonDto>>;
    uthevPerson?: (ident?: string, stønad18År?: boolean) => boolean;
    useHentRevurderingsbarn?: (ident?: string, stønad18År?: boolean) => boolean;
}>;

export function BidragCommonsProviderMock({
    children,
    client,
    personer = {},
    uthevPerson,
    useHentRevurderingsbarn,
}: Props) {
    return (
        <BidragCommonsProvider
            client={client}
            useHentPersonData={mockUseHentPersonData(personer)}
            uthevPerson={uthevPerson}
            useHentRevurderingsbarn={useHentRevurderingsbarn}
        >
            {children}
        </BidragCommonsProvider>
    );
}
