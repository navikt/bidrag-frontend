import { PersonPencilIcon } from "@navikt/aksel-icons";
import { Box, Button, Heading, HStack, VStack } from "@navikt/ds-react";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

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
        utkast.type === "samhandler"
            ? Boolean(utkast.ident)
            : !isRequired || (utkast.type === "barnet_selv" && Boolean(utkast.ident));

    return (
        <Box background="soft" padding={"space-8"} borderRadius={"12"}>
            <VStack gap={"space-16"}>
                <HStack gap="space-4" align="center" wrap={false}>
                    <PersonPencilIcon aria-hidden />
                    <Heading size="xsmall">Endre reell mottaker</Heading>
                </HStack>

                <ReellMottakerValgGruppe
                    barnNavn={barnNavn}
                    barnIdent={barn.fodselsnummer}
                    barnFødselsdato={barn.fødselsdato}
                    valg={utkast}
                    lagretSamhandler={lagretSamhandler}
                    onValg={handleValg}
                    visBarnekort={false}
                    kanFjerne={kanFjerne}
                    isRequired={isRequired}
                    kunSamhandlerSomReellMottaker={kunSamhandlerSomReellMottaker}
                    disabled={disabled}
                    feil={feil}
                />

                <HStack gap={"space-8"}>
                    <Button type="button" size="small" onClick={handleBekreft} disabled={disabled || !kanBekrefte}>
                        Legg til
                    </Button>
                    <Button type="button" size="small" variant="secondary" onClick={onAvbryt} disabled={disabled}>
                        Avbryt
                    </Button>
                </HStack>
            </VStack>
        </Box>
    );
}
