import { PersonPencilIcon } from "@navikt/aksel-icons";
import { Button, Detail, Heading, HStack, Modal, VStack } from "@navikt/ds-react";
import { useState } from "react";
import { useParams } from "react-router";

import ReellMottakerValgGruppe, {
    type ReellMottakerValg,
    type ReellMottakerValgregel,
    useLagretSamhandler,
} from "./components/ReellMottakerValgGruppe.tsx";
import { initialiserValg } from "./reell-mottaker-regel.ts";

interface ReellMottakerVelgerProps {
    barnNavn: string;
    barnIdent?: string;
    verdi: ReellMottakerValg;
    onAvbryt: () => void;
    onBekreft: (verdi: ReellMottakerValg) => void;
    disabled?: boolean;
    regel: ReellMottakerValgregel;
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
    // Utkast, slik at endringsoppsummeringen bak modalen først oppdateres ved bekreftelse.
    const [utkast, setUtkast] = useState<ReellMottakerValg>(() =>
        initialiserValg(verdi, regel, { ident: barnIdent ?? "", navn: barnNavn }),
    );
    const { lagretSamhandler, huskSamhandler } = useLagretSamhandler(utkast);

    const handleBekreft = () => {
        if (!kanBekrefte) {
            setValideringsfeil("Velg eller søk opp en reell mottaker før du legger til.");
            return;
        }
        setValideringsfeil(undefined);
        onBekreft(utkast);
    };

    const handleValg = (nyttValg: ReellMottakerValg) => {
        huskSamhandler(utkast, nyttValg);
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
