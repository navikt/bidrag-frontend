import { Box, Heading, VStack } from "@navikt/ds-react";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr.ts";
import { BrukerTransaksjonerAggregertTabell } from "~/routes/bruker/reskontro/BrukerTransaksjonerAggregertTabell.tsx";
import { BrukerTransaksjonerFilterPanel } from "~/routes/bruker/reskontro/BrukerTransaksjonerFilterPanel.tsx";
import type { Route } from "./+types/BrukerReskontroOversiktPage.ts";
import { useBrukerTransaksjonsfilter } from "./useBrukerTransaksjonsfilter";

export default function BrukerReskontroOversiktPage({ params }: Route.ComponentProps) {
    const { decodeFnr } = useObfuscateFnr();
    const brukerid = params.brukerid;
    const ident = decodeFnr(brukerid);
    const { filtrertData, totalTransCount } = useBrukerTransaksjonsfilter(ident || "");
    const documentTitle = `Sakreskontro - ${brukerid}`;

    return (
        <VStack gap="space-16">
            <title>{documentTitle}</title>
            <Heading size={"large"}>Reskontro for bruker {ident}</Heading>

            {/*<SakNokkelTall saksnummer={brukerid}/>*/}
            <Box borderColor="neutral-subtle" padding="space-16" borderWidth="1" borderRadius="4">
                <VStack gap="space-16">
                    <BrukerTransaksjonerFilterPanel ident={ident} />
                    <BrukerTransaksjonerAggregertTabell
                        transaksjoner={filtrertData}
                        totalTransCount={totalTransCount}
                    />
                </VStack>
            </Box>
        </VStack>
    );
}
