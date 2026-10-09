import { TilgangsFeilError } from "@bidrag/api";
import type { PersonDto } from "@bidrag/api/PersonApi";
import { useQueries } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { type UseFormReturn, useFormContext } from "react-hook-form";
import { hentForeldreinformasjonForBarnQueryOptions, useHentPersonMotpartBarnRelasjon } from "../../../api/person.api";
import { reellMottakerRegel } from "../../../felles/saksregler";
import { grupperBarnIKurver } from "../../barn/barnkurver";
import { useFlowSubmission } from "../../innsending/useFlowSubmission";
import type { ForelderKortProps } from "../../parter/ParterSeksjon";
import { filtrerBortValgteForeldre } from "../../parter/part-utils";
import { useOpprettSakStart } from "../../skjema/OpprettSakStartContext";
import {
    type BarnebidragForelderRolle,
    type BarnebidragSkjemaData,
    type Barnkurv,
    erKjentPart,
    type ForelderPart,
    type ForelderPartRolle,
} from "../../skjema/opprett-sak-schema";
import { utledBarnkurverForForelder, utledFellesBarn } from "./barnebidrag-barnkurver";
import { type ForeldreTilBarn, harFullstendigRelasjon, utledForelderforslag } from "./barnebidrag-forelderforslag";
import { harMotpartMedUlikeForelderroller } from "./barnebidrag-relasjonsvalidering";
import { rollerEtterValg, rolleSomPart, tilPart } from "./barnebidrag-roller";

const IKKE_VALGT: ForelderPart = { ident: "", navn: "", erKjent: undefined, diskresjonskode: undefined };
const UKJENT: ForelderPart = { ...IKKE_VALGT, erKjent: false };
const FORELDERROLLER: ForelderPartRolle[] = ["bidragspliktig", "bidragsmottaker"];

function useBarnkurver(form: UseFormReturn<BarnebidragSkjemaData>) {
    const roller = form.watch("roller");
    const bidragspliktig = rolleSomPart(roller, "BP").ident;
    const bidragsmottaker = rolleSomPart(roller, "BM").ident;

    const kilde = bidragspliktig || bidragsmottaker;
    const { data, isPending } = useHentPersonMotpartBarnRelasjon(kilde ? { ident: kilde } : null);
    const relasjoner = data?.personensMotpartBarnRelasjon ?? [];
    const kurver =
        bidragspliktig && bidragsmottaker
            ? [utledFellesBarn(relasjoner, bidragsmottaker)].filter((kurv) => kurv !== null)
            : utledBarnkurverForForelder(relasjoner);
    const kildePart = roller.find((rolle) => rolle.ident === kilde);
    const barnkurver = grupperBarnIKurver(kilde ? kurver : [], {
        ident: kilde,
        visningsnavn: kildePart?.navn,
    });
    const lasterKurver = !!kilde && isPending;

    const registrerteForeldre = [
        ...(data?.person ? [data.person] : []),
        ...relasjoner.flatMap((relasjon) => (relasjon.motpart ? [relasjon.motpart] : [])),
    ];

    return {
        barnkurver,
        lasterKurver,
        registrerteForeldre,
        ugyldigForelderrelasjon: harMotpartMedUlikeForelderroller(relasjoner),
    };
}

function useForelderforslag(form: UseFormReturn<BarnebidragSkjemaData>, roller: BarnebidragForelderRolle[]) {
    const valgteBarn = form.watch("valgteBarn");
    const foreldreinfo = useQueries({
        queries: valgteBarn.map((barn) => hentForeldreinformasjonForBarnQueryOptions({ ident: barn.ident })),
    });
    const foreldreTilBarn: ForeldreTilBarn[] = valgteBarn.map((barn, index) => ({
        barn,
        foreldre: foreldreinfo[index]?.data,
    }));
    const valgteForeldre = roller
        .filter((rolle) => rolle.erKjent && rolle.ident)
        .map((part) => ({ ident: part.ident ?? "", navn: part.navn ?? "" }));
    const { forslag, feil } = utledForelderforslag({ foreldreTilBarn, valgteForeldre });
    const ledige = filtrerBortValgteForeldre(forslag, valgteForeldre);
    const tilgangsfeil = foreldreinfo.find((query) => query.error instanceof TilgangsFeilError)?.error;
    const lasterForeldre = foreldreinfo.some((query) => query.isPending);
    return {
        foreldreTilBarn,
        forslag,
        ledige,
        forslagsfeil: feil,
        tilgangsfeil: tilgangsfeil?.message,
        lasterForeldre,
    };
}

