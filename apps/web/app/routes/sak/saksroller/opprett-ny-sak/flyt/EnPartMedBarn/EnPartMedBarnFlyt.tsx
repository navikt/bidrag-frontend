import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, InlineMessage } from "@navikt/ds-react";
import { FormProvider, useForm } from "react-hook-form";
import type { ReellMottakerRegel } from "../../../reell-mottaker-regel";
import LasterSkeleton from "../../components/LasterSkeleton";
import ParterSeksjon from "../../felles/ParterSeksjon";
import RolleFlytSide from "../../felles/RolleFlytSide";
import { useEnPartMedBarnFlyt } from "../../hooks/useEnPartMedBarnFlyt";
import {
    type Diskresjonskode,
    FarskapsSkjemaSchema,
    type FarskapsSkjemaSchemaData,
    type ForelderPartRolle,
    OppfostringsbidragSkjemaSchema,
    type PartISaken,
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
    const { sakstype, partISaken } = useSaksrolleroversikt();

    if (!partISaken || (sakstype !== "FARSKAP" && sakstype !== "OPPFOSTRINGSBIDRAG")) {
        return null;
    }

    return <EnPartMedBarnSkjema type={sakstype} partISaken={partISaken} />;
}

function EnPartMedBarnSkjema({ type, partISaken }: { type: Flyttype; partISaken: PartISaken }) {
    const { sakskategori } = useSaksrolleroversikt();
    const { arbeidsfordeling, rolle, schema } = konfig[type];
    const form = useForm<FarskapsSkjemaSchemaData>({
        resolver: zodResolver(schema),
        defaultValues: {
            arbeidsfordeling,
            partISaken: { ...partISaken, rolle, erKjent: true },
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
    const { arbeidsfordeling, reellMottakerRegel, beskrivelse, rolle } = konfig[type];
    const { form, barnkurver, valgteBarn, onSubmit, innsending, status, lasterKurver, kurvfeil } = useEnPartMedBarnFlyt(
        { arbeidsfordeling, rolle },
    );
    const partISaken = form.watch("partISaken");
    const settPart = (part: { ident: string; navn: string; diskresjonskode?: Diskresjonskode }) =>
        form.setValue(
            "partISaken",
            { ...part, rolle, erKjent: !!part.ident },
            { shouldDirty: true, shouldValidate: form.formState.isSubmitted },
        );
    const erOppfostring = type === "OPPFOSTRINGSBIDRAG";

    return (
        <RolleFlytSide
            onSubmit={onSubmit}
            status={{ ...status, lastetekst: "Henter barn..." }}
            meldinger={
                <>
                    {kurvfeil && (
                        <InlineMessage status="warning">
                            Kunne ikke hente forslag til barn. Du kan søke opp barn manuelt.
                        </InlineMessage>
                    )}
                    {erOppfostring && valgteBarn.length > 0 && (
                        <Alert variant="info" size="small">
                            Reell mottaker må velges for hvert barn før saken kan opprettes.
                        </Alert>
                    )}
                    {erOppfostring && valgteBarn.some((b) => b.reellMottakerType === "barnet_selv") && (
                        <Alert variant="warning" size="small">
                            Barnet selv kan ikke være reell mottaker i oppfostringsbidrag. Velg samhandler som kommune.
                        </Alert>
                    )}
                </>
            }
            innsending={innsending}
        >
            <ParterSeksjon
                tittel={`Kontroller ${rolle}`}
                kort={[
                    {
                        rolle,
                        part: { ...partISaken, erKjent: partISaken.ident ? true : undefined },
                        kanSettesUkjent: false,
                        feil: form.formState.errors.partISaken?.ident?.message,
                        onVelg: (person) =>
                            settPart({
                                ident: person.ident,
                                navn: person.visningsnavn,
                                diskresjonskode: person.diskresjonskode as Diskresjonskode,
                            }),
                        onUkjent: () => undefined,
                        onEndre: () => settPart({ ident: "", navn: "" }),
                    },
                ]}
            />
            {lasterKurver ? (
                <LasterSkeleton tekst="Laster data..." />
            ) : (
                <BarnSection
                    form={form}
                    barnkurver={barnkurver}
                    reellMottakerRegel={reellMottakerRegel}
                    beskrivelse={beskrivelse}
                />
            )}
        </RolleFlytSide>
    );
}
