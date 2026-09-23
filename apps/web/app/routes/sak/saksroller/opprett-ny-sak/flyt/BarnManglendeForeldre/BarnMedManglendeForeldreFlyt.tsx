import type { PersonDto } from "@bidrag/api/PersonApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@navikt/ds-react";
import { useEffect } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import BarnMottakerKort from "../../barn-felles/BarnMottakerKort";
import ForeldreSeksjon from "../../felles/ForeldreSeksjon";
import RolleFlytSide from "../../felles/RolleFlytSide";
import { useFlowSubmission } from "../../hooks/useFlowSubmission";
import useSyncKategori from "../../hooks/useSyncKategori";
import {
    type BarnMedManglendeForeldreSkjemaData,
    BarnMedManglendeForeldreSkjemaSchema,
    type ForelderPartRolle,
} from "../../opprett-sak-schema";
import { useSaksrolleroversikt } from "../../saksrolleroversiktContext";
import EnhetOgSubmitSection from "../../sections/EnhetOgSubmitSection";
import UfullstendigRelasjonAlert from "../../UfullstendigRelasjonAlert";
import { hentMotsattRolle } from "../../utils";

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
    const alleForeldreHarNavn = foreldre.every((f) => f.navn && f.navn.trim() !== "");
    const rollerErValgt = foreldre.every((f) => f.rolle !== null);
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
        isLoadingOpprettSak,
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

    const leggTilForelder = (person: PersonDto, index: number) => {
        const duplikatPerson = foreldre.find(
            (forelder, forelderIndex) => forelderIndex !== index && forelder.ident === person.ident,
        );

        if (duplikatPerson) {
            const personInfo = person.visningsnavn
                ? `${person.visningsnavn} (${person.ident})`
                : person.ident
                  ? `Denne personen (${person.ident})`
                  : "Denne personen";

            throw new Error(
                `${personInfo} er allerede registrert som ${duplikatPerson.rolle} og kan ikke legges til på nytt.`,
            );
        }

        const andreForelderRolle = form.getValues(`foreldre.${index === 0 ? 1 : 0}.rolle`);
        form.setValue(`foreldre.${index}`, {
            ident: person.ident,
            navn: person.visningsnavn,
            erKjent: true,
            diskresjonskode: person.diskresjonskode,
            rolle: andreForelderRolle ? hentMotsattRolle(andreForelderRolle) : null,
        });
    };

    const settForelderUkjent = (index: number) => {
        const andreForelderRolle = form.getValues(`foreldre.${index === 0 ? 1 : 0}.rolle`);
        form.setValue(`foreldre.${index}`, {
            ident: "",
            navn: "",
            erKjent: false,
            diskresjonskode: undefined,
            rolle: andreForelderRolle ? hentMotsattRolle(andreForelderRolle) : null,
        });
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
                    {alleForeldreHarNavn && <UfullstendigRelasjonAlert />}
                </>
            }
            submit={
                <EnhetOgSubmitSection
                    enhet={enhet}
                    enhetNavn={enhetNavn}
                    isLoadingEnhet={isLoadingEnhet}
                    enhetError={enhetError}
                    blocked={harEksisterendeSak || isLoadingHentSak || isLoadingEnhet}
                    isLoading={isLoadingOpprettSak}
                    submitError={error}
                    saksnummer={saksnummer}
                />
            }
        >
            <BarnMottakerKort form={form} barn={barn} erPåkrevd={trengerReellMottaker} kanVelge={rollerErValgt} />

            <ForeldreSeksjon
                foreldre={foreldre}
                beskrivelse={
                    kjentForelder
                        ? "Kontroller den registrerte forelderen og legg til den andre."
                        : "Søk etter begge foreldrene, eller registrer dem som ukjent."
                }
                rollefeil={foreldre.map((_forelder, index) => form.formState.errors.foreldre?.[index]?.rolle?.message)}
                personfeil={foreldre.map((_forelder, index) => form.formState.errors.foreldre?.[index]?.ident?.message)}
                kanRegistrere={(index) => index !== (kjentForelder ? 0 : -1)}
                onPersonValgt={leggTilForelder}
                onSettUkjent={settForelderUkjent}
                onVelgRolle={settRolle}
            />
        </RolleFlytSide>
    );
}
