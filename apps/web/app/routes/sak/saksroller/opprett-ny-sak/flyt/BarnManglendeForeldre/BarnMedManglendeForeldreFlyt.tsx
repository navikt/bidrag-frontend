import type { PersonDto } from "@bidrag/api/PersonApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@navikt/ds-react";
import { FormProvider, useForm } from "react-hook-form";
import BarnMottakerKort from "../../barn-felles/BarnMottakerKort";
import ForeldreSeksjon from "../../felles/ForeldreSeksjon";
import RolleFlytSide from "../../felles/RolleFlytSide";
import { useBarnForeldreFlyt } from "../../hooks/useBarnForeldreFlyt";
import {
    type BarnMedManglendeForeldreSkjemaData,
    BarnMedManglendeForeldreSkjemaSchema,
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
            foreldre: [lagKjentForelder(kjentForelder), { ident: "", navn: "", rolle: null, erKjent: undefined }],
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

function lagKjentForelder(forelder: PersonDto | null | undefined) {
    return {
        ident: forelder?.ident || "",
        navn: forelder?.visningsnavn || "",
        rolle: null,
        erKjent: forelder ? true : undefined,
        diskresjonskode: forelder?.diskresjonskode,
    };
}

function BarnMedManglendeForeldreFlytContent() {
    const { saksrolleFlyt } = useSaksrolleroversikt();
    const kjentForelder = saksrolleFlyt?.type === "BARN_MANGLENDE_FORELDRE" ? saksrolleFlyt.forelder : null;
    const { form, foreldre, barnKort, foreldreSeksjon, onSubmit, innsending, status } = useBarnForeldreFlyt();

    const alleForeldreHarNavn = foreldre.every((f) => f.navn && f.navn.trim() !== "");

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
            status={status}
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
            submit={<EnhetOgSubmitSection {...innsending} />}
        >
            <BarnMottakerKort {...barnKort} />

            <ForeldreSeksjon
                {...foreldreSeksjon}
                beskrivelse={
                    kjentForelder
                        ? "Kontroller den registrerte forelderen og legg til den andre."
                        : "Søk etter begge foreldrene, eller registrer dem som ukjent."
                }
                kanRegistrere={(index) => index !== (kjentForelder ? 0 : -1)}
                onPersonValgt={leggTilForelder}
                onSettUkjent={settForelderUkjent}
            />
        </RolleFlytSide>
    );
}
