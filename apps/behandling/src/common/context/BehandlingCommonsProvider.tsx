import { BidragCommonsProvider } from "@bidrag/common";
import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useHentPersonData, useHentRevurderingsbarn, useUthevPerson } from "../hooks/useApiData";

/**
 * Kobler `@bidrag/common`-komponenter (bl.a. `SakHeader`) til behandling-appens
 * egne datakilder (behandling-V2-oppslaget) i stedet for PDL-/graderingsoppslagene
 * som er default i `apps/web`. Monteres på roten av behandling-appen
 * (`BehandlingPageWrapper`) slik at alle sider/komponenter i behandling-app
 * som bruker `useBidragCommons()` får de behandlingsspesifikke variantene.
 *
 * Merk at `useHentRevurderingsbarn`/`useUthevPerson` i behandling-app krever
 * ident/stønad18År (ikke valgfrie), mens `BidragCommonsProvider` sin type tillater
 * at de er `undefined` - derfor `?? ""`/`?? false` som fallback i adapterne under.
 */
export const BehandlingCommonsProvider = ({ children }: { children: React.ReactNode }) => {
    const queryClient = useQueryClient();

    return (
        <BidragCommonsProvider
            client={queryClient}
            useHentPersonData={useHentPersonData}
            useHentRevurderingsbarn={(ident, stønad18År) => useHentRevurderingsbarn(ident ?? "", stønad18År ?? false)}
            uthevPerson={(ident, stønad18År) => useUthevPerson(ident ?? "", stønad18År ?? false)}
        >
            {children}
        </BidragCommonsProvider>
    );
};
