import { Box, LocalAlert, Radio, RadioGroup, VStack } from "@navikt/ds-react";

import { useState } from "react";
import FunnetPersonInfo from "./FunnetPersonInfo.tsx";
import ReellMottakerSøk from "./ReellMottakerSøk.tsx";

export type ReellMottakerValg = {
    type?: "barnet_selv" | "samhandler";
    ident?: string;
    navn?: string;
};

export type ReellMottakerValgregel = "valgfri" | "påkrevd" | "kun-samhandler";

const KUN_SAMHANDLER_MELDING =
    "Barnet selv kan ikke velges som reell mottaker i oppfostringsbidrag. Velg samhandler (kommune).";

type Props = {
    barnNavn: string;
    barnIdent: string;
    valg: ReellMottakerValg;
    lagretSamhandler: { ident: string; navn: string } | null;
    onValg: (valg: ReellMottakerValg) => void;
    regel: ReellMottakerValgregel;
    disabled?: boolean;
    feil?: string;
};

export default function ReellMottakerValgGruppe({
    barnNavn,
    barnIdent,
    valg,
    lagretSamhandler,
    onValg,
    regel,
    disabled,
    feil,
}: Props) {
    const påkrevd = regel !== "valgfri";
    const kunSamhandlerSomReellMottaker = regel === "kun-samhandler";

    const handleRadioChange = (value: string) => {
        if (value === "ingen") {
            onValg({});
            return;
        }

        if (value === "barnet_selv") {
            onValg({ type: "barnet_selv", ident: barnIdent, navn: barnNavn });
            return;
        }

        onValg({ type: "samhandler", ident: lagretSamhandler?.ident, navn: lagretSamhandler?.navn });
    };

    const [error, setError] = useState<string>();

    return (
        <VStack gap="space-24">
            <RadioGroup
                size="small"
                legend="Hvem er reell mottaker?"
                value={valg.type || "ingen"}
                onChange={handleRadioChange}
                disabled={disabled}
                error={feil}
            >
                <VStack gap="space-0">
                    <Radio value="ingen" disabled={påkrevd}>
                        Bidragsmottaker
                    </Radio>
                    <Radio disabled={kunSamhandlerSomReellMottaker} value="barnet_selv">
                        {barnNavn} (barnet selv)
                    </Radio>
                    <Radio value="samhandler">Annen person eller samhandler</Radio>
                </VStack>
            </RadioGroup>

            {kunSamhandlerSomReellMottaker && (
                <LocalAlert status="warning" size="small">
                    <LocalAlert.Content>{KUN_SAMHANDLER_MELDING}</LocalAlert.Content>
                </LocalAlert>
            )}

            {valg.type === "samhandler" && (
                <ReellMottakerSøk
                    valgtSamhandlerId={valg.ident ?? lagretSamhandler?.ident}
                    onVelg={(ident, navn) => onValg({ type: "samhandler", ident, navn })}
                    onError={setError}
                />
            )}

            {!feil && !error && valg.type === "samhandler" && valg.navn && valg.ident && (
                <Box borderWidth="2" borderRadius="12">
                    <FunnetPersonInfo label="Reell mottaker:" navn={valg.navn} ident={valg.ident} disabled={disabled} />
                </Box>
            )}
        </VStack>
    );
}
