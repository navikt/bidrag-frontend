import { SecureLoggerService } from "@bidrag/common";
import { XMarkIcon } from "@navikt/aksel-icons";
import { Box, Button, ErrorMessage, HStack, Tag, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { useHentSamhandler } from "~/api/useApi.ts";
import { FunnetPersonInnhold } from "../components/FunnetPersonInfo.tsx";
import { BarnKortInnhold } from "../felles/BarnKort.tsx";
import { KortRamme } from "../felles/PersonRolleKort.tsx";
import ReellMottakerRad from "../felles/ReellMottakerRad.tsx";
import { useRegistrerÅpenRedigering } from "../RedigeringRegisterContext.tsx";
import ReellMottakerVelger from "../ReellMottakerVelger.tsx";
import RollehistorikkVisning from "../RollehistorikkVisning.tsx";
import type { BarnRolle, SakRedigeringData } from "../sakvisning-schema.ts";

interface BarnVisningProps {
    rolle: BarnRolle;
    index: number;
    kanFjerneRM: boolean;
    erNyttBarn?: boolean;
    hentOgNullstillSamhandler: (barnIndex: number, isLeggTilBarn: boolean) => { ident: string; navn: string } | null;
    closeEditorSignal?: number;
    erOppfostringsbidrag?: boolean;
}

export default function BarnVisning({
    rolle,
    index,
    kanFjerneRM,
    erNyttBarn,
    hentOgNullstillSamhandler,
    closeEditorSignal,
    erOppfostringsbidrag = false,
}: BarnVisningProps) {
    const form = useFormContext<SakRedigeringData>();
    const errors = form.formState.errors;

    const skalHenteSamhandler =
        rolle.reellMottakerType === "samhandler" && rolle?.reellMottaker?.trim() !== "" && !rolle?.reellMottakerNavn;

    const {
        data: samhandlerInfo,
        isLoading: lasterSamhandler,
        error: samhandlerError,
    } = useHentSamhandler(rolle.reellMottaker || "", skalHenteSamhandler);

    const [visReellMottaker, setVisReellMottaker] = useState(false);
    useRegistrerÅpenRedigering(`barn-reell-mottaker-${rolle.fodselsnummer || index}`, visReellMottaker);
    const roller = form.watch("roller") || [];

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

    const handleFjernBarn = () => {
        const oppdaterteRoller = roller.filter((r) => r.fodselsnummer !== rolle.fodselsnummer);
        form.setValue("roller", oppdaterteRoller, { shouldValidate: true });
    };

    const handleÅpneReellMottaker = () => {
        setVisReellMottaker(true);
    };

    const handleLukkReellMottaker = () => {
        setVisReellMottaker(false);
    };

    const harReellMottaker = Boolean(rolle.reellMottaker);
    const visRmFeil = Boolean(errors.roller?.[index]?.reellMottaker) && !visReellMottaker;

    return (
        <KortRamme>
            <VStack gap={"space-16"}>
                <BarnKortInnhold
                    barn={{
                        ident: rolle.fodselsnummer,
                        navn: rolle.navn,
                        fødselsdato: rolle.fødselsdato,
                        alder: rolle.alder,
                        erMyndig: rolle.erMyndig,
                        diskresjonskode: rolle.diskresjonskode,
                    }}
                    visIkon={false}
                    headingActions={
                        erNyttBarn && (
                            <HStack gap="space-12" align="center" flexShrink="0" marginInline="auto space-0">
                                <Tag variant="alt1" size="xsmall">
                                    Nytt barn
                                </Tag>
                                <Button
                                    type="button"
                                    variant="tertiary"
                                    size="small"
                                    icon={<XMarkIcon aria-hidden />}
                                    onClick={handleFjernBarn}
                                >
                                    Fjern
                                </Button>
                            </HStack>
                        )
                    }
                >
                    {!visReellMottaker && (
                        <ReellMottakerRad
                            harReellMottaker={harReellMottaker}
                            reellMottakerInfo={getReellMottakerInfo()}
                            onEndre={handleÅpneReellMottaker}
                            onLeggTil={handleÅpneReellMottaker}
                        />
                    )}

                    {visRmFeil && (
                        <Box asChild marginBlock="space-8 space-0">
                            <ErrorMessage size="small">{errors.roller?.[index]?.reellMottaker?.message}</ErrorMessage>
                        </Box>
                    )}
                </BarnKortInnhold>

                {visReellMottaker && (
                    <ReellMottakerVelger
                        barnNavn={rolle.navn || "Barnet"}
                        barnIdent={rolle.fodselsnummer}
                        verdi={{
                            type: rolle.reellMottakerType,
                            ident: rolle.reellMottaker,
                            navn: rolle.reellMottakerNavn,
                        }}
                        onAvbryt={handleLukkReellMottaker}
                        onBekreft={(valg) => {
                            handleEndreReellMottaker(valg.type, valg.ident, valg.navn);
                            handleLukkReellMottaker();
                        }}
                        regel={erOppfostringsbidrag ? "kun-samhandler" : kanFjerneRM ? "valgfri" : "påkrevd"}
                    />
                )}
                <RollehistorikkVisning
                    rollehistorikk={rolle.rollehistorikk}
                    rolle={rolle}
                    saksnummer={form.getValues("saksnummer")}
                />
            </VStack>
        </KortRamme>
    );
}
