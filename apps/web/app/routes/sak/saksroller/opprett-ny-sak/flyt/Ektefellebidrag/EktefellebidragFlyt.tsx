import type { PersonDto } from "@bidrag/api/PersonApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useHentPersonMotpartBarnRelasjon } from "~/api/useApi.ts";
import { useFlowSubmission } from "../../innsending/useFlowSubmission";
import ParterSeksjon, { type ForelderKortProps } from "../../parter/ParterSeksjon";
import { filtrerBortValgteForeldre, hentMotsattRolle, tilForelderrolle, tilRolletype } from "../../parter/part-utils";
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

function startverdier(start: PartISaken): EktefellebidragSkjemaData {
    const forelder = (type: "BP" | "BM") => {
        const erStart = start.rolle === tilForelderrolle(type);
        return { ident: erStart ? start.ident : "", navn: erStart ? start.navn : "", type, erKjent: true as const };
    };
    return { arbeidsfordeling: "EFS", roller: [forelder("BP"), forelder("BM")], kategori: "Nasjonal" };
}

function finnPart(roller: EktefellebidragSkjemaData["roller"], rolle: ForelderPartRolle): Part {
    return roller.find((r) => r.type === tilRolletype(rolle)) ?? { ident: "", navn: "" };
}

function EktefellebidragSkjema({ partISaken: start }: { partISaken: PartISaken }) {
    const { låstIdent } = useSaksrolleroversikt();
    const startrolle = start.rolle as ForelderPartRolle;
    const motsattRolle = hentMotsattRolle(startrolle);

    const form = useForm<EktefellebidragSkjemaData>({
        resolver: zodResolver(EktefellebidragSkjemaSchema),
        defaultValues: startverdier(start),
        mode: "onSubmit",
    });

    const roller = form.watch("roller");
    const partISaken = finnPart(roller, startrolle);
    const motpart = finnPart(roller, motsattRolle);
    const [redigerer, setRedigerer] = useState<ForelderPartRolle>();
    const forslagTilMotpart = useMotparterTil(partISaken.ident);
    const forslagTilPartISaken = useMotparterTil(motpart.ident);

    const settRolle = (rolle: ForelderPartRolle, part: Part) => {
        const type = tilRolletype(rolle);
        form.setValue(
            "roller",
            form
                .getValues("roller")
                .map((eksisterende) =>
                    eksisterende.type === type ? { ...eksisterende, ...part, erKjent: true } : eksisterende,
                ),
            { shouldDirty: true, shouldValidate: form.formState.isSubmitted },
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

    const feilFor = (rolle: ForelderPartRolle) =>
        form.formState.errors.roller?.[roller.findIndex((r) => r.type === tilRolletype(rolle))]?.ident?.message;

    const kort = (
        rolle: ForelderPartRolle,
        part: Part,
        forslag: PersonDto[],
        sett: (part: Part) => void,
    ): ForelderKortProps => ({
        rolle,
        part: { ...part, erKjent: part.ident ? true : undefined },
        forslag: filtrerBortValgteForeldre(forslag, redigerer === rolle ? [part] : [partISaken, motpart]).filter(
            (person) => person.ident !== låstIdent,
        ),
        kanSettesUkjent: false,
        låst: !!låstIdent && part.ident === låstIdent,
        feil: feilFor(rolle),
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
                        kort(startrolle, partISaken, forslagTilPartISaken, settPartISaken),
                        kort(motsattRolle, motpart, forslagTilMotpart, settMotpart),
                    ]}
                />
            </RolleFlytSide>
        </FormProvider>
    );
}
