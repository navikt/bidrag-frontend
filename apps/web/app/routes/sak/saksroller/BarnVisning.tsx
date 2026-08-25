import { RolleTag, RolleTypeAbbreviation, SecureLoggerService } from "@bidrag/common";
import { PencilIcon, PlusIcon, XMarkIcon } from "@navikt/aksel-icons";
import { BodyLong, Box, Button, ErrorMessage, HStack, Tag } from "@navikt/ds-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { useHentSamhandler } from "~/api/useApi.ts";
import DiskresjonAlert from "./components/DiskresjonAlert.tsx";
import FunnetPersonInfo from "./components/FunnetPersonInfo.tsx";
import PersonInfo from "./components/PersonInfo.tsx";
import ReellMottakerVelger from "./ReellMottakerVelger.tsx";
import RollehistorikkVisning from "./RollehistorikkVisning.tsx";
import type { BarnRolle, SakRedigeringData } from "./sakvisning-schema.ts";

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
                return <FunnetPersonInfo simple navn={rolle.reellMottakerNavn} ident={rolle.reellMottaker} />;
            }
            if (samhandlerInfo) {
                return <FunnetPersonInfo simple navn={samhandlerInfo.navn ?? ""} ident={rolle.reellMottaker} />;
            }
        }

        return "Ikke registrert";
    };

    useEffect(() => {
        if (samhandlerInfo && rolle.reellMottakerType === "samhandler" && !rolle.reellMottakerNavn) {
            handleEndreReellMottaker("samhandler", rolle.reellMottaker, samhandlerInfo.navn);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <Box background="raised" borderColor="neutral-subtleA" borderWidth="1" borderRadius="12" padding="space-16">
            <PersonInfo
                navn={rolle.navn || ""}
                ident={rolle.fodselsnummer}
                alder={rolle.alder}
                fødselsdato={rolle.fødselsdato}
                rolle="BA"
                stønad18År={rolle.erMyndig}
                tags={null}
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
                {rolle.diskresjonskode && <DiskresjonAlert diskresjonskode={rolle.diskresjonskode} />}

                {!visReellMottaker && !visRmFeil && (
                    <Box marginBlock="space-8 space-0">
                        {harReellMottaker ? (
                            <>
                                <Box borderColor="neutral-subtleA" borderWidth="1 0 0 0" />
                                <HStack gap="space-12" align="center" justify="space-between" paddingBlock="space-8">
                                    <HStack gap="space-8" align="center" minWidth="0">
                                        <RolleTag rolleType={RolleTypeAbbreviation.RM} />
                                        <BodyLong size="small" textColor="subtle" truncate>
                                            {getReellMottakerInfo()}
                                        </BodyLong>
                                    </HStack>
                                    <Button
                                        variant="tertiary"
                                        size="xsmall"
                                        type="button"
                                        icon={<PencilIcon aria-hidden />}
                                        aria-label="Endre reell mottaker"
                                        onClick={handleÅpneReellMottaker}
                                    />
                                </HStack>
                                <Box borderColor="neutral-subtleA" borderWidth="1 0 0 0" />
                            </>
                        ) : (
                            <Button
                                variant="tertiary"
                                size="small"
                                type="button"
                                icon={<PlusIcon aria-hidden />}
                                onClick={handleÅpneReellMottaker}
                            >
                                Legg til reell mottaker
                            </Button>
                        )}
                    </Box>
                )}

                {visRmFeil && (
                    <ErrorMessage size="small" className="mt-2">
                        {errors.roller?.[index]?.reellMottaker?.message}
                    </ErrorMessage>
                )}

                <RollehistorikkVisning rollehistorikk={rolle.rollehistorikk} rolle={rolle} />
            </PersonInfo>

            {visReellMottaker && (
                <ReellMottakerVelger
                    rolleIndex={index}
                    barnNavn={rolle.navn || "Barnet"}
                    onAvbryt={handleLukkReellMottaker}
                    onBekreft={handleLukkReellMottaker}
                    kanFjerne={kanFjerneRM}
                    isRequired={!kanFjerneRM}
                    kunSamhandlerSomReellMottaker={erOppfostringsbidrag}
                />
            )}
        </Box>
    );
}