/** Når nye barn gir én entydig forelder og bare ett kort er tomt, fylles kortet ut. */
function useFyllUtForelder(
    foreldreTilBarn: ForeldreTilBarn[],
    forslag: PersonDto[],
    fyllUt: (rolle: ForelderPartRolle, person: PersonDto) => void,
    velg: (rolle: ForelderPartRolle, person: PersonDto) => void,
    erTom: (rolle: ForelderPartRolle) => boolean,
) {
    const venterPåInitialForelder = useFyllUtInitialForelder(forslag, velg, erTom);
    const behandledeBarn = useRef(new Set<string>());
    useEffect(() => {
        const nyeBarn = foreldreTilBarn.filter((b) => b.foreldre && !behandledeBarn.current.has(b.barn.ident));
        for (const b of nyeBarn) behandledeBarn.current.add(b.barn.ident);
        const tomme = FORELDERROLLER.filter(erTom);
        const [rolle] = tomme;
        const [eneste] = forslag;
        if (nyeBarn.length > 0 && tomme.length === 1 && rolle && forslag.length === 1 && eneste) {
            fyllUt(rolle, eneste);
        }
    });
    return venterPåInitialForelder;
}

function useFyllUtInitialForelder(
    forslag: PersonDto[],
    velg: (rolle: ForelderPartRolle, person: PersonDto) => void,
    erTom: (rolle: ForelderPartRolle) => boolean,
) {
    const initialForelder = useOpprettSakStart().inngang?.initialForelder;
    const utført = useRef(false);
    const rolle: ForelderPartRolle = initialForelder?.rolle === "BP" ? "bidragspliktig" : "bidragsmottaker";
    const person = initialForelder && forslag.find((f) => f.ident === initialForelder.ident);
    const skalFylles = !!person && !utført.current && erTom(rolle);
    useEffect(() => {
        if (!skalFylles || !person) return;
        utført.current = true;
        velg(rolle, person);
    });
    /** Forelderen fylles ut etter denne renderingen. Til da vet vi ikke hvilke barnlister som gjelder. */
    return skalFylles;
}

/**
 * Tittel for barn som ikke finnes blant felles barn. Skiller mellom forelder som ikke er valgt ennå
 * og forelder som er satt til ukjent.
 */
export function tittelForBarnUtenKurv(bidragspliktig: ForelderPart, bidragsmottaker: ForelderPart): string {
    const status = (part: ForelderPart) => (part.erKjent === false ? "ukjent" : part.ident ? "valgt" : "ikke valgt");
    const bp = status(bidragspliktig);
    const bm = status(bidragsmottaker);
    if (bp === "ikke valgt" && bm === "ikke valgt") return "Foreldre ikke valgt";
    if (bm === "ikke valgt") return "Bidragsmottaker ikke valgt";
    if (bp === "ikke valgt") return "Bidragspliktig ikke valgt";
    if (bm === "ukjent") return "Med ukjent bidragsmottaker";
    if (bp === "ukjent") return "Med ukjent bidragspliktig";
    return "Ikke registrert som felles barn";
}

function partFraKurv(kurv: Barnkurv): ForelderPart {
    return kurv.motpart ? tilPart(kurv.motpart as PersonDto) : UKJENT;
}

function relasjonsmeldinger(
    foreldreTilBarn: ForeldreTilBarn[],
    bidragspliktig: ForelderPart,
    bidragsmottaker: ForelderPart,
) {
    const harBarn = foreldreTilBarn.length > 0;
    const fullstendig = harFullstendigRelasjon(foreldreTilBarn, bidragspliktig.ident, bidragsmottaker.ident);
    return {
        ufullstendigRelasjon: harBarn && fullstendig === false,
        bidragsmottakerUtenBarn: erKjentPart(bidragsmottaker) && !harBarn,
    };
}

