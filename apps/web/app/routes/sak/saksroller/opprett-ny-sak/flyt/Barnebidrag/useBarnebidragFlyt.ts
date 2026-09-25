import { TilgangsFeilError } from "@bidrag/api";
import type { PersonDto } from "@bidrag/api/PersonApi";
import { useQueries } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { type UseFormReturn, useFormContext } from "react-hook-form";
import { hentForeldreinformasjonForBarnQueryOptions, useHentPersonMotpartBarnRelasjon } from "~/api/useApi.ts";
import { grupperBarnIKurver } from "../../barn/barnkurver";
import { useFjernBarnUtenforKurver } from "../../barn/useFjernBarnUtenforKurver";
import { useFlowSubmission } from "../../innsending/useFlowSubmission";
import type { ForelderKortProps } from "../../parter/ParterSeksjon";
import { filtrerBortValgteForeldre } from "../../parter/part-utils";
import {
    type BarnebidragForelderRolle,
    type BarnebidragSkjemaData,
    type Barnkurv,
    erKjentPart,
    type ForelderPart,
    type ForelderPartRolle,
} from "../../skjema/opprett-sak-schema";
import { useSaksrolleroversikt } from "../../skjema/saksrolleroversiktContext";
import {
    type ForeldreTilBarn,
    harFullstendigRelasjon,
    type Parter,
    parterEtterValg,
    tilPart,
    utledBarnkurverForForelder,
    utledFellesBarn,
    utledForelderforslag,
} from "./barnebidrag-forslag";

const IKKE_VALGT: ForelderPart = { ident: "", navn: "", erKjent: undefined, diskresjonskode: undefined };
const UKJENT: ForelderPart = { ...IKKE_VALGT, erKjent: false };
const FORELDERROLLER: ForelderPartRolle[] = ["bidragspliktig", "bidragsmottaker"];

function useBarnkurver(form: UseFormReturn<BarnebidragSkjemaData>) {
    const roller = form.watch("roller");
    const bidragspliktig = roller.find((rolle) => rolle.type === "BP")?.ident;
    const bidragsmottaker = roller.find((rolle) => rolle.type === "BM")?.ident;
    const valgteBarn = form.watch("valgteBarn");

    const kilde = bidragspliktig || bidragsmottaker;
    const { data, isPending } = useHentPersonMotpartBarnRelasjon(kilde ? { ident: kilde } : null);
    const relasjoner = data?.personensMotpartBarnRelasjon ?? [];
    const manuelle = valgteBarn.filter((b) => b.manuellLagtTil).map((b) => b.ident);
    const kurver =
        bidragspliktig && bidragsmottaker
            ? [utledFellesBarn(relasjoner, bidragsmottaker, manuelle)].filter((kurv) => kurv !== null)
            : utledBarnkurverForForelder(relasjoner);
    const barnkurver = grupperBarnIKurver(kilde ? kurver : []);
    const lasterKurver = !!kilde && isPending;

    useFjernBarnUtenforKurver(form, barnkurver, lasterKurver);

    return barnkurver;
}

function useForelderforslag(form: UseFormReturn<BarnebidragSkjemaData>, parter: Parter) {
    const valgteBarn = form.watch("valgteBarn");
    const foreldreinfo = useQueries({
        queries: valgteBarn.map((barn) => hentForeldreinformasjonForBarnQueryOptions({ ident: barn.ident })),
    });
    const foreldreTilBarn: ForeldreTilBarn[] = valgteBarn.map((barn, index) => ({
        barn,
        foreldre: foreldreinfo[index]?.data,
    }));
    const valgteForeldre = FORELDERROLLER.map((rolle) => parter[rolle])
        .filter((part) => part.erKjent && part.ident)
        .map((part) => ({ ident: part.ident ?? "", navn: part.navn ?? "" }));
    const { forslag, feil } = utledForelderforslag({ foreldreTilBarn, valgteForeldre });
    const ledige = filtrerBortValgteForeldre(forslag, valgteForeldre);
    const tilgangsfeil = foreldreinfo.find((query) => query.error instanceof TilgangsFeilError)?.error;
    return { foreldreTilBarn, forslag, ledige, forslagsfeil: feil, tilgangsfeil: tilgangsfeil?.message };
}

