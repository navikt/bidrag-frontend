import { TrashIcon } from "@navikt/aksel-icons";
import { Button, Checkbox, InlineMessage, Select, VStack } from "@navikt/ds-react";

import { useState } from "react";
import type { Mottakertype } from "../../api/samhandler.api";
import FunnetPersonInfo from "../person/FunnetPersonInfo.tsx";
import ReellMottakerSøk from "./ReellMottakerSøk.tsx";
import { erPersonSomReellMottaker, kanBekrefteReellMottaker } from "./reell-mottaker-regler.ts";

export type ReellMottakerValg = {
    type?: "barnet_selv" | "samhandler";
    ident?: string;
    navn?: string;
    mottakertype?: Mottakertype;
    verge?: boolean;
};

export type ReellMottakerValgregel = "valgfri" | "påkrevd" | "kun-samhandler";

type Samhandler = { ident: string; navn?: string; mottakertype?: Mottakertype };

function somSamhandler(valg: ReellMottakerValg): Samhandler | null {
    return valg.type === "samhandler" && valg.ident
        ? { ident: valg.ident, navn: valg.navn, mottakertype: valg.mottakertype }
        : null;
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
    "Barnet selv kan ikke velges som reell mottaker i oppfostringsbidrag. Velg en registrert samhandler.";

type Props = {
    barnNavn: string;
    barnIdent: string;
    valg: ReellMottakerValg;
    lagretSamhandler: Samhandler | null;
    onValg: (valg: ReellMottakerValg) => void;
    regel: ReellMottakerValgregel;
    feil?: string;
    disabled?: boolean;
};

export default function ReellMottakerValgGruppe({
    barnNavn,
    barnIdent,
    valg,
    lagretSamhandler,
    onValg,
    regel,
    feil,
    disabled = false,
}: Props) {
    const påkrevd = regel !== "valgfri";
    const kunSamhandlerSomReellMottaker = regel === "kun-samhandler";
    const [error, setError] = useState<string>();
    const [valideringsmelding, setValideringsmelding] = useState<string>();
    const [barnetSøktOppSomSamhandler, setBarnetSøktOppSomSamhandler] = useState(false);

    const handleValgChange = (value: string) => {
        setError(undefined);
        setValideringsmelding(undefined);
        setBarnetSøktOppSomSamhandler(false);
        const lagretSamhandlerKanBekreftes =
            lagretSamhandler !== null &&
            kanBekrefteReellMottaker({ type: "samhandler", ...lagretSamhandler }, "kun-samhandler");
        const samhandlerForRegel =
            kunSamhandlerSomReellMottaker && !lagretSamhandlerKanBekreftes ? null : lagretSamhandler;
        onValg(valgForMottaker(value, { ident: barnIdent, navn: barnNavn }, samhandlerForRegel));
    };

    const handleVelgSamhandler = (ident: string, navn?: string, mottakertype?: Mottakertype) => {
        setError(undefined);
        setValideringsmelding(undefined);
        const erBarnet = ident === barnIdent;
        const faktiskMottakertype = erBarnet ? "PERSON" : mottakertype;
        const valgt: ReellMottakerValg = erBarnet
            ? { type: "barnet_selv", ident: barnIdent, navn: barnNavn, mottakertype: "PERSON" }
            : { type: "samhandler", ident, navn, mottakertype };
        if (kunSamhandlerSomReellMottaker && !kanBekrefteReellMottaker(valgt, "kun-samhandler")) {
            setBarnetSøktOppSomSamhandler(erBarnet);
            setValideringsmelding(
                faktiskMottakertype === "PERSON"
                    ? "Velg mottakeren med samhandler-ID, ikke personident."
                    : "Søketreffet mangler mottakertype. Søk opp en registrert samhandler på nytt.",
            );
            onValg({ type: "samhandler" });
        } else {
            setBarnetSøktOppSomSamhandler(false);
            onValg(valgt);
        }
    };

    return (
        <VStack gap="space-24">
            <Select
                size="small"
                label="Hvem er reell mottaker?"
                value={disabled ? "" : valg.type || "ingen"}
                onChange={(event) => handleValgChange(event.target.value)}
                error={feil}
                disabled={disabled}
            >
                {disabled && <option value="" disabled />}
                <option value="ingen" disabled={påkrevd}>
                    Bidragsmottaker
                </option>
                <option disabled={kunSamhandlerSomReellMottaker} value="barnet_selv" className="personnavn">
                    {barnNavn} (barnet selv)
                </option>
                <option value="samhandler">
                    {kunSamhandlerSomReellMottaker ? "Samhandler" : "Annen person eller samhandler"}
                </option>
            </Select>

            {kunSamhandlerSomReellMottaker && (
                <InlineMessage status={barnetSøktOppSomSamhandler ? "error" : "info"} size="small">
                    {KUN_SAMHANDLER_MELDING}
                </InlineMessage>
            )}

            {valideringsmelding && (
                <InlineMessage status="error" size="small">
                    {valideringsmelding}
                </InlineMessage>
            )}

            {valg.type === "samhandler" && (
                <SamhandlerValg
                    valg={valg}
                    lagretSamhandlerIdent={lagretSamhandler?.ident}
                    skjulValgt={Boolean(feil || error)}
                    onVelg={handleVelgSamhandler}
                    onFjern={() => {
                        setError(undefined);
                        setValideringsmelding(undefined);
                        onValg({ type: "samhandler" });
                    }}
                    onError={setError}
                />
            )}

            <VergeValg valg={valg} disabled={disabled} onValg={onValg} />
        </VStack>
    );
}

function VergeValg({ valg, disabled, onValg }: Pick<Props, "valg" | "disabled" | "onValg">) {
    if (disabled || valg.type !== "samhandler") return null;
    if (!erPersonSomReellMottaker(valg)) {
        return (
            <InlineMessage status="info" size="small">
                Verge kan registreres når reell mottaker er en person.
            </InlineMessage>
        );
    }
    return (
        <Checkbox
            size="small"
            checked={valg.verge ?? false}
            onChange={(event) => onValg({ ...valg, verge: event.target.checked })}
        >
            Reell mottaker er verge for barnet
        </Checkbox>
    );
}

function valgForMottaker(
    value: string,
    barn: { ident: string; navn: string },
    lagretSamhandler: Samhandler | null,
): ReellMottakerValg {
    if (value === "ingen") return {};
    if (value === "barnet_selv") return { type: "barnet_selv", ...barn, mottakertype: "PERSON" };
    return {
        type: "samhandler",
        ident: lagretSamhandler?.ident,
        navn: lagretSamhandler?.navn,
        mottakertype: lagretSamhandler?.mottakertype,
    };
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
    onVelg: (ident: string, navn?: string, mottakertype?: Mottakertype) => void;
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
