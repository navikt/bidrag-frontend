import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Button, VStack } from "@navikt/ds-react";
import { useEffect } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

import FunnetPersonInfo from "../../../components/FunnetPersonInfo";
import BarnMottakerKort from "../../barn-felles/BarnMottakerKort";
import ParterOppsummeringBarn from "../../barn-felles/ParterOppsummeringBarn";
import LasterSkeleton from "../../components/LasterSkeleton";
import { useFlowSubmission } from "../../hooks/useFlowSubmission";
import useSyncKategori from "../../hooks/useSyncKategori";
import { type BarnBeggForeldreSkjemaData, BarnBeggForeldreSkjemaSchema } from "../../opprett-sak-schema";
import { useSaksrolleroversikt } from "../../saksrolleroversiktContext";
import EksisterendeSakSection from "../../sections/EksisterendeSakSection";
import EnhetOgSubmitSection from "../../sections/EnhetOgSubmitSection";
import ValideringsAlertsSection from "../../sections/ValideringsAlertsSection";
import RolleVelger from "./RollerVelger";

export default function BarnBeggeForeldreFlyt() {
    const { partISaken, saksrolleFlyt, sakskategori } = useSaksrolleroversikt();

    if (!partISaken || !saksrolleFlyt || saksrolleFlyt.type !== "BARN_BEGGE_FORELDRE") {
        return null;
    }

    const foreldre = saksrolleFlyt.foreldre;

    const form = useForm<BarnBeggForeldreSkjemaData>({
        resolver: zodResolver(BarnBeggForeldreSkjemaSchema),
        defaultValues: {
            barn: {
                ident: partISaken.ident,
                navn: partISaken.navn,
                rolle: partISaken.rolle,
                diskresjonskode: partISaken.diskresjonskode,
            },
            foreldre: foreldre.map((f) => ({
                ident: f.ident,
                navn: f.visningsnavn,
                rolle: null,
                erKjent: true, // Begge er kjent fra registeret
                diskresjonskode: f.diskresjonskode,
            })),
            kategori: sakskategori,
        },
        mode: "onChange",
    });

    return (
        <FormProvider {...form}>
            <BarnBeggeForeldreFlytContent />
        </FormProvider>
    );
}

