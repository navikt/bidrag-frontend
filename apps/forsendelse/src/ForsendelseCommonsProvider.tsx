import { BidragCommonsProvider } from "@bidrag/common";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useHentRevurderingsbarn } from "./hooks/useForsendelseApi";

/**
 * Kobler `@bidrag/common`-komponenter (bl.a. `RolleTag`) til forsendelse-appens
 * egne datakilder. Monteres på roten av forsendelse-sidene slik at komponenter
 * som bruker `useBidragCommons()` får de forsendelsesspesifikke variantene.
 * apps/web setter opp `QueryClientProvider` og en global `BidragCommonsProvider`
 * på roten; her nøstes en forsendelses-variant som gjenbruker samme queryClient.
 */
export function ForsendelseCommonsProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();

    return (
        <BidragCommonsProvider
            client={queryClient}
            useHentRevurderingsbarn={(ident) => useHentRevurderingsbarn(ident ?? "")}
        >
            {children}
        </BidragCommonsProvider>
    );
}
