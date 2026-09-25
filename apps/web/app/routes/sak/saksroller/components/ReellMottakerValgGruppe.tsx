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

type Samhandler = { ident: string; navn: string };

function somSamhandler(valg: ReellMottakerValg): Samhandler | null {
    return valg.type === "samhandler" && valg.ident && valg.navn ? { ident: valg.ident, navn: valg.navn } : null;
}

/** Husker sist valgte samhandler, slik at den kan velges igjen etter bytte til et annet alternativ. */
export function useLagretSamhandler(startvalg: ReellMottakerValg) {
    const [lagretSamhandler, setLagretSamhandler] = useState(() => somSamhandler(startvalg));

    const huskSamhandler = (forrige: ReellMottakerValg, nytt: ReellMottakerValg) => {
        const samhandler = somSamhandler(nytt) ?? (nytt.type !== "samhandler" ? somSamhandler(forrige) : null);
        if (samhandler) setLagretSamhandler(samhandler);
    };

    return { lagretSamhandler, huskSamhandler };
}

const KUN_SAMHANDLER_MELDING =
    "Barnet selv kan ikke velges som reell mottaker i oppfostringsbidrag. Velg samhandler (kommune).";

type Props = {
    barnNavn: string;
    barnIdent: string;
    valg: ReellMottakerValg;
    lagretSamhandler: Samhandler | null;
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
    const [error, setError] = useState<string>();

    const handleRadioChange = (value: string) => {
        setError(undefined);
        onValg(valgForRadio(value, { ident: barnIdent, navn: barnNavn }, lagretSamhandler));
    };

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
                <SamhandlerValg
                    valg={valg}
                    lagretSamhandlerIdent={lagretSamhandler?.ident}
                    skjulValgt={Boolean(feil || error)}
                    disabled={disabled}
                    onVelg={(ident, navn) => {
                        setError(undefined);
                        onValg({ type: "samhandler", ident, navn });
                    }}
                    onError={setError}
                />
            )}
        </VStack>
    );
}

function valgForRadio(
    value: string,
    barn: { ident: string; navn: string },
    lagretSamhandler: { ident: string; navn: string } | null,
): ReellMottakerValg {
    if (value === "ingen") return {};
    if (value === "barnet_selv") return { type: "barnet_selv", ...barn };
    return { type: "samhandler", ident: lagretSamhandler?.ident, navn: lagretSamhandler?.navn };
}

function SamhandlerValg({
    valg,
    lagretSamhandlerIdent,
    skjulValgt,
    disabled,
    onVelg,
    onError,
}: {
    valg: ReellMottakerValg;
    lagretSamhandlerIdent?: string;
    skjulValgt: boolean;
    disabled?: boolean;
    onVelg: (ident: string, navn?: string) => void;
    onError: (feil: string) => void;
}) {
    return (
        <>
            <ReellMottakerSøk
                valgtSamhandlerId={valg.ident ?? lagretSamhandlerIdent}
                onVelg={onVelg}
                onError={onError}
            />
            {!skjulValgt && valg.navn && valg.ident && (
                <Box borderWidth="2" borderRadius="12">
                    <FunnetPersonInfo
                        label="Reell mottaker:"
                        navn={valg.navn}
                        ident={valg.ident}
                        disabled={disabled}
                        variant="info"
                    />
                </Box>
            )}
        </>
    );
}
