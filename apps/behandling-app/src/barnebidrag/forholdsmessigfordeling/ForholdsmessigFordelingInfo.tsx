import { Alert, Button, Dialog, Heading, HStack, VStack } from "@navikt/ds-react";
import { useState } from "react";

import { useGetBehandlingV2 } from "../../common/hooks/useApiData";
import { BarnListe } from "./BarnListe";

export default function ForholdsmessigFordelingInfo() {
    const { forholdsmessigFordeling, lesemodus } = useGetBehandlingV2();

    const [modalOpen, setModalOpen] = useState(false);

    if (!forholdsmessigFordeling) return null;

    const erLesemodusVedtak = lesemodus?.fattetTidspunkt !== undefined;
    return (
        <>
            <Dialog open={modalOpen} onOpenChange={setModalOpen} aria-label="">
                <Dialog.Popup className="w-fit" position="center">
                    <Dialog.Header>Forholdsmessig fordeling detaljer</Dialog.Header>
                    <Dialog.Body className="min-w-[700px]">
                        <VStack gap="space-2">
                            <BarnListe barn={forholdsmessigFordeling.barn} />
                        </VStack>
                    </Dialog.Body>
                </Dialog.Popup>
            </Dialog>
            <Alert
                size="small"
                variant="info"
                className="ax-lg:max-w-saksbehandling-inner ax-md:max-w-saksbehandling-inner-md ax-sm:max-w-saksbehandling-inner-sm"
            >
                <Heading size="xsmall">
                    {erLesemodusVedtak ? "Forholdsmessig fordeling" : "Forholdsmessig fordeling opprettet"}
                </Heading>
                <VStack gap="space-12">
                    <div>
                        {erLesemodusVedtak
                            ? "Forholdsmessig fordeling var opprettet for vedtak. Se detaljer om hvilken barn/BM og saker FF er del av."
                            : "Forholdsmessig fordeling er opprettet for behandling. Se detaljer om hvilken barn/BM og saker FF er del av."}
                    </div>
                    <HStack gap="space-16">
                        <Button size="xsmall" variant="secondary-neutral" onClick={() => setModalOpen(true)}>
                            Vis detaljer
                        </Button>
                    </HStack>
                </VStack>
            </Alert>
        </>
    );
}
