import { PencilIcon, XMarkIcon } from "@navikt/aksel-icons";
import { SecureLoggerService } from "@bidrag/common";
import { BodyLong, Button, Tag } from "@navikt/ds-react";
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

    // Hent samhandler kun hvis det er en samhandler (ikke "barnet_selv")
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

    return (
        <div className="p-6 bg-ax-neutral-100 rounded-lg">
            <div className="flex justify-between items-center w-full">
                <div className="flex flex-col">
                    <div className="flex gap-2 items-center">
                        <PersonInfo
                            navn={rolle.navn || ""}
                            ident={rolle.fodselsnummer}
                            alder={rolle.alder}
                            fødselsdato={rolle.fødselsdato}
                            tags={
                                erNyttBarn && (
                                    <Tag variant="alt1" size="xsmall">
                                        Nytt barn
                                    </Tag>
                                )
                            }
                        />
                    </div>
                    {rolle.diskresjonskode && <DiskresjonAlert diskresjonskode={rolle.diskresjonskode} />}
                </div>

                {erNyttBarn && (
                    <Button
                        type="button"
                        variant="tertiary"
                        size="small"
                        icon={<XMarkIcon aria-hidden />}
                        onClick={handleFjernBarn}
                    >
                        Fjern
                    </Button>
                )}
            </div>

            <div className="mt-1 pt-1 ">
                {!visReellMottaker && !errors.roller?.[index]?.reellMottaker && (
                    <div className="flex gap-7 items-center">
                        <div>
                            <BodyLong size="small" className="font-medium">
                                Reell mottaker:
                            </BodyLong>
                            <BodyLong size="small" className="text-ax-neutral-800">
                                {getReellMottakerInfo()}
                            </BodyLong>
                        </div>

                        <Button
                            variant="tertiary"
                            size="small"
                            type="button"
                            icon={<PencilIcon aria-hidden />}
                            onClick={handleÅpneReellMottaker}
                        >
                            Endre
                        </Button>
                    </div>
                )}

                {(visReellMottaker || errors.roller?.[index]?.reellMottaker) && (
                    <ReellMottakerVelger
                        rolleIndex={index}
                        barnNavn={rolle.navn || "Barnet"}
                        onAvbryt={handleLukkReellMottaker}
                        kanFjerne={kanFjerneRM}
                        isRequired={!kanFjerneRM}
                        feil={errors.roller?.[index]?.reellMottaker?.message}
                        kunSamhandlerSomReellMottaker={erOppfostringsbidrag}
                    />
                )}
                <RollehistorikkVisning rollehistorikk={rolle.rollehistorikk} />
            </div>
        </div>
    );
}
