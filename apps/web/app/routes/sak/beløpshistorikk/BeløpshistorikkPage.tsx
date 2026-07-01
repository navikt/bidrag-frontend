import { Box, Loader, Tabs, VStack } from "@navikt/ds-react";
import { type ReactNode, Suspense } from "react";
import { useParams } from "react-router";
import { BeløpshistorikkTabell } from "./BeløpshistorikkTabell";
import { Engangsbetalinger } from "./Engangsbetalinger";
import { Gebyr } from "./Gebyr";
import PerioderFilterPanel from "./PerioderFilterPanel";

export default function BeløpshistorikkPage() {
    const params = useParams();
    const saksnummer = params.saksnummer as string;
    const documentTitle = `Beløpshistorikk - ${saksnummer}`;

    return (
        <>
            <title>{documentTitle}</title>
            <Tabs defaultValue="belopshistorikk">
                <Tabs.List>
                    <Tabs.Tab value="belopshistorikk" label="Bidrag/Forskudd" />
                    <Tabs.Tab value="særbidrag" label="Særbidrag" />
                    <Tabs.Tab value="gebyr" label="Gebyr" />
                </Tabs.List>
                <TabPanel value={"belopshistorikk"}>
                    <Suspense fallback={<Loader size="medium" />}>
                        <VStack gap={"space-16"}>
                            <PerioderFilterPanel saksnummer={saksnummer} />
                            <BeløpshistorikkTabell saksnummer={saksnummer} />
                        </VStack>
                    </Suspense>
                </TabPanel>
                <TabPanel value={"særbidrag"}>
                    <Suspense fallback={<Loader size="medium" />}>
                        <Engangsbetalinger saksnummer={saksnummer} />
                    </Suspense>
                </TabPanel>
                <TabPanel value={"gebyr"}>
                    <Suspense fallback={<Loader size="medium" />}>
                        <Gebyr saksnummer={saksnummer} />
                    </Suspense>
                </TabPanel>
            </Tabs>
        </>
    );
}

function TabPanel({
    value,
    children,
}: {
    value: string;
    children: ReactNode;
}) {
    return (
        <Tabs.Panel value={value}>
            <Box paddingBlock={"space-32"}>
                <Suspense fallback={<Loader size="medium" />}>
                    {children}
                </Suspense>
            </Box>
        </Tabs.Panel>
    );
}
