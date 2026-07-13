import {Box, Heading, List, LocalAlert, VStack} from "@navikt/ds-react";
import {useState} from "react";
import type {Route} from "./+types/BrukerReskontroOversiktPage.ts";
import {SakNokkelTall} from "../../sak/reskontro/SakNokkelTall";
import BrukerTransaksjonerAggregertTabell from "./BrukerTransaksjonerAggregertTabell";
import BrukerTransaksjonerFilterPanel from "./BrukerTransaksjonerFilterPanel.tsx";
import {useBrukerTransaksjonsfilter} from "./useBrukerTransaksjonsfilter";
import {useObfuscateFnr} from "~/common/person/useObfuscateFnr.ts";

export default function BrukerReskontroOversiktPage({
                                                     params,
                                                 }: Route.ComponentProps) {
    const {decodeFnr} = useObfuscateFnr();
    const brukerid = params.brukerid;
    const ident = decodeFnr(brukerid)
    const {filtrertData, totalTransCount} = useBrukerTransaksjonsfilter(ident || "");
    const [showAlert, setShowAlert] = useState(true);
    const documentTitle = `Sakreskontro - ${brukerid}`;

    return (
        <VStack gap="space-16">
            <title>{documentTitle}</title>
            <Heading size={"large"}>Reskontro for bruker {ident}</Heading>
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
                            <List.Item>Link til saksreskontro</List.Item>
                            <List.Item>Sum pr sak</List.Item>
                            <List.Item>Motpost</List.Item>
                        </List>
                    </LocalAlert.Content>
                </LocalAlert>
            )}

            {/*<SakNokkelTall saksnummer={brukerid}/>*/}
            <Box
                borderColor="neutral-subtle"
                padding="space-16"
                borderWidth="1"
                borderRadius="4"
            >
                <VStack gap="space-16">
                    <BrukerTransaksjonerFilterPanel/>
                    <BrukerTransaksjonerAggregertTabell
                        transaksjoner={filtrertData}
                        totalTransCount={totalTransCount}
                    />
                </VStack>
            </Box>
        </VStack>
    );
}
