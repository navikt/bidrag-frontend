import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button } from "@navikt/ds-react";
import { useEffect } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

import BarnMottakerKort from "../../barn-felles/BarnMottakerKort";
import ForeldreSeksjon from "../../felles/ForeldreSeksjon";
import RolleFlytSide from "../../felles/RolleFlytSide";
import { useFlowSubmission } from "../../hooks/useFlowSubmission";
import useSyncKategori from "../../hooks/useSyncKategori";
import { type BarnBeggForeldreSkjemaData, BarnBeggForeldreSkjemaSchema } from "../../opprett-sak-schema";
import { useSaksrolleroversikt } from "../../saksrolleroversiktContext";
import EnhetOgSubmitSection from "../../sections/EnhetOgSubmitSection";
import UfullstendigRelasjonAlert from "../../UfullstendigRelasjonAlert";

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

    const trengerReellMottaker = barnErMyndig || bidragsmottakerErUkjent;

    const settRolle = (index: number, rolle: "bidragspliktig" | "bidragsmottaker") => {
        valgteRoller.forEach((_person, forelderIndex) => {
            form.clearErrors(`foreldre.${forelderIndex}`);
        });

        form.setValue(`foreldre.${index}.rolle`, rolle);
        form.setValue(
            `foreldre.${index === 0 ? 1 : 0}.rolle`,
            rolle === "bidragspliktig" ? "bidragsmottaker" : "bidragspliktig",
        );
    };

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

    return (
        <RolleFlytSide
            onSubmit={onSubmit}
            status={{
                infoMelding: eksisterendeSakInfoMelding,
                harEksisterendeSak,
                eksisterendeSak,
                isLoading: isLoadingHentSak,
                partISakenNavn: bidragspliktig?.navn ?? "",
                motpartNavn: bidragsmottaker?.navn,
            }}
            meldinger={
                <>
                    <Alert variant="info" size="small">
                        Barnet har begge foreldre registrert. Du må velge hvem som skal betale bidrag.
                    </Alert>
                    {bidragsmottakerErUkjent && <UfullstendigRelasjonAlert />}
                </>
            }
            submit={
                <EnhetOgSubmitSection
                    enhet={enhet}
                    enhetNavn={enhetNavn}
                    isLoadingEnhet={isLoadingEnhet}
                    enhetError={enhetError}
                    blocked={harEksisterendeSak || isLoadingHentSak || isLoadingEnhet}
                    submitError={error}
                    saksnummer={saksnummer}
                />
            }
        >
            <BarnMottakerKort form={form} barn={barn} erPåkrevd={trengerReellMottaker} kanVelge={rollerErValgt} />

            <ForeldreSeksjon
                foreldre={valgteRoller}
                beskrivelse="Velg rolle for en av foreldrene. Den andre får motsatt rolle."
                rollefeil={valgteRoller.map(
                    (_forelder, index) => form.formState.errors.foreldre?.[index]?.rolle?.message,
                )}
                personfeil={valgteRoller.map(
                    (_forelder, index) => form.formState.errors.foreldre?.[index]?.ident?.message,
                )}
                onVelgRolle={settRolle}
                handling={(forelder) => {
                    if (forelder.rolle !== "bidragsmottaker") {
                        return null;
                    }

                    return forelder.erKjent ? (
                        <Button type="button" variant="tertiary" size="small" onClick={settBidragsmottakerUkjent}>
                            Sett bidragsmottaker som ukjent
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="secondary"
                            size="small"
                            onClick={settDenAndreForelderSomBidragsmottaker}
                        >
                            Bruk registrert forelder
                        </Button>
                    );
                }}
            />
        </RolleFlytSide>
    );
}
