import { zodResolver } from "@hookform/resolvers/zod";
import type { PropsWithChildren } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { z } from "zod";
import {
    BarnBeggForeldreSkjemaSchema,
    BarnMedManglendeForeldreSkjemaSchema,
    EktefellebidragSkjemaSchema,
    ForelderMedBarnSkjemaSchema,
    type ForelderPartRolle,
    ForelderUtenBarnSkjemaSchema,
    OppfostringsbidragSkjemaSchema,
    type PartISaken,
} from "./opprett-sak-schema";
import { useSaksrolleroversikt } from "./saksrolleroversiktContext";
import { hentMotsattRolle } from "./utils";

type OpprettSakFormData =
    | z.infer<typeof ForelderMedBarnSkjemaSchema>
    | z.infer<typeof ForelderUtenBarnSkjemaSchema>
    | z.infer<typeof BarnBeggForeldreSkjemaSchema>
    | z.infer<typeof BarnMedManglendeForeldreSkjemaSchema>
    | z.infer<typeof EktefellebidragSkjemaSchema>
    | z.infer<typeof OppfostringsbidragSkjemaSchema>;

function getSchemaForFlowType(flowType: string) {
    const schemaMap = {
        FORELDER_MED_BARN: ForelderMedBarnSkjemaSchema,
        FORELDER_UTEN_BARN: ForelderUtenBarnSkjemaSchema,
        BARN_BEGGE_FORELDRE: BarnBeggForeldreSkjemaSchema,
        BARN_MANGLENDE_FORELDRE: BarnMedManglendeForeldreSkjemaSchema,
        EKTEFELLEBIDRAG: EktefellebidragSkjemaSchema,
        OPPFOSTRINGSBIDRAG: OppfostringsbidragSkjemaSchema,
        FARSKAP: EktefellebidragSkjemaSchema, // Reuse similar schema for now
    } as const;

    return schemaMap[flowType as keyof typeof schemaMap] || ForelderMedBarnSkjemaSchema;
}

const TOM_PART_I_SAKEN: PartISaken = {
    ident: "",
    navn: "",
    rolle: "bidragspliktig",
};

function getDefaultValuesForFlowType(flowType: string, partISaken: PartISaken | null, kategori: "Nasjonal" | "Utland") {
    const part = partISaken ?? TOM_PART_I_SAKEN;
    const baseDefaults = {
        partISaken: part,
        kategori,
    };

    switch (flowType) {
        case "FORELDER_MED_BARN":
        case "FORELDER_UTEN_BARN":
            return {
                ...baseDefaults,
                valgteBarn: [],
                motpart: {
                    erKjent: false,
                    rolle: hentMotsattRolle(part.rolle as ForelderPartRolle),
                },
            };

        case "BARN_BEGGE_FORELDRE":
            return {
                ...baseDefaults,
                foreldre: [],
                bidragspliktig: null,
                bidragsmottaker: null,
            };

        case "BARN_MANGLENDE_FORELDRE":
            return {
                ...baseDefaults,
                forelder: null,
                annenForelder: {
                    erKjent: false,
                },
            };

        case "EKTEFELLEBIDRAG":
            return {
                ...baseDefaults,
                motpart: {
                    erKjent: false,
                    rolle: hentMotsattRolle(part.rolle as ForelderPartRolle),
                },
            };

        case "OPPFOSTRINGSBIDRAG":
            return {
                ...baseDefaults,
                valgteBarn: [],
            };

        case "FARSKAP":
            return {
                ...baseDefaults,
                motpart: {
                    erKjent: false,
                    rolle: hentMotsattRolle(part.rolle as ForelderPartRolle),
                },
            };

        default:
            return baseDefaults;
    }
}

type Props = PropsWithChildren<{
    flowType: string;
}>;

export default function OpprettSakFormProvider({ flowType, children }: Props) {
    const { partISaken, sakskategori } = useSaksrolleroversikt();

    const schema = getSchemaForFlowType(flowType);
    const defaultValues = getDefaultValuesForFlowType(flowType, partISaken, sakskategori);

    const form = useForm<OpprettSakFormData>({
        resolver: zodResolver(schema),
        defaultValues: defaultValues as OpprettSakFormData,
        mode: "onChange",
    });

    return <FormProvider {...form}>{children}</FormProvider>;
}

export type { OpprettSakFormData };
