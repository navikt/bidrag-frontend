import { Alert, Box, Label, Radio, RadioGroup, VStack } from "@navikt/ds-react";
import { useEffect, useState } from "react";

import FunnetPersonInfo from "./FunnetPersonInfo.tsx";
import PersonInfo from "./PersonInfo.tsx";
import ReellMottakerSøk from "./ReellMottakerSøk.tsx";

export type ReellMottakerValg = {
    type?: "barnet_selv" | "samhandler";
    ident?: string;
    navn?: string;
};

const KUN_SAMHANDLER_MELDING =
    "Barnet selv kan ikke velges som reell mottaker i oppfostringsbidrag. Velg samhandler (kommune).";

type Props = {
    barnNavn: string;
    barnIdent: string;
    barnFødselsdato?: string;
    valg: ReellMottakerValg;
    onValg: (valg: ReellMottakerValg) => void;
    visBarnekort?: boolean;
    kanFjerne?: boolean;
    isRequired?: boolean;
    kunSamhandlerSomReellMottaker?: boolean;
    disabled?: boolean;
    feil?: string;
};

export default function ReellMottakerValgGruppe({
    barnNavn,
    barnIdent,
    barnFødselsdato,
    valg,
    onValg,
    visBarnekort = false,
    kanFjerne = false,
    isRequired = false,
    kunSamhandlerSomReellMottaker = false,
    disabled,
    feil,
}: Props) {
    // Husker forrige samhandler slik at den kommer tilbake om saksbehandler bytter fram og tilbake.
    const [lagretSamhandler, setLagretSamhandler] = useState<{ ident: string; navn: string } | null>(null);

    useEffect(() => {
        if (valg.type === "samhandler" && valg.ident && valg.navn) {
            setLagretSamhandler({ ident: valg.ident, navn: valg.navn });
        }
    }, [valg.type, valg.ident, valg.navn]);

    useEffect(() => {
        if (!isRequired || valg.type) {
            return;
        }

        if (kunSamhandlerSomReellMottaker) {
            onValg({ type: "samhandler", ident: lagretSamhandler?.ident, navn: lagretSamhandler?.navn });
            return;
        }

        onValg({ type: "barnet_selv", ident: barnIdent, navn: barnNavn });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRequired, kunSamhandlerSomReellMottaker, lagretSamhandler, valg.type, barnIdent, barnNavn]);

    useEffect(() => {
        if (!kunSamhandlerSomReellMottaker || valg.type !== "barnet_selv") {
            return;
        }

        onValg({ type: "samhandler", ident: lagretSamhandler?.ident, navn: lagretSamhandler?.navn });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kunSamhandlerSomReellMottaker, lagretSamhandler, valg.type]);

    const handleRadioChange = (value: string) => {
        if (value === "ingen") {
            onValg({});
            return;
        }

        if (value === "barnet_selv") {
            if (kunSamhandlerSomReellMottaker) {
                onValg({ type: "samhandler", ident: lagretSamhandler?.ident, navn: lagretSamhandler?.navn });
                return;
            }

            if (valg.type === "samhandler" && valg.ident && valg.navn) {
                setLagretSamhandler({ ident: valg.ident, navn: valg.navn });
            }

            onValg({ type: "barnet_selv", ident: barnIdent, navn: barnNavn });
            return;
        }

        onValg({ type: "samhandler", ident: lagretSamhandler?.ident, navn: lagretSamhandler?.navn });
    };

    return (
        <VStack gap="space-16">
            {visBarnekort && barnIdent && (
                <VStack gap="space-8">
                    <Label size="small">Barnet</Label>
                    <Box
                        background="raised"
                        borderColor="neutral-subtleA"
                        borderWidth="1"
                        borderRadius="12"
                        padding="space-8"
                        width="fit-content"
                    >
                        <PersonInfo navn={barnNavn} ident={barnIdent} rolle="BA" fødselsdato={barnFødselsdato} />
                    </Box>
                </VStack>
            )}

            <RadioGroup
                size="small"
                legend="Hvem er reell mottaker?"
                value={valg.type || "ingen"}
                onChange={handleRadioChange}
                disabled={disabled}
                error={feil}
            >
                <VStack gap="space-0">
                    <Radio value="ingen" disabled={isRequired || !kanFjerne}>
                        Bidragsmottaker
                    </Radio>
                    <Radio disabled={kunSamhandlerSomReellMottaker} value="barnet_selv">
                        {barnNavn} (barnet selv)
                    </Radio>
                    <Radio value="samhandler">Annen person eller samhandler</Radio>
                </VStack>
            </RadioGroup>

            {kunSamhandlerSomReellMottaker && (
                <Alert variant="warning" size="small">
                    {KUN_SAMHANDLER_MELDING}
                </Alert>
            )}

            {valg.type === "samhandler" && (
                <ReellMottakerSøk
                    valgtSamhandlerId={valg.ident ?? lagretSamhandler?.ident}
                    onVelg={(ident, navn) => onValg({ type: "samhandler", ident, navn })}
                />
            )}

            {valg.type === "samhandler" && valg.navn && valg.ident && (
                <FunnetPersonInfo label="Reell mottaker:" navn={valg.navn} ident={valg.ident} disabled={disabled} />
            )}
        </VStack>
    );
}