export function useBarnebidragFlyt() {
    const form = useFormContext<BarnebidragSkjemaData>();
    const { låstIdent } = useOpprettSakStart();

    const roller = form.watch("roller");
    const bidragspliktig = rolleSomPart(roller, "BP");
    const bidragsmottaker = rolleSomPart(roller, "BM");
    const [redigerer, setRedigerer] = useState<ForelderPartRolle>();
    const valgteBarn = form.watch("valgteBarn");

    const { barnkurver, lasterKurver, registrerteForeldre, ugyldigForelderrelasjon } = useBarnkurver(form);
    const { foreldreTilBarn, forslag, ledige, forslagsfeil, tilgangsfeil, lasterForeldre } = useForelderforslag(
        form,
        roller,
    );
    const tilgjengeligeForeldre = useRef(new Map<string, PersonDto>());
    for (const forelder of [...registrerteForeldre, ...forslag]) {
        tilgjengeligeForeldre.current.set(forelder.ident, forelder);
    }
    for (const forelder of roller) {
        if (forelder.erKjent && forelder.ident && forelder.navn && !tilgjengeligeForeldre.current.has(forelder.ident)) {
            tilgjengeligeForeldre.current.set(forelder.ident, {
                ident: forelder.ident,
                visningsnavn: forelder.navn,
                diskresjonskode: forelder.diskresjonskode,
            });
        }
    }

    const settPart = (rolle: ForelderPartRolle, part: ForelderPart) => {
        const type = rolle === "bidragspliktig" ? "BP" : "BM";
        form.setValue(
            "roller",
            form
                .getValues("roller")
                .map((eksisterende) => (eksisterende.type === type ? { ...part, type } : eksisterende)),
            { shouldDirty: true, shouldValidate: form.formState.isSubmitted },
        );
    };
    const velg = (rolle: ForelderPartRolle, person: PersonDto) => {
        if (person.ident === låstIdent) return;
        const nye = rollerEtterValg(roller, rolle, person, forslag);
        form.setValue("roller", nye, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
        setRedigerer(undefined);
    };
    const venterPåForelder = useFyllUtForelder(
        foreldreTilBarn,
        ledige,
        (rolle, person) => settPart(rolle, tilPart(person)),
        velg,
        (rolle) =>
            rolleSomPart(form.getValues("roller"), rolle === "bidragspliktig" ? "BP" : "BM").erKjent === undefined,
    );

    const onKurvByttet = (kurv: Barnkurv | null) => {
        if (kurv) settPart(bidragspliktig.ident ? "bidragsmottaker" : "bidragspliktig", partFraKurv(kurv));
    };

    const { onSubmit, sakStatus, innsending } = useFlowSubmission({
        form,
        roller,
        valgteBarn,
    });

    const kort = FORELDERROLLER.map(
        (rolle): ForelderKortProps => ({
            rolle,
            part: rolleSomPart(roller, rolle === "bidragspliktig" ? "BP" : "BM"),
            forslag: filtrerBortValgteForeldre(
                [...tilgjengeligeForeldre.current.values()],
                redigerer === rolle
                    ? [rolleSomPart(roller, rolle === "bidragspliktig" ? "BP" : "BM")]
                    : [bidragspliktig, bidragsmottaker],
            ).filter((f) => f.ident !== låstIdent),
            låst: !!låstIdent && rolleSomPart(roller, rolle === "bidragspliktig" ? "BP" : "BM").ident === låstIdent,
            feil: form.formState.errors.roller?.[finnRolleIndex(roller, rolle === "bidragspliktig" ? "BP" : "BM")]
                ?.ident?.message,
            onVelg: (person) => velg(rolle, person),
            onUkjent: () => {
                settPart(rolle, UKJENT);
                setRedigerer(undefined);
            },
            onEndre: () => {
                setRedigerer(rolle);
                settPart(rolle, IKKE_VALGT);
            },
        }),
    );

    const [primær, sekundær] = bidragspliktig.ident
        ? (["bidragspliktig", "bidragsmottaker"] as const)
        : (["bidragsmottaker", "bidragspliktig"] as const);

    return {
        form,
        barnkurver,
        /** Barnkurvene eller foreldrene som fyller dem ut, hentes fortsatt. */
        lasterKurver: lasterKurver || lasterForeldre || venterPåForelder,
        manuellTittel: tittelForBarnUtenKurv(bidragspliktig, bidragsmottaker),
        onKurvByttet,
        reellMottakerRegel: reellMottakerRegel("Barnebidrag", bidragsmottaker.erKjent === false),
        kort,
        onSubmit,
        innsending,
        meldinger: {
            ugyldigForelderrelasjon,
            tilgangsfeil,
            forslagsfeil,
            ...relasjonsmeldinger(foreldreTilBarn, bidragspliktig, bidragsmottaker),
        },
        status: {
            ...sakStatus,
            partISakenNavn: (primær === "bidragspliktig" ? bidragspliktig : bidragsmottaker).navn ?? "",
            motpartNavn: (sekundær === "bidragspliktig" ? bidragspliktig : bidragsmottaker).navn,
        },
    };
}

function finnRolleIndex(roller: BarnebidragForelderRolle[], type: "BP" | "BM") {
    return roller.findIndex((rolle) => rolle.type === type);
}
