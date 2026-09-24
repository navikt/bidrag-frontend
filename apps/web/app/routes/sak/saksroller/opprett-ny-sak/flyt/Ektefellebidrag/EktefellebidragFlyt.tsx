import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import RolleFlytSide from "../../felles/RolleFlytSide";
import { useFlowSubmission } from "../../hooks/useFlowSubmission";
import useSyncKategori from "../../hooks/useSyncKategori";
import {
    type EktefellebidragSkjemaData,
    EktefellebidragSkjemaSchema,
    type ForelderPartRolle,
} from "../../opprett-sak-schema";
import { useSaksrolleroversikt } from "../../saksrolleroversiktContext";
import EnhetOgSubmitSection from "../../sections/EnhetOgSubmitSection";
import { hentMotsattRolle } from "../../utils";
import EktefelleParterSeksjon from "./EktefelleParterSeksjon";

export default function EktefellebidragFlyt() {
    const { partISaken, saksrolleFlyt, sakskategori } = useSaksrolleroversikt();

    if (!partISaken || !saksrolleFlyt || saksrolleFlyt.type !== "EKTEFELLEBIDRAG") {
        return null;
    }

    const { motpart: forslagMotpart } = saksrolleFlyt;

    const motsattRolle = hentMotsattRolle(partISaken.rolle as ForelderPartRolle);

    const form = useForm<EktefellebidragSkjemaData>({
        resolver: zodResolver(EktefellebidragSkjemaSchema),
        defaultValues: {
            arbeidsfordeling: "EFS",
            partISaken: partISaken,
            motpart: {
                ident: "",
                navn: "",
                rolle: motsattRolle,
                erKjent: true,
            },
            kategori: sakskategori,
        },
        mode: "onChange",
    });

    useSyncKategori(form);

    const motpart = form.watch("motpart");

    const { onSubmit, sakStatus, innsending } = useFlowSubmission({
        form,
        partISaken: { ...partISaken, erKjent: true },
        motpart,
        valgteBarn: [],
        arbeidsfordeling: "EFS",
        erEktefellebidrag: true,
        eksisterendeSakPartISaken: {
            ident: partISaken.ident,
            rolle: partISaken.rolle,
            navn: partISaken.navn,
            erKjent: true,
        },
        eksisterendeSakMotpart: {
            ident: motpart.ident,
            rolle: motpart.rolle,
            erKjent: motpart.erKjent,
            navn: motpart.navn,
        },
    });

    return (
        <FormProvider {...form}>
            <RolleFlytSide
                onSubmit={onSubmit}
                status={{
                    ...sakStatus,
                    partISakenNavn: partISaken.navn,
                    motpartNavn: motpart.navn,
                }}
                submit={<EnhetOgSubmitSection {...innsending} />}
            >
                <EktefelleParterSeksjon form={form} forslagMotpart={forslagMotpart ?? []} motsattRolle={motsattRolle} />
            </RolleFlytSide>
        </FormProvider>
    );
}
