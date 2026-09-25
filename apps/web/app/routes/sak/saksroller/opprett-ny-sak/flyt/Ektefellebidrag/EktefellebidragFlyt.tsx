import type { PersonDto } from "@bidrag/api/PersonApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useHentPersonMotpartBarnRelasjon } from "~/api/useApi.ts";
import { useFlowSubmission } from "../../innsending/useFlowSubmission";
import ParterSeksjon, { type ForelderKortProps } from "../../parter/ParterSeksjon";
import { filtrerBortValgteForeldre, hentMotsattRolle } from "../../parter/part-utils";
import {
    type Diskresjonskode,
    type EktefellebidragSkjemaData,
    EktefellebidragSkjemaSchema,
    type ForelderPartRolle,
    type PartISaken,
} from "../../skjema/opprett-sak-schema";
import RolleFlytSide from "../../skjema/RolleFlytSide";
import { useSaksrolleroversikt } from "../../skjema/saksrolleroversiktContext";

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
    const { låstIdent } = useSaksrolleroversikt();
    const startrolle = start.rolle as ForelderPartRolle;
    const motsattRolle = hentMotsattRolle(startrolle);

    const form = useForm<EktefellebidragSkjemaData>({
        resolver: zodResolver(EktefellebidragSkjemaSchema),
        defaultValues: {
            arbeidsfordeling: "EFS",
            roller: [
                {
                    ident: start.rolle === "bidragspliktig" ? start.ident : "",
                    navn: start.rolle === "bidragspliktig" ? start.navn : "",
                    type: "BP",
                    erKjent: true,
                },
                {
                    ident: start.rolle === "bidragsmottaker" ? start.ident : "",
                    navn: start.rolle === "bidragsmottaker" ? start.navn : "",
                    type: "BM",
                    erKjent: true,
                },
            ],
            kategori: "Nasjonal",
        },
        mode: "onChange",
    });

    const roller = form.watch("roller");
    const partISaken = roller.find((rolle) => rolle.type === (startrolle === "bidragspliktig" ? "BP" : "BM")) ?? {
        ident: "",
        navn: "",
    };
    const motpart = roller.find((rolle) => rolle.type === (motsattRolle === "bidragspliktig" ? "BP" : "BM")) ?? {
        ident: "",
        navn: "",
    };
    const [redigerer, setRedigerer] = useState<ForelderPartRolle>();
    const forslagTilMotpart = useMotparterTil(partISaken.ident);
    const forslagTilPartISaken = useMotparterTil(motpart.ident);

    const settRolle = (rolle: ForelderPartRolle, part: Part) => {
        const type = rolle === "bidragspliktig" ? "BP" : "BM";
        form.setValue(
            "roller",
            form
                .getValues("roller")
                .map((eksisterende) =>
                    eksisterende.type === type ? { ...eksisterende, ...part, erKjent: true } : eksisterende,
                ),
            { shouldDirty: true, shouldValidate: true },
        );
    };
    const settPartISaken = (part: Part) => settRolle(startrolle, part);
    const settMotpart = (part: Part) => settRolle(motsattRolle, part);

    const { onSubmit, sakStatus, innsending } = useFlowSubmission({
        form,
        roller,
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
        forslag: filtrerBortValgteForeldre(forslag, redigerer === rolle ? [part] : [partISaken, motpart]).filter(
            (person) => person.ident !== låstIdent,
        ),
        kanSettesUkjent: false,
        låst: !!låstIdent && part.ident === låstIdent,
        feil,
        onVelg: (person) => {
            sett({
                ident: person.ident,
                navn: person.visningsnavn,
                diskresjonskode: person.diskresjonskode as Diskresjonskode,
            });
            setRedigerer(undefined);
        },
        onUkjent: () => undefined,
        onEndre: () => {
            setRedigerer(rolle);
            sett({ ident: "", navn: "" });
        },
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
                            form.formState.errors.roller?.[startrolle === "bidragspliktig" ? 0 : 1]?.ident?.message,
                        ),
                        kort(
                            motsattRolle,
                            motpart,
                            forslagTilMotpart,
                            settMotpart,
                            form.formState.errors.roller?.[motsattRolle === "bidragspliktig" ? 0 : 1]?.ident?.message,
                        ),
                    ]}
                />
            </RolleFlytSide>
        </FormProvider>
    );
}
