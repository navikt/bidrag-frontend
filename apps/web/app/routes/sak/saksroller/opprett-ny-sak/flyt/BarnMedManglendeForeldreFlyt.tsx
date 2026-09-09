import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, VStack } from "@navikt/ds-react";
import { useEffect } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import BarnMottakerKort from "../barn-felles/BarnMottakerKort";
import ParterOppsummeringBarn from "../barn-felles/ParterOppsummeringBarn";
import LasterSkeleton from "../components/LasterSkeleton";
import { useFlowSubmission } from "../hooks/useFlowSubmission";
import useSyncKategori from "../hooks/useSyncKategori";
import {
    type BarnMedManglendeForeldreSkjemaData,
    BarnMedManglendeForeldreSkjemaSchema,
    type ForelderPartRolle,
} from "../opprett-sak-schema";
import { useSaksrolleroversikt } from "../saksrolleroversiktContext";
import EksisterendeSakSection from "../sections/EksisterendeSakSection";
import EnhetOgSubmitSection from "../sections/EnhetOgSubmitSection";
import ValideringsAlertsSection from "../sections/ValideringsAlertsSection";
import KjentForelderInfo from "./KjentForelderInfo";
import LeggTilForelderSeksjon from "./LeggTilForelderSeksjon";

export default function BarnMedManglendeForeldreFlyt() {
    const { partISaken, saksrolleFlyt, sakskategori } = useSaksrolleroversikt();

    if (!partISaken || !saksrolleFlyt || saksrolleFlyt.type !== "BARN_MANGLENDE_FORELDRE") {
        return null;
    }

    const kjentForelder = saksrolleFlyt.forelder;

    const form = useForm<BarnMedManglendeForeldreSkjemaData>({
        resolver: zodResolver(BarnMedManglendeForeldreSkjemaSchema),
        defaultValues: {
            barn: {
                ident: partISaken.ident,
                navn: partISaken.navn,
                rolle: partISaken.rolle as "barn_over_18" | "barn_under_18",
                diskresjonskode: partISaken.diskresjonskode,
            },
            foreldre: [
                {
                    ident: kjentForelder?.ident || "",
                    navn: kjentForelder?.visningsnavn || "",
                    rolle: null,
                    erKjent: kjentForelder !== null ? true : undefined,
                    diskresjonskode: kjentForelder?.diskresjonskode,
                },
                {
                    ident: "",
                    navn: "",
                    rolle: null,
                    erKjent: undefined,
                },
            ],
            kategori: sakskategori,
        },
        mode: "onChange",
    });

    return (
        <FormProvider {...form}>
            <BarnMedManglendeForeldreFlytContent />
        </FormProvider>
    );
}

function BarnMedManglendeForeldreFlytContent() {
    const { partISaken, saksrolleFlyt } = useSaksrolleroversikt();
    const form = useFormContext<BarnMedManglendeForeldreSkjemaData>();
    useSyncKategori(form);
    const kjentForelder = saksrolleFlyt?.type === "BARN_MANGLENDE_FORELDRE" ? saksrolleFlyt.forelder : null;

    useEffect(() => {
        if (partISaken) {
            form.setValue("barn.rolle", partISaken.rolle);
        }
    }, [partISaken]);

    const barn = form.watch("barn");
    const foreldre = form.watch("foreldre");

    const barnErMyndig = barn.rolle === "barn_over_18";
    const foreldreKlareForOppsummering = foreldre.every((f) => f.navn && f.navn.trim() !== "");
    const rollerErValgt = foreldre.every((f) => f.rolle !== null);
    const harUkjentForelder = foreldre.some((forelder) => forelder.erKjent === false);
    const bidragspliktig = foreldre.find((f) => f.rolle === "bidragspliktig");

    const bidragsmottaker = foreldre.find((f) => f.rolle === "bidragsmottaker");
    const bidragsmottakerErUkjent = typeof bidragsmottaker?.erKjent === "boolean" && !bidragsmottaker?.erKjent;

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
                  navn: bidragspliktig.navn || "",
                  ident: bidragspliktig.ident || "",
                  erKjent: bidragspliktig.erKjent,
                  rolle: "bidragspliktig",
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

    const settRolle = (index: number, rolle: ForelderPartRolle) => {
        foreldre.forEach((_person, index) => {
            form.clearErrors(`foreldre.${index}`);
        });

        form.setValue(`foreldre.${index}.rolle`, rolle);

        const andreIndex = index === 0 ? 1 : 0;
        const motsattRolle = rolle === "bidragspliktig" ? "bidragsmottaker" : "bidragspliktig";
        form.setValue(`foreldre.${andreIndex}.rolle`, motsattRolle);
    };

    const antallManglendeforeldre = foreldre.filter((f) => !f.ident || f.ident.trim() === "").length;

    const visReellMottaker = rollerErValgt;
    const visOppsummering = (foreldreKlareForOppsummering && rollerErValgt) || harUkjentForelder;

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
                    {kjentForelder ? (
                        <Alert variant="info" size="small">
                            Dette barnet har én forelder registrert ({kjentForelder.visningsnavn},{kjentForelder.ident}
                            ). Du må legge til den andre forelderen manuelt.
                        </Alert>
                    ) : (
                        <Alert variant="warning" size="small">
                            Dette barnet har ingen registrerte foreldre. Du må legge til begge foreldre manuelt.
                        </Alert>
                    )}

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

                {kjentForelder && (
                    <KjentForelderInfo
                        form={form}
                        forelder={kjentForelder}
                        onVelgRolle={(rolle) => settRolle(0, rolle)}
                        valgtRolle={foreldre[0]?.rolle ?? null}
                    />
                )}

                <LeggTilForelderSeksjon
                    form={form}
                    foreldre={foreldre}
                    antallManglende={antallManglendeforeldre}
                    kjentForelderIndex={kjentForelder ? 0 : null}
                    onVelgRolle={settRolle}
                />

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

                {foreldreKlareForOppsummering && (
                    <>
                        <div className="border-t border-ax-neutral-300" />
                        <ValideringsAlertsSection visUfullstendigRelasjonAlert />
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
