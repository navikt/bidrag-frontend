import { Alert, BodyShort, Button, Radio, RadioGroup, Stack } from "@navikt/ds-react";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import type { SakRedigeringData } from "./sakvisning-schema.ts";
import FunnetPersonInfo from "./components/FunnetPersonInfo.tsx";
import ReellMottakerSøk from "./components/ReellMottakerSøk.tsx";

interface ReellMottakerVelgerProps {
    barnNavn: string;
    rolleIndex: number;
    onAvbryt: () => void;
    onSelect?: () => void;
    disabled?: boolean;
    kanFjerne?: boolean;
    isRequired?: boolean;
    feil?: string;
    kunSamhandlerSomReellMottaker?: boolean;
}

export default function ReellMottakerVelger({
    barnNavn,
    rolleIndex,
    disabled,
    onAvbryt,
    feil,
    onSelect,
    kanFjerne = false,
    isRequired = false,
    kunSamhandlerSomReellMottaker = false,
}: ReellMottakerVelgerProps) {
    const form = useFormContext<SakRedigeringData>();
    const barn = useWatch({
        control: form.control,
        name: `roller.${rolleIndex}`,
    });

    const [lagretSamhandler, setLagretSamhandler] = useState<{ ident: string; navn: string } | null>(null);
    const kunSamhandlerFeilmelding =
        "Barnet selv kan ikke velges som reell mottaker i oppfostringsbidrag. Velg samhandler (kommune).";
    const samhandlerIdent = form.watch(`roller.${rolleIndex}.reellMottaker`);
    const samhandlerNavn = form.watch(`roller.${rolleIndex}.reellMottakerNavn`);

    useEffect(() => {
        if (barn?.reellMottakerType === "samhandler" && samhandlerIdent && samhandlerNavn) {
            setLagretSamhandler({ ident: samhandlerIdent, navn: samhandlerNavn });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [barn?.reellMottakerType, samhandlerIdent, samhandlerNavn]);

    useEffect(() => {
        if (!isRequired || !barn) {
            return;
        }
        if (barn.reellMottakerType && barn.reellMottakerType !== "ingen") {
            return;
        }

        if (kunSamhandlerSomReellMottaker) {
            form.setValue(`roller.${rolleIndex}.reellMottakerType`, "samhandler");
            form.setValue(`roller.${rolleIndex}.reellMottaker`, lagretSamhandler?.ident);
            form.setValue(`roller.${rolleIndex}.reellMottakerNavn`, lagretSamhandler?.navn);
            return;
        }

        form.setValue(`roller.${rolleIndex}.reellMottakerType`, "barnet_selv");
        form.setValue(`roller.${rolleIndex}.reellMottaker`, barn.fodselsnummer);
        form.setValue(`roller.${rolleIndex}.reellMottakerNavn`, barn.navn);
    }, [barn, form, isRequired, kunSamhandlerSomReellMottaker, lagretSamhandler, rolleIndex]);

    useEffect(() => {
        if (!kunSamhandlerSomReellMottaker || !barn || barn.reellMottakerType !== "barnet_selv") {
            return;
        }

        form.setValue(`roller.${rolleIndex}.reellMottakerType`, "samhandler");
        form.setValue(`roller.${rolleIndex}.reellMottaker`, lagretSamhandler?.ident);
        form.setValue(`roller.${rolleIndex}.reellMottakerNavn`, lagretSamhandler?.navn);
    }, [barn, form, kunSamhandlerSomReellMottaker, lagretSamhandler, rolleIndex]);

    const handleRadioChange = (value: string) => {
        if (value === "ingen") {
            fjernSamhandler();
            return;
        }

        const nyType = value as "barnet_selv" | "samhandler";

        if (kunSamhandlerSomReellMottaker && nyType === "barnet_selv") {
            form.setValue(`roller.${rolleIndex}.reellMottakerType`, "samhandler");
            form.setValue(`roller.${rolleIndex}.reellMottaker`, lagretSamhandler?.ident);
            form.setValue(`roller.${rolleIndex}.reellMottakerNavn`, lagretSamhandler?.navn);
            return;
        }

        if (nyType === "barnet_selv") {
            if (barn?.reellMottakerType === "samhandler" && samhandlerIdent && samhandlerNavn) {
                setLagretSamhandler({ ident: samhandlerIdent, navn: samhandlerNavn });
            }

            form.setValue(`roller.${rolleIndex}.reellMottakerType`, "barnet_selv");
            form.setValue(`roller.${rolleIndex}.reellMottaker`, barn.fodselsnummer);
            form.setValue(`roller.${rolleIndex}.reellMottakerNavn`, barn.navn);
            onSelect?.();
        } else if (nyType === "samhandler") {
            form.setValue(`roller.${rolleIndex}.reellMottakerType`, "samhandler");

            if (lagretSamhandler) {
                form.setValue(`roller.${rolleIndex}.reellMottaker`, lagretSamhandler.ident);
                form.setValue(`roller.${rolleIndex}.reellMottakerNavn`, lagretSamhandler.navn);
            } else {
                form.setValue(`roller.${rolleIndex}.reellMottaker`, undefined);
                form.setValue(`roller.${rolleIndex}.reellMottakerNavn`, undefined);
            }
        }
    };

    const fjernSamhandler = () => {
        form.setValue(`roller.${rolleIndex}.reellMottakerType`, undefined);
        form.setValue(`roller.${rolleIndex}.reellMottaker`, undefined);
        form.setValue(`roller.${rolleIndex}.reellMottakerNavn`, undefined);
    };

    if (!barn) {
        return null;
    }

    return (
        <div className="space-y-4">
            <RadioGroup
                size="small"
                legend={
                    <div className="flex flex-row gap-2 items-center">
                        <BodyShort size="small">Hvem er reell mottaker?</BodyShort>
                        <div className="flex gap-2">
                            <Button
                                size="small"
                                variant="tertiary"
                                type="button"
                                onClick={onAvbryt}
                                disabled={disabled}
                            >
                                Lukk
                            </Button>
                        </div>
                    </div>
                }
                value={barn.reellMottakerType || "ingen"}
                onChange={handleRadioChange}
                disabled={disabled}
                error={feil}
            >
                <Stack gap="space-0 space-24" direction={{ xs: "column", sm: "row" }} wrap={false}>
                    <Radio value="ingen" disabled={isRequired || !kanFjerne}>
                        Ingen
                    </Radio>
                    <Radio disabled={!kunSamhandlerSomReellMottaker} value="barnet_selv">
                        {barnNavn} (barnet selv)
                    </Radio>
                    <Radio value="samhandler">Søk samhandler</Radio>
                </Stack>
            </RadioGroup>

            {kunSamhandlerSomReellMottaker && (
                <Alert variant="warning" size="small">
                    {kunSamhandlerFeilmelding}
                </Alert>
            )}

            {barn.reellMottakerType === "samhandler" && (
                <ReellMottakerSøk
                    barnIndex={rolleIndex}
                    valgtSamhandlerId={samhandlerIdent ?? lagretSamhandler?.ident}
                    onSelect={onSelect}
                />
            )}

            {barn.reellMottakerType === "samhandler" && samhandlerNavn && samhandlerIdent && (
                <FunnetPersonInfo
                    label="Reell mottaker:"
                    navn={samhandlerNavn}
                    ident={samhandlerIdent}
                    disabled={disabled}
                />
            )}
        </div>
    );
}
