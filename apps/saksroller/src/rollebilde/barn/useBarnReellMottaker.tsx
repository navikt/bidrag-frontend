import { IdentUtils, SecureLoggerService } from "@bidrag/common";
import { BodyShort } from "@navikt/ds-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useHentSamhandler } from "../../api/samhandler.api";
import { FunnetPersonInnhold } from "../../felles/person/FunnetPersonInfo.tsx";
import SamhandlerInfo from "../../felles/person/SamhandlerInfo.tsx";
import type { ReellMottakerValg } from "../../felles/reell-mottaker/ReellMottakerValgGruppe.tsx";
import { erPersonSomReellMottaker } from "../../felles/reell-mottaker/reell-mottaker-valg.ts";
import type { BarnRolle, SakRedigeringData } from "../../felles/sakvisning-schema.ts";
import { fjernRolle } from "../endringer/rolle-endringer.ts";
import { useRegistrerÅpenRedigering } from "../RedigeringRegisterContext.tsx";

export function useBarnReellMottaker({
    rolle,
    index,
    closeEditorSignal,
    hentOgNullstillSamhandler,
}: {
    rolle: BarnRolle;
    index: number;
    closeEditorSignal?: number;
    hentOgNullstillSamhandler: (barnIndex: number, isLeggTilBarn: boolean) => { ident: string; navn: string } | null;
}) {
    const form = useFormContext<SakRedigeringData>();
    const roller = form.watch("roller") || [];
    const [visReellMottaker, setVisReellMottaker] = useState(false);
    const skalHenteSamhandler =
        rolle.reellMottakerType === "samhandler" && rolle.reellMottaker?.trim() !== "" && !rolle.reellMottakerNavn;
    const {
        data: samhandlerInfo,
        isLoading: lasterSamhandler,
        error: samhandlerError,
    } = useHentSamhandler(rolle.reellMottaker || "", skalHenteSamhandler);

    useRegistrerÅpenRedigering(`barn-reell-mottaker-${rolle.fodselsnummer || index}`, visReellMottaker);

    const handleEndreReellMottaker = (
        type?: "barnet_selv" | "samhandler",
        ident?: string,
        navn?: string,
        verge?: boolean,
    ) => {
        const oppdaterteRoller = [...roller];
        const currentRolle = oppdaterteRoller[index] as BarnRolle;

        currentRolle.reellMottakerType = type;
        if (type === "barnet_selv") {
            currentRolle.reellMottaker = currentRolle.fodselsnummer;
            currentRolle.reellMottakerNavn = currentRolle.navn;
        } else if (type === "samhandler") {
            currentRolle.reellMottaker = ident;
            currentRolle.reellMottakerNavn = navn;
        } else {
            currentRolle.reellMottaker = undefined;
            currentRolle.reellMottakerNavn = undefined;
        }

        currentRolle.reellMottakerErVerge = erPersonSomReellMottaker({ type, ident }) ? (verge ?? false) : false;

        form.setValue("roller", oppdaterteRoller, { shouldValidate: true });
    };

    useEffect(() => {
        if (samhandlerInfo && rolle.reellMottakerType === "samhandler" && !rolle.reellMottakerNavn) {
            handleEndreReellMottaker(
                "samhandler",
                rolle.reellMottaker,
                samhandlerInfo.navn,
                rolle.reellMottakerErVerge,
            );
        }
    }, [samhandlerInfo]);

    useEffect(() => {
        if (samhandlerError) {
            SecureLoggerService.error(
                "Kunne ikke hente samhandlerinformasjon",
                samhandlerError instanceof Error ? samhandlerError : new Error(String(samhandlerError)),
            );
        }
    }, [samhandlerError]);

    useEffect(() => {
        setVisReellMottaker(false);
    }, [closeEditorSignal]);

    useEffect(() => {
        if (visReellMottaker) {
            const nyData = hentOgNullstillSamhandler(index, false);
            if (nyData) {
                handleEndreReellMottaker("samhandler", nyData.ident, nyData.navn);
                setVisReellMottaker(false);
            }
        }
    }, [index, visReellMottaker, hentOgNullstillSamhandler]);

    const getReellMottakerInfo = (): ReactNode => {
        if (lasterSamhandler) {
            return "Laster...";
        }
        if (samhandlerError) {
            return "Feil ved henting av samhandler";
        }
        if (rolle.reellMottaker && rolle.reellMottakerType === "barnet_selv") {
            return "Barnet selv";
        }
        if (rolle.reellMottakerType === "samhandler") {
            const navn = rolle.reellMottakerNavn ?? (samhandlerInfo ? (samhandlerInfo.navn ?? "") : undefined);
            if (navn !== undefined && rolle.reellMottaker && IdentUtils.isSamhandlerId(rolle.reellMottaker)) {
                return <SamhandlerInfo navn={navn} ident={rolle.reellMottaker} />;
            }
            if (navn !== undefined) {
                return (
                    <FunnetPersonInnhold
                        navn={navn}
                        ident={rolle.reellMottaker}
                        tags={
                            rolle.reellMottakerErVerge && (
                                <BodyShort size="small" textColor="subtle">
                                    (verge)
                                </BodyShort>
                            )
                        }
                    />
                );
            }
        }
        return "Ikke registrert";
    };

    return {
        visReellMottaker,
        harReellMottaker: Boolean(rolle.reellMottaker),
        reellMottakerInfo: getReellMottakerInfo(),
        handleFjernBarn: () => fjernRolle(form, rolle.fodselsnummer),
        handleÅpneReellMottaker: () => setVisReellMottaker(true),
        handleLukkReellMottaker: () => setVisReellMottaker(false),
        handleBekreftReellMottaker: (valg: ReellMottakerValg) => {
            handleEndreReellMottaker(valg.type, valg.ident, valg.navn, valg.verge);
            setVisReellMottaker(false);
        },
    };
}
