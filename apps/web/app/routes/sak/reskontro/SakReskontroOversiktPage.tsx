import {Box, Heading, List, LocalAlert, VStack} from "@navikt/ds-react";
import {useState} from "react";
import type {Route} from "./+types/SakReskontroOversiktPage.ts";
import {SakNokkelTall} from "./SakNokkelTall";
import TransaksjonerAggregertTabell from "./TransaksjonerAggregertTabell";
import TransaksjonerFilterPanel from "./TransaksjonerFilterPanel";
import {useTransaksjonsfilter} from "./useTransaksjonsfilter";

export default function SakReskontroOversiktPage({
                                                     params,
                                                 }: Route.ComponentProps) {
    const saksnummer = params.saksnummer;
    const {filtrertData, totalTransCount} = useTransaksjonsfilter(saksnummer);
    const [showAlert, setShowAlert] = useState(true);
    const documentTitle = `Sakreskontro - ${saksnummer}`;

    return (
        <VStack gap="space-16">
            <title>{documentTitle}</title>
            <Heading size={"large"}>Reskontro for sak {saksnummer}</Heading>
            {showAlert && (
                <LocalAlert status="announcement">
                    <LocalAlert.Header>
                        <LocalAlert.Title>
                            Denne siden er under arbeid
                        </LocalAlert.Title>
                        <LocalAlert.CloseButton
                            onClick={() => setShowAlert(false)}
                        />
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

            <SakNokkelTall saksnummer={saksnummer}/>
            <Box
                borderColor="neutral-subtle"
                padding="space-16"
                borderWidth="1"
                borderRadius="4"
            >
                <VStack gap="space-16">
                    <TransaksjonerFilterPanel/>
                    <TransaksjonerAggregertTabell
                        transaksjoner={filtrertData}
                        totalTransCount={totalTransCount}
                    />
                </VStack>
            </Box>
        </VStack>
    );
}
