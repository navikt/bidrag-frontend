import { Box, Heading, VStack } from "@navikt/ds-react";
import { TransaksjonerAggregertTabell } from "~/common/reskontro/TransaksjonerAggregertTabell.tsx";
import { useTransaksjonsfilter } from "~/common/reskontro/useTransaksjonsfilter.ts";
import { SakTransaksjonerFilterPanel } from "~/routes/sak/reskontro/SakTransaksjonerFilterPanel.tsx";
import type { SakSideTittelHandle } from "~/routes/sak/sakSideTittel";
import type { Route } from "./+types/SakReskontroOversiktPage.ts";
import { SakNokkelTall } from "./SakNokkelTall";
import { useTransaksjoner } from "./useTransaksjoner";

export const handle: SakSideTittelHandle = { sakSideTittel: "Saksreskontro" };

export default function SakReskontroOversiktPage({ params }: Route.ComponentProps) {
    const saksnummer = params.saksnummer;
    const { filtrertData, totalTransCount } = useTransaksjonsfilter(useTransaksjoner(saksnummer));
    const documentTitle = `Sakreskontro - ${saksnummer}`;

    return (
        <VStack gap="space-16">
            <title>{documentTitle}</title>
            <Heading size={"large"}>Saksreskontro for {saksnummer}</Heading>

            <SakNokkelTall saksnummer={saksnummer} />
            <Box borderColor="neutral-subtle" padding="space-16" borderWidth="1" borderRadius="4">
                <VStack gap="space-16">
                    <SakTransaksjonerFilterPanel saksnummer={saksnummer} />
                    <TransaksjonerAggregertTabell transaksjoner={filtrertData} totalTransCount={totalTransCount} />
                </VStack>
            </Box>
        </VStack>
    );
}
