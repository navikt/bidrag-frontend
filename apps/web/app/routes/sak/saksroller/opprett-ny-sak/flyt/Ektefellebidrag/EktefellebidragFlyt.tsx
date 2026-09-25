import type { PersonDto } from "@bidrag/api/PersonApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useHentPersonMotpartBarnRelasjon } from "~/api/useApi.ts";

import ParterSeksjon, { type ForelderKortProps } from "../../felles/ParterSeksjon";
import RolleFlytSide from "../../felles/RolleFlytSide";
import { useFlowSubmission } from "../../hooks/useFlowSubmission";
import {
    type Diskresjonskode,
    type EktefellebidragSkjemaData,
    EktefellebidragSkjemaSchema,
    type ForelderPartRolle,
    type PartISaken,
} from "../../opprett-sak-schema";
import { useSaksrolleroversikt } from "../../saksrolleroversiktContext";
import { hentMotsattRolle } from "../../utils";

type Part = { ident: string; navn: string; diskresjonskode?: Diskresjonskode };

export default function EktefellebidragFlyt() {
    const { partISaken } = useSaksrolleroversikt();
    if (!partISaken) return null;
    return <EktefellebidragSkjema partISaken={partISaken} />;
}

function useMotparterTil(ident: string) {
    const { data } = useHentPersonMotpartBarnRelasjon(ident ? { ident } : null);
    const unike = new Map<string, PersonDto>();
    for (const { motpart } of data?.personensMotpartBarnRelasjon ?? []) {
        if (motpart && !unike.has(motpart.ident)) unike.set(motpart.ident, motpart);
    }
    return [...unike.values()];
}

function EktefellebidragSkjema({ partISaken: start }: { partISaken: PartISaken }) {
    const { sakskategori } = useSaksrolleroversikt();
    const startrolle = start.rolle as ForelderPartRolle;
    const motsattRolle = hentMotsattRolle(startrolle);

    const form = useForm<EktefellebidragSkjemaData>({
        resolver: zodResolver(EktefellebidragSkjemaSchema),
        defaultValues: {
            arbeidsfordeling: "EFS",
            partISaken: { ...start, erKjent: true },
            motpart: { ident: "", navn: "", rolle: motsattRolle, erKjent: true },
            kategori: sakskategori,
        },
        mode: "onChange",
    });

    const partISaken = form.watch("partISaken");
    const motpart = form.watch("motpart");
    const forslagTilMotpart = useMotparterTil(partISaken.ident);
    const forslagTilPartISaken = useMotparterTil(motpart.ident);

    const settPartISaken = ({ ident, navn, diskresjonskode }: Part) =>
        form.setValue(
            "partISaken",
            { ident, navn, rolle: startrolle, erKjent: true, diskresjonskode },
            { shouldDirty: true, shouldValidate: true },
        );
    const settMotpart = ({ ident, navn, diskresjonskode }: Part) =>
        form.setValue(
            "motpart",
            { ident, navn, rolle: motsattRolle, erKjent: true, diskresjonskode },
            { shouldDirty: true, shouldValidate: true },
        );

    const parter: Record<ForelderPartRolle, Part> =
        startrolle === "bidragspliktig"
            ? { bidragspliktig: partISaken, bidragsmottaker: motpart }
            : { bidragspliktig: motpart, bidragsmottaker: partISaken };
    const { onSubmit, sakStatus, innsending } = useFlowSubmission({
        form,
        bidragspliktig: { ...parter.bidragspliktig, erKjent: true },
        bidragsmottaker: { ...parter.bidragsmottaker, erKjent: true },
        arbeidsfordeling: "EFS",
        erEktefellebidrag: true,
    });

    const kort = (
        rolle: ForelderPartRolle,
        part: Part,
        forslag: PersonDto[],
        sett: (part: Part) => void,
        feil?: string,
    ): ForelderKortProps => ({
        rolle,
        part: { ...part, erKjent: part.ident ? true : undefined },
        forslag: forslag.filter((person) => person.ident !== part.ident),
        kanSettesUkjent: false,
        feil,
        onVelg: (person) =>
            sett({
                ident: person.ident,
                navn: person.visningsnavn,
                diskresjonskode: person.diskresjonskode as Diskresjonskode,
            }),
        onUkjent: () => undefined,
        onEndre: () => sett({ ident: "", navn: "" }),
    });

    return (
        <FormProvider {...form}>
            <RolleFlytSide
                onSubmit={onSubmit}
                status={{ ...sakStatus, partISakenNavn: partISaken.navn, motpartNavn: motpart.navn }}
                innsending={innsending}
            >
                <ParterSeksjon
                    beskrivelse="Velg ektefelle eller partner og kontroller rollene i saken."
                    kort={[
                        kort(
                            startrolle,
                            partISaken,
                            forslagTilPartISaken,
                            settPartISaken,
                            form.formState.errors.partISaken?.ident?.message,
                        ),
                        kort(
                            motsattRolle,
                            motpart,
                            forslagTilMotpart,
                            settMotpart,
                            form.formState.errors.motpart?.ident?.message,
                        ),
                    ]}
                />
            </RolleFlytSide>
        </FormProvider>
    );
}
