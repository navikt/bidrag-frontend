import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@navikt/ds-react";
import { FormProvider, useForm } from "react-hook-form";
import type { ReellMottakerRegel } from "../../../reell-mottaker-regel";
import RolleFlytSide from "../../felles/RolleFlytSide";
import { useEnPartMedBarnFlyt } from "../../hooks/useEnPartMedBarnFlyt";
import {
    FarskapsSkjemaSchema,
    type FarskapsSkjemaSchemaData,
    type ForelderPartRolle,
    OppfostringsbidragSkjemaSchema,
} from "../../opprett-sak-schema";
import { useSaksrolleroversikt } from "../../saksrolleroversiktContext";
import BarnSection from "../../sections/BarnSection";

type Flyttype = "FARSKAP" | "OPPFOSTRINGSBIDRAG";

const konfig: Record<
    Flyttype,
    {
        arbeidsfordeling: "FRS" | "OPS";
        rolle: ForelderPartRolle;
        schema: typeof FarskapsSkjemaSchema;
        reellMottakerRegel: ReellMottakerRegel;
        beskrivelse?: string;
    }
> = {
    FARSKAP: {
        arbeidsfordeling: "FRS",
        rolle: "bidragsmottaker",
        schema: FarskapsSkjemaSchema,
        reellMottakerRegel: { type: "skjult" },
        beskrivelse: "Velg barnet saken gjelder. Den andre forelderen registreres når farskapet er avklart.",
    },
    OPPFOSTRINGSBIDRAG: {
        arbeidsfordeling: "OPS",
        rolle: "bidragspliktig",
        schema: OppfostringsbidragSkjemaSchema,
        reellMottakerRegel: { type: "alltid-samhandler" },
    },
};

/**
 * Farskap og oppfostringsbidrag: én kjent part og valgte barn, uten motpart.
 */
export default function EnPartMedBarnFlyt() {
    const { saksrolleFlyt } = useSaksrolleroversikt();
    const type = saksrolleFlyt?.type;

    if (type !== "FARSKAP" && type !== "OPPFOSTRINGSBIDRAG") {
        return null;
    }

    return <EnPartMedBarnSkjema key={type} type={type} />;
}

function EnPartMedBarnSkjema({ type }: { type: Flyttype }) {
    const { sakskategori } = useSaksrolleroversikt();
    const { arbeidsfordeling, rolle, schema } = konfig[type];
    const form = useForm<FarskapsSkjemaSchemaData>({
        resolver: zodResolver(schema),
        defaultValues: {
            arbeidsfordeling,
            partISaken: { ident: "", navn: "", rolle, diskresjonskode: undefined, erKjent: false },
            valgteBarn: [],
            motpart: { ident: "", navn: "", erKjent: false },
            kategori: sakskategori,
        },
        mode: "onChange",
    });

    return (
        <FormProvider {...form}>
            <EnPartMedBarnInnhold type={type} />
        </FormProvider>
    );
}

function EnPartMedBarnInnhold({ type }: { type: Flyttype }) {
    const { arbeidsfordeling, rolle, reellMottakerRegel, beskrivelse } = konfig[type];
    const { form, barnkurver, valgteBarn, onSubmit, innsending, status } = useEnPartMedBarnFlyt({
        flytType: type,
        arbeidsfordeling,
        rolle,
    });
    const erOppfostring = type === "OPPFOSTRINGSBIDRAG";

    return (
        <RolleFlytSide
            onSubmit={onSubmit}
            status={{ ...status, lastetekst: "Henter barn..." }}
            meldinger={
                erOppfostring && (
                    <>
                        {valgteBarn.length > 0 && (
                            <Alert variant="info" size="small">
                                Reell mottaker må velges for hvert barn før saken kan opprettes.
                            </Alert>
                        )}
                        {valgteBarn.some((b) => b.reellMottakerType === "barnet_selv") && (
                            <Alert variant="warning" size="small">
                                Barnet selv kan ikke være reell mottaker i oppfostringsbidrag. Velg samhandler som
                                kommune.
                            </Alert>
                        )}
                    </>
                )
            }
            innsending={innsending}
        >
            <BarnSection
                form={form}
                barnkurver={barnkurver}
                reellMottakerRegel={reellMottakerRegel}
                beskrivelse={beskrivelse}
            />
        </RolleFlytSide>
    );
}
