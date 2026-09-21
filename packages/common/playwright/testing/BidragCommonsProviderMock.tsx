import type { PersonDto } from "@bidrag/api/PersonApi";
import type { PropsWithChildren } from "react";
import { BidragCommonsProvider } from "../../src/api/BidragCommonsContext.tsx";
import { mockUseHentPersonData } from "./mockPersonData.ts";

type Props = PropsWithChildren<{
    personer?: Record<string, Partial<PersonDto>>;
    uthevPerson?: (ident?: string, stønad18År?: boolean) => boolean;
    useHentRevurderingsbarn?: (ident?: string, stønad18År?: boolean) => boolean;
}>;

export function BidragCommonsProviderMock({ children, personer = {}, uthevPerson, useHentRevurderingsbarn }: Props) {
    return (
        <BidragCommonsProvider
            useHentPersonData={mockUseHentPersonData(personer)}
            uthevPerson={uthevPerson}
            useHentRevurderingsbarn={useHentRevurderingsbarn}
        >
            {children}
        </BidragCommonsProvider>
    );
}
