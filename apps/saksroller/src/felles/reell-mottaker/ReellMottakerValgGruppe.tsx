import { TrashIcon } from "@navikt/aksel-icons";
import { Button, InlineMessage, Radio, RadioGroup, VStack } from "@navikt/ds-react";

import { useState } from "react";
import FunnetPersonInfo from "../person/FunnetPersonInfo.tsx";
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
        if (nytt.type === "samhandler" && !nytt.ident) {
            setLagretSamhandler(null);
            return;
        }

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
    feil?: string;
    readOnly?: boolean;
};

export default function ReellMottakerValgGruppe({
    barnNavn,
    barnIdent,
    valg,
    lagretSamhandler,
    onValg,
    regel,
    feil,
    readOnly = false,
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
                description={readOnly ? "Velg barnet for å angi reell mottaker" : undefined}
                value={readOnly ? "" : valg.type || "ingen"}
                onChange={handleRadioChange}
                error={feil}
                readOnly={readOnly}
            >
                <VStack gap="space-0">
                    <Radio value="ingen" disabled={påkrevd}>
                        Bidragsmottaker
                    </Radio>
                    <Radio disabled={kunSamhandlerSomReellMottaker} value="barnet_selv">
                        <span className="personnavn">{barnNavn}</span> (barnet selv)
                    </Radio>
                    <Radio value="samhandler">Annen person eller samhandler</Radio>
                </VStack>
            </RadioGroup>

            {kunSamhandlerSomReellMottaker && (
                <InlineMessage status="info" size="small">
                    {KUN_SAMHANDLER_MELDING}
                </InlineMessage>
            )}

            {valg.type === "samhandler" && (
                <SamhandlerValg
                    valg={valg}
                    lagretSamhandlerIdent={lagretSamhandler?.ident}
                    skjulValgt={Boolean(feil || error)}
                    onVelg={(ident, navn) => {
                        setError(undefined);
                        onValg({ type: "samhandler", ident, navn });
                    }}
                    onFjern={() => {
                        setError(undefined);
                        onValg({ type: "samhandler" });
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
    onVelg,
    onFjern,
    onError,
}: {
    valg: ReellMottakerValg;
    lagretSamhandlerIdent?: string;
    skjulValgt: boolean;
    onVelg: (ident: string, navn?: string) => void;
    onFjern: () => void;
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
                <FunnetPersonInfo
                    navn={valg.navn}
                    ident={valg.ident}
                    handlinger={
                        <Button
                            type="button"
                            size="small"
                            variant="tertiary"
                            icon={<TrashIcon aria-hidden />}
                            aria-label="Fjern reell mottaker"
                            onClick={onFjern}
                        />
                    }
                />
            )}
        </>
    );
}
