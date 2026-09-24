import { PersonPencilIcon } from "@navikt/aksel-icons";
import { Button, Detail, Heading, HStack, Modal, VStack } from "@navikt/ds-react";
import { useState } from "react";
import { useParams } from "react-router";

import ReellMottakerValgGruppe, { type ReellMottakerValg } from "./components/ReellMottakerValgGruppe.tsx";

interface ReellMottakerVelgerProps {
    barnNavn: string;
    barnIdent?: string;
    verdi: ReellMottakerValg;
    onAvbryt: () => void;
    onBekreft: (verdi: ReellMottakerValg) => void;
    disabled?: boolean;
    regel: "valgfri" | "påkrevd" | "kun-samhandler";
    feil?: string;
}

export default function ReellMottakerVelger({
    barnNavn,
    barnIdent,
    verdi,
    disabled,
    onAvbryt,
    onBekreft,
    feil,
    regel,
}: ReellMottakerVelgerProps) {
    const { saksnummer } = useParams();
    const [valideringsfeil, setValideringsfeil] = useState<string | undefined>();
    const påkrevd = regel !== "valgfri";
    const kunSamhandlerSomReellMottaker = regel === "kun-samhandler";
    // Utkast, slik at endringsoppsummeringen bak modalen først oppdateres ved bekreftelse.
    const [utkast, setUtkast] = useState<ReellMottakerValg>(() => {
        if (kunSamhandlerSomReellMottaker && verdi.type === "barnet_selv") {
            return { type: "samhandler" };
        }

        if (påkrevd && !verdi.type) {
            return kunSamhandlerSomReellMottaker
                ? { type: "samhandler" }
                : { type: "barnet_selv", ident: barnIdent, navn: barnNavn };
        }

        return verdi;
    });
    const [lagretSamhandler, setLagretSamhandler] = useState<{ ident: string; navn: string } | null>(() =>
        utkast.type === "samhandler" && utkast.ident && utkast.navn ? { ident: utkast.ident, navn: utkast.navn } : null,
    );

    const handleBekreft = () => {
        if (!kanBekrefte) {
            setValideringsfeil("Velg eller søk opp en reell mottaker før du legger til.");
            return;
        }
        setValideringsfeil(undefined);
        onBekreft(utkast);
    };

    const handleValg = (nyttValg: ReellMottakerValg) => {
        if (utkast.type === "samhandler" && utkast.ident && utkast.navn && nyttValg.type !== "samhandler") {
            setLagretSamhandler({ ident: utkast.ident, navn: utkast.navn });
        }

        if (nyttValg.type === "samhandler" && nyttValg.ident && nyttValg.navn) {
            setLagretSamhandler({ ident: nyttValg.ident, navn: nyttValg.navn });
        }

        setUtkast(nyttValg);
        setValideringsfeil(undefined);
    };

    const kanBekrefte =
        utkast.type === "samhandler"
            ? Boolean(utkast.ident)
            : !påkrevd || (utkast.type === "barnet_selv" && Boolean(utkast.ident));

    return (
        <Modal open onClose={onAvbryt} width="medium" aria-label="Endre reell mottaker">
            <Modal.Header>
                <VStack gap="space-2">
                    {saksnummer && <Detail>Sak {saksnummer}</Detail>}
                    <HStack gap="space-4" align="center" wrap={false}>
                        <PersonPencilIcon aria-hidden />
                        <Heading level="2" size="small">
                            Endre reell mottaker av barnebidraget
                        </Heading>
                    </HStack>
                </VStack>
            </Modal.Header>
            <Modal.Body>
                <ReellMottakerValgGruppe
                    barnNavn={barnNavn}
                    barnIdent={barnIdent ?? ""}
                    valg={utkast}
                    lagretSamhandler={lagretSamhandler}
                    onValg={handleValg}
                    regel={regel}
                    disabled={disabled}
                    feil={valideringsfeil ?? feil}
                />
            </Modal.Body>
            <Modal.Footer>
                {!disabled && (
                    <>
                        <Button type="button" size="small" onClick={handleBekreft}>
                            Legg til
                        </Button>
                        <Button type="button" size="small" variant="secondary" onClick={onAvbryt}>
                            Avbryt
                        </Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
}
