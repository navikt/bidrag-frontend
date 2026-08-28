import type { PersonDto } from "@bidrag/api/PersonApi";
import { BidragCommonsProvider } from "@bidrag/common";
import type { PropsWithChildren } from "react";
import { mockUseHentPersonData } from "../../../../packages/common/playwright/testing/mockPersonData";

type CtProvidersProps = PropsWithChildren<{
    personer?: Record<string, Partial<PersonDto>>;
    uthevPerson?: (ident?: string, stønad18År?: boolean) => boolean;
    useHentRevurderingsbarn?: (ident?: string, stønad18År?: boolean) => boolean;
}>;

export function CtProviders({ children, personer = {}, uthevPerson, useHentRevurderingsbarn }: CtProvidersProps) {
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
