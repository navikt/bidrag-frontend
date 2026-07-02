import { Box, Heading, List, LocalAlert, VStack } from "@navikt/ds-react";
import { QueryErrorWrapper } from "@shared/error/QueryErrorWrapper";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { SakNokkelTall } from "~/features/reskontro/SakNokkelTall";
import TransaksjonerAggregertTabell from "~/features/reskontro/TransaksjonerAggregertTabell";
import TransaksjonerFilterPanel from "~/features/reskontro/TransaksjonerFilterPanel";
import { useTransaksjonsfilter } from "~/features/reskontro/useTransaksjonsfilter";

export default function SakReskontroOversiktPage() {
    const { saksnummer } = useParams();

    useEffect(() => {
        window.setHeaderNavigationContext({ mode: "sak", saksnummer: saksnummer });
        window.setAppContext({ appName: "sak", moduleName: "sakreskontro" });
        document.title = `Sakreskontro - ${saksnummer}`;
    }, [saksnummer]);

    return (
        <QueryErrorWrapper>
            <SakReskontroOversiktPageContent />
        </QueryErrorWrapper>
    );
}

function SakReskontroOversiktPageContent() {
    const { saksnummer } = useParams();
    const { filtrertData, totalTransCount } = useTransaksjonsfilter(saksnummer);
    const [showAlert, setShowAlert] = useState(true);

    return (
        <VStack gap="space-16">
            <Heading size={"large"}>Reskontro for sak {saksnummer}</Heading>
            {showAlert && (
                <LocalAlert status="announcement">
                    <LocalAlert.Header>
                        <LocalAlert.Title>Denne siden er under arbeid</LocalAlert.Title>
                        <LocalAlert.CloseButton onClick={() => setShowAlert(false)} />
                    </LocalAlert.Header>
                    <LocalAlert.Content>
                        Følgende er ikke enda implementert
                        <List>
                            <List.Item>Link til brukerreskontro</List.Item>
                            <List.Item>Sum pr sak</List.Item>
                            <List.Item>Motpost</List.Item>
                        </List>
                    </LocalAlert.Content>
                </LocalAlert>
            )}

            <SakNokkelTall saksnummer={saksnummer} />
            <Box borderColor="neutral-subtle" padding="space-16" borderWidth="1" borderRadius="4">
                <VStack gap="space-16">
                    <TransaksjonerFilterPanel />
                    <TransaksjonerAggregertTabell transaksjoner={filtrertData} totalTransCount={totalTransCount} />
                </VStack>
            </Box>
        </VStack>
    );
}