/** Når nye barn gir én entydig forelder og bare ett kort er tomt, fylles kortet ut. */
function useFyllUtForelder(
    foreldreTilBarn: ForeldreTilBarn[],
    forslag: PersonDto[],
    fyllUt: (rolle: ForelderPartRolle, person: PersonDto) => void,
    velg: (rolle: ForelderPartRolle, person: PersonDto) => void,
    erTom: (rolle: ForelderPartRolle) => boolean,
) {
    useFyllUtInitialForelder(forslag, velg, erTom);
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
}

function useFyllUtInitialForelder(
    forslag: PersonDto[],
    velg: (rolle: ForelderPartRolle, person: PersonDto) => void,
    erTom: (rolle: ForelderPartRolle) => boolean,
) {
    const initialForelder = useSaksrolleroversikt().inngang?.initialForelder;
    const utført = useRef(false);
    useEffect(() => {
        if (!initialForelder || utført.current) return;
        const rolle: ForelderPartRolle = initialForelder.rolle === "BP" ? "bidragspliktig" : "bidragsmottaker";
        const person = forslag.find((f) => f.ident === initialForelder.ident);
        if (!person || !erTom(rolle)) return;
        utført.current = true;
        velg(rolle, person);
    });
}

function partFraKurv(kurv: Barnkurv): ForelderPart {
    return kurv.motpart ? tilPart(kurv.motpart as PersonDto) : UKJENT;
}

function relasjonsmeldinger(foreldreTilBarn: ForeldreTilBarn[], parter: Parter) {
    const harBarn = foreldreTilBarn.length > 0;
    const fullstendig = harFullstendigRelasjon(
        foreldreTilBarn,
        parter.bidragspliktig.ident,
        parter.bidragsmottaker.ident,
    );
    return {
        ufullstendigRelasjon: harBarn && fullstendig === false,
        bidragsmottakerUtenBarn: erKjentPart(parter.bidragsmottaker) && !harBarn,
    };
}

export function useBarnebidragFlyt() {
    const form = useFormContext<BarnebidragSkjemaData>();
    const { låstIdent } = useSaksrolleroversikt();

    const roller = form.watch("roller");
    const bidragspliktig = rolleSomPart(roller, "BP");
    const bidragsmottaker = rolleSomPart(roller, "BM");
    const valgteBarn = form.watch("valgteBarn");
    const parter: Parter = { bidragspliktig, bidragsmottaker };

    const barnkurver = useBarnkurver(form);
    const { foreldreTilBarn, forslag, ledige, forslagsfeil, tilgangsfeil } = useForelderforslag(form, parter);

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
        const nye = parterEtterValg(parter, rolle, person, forslag);
        for (const r of FORELDERROLLER) settPart(r, nye[r]);
    };
    useFyllUtForelder(
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
        bidragspliktig,
        bidragsmottaker,
        valgteBarn,
    });

    const kort = FORELDERROLLER.map(
        (rolle): ForelderKortProps => ({
            rolle,
            part: parter[rolle],
            forslag: ledige.filter((f) => f.ident !== låstIdent),
            låst: !!låstIdent && parter[rolle].ident === låstIdent,
            feil: form.formState.errors.roller?.[rolle === "bidragspliktig" ? 0 : 1]?.ident?.message,
            onVelg: (person) => velg(rolle, person),
            onUkjent: () => settPart(rolle, UKJENT),
            onEndre: () => settPart(rolle, IKKE_VALGT),
        }),
    );

    const [primær, sekundær] = bidragspliktig.ident
        ? (["bidragspliktig", "bidragsmottaker"] as const)
        : (["bidragsmottaker", "bidragspliktig"] as const);

    return {
        form,
        barnkurver,
        onKurvByttet,
        reellMottakerRegel: { type: "etter-barn", bidragsmottakerErUkjent: bidragsmottaker.erKjent === false } as const,
        kort,
        onSubmit,
        innsending,
        meldinger: {
            tilgangsfeil,
            forslagsfeil,
            ...relasjonsmeldinger(foreldreTilBarn, parter),
        },
        status: { ...sakStatus, partISakenNavn: parter[primær].navn ?? "", motpartNavn: parter[sekundær].navn },
    };
}

function rolleSomPart(roller: BarnebidragForelderRolle[], type: "BP" | "BM"): ForelderPart {
    const rolle = roller.find((r) => r.type === type);
    return {
        ident: rolle?.ident ?? "",
        navn: rolle?.navn ?? "",
        erKjent: rolle?.erKjent,
        diskresjonskode: rolle?.diskresjonskode,
    };
}
