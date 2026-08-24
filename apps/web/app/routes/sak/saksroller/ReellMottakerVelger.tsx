import { PersonPencilIcon } from "@navikt/aksel-icons";
import { Button, Detail, Heading, HStack, Modal, VStack } from "@navikt/ds-react";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useParams } from "react-router";

import ReellMottakerValgGruppe, { type ReellMottakerValg } from "./components/ReellMottakerValgGruppe.tsx";
import type { BarnRolle, SakRedigeringData } from "./sakvisning-schema.ts";

interface ReellMottakerVelgerProps {
    barnNavn: string;
    rolleIndex: number;
    onAvbryt: () => void;
    disabled?: boolean;
    kanFjerne?: boolean;
    isRequired?: boolean;
    feil?: string;
    kunSamhandlerSomReellMottaker?: boolean;
    onBekreft?: () => void;
}

export default function ReellMottakerVelger({
    barnNavn,
    rolleIndex,
    disabled,
    onAvbryt,
    feil,
    kanFjerne = false,
    isRequired = false,
    kunSamhandlerSomReellMottaker = false,
    onBekreft,
}: ReellMottakerVelgerProps) {
    const form = useFormContext<SakRedigeringData>();
    const { saksnummer } = useParams();
    const barn = useWatch({
        control: form.control,
        name: `roller.${rolleIndex}`,
    }) as BarnRolle | undefined;

    // Utkast, slik at endringsoppsummeringen bak modalen først oppdateres ved bekreftelse.
    const [utkast, setUtkast] = useState<ReellMottakerValg>(() => {
        const eksisterendeValg = {
            type: barn?.reellMottakerType,
            ident: barn?.reellMottaker,
            navn: barn?.reellMottakerNavn,
        };

        if (kunSamhandlerSomReellMottaker && eksisterendeValg.type === "barnet_selv") {
            return { type: "samhandler" };
        }

        if (isRequired && !eksisterendeValg.type) {
            return kunSamhandlerSomReellMottaker
                ? { type: "samhandler" }
                : { type: "barnet_selv", ident: barn?.fodselsnummer, navn: barnNavn };
        }

        return eksisterendeValg;
    });
    const [lagretSamhandler, setLagretSamhandler] = useState<{ ident: string; navn: string } | null>(() =>
        utkast.type === "samhandler" && utkast.ident && utkast.navn ? { ident: utkast.ident, navn: utkast.navn } : null,
    );

    if (!barn) {
        return null;
    }

    const handleBekreft = () => {
        form.setValue(`roller.${rolleIndex}.reellMottakerType`, utkast.type);
        form.setValue(`roller.${rolleIndex}.reellMottaker`, utkast.ident);
        form.setValue(`roller.${rolleIndex}.reellMottakerNavn`, utkast.navn, { shouldValidate: true });
        onBekreft?.();
    };

    const handleValg = (nyttValg: ReellMottakerValg) => {
        if (utkast.type === "samhandler" && utkast.ident && utkast.navn && nyttValg.type !== "samhandler") {
            setLagretSamhandler({ ident: utkast.ident, navn: utkast.navn });
        }

        if (nyttValg.type === "samhandler" && nyttValg.ident && nyttValg.navn) {
            setLagretSamhandler({ ident: nyttValg.ident, navn: nyttValg.navn });
        }

        setUtkast(nyttValg);
    };

    const kanBekrefte =
        !isRequired || (utkast.type === "barnet_selv" ? Boolean(utkast.ident) : Boolean(utkast.type && utkast.ident));

    return (
        <Modal open onClose={onAvbryt} width="medium" aria-label="Endre reell mottaker">
            <Modal.Header>
                <VStack gap="space-2">
                    {saksnummer && <Detail>Sak {saksnummer}</Detail>}
                    <HStack gap="space-4" align="center" wrap={false}>
                        <PersonPencilIcon aria-hidden fontSize="1.5rem" />
                        <Heading level="2" size="medium">
                            Endre reell mottaker av barnebidraget
                        </Heading>
                    </HStack>
                </VStack>
            </Modal.Header>

            <Modal.Body>
                <ReellMottakerValgGruppe
                    barnNavn={barnNavn}
                    barnIdent={barn.fodselsnummer}
                    barnFødselsdato={barn.fødselsdato}
                    valg={utkast}
                    lagretSamhandler={lagretSamhandler}
                    onValg={handleValg}
                    visBarnekort
                    kanFjerne={kanFjerne}
                    isRequired={isRequired}
                    kunSamhandlerSomReellMottaker={kunSamhandlerSomReellMottaker}
                    disabled={disabled}
                    feil={feil}
                />
            </Modal.Body>

            <Modal.Footer>
                <Button type="button" onClick={handleBekreft} disabled={disabled || !kanBekrefte}>
                    Legg til
                </Button>
                <Button type="button" variant="secondary" onClick={onAvbryt} disabled={disabled}>
                    Avbryt
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
