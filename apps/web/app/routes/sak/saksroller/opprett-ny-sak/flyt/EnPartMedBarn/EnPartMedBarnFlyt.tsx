import type { MotpartBarnRelasjon } from "@bidrag/api/PersonApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, InlineMessage, VStack } from "@navikt/ds-react";
import { FormProvider, useForm } from "react-hook-form";
import { useHentPersonMotpartBarnRelasjon } from "~/api/useApi.ts";
import type { ReellMottakerRegel } from "../../../reell-mottaker-regel";
import LasterSkeleton from "../../components/LasterSkeleton";
import RolleFlytSide from "../../felles/RolleFlytSide";
import { useEnPartMedBarnFlyt } from "../../hooks/useEnPartMedBarnFlyt";
import {
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

    return <EnPartMedBarnMedForslag type={sakstype} partISaken={partISaken} />;
}

function EnPartMedBarnMedForslag({ type, partISaken }: { type: Flyttype; partISaken: PartISaken }) {
    const { data, isLoading, isError } = useHentPersonMotpartBarnRelasjon({ ident: partISaken.ident });

    if (isLoading) return <LasterSkeleton tekst="Laster data..." />;

    return (
        <VStack gap="space-24">
            {isError && (
                <InlineMessage status="warning">
                    Kunne ikke hente forslag til barn. Du kan søke opp barn manuelt.
                </InlineMessage>
            )}
            <EnPartMedBarnSkjema
                type={type}
                partISaken={partISaken}
                registrerteKurver={data?.personensMotpartBarnRelasjon ?? []}
            />
        </VStack>
    );
}

function EnPartMedBarnSkjema({
    type,
    partISaken,
    registrerteKurver,
}: {
    type: Flyttype;
    partISaken: PartISaken;
    registrerteKurver: MotpartBarnRelasjon[];
}) {
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
            <EnPartMedBarnInnhold type={type} registrerteKurver={registrerteKurver} />
        </FormProvider>
    );
}

function EnPartMedBarnInnhold({
    type,
    registrerteKurver,
}: {
    type: Flyttype;
    registrerteKurver: MotpartBarnRelasjon[];
}) {
    const { arbeidsfordeling, reellMottakerRegel, beskrivelse } = konfig[type];
    const { form, barnkurver, valgteBarn, onSubmit, innsending, status } = useEnPartMedBarnFlyt({
        registrerteKurver,
        arbeidsfordeling,
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
