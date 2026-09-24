import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button } from "@navikt/ds-react";
import { FormProvider, useForm } from "react-hook-form";

import BarnMottakerKort from "../../barn-felles/BarnMottakerKort";
import ForeldreSeksjon from "../../felles/ForeldreSeksjon";
import RolleFlytSide from "../../felles/RolleFlytSide";
import { useBarnForeldreFlyt } from "../../hooks/useBarnForeldreFlyt";
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
    const { saksrolleFlyt } = useSaksrolleroversikt();
    const registrerteForeldre = saksrolleFlyt?.type === "BARN_BEGGE_FORELDRE" ? saksrolleFlyt.foreldre : [];
    const {
        form,
        foreldre,
        bidragspliktig,
        bidragsmottakerErUkjent,
        barnKort,
        foreldreSeksjon,
        onSubmit,
        innsending,
        status,
    } = useBarnForeldreFlyt();

    const bidragsmottakerIndex = foreldre.findIndex((f) => f.rolle === "bidragsmottaker");

    const settBidragsmottakerUkjent = () => {
        if (bidragsmottakerIndex !== -1) {
            form.setValue(`foreldre.${bidragsmottakerIndex}.erKjent`, false);
            form.setValue(`foreldre.${bidragsmottakerIndex}.ident`, "");
            form.setValue(`foreldre.${bidragsmottakerIndex}.navn`, "");
        }
    };

    const settDenAndreForelderSomBidragsmottaker = () => {
        const denAndreForelder = bidragspliktig
            ? registrerteForeldre.find((f) => f.ident !== bidragspliktig.ident)
            : undefined;

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
            status={status}
            meldinger={
                <>
                    <Alert variant="info" size="small">
                        Barnet har begge foreldre registrert. Du må velge hvem som skal betale bidrag.
                    </Alert>
                    {bidragsmottakerErUkjent && <UfullstendigRelasjonAlert />}
                </>
            }
            submit={<EnhetOgSubmitSection {...innsending} />}
        >
            <BarnMottakerKort {...barnKort} />

            <ForeldreSeksjon
                {...foreldreSeksjon}
                beskrivelse="Velg rolle for en av foreldrene. Den andre får motsatt rolle."
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