function BarnBeggeForeldreFlytContent() {
    const { partISaken, saksrolleFlyt } = useSaksrolleroversikt();
    const form = useFormContext<BarnBeggForeldreSkjemaData>();
    useSyncKategori(form);
    const foreldre = saksrolleFlyt?.type === "BARN_BEGGE_FORELDRE" ? saksrolleFlyt.foreldre : [];

    const barn = form.watch("barn");
    const valgteRoller = form.watch("foreldre");

    const barnErMyndig = barn.rolle === "barn_over_18";
    const rollerErValgt = valgteRoller.every((f) => f.rolle !== null);

    const bidragsmottaker = valgteRoller.find((f) => f.rolle === "bidragsmottaker");
    const bidragspliktig = valgteRoller.find((f) => f.rolle === "bidragspliktig");
    const bidragsmottakerErUkjent = typeof bidragsmottaker?.erKjent === "boolean" && !bidragsmottaker?.erKjent;
    const harUkjentForelder = valgteRoller.some((forelder) => forelder.erKjent === false);

    const trengerReellMottaker = barnErMyndig || bidragsmottakerErUkjent;

    const {
        enhet,
        enhetNavn,
        isLoadingEnhet,
        enhetError,
        harEksisterendeSak,
        eksisterendeSak,
        isLoadingHentSak,
        infoMelding: eksisterendeSakInfoMelding,
        onSubmit,
        error,
        saksnummer,
    } = useFlowSubmission({
        form,
        partISaken: partISaken ?? form.getValues("barn"),
        motpart: null,
        valgteBarn: barn,
        bidragspliktig,
        bidragsmottaker,
        eksisterendeSakPartISaken: bidragspliktig
            ? {
                  ident: bidragspliktig.ident || "",
                  navn: bidragspliktig.navn || "",
                  rolle: "bidragspliktig",
                  erKjent: bidragspliktig.erKjent,
              }
            : null,
        eksisterendeSakMotpart: bidragsmottaker
            ? {
                  ident: bidragsmottaker.ident,
                  rolle: "bidragsmottaker",
                  erKjent: bidragsmottaker.erKjent,
                  navn: bidragsmottaker.navn,
              }
            : null,
    });

    useEffect(() => {
        if (partISaken) {
            form.setValue("barn.rolle", partISaken.rolle);
        }
    }, [partISaken]);

    const settBidragsmottakerUkjent = () => {
        const bidragsmottakerIndex = valgteRoller.findIndex((f) => f.rolle === "bidragsmottaker");
        if (bidragsmottakerIndex !== -1) {
            form.setValue(`foreldre.${bidragsmottakerIndex}.erKjent`, false);
            form.setValue(`foreldre.${bidragsmottakerIndex}.ident`, "");
            form.setValue(`foreldre.${bidragsmottakerIndex}.navn`, "");
        }
    };

    const settDenAndreForelderSomBidragsmottaker = () => {
        const bidragsmottakerIndex = valgteRoller.findIndex((f) => f.rolle === "bidragsmottaker");
        const denAndreForelder = bidragspliktig ? foreldre.find((f) => f.ident !== bidragspliktig.ident) : undefined;

        if (bidragsmottakerIndex === -1 || !denAndreForelder) {
            return;
        }

        form.setValue(`foreldre.${bidragsmottakerIndex}.ident`, denAndreForelder.ident);
        form.setValue(`foreldre.${bidragsmottakerIndex}.navn`, denAndreForelder.visningsnavn);
        form.setValue(`foreldre.${bidragsmottakerIndex}.erKjent`, true);
    };

    const visReellMottaker = rollerErValgt;
    const visOppsummering = rollerErValgt || harUkjentForelder;

    return (
        <Box
            as="form"
            onSubmit={onSubmit}
            borderRadius={"2"}
            background="default"
            padding={"space-12"}
            className="gap-4 flex flex-col"
        >
            <VStack gap="space-6">
                <div className="space-y-3">
                    <Alert variant="info" size="small">
                        Barnet har begge foreldre registrert. Du må velge hvem som skal betale bidrag.
                    </Alert>

                    {eksisterendeSakInfoMelding && (
                        <Alert size="small" variant={eksisterendeSakInfoMelding.type}>
                            {eksisterendeSakInfoMelding.melding}
                        </Alert>
                    )}

                    <EksisterendeSakSection
                        harEksisterendeSak={harEksisterendeSak}
                        eksisterendeSak={eksisterendeSak}
                        partISakenNavn={bidragspliktig?.navn ?? ""}
                        motpartNavn={bidragsmottaker?.navn}
                    />
                </div>

                {isLoadingHentSak && <LasterSkeleton tekst="Henter sak..." />}

                <div className="border-t border-ax-neutral-300" />

                <VStack gap="space-4">
                    <RolleVelger form={form} foreldre={foreldre} />

                    {rollerErValgt && bidragsmottaker?.erKjent && (
                        <div className="flex justify-end">
                            <Button type="button" variant="tertiary" size="small" onClick={settBidragsmottakerUkjent}>
                                Sett bidragsmottaker som ukjent
                            </Button>
                        </div>
                    )}

                    {bidragsmottaker?.erKjent === false && (
                        <FunnetPersonInfo
                            label="Bidragsmottaker:"
                            navn="Ukjent"
                            fjern={settDenAndreForelderSomBidragsmottaker}
                            bakgrunn="bg-ax-warning-200"
                            border="border-ax-warning-600"
                            ikon="text-ax-warning-700"
                        />
                    )}
                </VStack>

                {visReellMottaker && (
                    <>
                        <div className="border-t border-ax-neutral-300" />
                        <BarnMottakerKort
                            form={form}
                            barn={barn}
                            visReellMottaker={visReellMottaker}
                            erPåkrevd={trengerReellMottaker}
                        />
                    </>
                )}

                {visOppsummering && (
                    <>
                        <div className="border-t border-ax-neutral-300" />
                        <ParterOppsummeringBarn form={form} />
                    </>
                )}

                {bidragsmottakerErUkjent && (
                    <>
                        <div className="border-t border-ax-neutral-300" />
                        <ValideringsAlertsSection visUfullstendigRelasjonAlert={bidragsmottakerErUkjent} />
                    </>
                )}

                <div className="border-t border-ax-neutral-300" />

                <EnhetOgSubmitSection
                    enhet={enhet}
                    enhetNavn={enhetNavn}
                    isLoadingEnhet={isLoadingEnhet}
                    enhetError={enhetError}
                    disabled={harEksisterendeSak || isLoadingHentSak || isLoadingEnhet}
                    submitError={error}
                    saksnummer={saksnummer}
                />
            </VStack>
        </Box>
    );
}
