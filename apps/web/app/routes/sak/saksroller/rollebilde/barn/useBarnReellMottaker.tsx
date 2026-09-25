import { SecureLoggerService } from "@bidrag/common";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useHentSamhandler } from "~/api/useApi.ts";
import { FunnetPersonInnhold } from "../../felles/person/FunnetPersonInfo.tsx";
import type { ReellMottakerValg } from "../../felles/reell-mottaker/ReellMottakerValgGruppe.tsx";
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

    const handleEndreReellMottaker = (type?: "barnet_selv" | "samhandler", ident?: string, navn?: string) => {
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

        form.setValue("roller", oppdaterteRoller, { shouldValidate: true });
    };

    useEffect(() => {
        if (samhandlerInfo && rolle.reellMottakerType === "samhandler" && !rolle.reellMottakerNavn) {
            handleEndreReellMottaker("samhandler", rolle.reellMottaker, samhandlerInfo.navn);
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
            if (rolle.reellMottakerNavn) {
                return <FunnetPersonInnhold navn={rolle.reellMottakerNavn} ident={rolle.reellMottaker} />;
            }
            if (samhandlerInfo) {
                return <FunnetPersonInnhold navn={samhandlerInfo.navn ?? ""} ident={rolle.reellMottaker} />;
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
            handleEndreReellMottaker(valg.type, valg.ident, valg.navn);
            setVisReellMottaker(false);
        },
    };
}
