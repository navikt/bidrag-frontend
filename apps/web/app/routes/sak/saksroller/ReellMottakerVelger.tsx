import { PersonPencilIcon } from "@navikt/aksel-icons";
import { Box, Button, Heading, HStack, VStack } from "@navikt/ds-react";
import { useState } from "react";

import ReellMottakerValgGruppe, { type ReellMottakerValg } from "./components/ReellMottakerValgGruppe.tsx";

export type { ReellMottakerValg };

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
    };

    const kanBekrefte =
        utkast.type === "samhandler"
            ? Boolean(utkast.ident)
            : !påkrevd || (utkast.type === "barnet_selv" && Boolean(utkast.ident));

    return (
        <Box background="soft" padding={"space-8"} borderRadius={"12"}>
            <VStack gap={"space-16"}>
                <HStack gap="space-4" align="center" wrap={false}>
                    <PersonPencilIcon aria-hidden />
                    <Heading size="xsmall">Endre reell mottaker</Heading>
                </HStack>

                <ReellMottakerValgGruppe
                    barnNavn={barnNavn}
                    barnIdent={barnIdent ?? ""}
                    valg={utkast}
                    lagretSamhandler={lagretSamhandler}
                    onValg={handleValg}
                    regel={regel}
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
