import { IdentUtils, SecureLoggerService } from "@bidrag/common";
import { BodyShort } from "@navikt/ds-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useHentSamhandler } from "../../api/samhandler.api";
import { FunnetPersonInnhold } from "../../felles/person/FunnetPersonInfo.tsx";
import SamhandlerInfo from "../../felles/person/SamhandlerInfo.tsx";
import type { ReellMottakerValg } from "../../felles/reell-mottaker/ReellMottakerValgGruppe.tsx";
import {
    erPersonSomReellMottaker,
    erSammeMottakerUtenType,
} from "../../felles/reell-mottaker/reell-mottaker-regler.ts";
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

    const handleEndreReellMottaker = (valg: ReellMottakerValg) => {
        const oppdaterteRoller = [...roller];
        const currentRolle = oppdaterteRoller[index] as BarnRolle;
        const erUendretUkjentLegacy = erSammeMottakerUtenType(
            {
                type: currentRolle.reellMottakerType,
                ident: currentRolle.reellMottaker,
                mottakertype: currentRolle.reellMottakerEntitetstype,
                verge: currentRolle.reellMottakerErVerge,
            },
            valg,
        );

        currentRolle.reellMottakerType = valg.type;
        currentRolle.reellMottaker = valg.ident;
        currentRolle.reellMottakerEntitetstype =
            valg.mottakertype ?? (valg.type === "barnet_selv" ? "PERSON" : undefined);
        currentRolle.reellMottakerNavn = valg.navn;

        if (erPersonSomReellMottaker(valg)) {
            currentRolle.reellMottakerErVerge = valg.verge ?? false;
        } else if (!erUendretUkjentLegacy) {
            currentRolle.reellMottakerErVerge = false;
        }

        form.setValue("roller", oppdaterteRoller, { shouldValidate: true });
    };

    useEffect(() => {
        const informasjon = samhandlerInfo;
        if (
            informasjon &&
            informasjon.samhandlerId === rolle.reellMottaker &&
            informasjon.navn &&
            rolle.reellMottakerType === "samhandler" &&
            !rolle.reellMottakerNavn
        ) {
            const oppdaterteRoller = [...(form.getValues("roller") || [])];
            const currentRolle = oppdaterteRoller[index] as BarnRolle;
            if (
                currentRolle.reellMottakerType === "samhandler" &&
                currentRolle.reellMottaker === rolle.reellMottaker &&
                !currentRolle.reellMottakerNavn
            ) {
                currentRolle.reellMottakerNavn = informasjon.navn;
                form.setValue("roller", oppdaterteRoller, { shouldValidate: true });
            }
        }
    }, [form, index, rolle.reellMottaker, rolle.reellMottakerNavn, rolle.reellMottakerType, samhandlerInfo]);

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
                handleEndreReellMottaker({ type: "samhandler", ident: nyData.ident, navn: nyData.navn });
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
            return registrertReellMottakerInfo(rolle, navn);
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
            handleEndreReellMottaker(valg);
            setVisReellMottaker(false);
        },
    };
}

function registrertReellMottakerInfo(rolle: BarnRolle, navn: string | undefined): ReactNode {
    if (navn === undefined) return "Ikke registrert";
    if (rolle.reellMottaker && IdentUtils.isSamhandlerId(rolle.reellMottaker)) {
        return <SamhandlerInfo navn={navn} ident={rolle.reellMottaker} />;
    }
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
