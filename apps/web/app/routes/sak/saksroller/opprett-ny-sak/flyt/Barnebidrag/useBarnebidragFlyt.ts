import { TilgangsFeilError } from "@bidrag/api";
import type { MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { useQueries } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { type UseFormReturn, useFormContext } from "react-hook-form";
import { hentForeldreinformasjonForBarnQueryOptions, useHentPersonMotpartBarnRelasjon } from "~/api/useApi.ts";
import type { ForelderKortProps } from "../../felles/ParterSeksjon";
import { lagEksisterendeSakPart, useFlowSubmission } from "../../hooks/useFlowSubmission";
import type { BarnebidragSkjemaData, Barnkurv, ForelderPart, ForelderPartRolle } from "../../opprett-sak-schema";
import { useSaksrolleroversikt } from "../../saksrolleroversiktContext";
import { grupperBarnIKurver, hentMotsattRolle } from "../../utils";
import {
    type ForeldreTilBarn,
    harFullstendigRelasjon,
    type Parter,
    parterEtterValg,
    tilPart,
    utledFellesBarn,
    utledForelderforslag,
} from "./barnebidrag-forslag";

const IKKE_VALGT: ForelderPart = { ident: "", navn: "", erKjent: undefined, diskresjonskode: undefined };
const UKJENT: ForelderPart = { ...IKKE_VALGT, erKjent: false };
const FORELDERROLLER: ForelderPartRolle[] = ["bidragspliktig", "bidragsmottaker"];

function erForelderRolle(rolle: string): rolle is ForelderPartRolle {
    return rolle === "bidragspliktig" || rolle === "bidragsmottaker";
}

function useBarnkurver(form: UseFormReturn<BarnebidragSkjemaData>, registrerteKurver: MotpartBarnRelasjon[]) {
    const bidragspliktig = form.watch("bidragspliktig.ident");
    const bidragsmottaker = form.watch("bidragsmottaker.ident");
    const valgteBarn = form.watch("valgteBarn");

    const hentFellesBarn = registrerteKurver.length === 0 && !!bidragspliktig && !!bidragsmottaker;
    const { data } = useHentPersonMotpartBarnRelasjon(
        hentFellesBarn ? { ident: bidragspliktig ?? "" } : null,
        hentFellesBarn,
    );
    const manuelle = valgteBarn.filter((b) => b.manuellLagtTil).map((b) => b.ident);
    const fellesBarn = hentFellesBarn
        ? utledFellesBarn(data?.personensMotpartBarnRelasjon, bidragsmottaker, manuelle)
        : null;
    const barnkurver = grupperBarnIKurver(fellesBarn ? [fellesBarn] : registrerteKurver);

    const synligeKurvbarn = barnkurver.flatMap((kurv) => kurv.barn.map((b) => b.ident)).join();
    useEffect(() => {
        const valgte = form.getValues("valgteBarn");
        const beholdt = valgte.filter((b) => b.manuellLagtTil || synligeKurvbarn.split(",").includes(b.ident));
        if (beholdt.length !== valgte.length) form.setValue("valgteBarn", beholdt);
    }, [form, synligeKurvbarn]);

    return barnkurver;
}

function useForelderforslag(
    form: UseFormReturn<BarnebidragSkjemaData>,
    låstForelder: { ident: string; navn: string } | undefined,
) {
    const valgteBarn = form.watch("valgteBarn");
    const foreldreinfo = useQueries({
        queries: valgteBarn.map((barn) => hentForeldreinformasjonForBarnQueryOptions({ ident: barn.ident })),
    });
    const foreldreTilBarn: ForeldreTilBarn[] = valgteBarn.map((barn, index) => ({
        barn,
        foreldre: foreldreinfo[index]?.data,
    }));
    const { forslag, feil } = utledForelderforslag({ foreldreTilBarn, låstForelder, valgteIdenter: [] });
    const tilgangsfeil = foreldreinfo.find((query) => query.error instanceof TilgangsFeilError)?.error;
    return { foreldreTilBarn, forslag, forslagsfeil: feil, tilgangsfeil: tilgangsfeil?.message };
}

function useFyllUtForelder(
    foreldreTilBarn: ForeldreTilBarn[],
    forslag: PersonDto[],
    låstForelder: ForelderPartRolle | null,
    fyllUt: (rolle: ForelderPartRolle, person: PersonDto) => void,
    velg: (rolle: ForelderPartRolle, person: PersonDto) => void,
    erTom: (rolle: ForelderPartRolle) => boolean,
) {
    const redigerbare = FORELDERROLLER.filter((rolle) => rolle !== låstForelder);
    useFyllUtInitialForelder(forslag, låstForelder, velg, erTom);
    const behandledeBarn = useRef(new Set<string>());
    useEffect(() => {
        const nyeBarn = foreldreTilBarn.filter((b) => b.foreldre && !behandledeBarn.current.has(b.barn.ident));
        for (const b of nyeBarn) behandledeBarn.current.add(b.barn.ident);
        const [rolle] = redigerbare;
        const [eneste] = forslag;
        if (nyeBarn.length > 0 && redigerbare.length === 1 && rolle && erTom(rolle) && forslag.length === 1 && eneste) {
            fyllUt(rolle, eneste);
        }
    });
}

function useFyllUtInitialForelder(
    forslag: PersonDto[],
    låstForelder: ForelderPartRolle | null,
    velg: (rolle: ForelderPartRolle, person: PersonDto) => void,
    erTom: (rolle: ForelderPartRolle) => boolean,
) {
    const initialForelder = useSaksrolleroversikt().inngang?.initialForelder;
    const utført = useRef(false);
    useEffect(() => {
        if (!initialForelder || utført.current) return;
        const rolle: ForelderPartRolle = initialForelder.rolle === "BP" ? "bidragspliktig" : "bidragsmottaker";
        const person = forslag.find((f) => f.ident === initialForelder.ident);
        if (!person || rolle === låstForelder || !erTom(rolle)) return;
        utført.current = true;
        velg(rolle, person);
    });
}

function partFraKurv(kurv: Barnkurv | null): ForelderPart {
    if (!kurv) return IKKE_VALGT;
    return kurv.motpart ? tilPart(kurv.motpart as PersonDto) : UKJENT;
}

function relasjonsmeldinger(foreldreTilBarn: ForeldreTilBarn[], parter: Parter, låstRolle: string) {
    const harBarn = foreldreTilBarn.length > 0;
    const fullstendig = harFullstendigRelasjon(
        foreldreTilBarn,
        parter.bidragspliktig.ident,
        parter.bidragsmottaker.ident,
    );
    return {
        ufullstendigRelasjon: harBarn && fullstendig === false,
        bidragsmottakerUtenBarn: låstRolle === "bidragsmottaker" && !harBarn,
    };
}

export function useBarnebidragFlyt() {
    const { partISaken, saksrolleFlyt } = useSaksrolleroversikt();
    const form = useFormContext<BarnebidragSkjemaData>();

    const låstRolle = form.watch("låstRolle");
    const søktIdent = form.watch("søktIdent");
    const bidragspliktig = form.watch("bidragspliktig");
    const bidragsmottaker = form.watch("bidragsmottaker");
    const valgteBarn = form.watch("valgteBarn");
    const parter: Parter = { bidragspliktig, bidragsmottaker };
    const låstForelder = erForelderRolle(låstRolle) ? låstRolle : null;
    const redigerbare = FORELDERROLLER.filter((rolle) => rolle !== låstForelder);

    const barnkurver = useBarnkurver(form, saksrolleFlyt?.type === "BARNEBIDRAG" ? saksrolleFlyt.barnkurver : []);
    const { foreldreTilBarn, forslag, forslagsfeil, tilgangsfeil } = useForelderforslag(
        form,
        låstForelder ? { ident: søktIdent, navn: partISaken?.navn ?? "" } : undefined,
    );

    const settPart = (rolle: ForelderPartRolle, part: ForelderPart) =>
        form.setValue(rolle, part, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
    const velg = (rolle: ForelderPartRolle, person: PersonDto) => {
        const nye = parterEtterValg(form.getValues(), rolle, person, forslag, låstForelder);
        for (const r of FORELDERROLLER) settPart(r, nye[r]);
    };
    useFyllUtForelder(
        foreldreTilBarn,
        forslag,
        låstForelder,
        (rolle, person) => settPart(rolle, tilPart(person)),
        velg,
        (rolle) => form.getValues(rolle).erKjent === undefined,
    );

    const onKurvByttet = (kurv: Barnkurv | null) => {
        const [rolle] = redigerbare;
        if (rolle && redigerbare.length === 1) settPart(rolle, partFraKurv(kurv));
    };

    const primær = låstForelder ?? "bidragspliktig";
    const sekundær = hentMotsattRolle(primær);
    const { onSubmit, sakStatus, innsending } = useFlowSubmission({
        form,
        partISaken: partISaken ?? { ident: søktIdent, navn: "", rolle: låstRolle },
        bidragspliktig,
        bidragsmottaker,
        valgteBarn,
        eksisterendeSakPartISaken: lagEksisterendeSakPart(parter[primær], primær),
        eksisterendeSakMotpart: lagEksisterendeSakPart(parter[sekundær], sekundær),
    });

    const kort = FORELDERROLLER.map(
        (rolle): ForelderKortProps => ({
            rolle,
            part: parter[rolle],
            låst: rolle === låstForelder,
            forslag: forslag.filter((f) => f.ident !== parter[rolle].ident),
            feil: form.formState.errors[rolle]?.ident?.message,
            onVelg: (person) => velg(rolle, person),
            onUkjent: () => settPart(rolle, UKJENT),
            onEndre: () => settPart(rolle, IKKE_VALGT),
        }),
    );

    return {
        form,
        barnkurver,
        onKurvByttet,
        låsteIdenter: låstForelder ? [] : [søktIdent],
        reellMottakerRegel: { type: "etter-barn", bidragsmottakerErUkjent: bidragsmottaker.erKjent === false } as const,
        kort,
        onSubmit,
        innsending,
        meldinger: {
            tilgangsfeil,
            forslagsfeil,
            ...relasjonsmeldinger(foreldreTilBarn, parter, låstRolle),
        },
        status: { ...sakStatus, partISakenNavn: parter[primær].navn ?? "", motpartNavn: parter[sekundær].navn },
    };
}
