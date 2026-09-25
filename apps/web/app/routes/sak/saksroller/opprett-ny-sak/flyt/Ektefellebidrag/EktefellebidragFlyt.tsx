import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import ParterSeksjon from "../../felles/ParterSeksjon";
import RolleFlytSide from "../../felles/RolleFlytSide";
import { useFlowSubmission } from "../../hooks/useFlowSubmission";
import useSyncKategori from "../../hooks/useSyncKategori";
import {
    type Diskresjonskode,
    type EktefellebidragSkjemaData,
    EktefellebidragSkjemaSchema,
    type ForelderPartRolle,
} from "../../opprett-sak-schema";
import { useSaksrolleroversikt } from "../../saksrolleroversiktContext";
import { hentMotsattRolle } from "../../utils";

const ingenHandling = { onVelg: () => undefined, onUkjent: () => undefined, onEndre: () => undefined };

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
    const settMotpart = (ident: string, navn: string, diskresjonskode: string | undefined) =>
        form.setValue(
            "motpart",
            { ident, navn, rolle: motsattRolle, erKjent: true, diskresjonskode: diskresjonskode as Diskresjonskode },
            { shouldDirty: true, shouldValidate: true },
        );

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
                innsending={innsending}
            >
                <ParterSeksjon
                    beskrivelse="Velg ektefelle eller partner og kontroller rollene i saken."
                    kort={[
                        {
                            rolle: partISaken.rolle as ForelderPartRolle,
                            part: { ...partISaken, erKjent: true },
                            låst: true,
                            ...ingenHandling,
                        },
                        {
                            rolle: motsattRolle,
                            part: motpart.ident ? motpart : { ...motpart, erKjent: undefined },
                            forslag: (forslagMotpart ?? []).filter((person) => person.ident !== motpart.ident),
                            kanSettesUkjent: false,
                            feil: form.formState.errors.motpart?.ident?.message,
                            onVelg: (person) => settMotpart(person.ident, person.visningsnavn, person.diskresjonskode),
                            onUkjent: () => undefined,
                            onEndre: () => settMotpart("", "", undefined),
                        },
                    ]}
                />
            </RolleFlytSide>
        </FormProvider>
    );
}
