import {
    type TreeChild,
    TreeChildType,
    type TreeEngangsbeløp,
    type TreePeriode,
    type TreeStønad,
    type TreeVedtak,
} from "@bidrag/api";
import {
    type EngangsbelopDto,
    type GrunnlagDto,
    Grunnlagstype,
    type StonadsendringDto,
    type VedtakDto,
    type VedtakPeriodeDto,
} from "@bidrag/api/BidragVedtakApi";
import { hentVisningsnavn } from "./VisningsnavnMapper";

export function mapVedtakToTree(vedtak: VedtakDto) {
    const vedtakParent: TreeChild = {
        id: vedtakNodeId(),
        name: "Vedtak",
        innhold: vedtakToTreeDto(vedtak),
        type: TreeChildType.VEDTAK,
        parent: null,
        children: [],
    };

    const grunnlagSomIkkeErReferert: TreeChild = {
        id: "ikke_referert",
        name: "Frittstående(Ikke referert av grunnlag eller stønadsendring/engangsbeløp)",
        parent: vedtakParent,
        type: TreeChildType.FRITTSTÅENDE,
        children: genererGrunnlagSomIkkeErReferert(vedtak, vedtakParent),
        innhold: undefined,
    };

    vedtakParent.children.push(grunnlagSomIkkeErReferert);

    vedtak.engangsbeløpListe.forEach((engangsbeløp) => {
        const engangsbeløpNode: TreeChild = {
            id: nodeIdEngangsbeløp(engangsbeløp),
            name: `Engangsbeløp ${hentVisningsnavn(engangsbeløp.type)}`,
            type: TreeChildType.ENGANGSBELØP,
            parent: vedtakParent,
            children: [],
            innhold: engangsbeløpToTreeDto(engangsbeløp),
        };
        vedtakParent.children.push(engangsbeløpNode);
        engangsbeløp.grunnlagReferanseListe.forEach((referanse) => {
            const node = referanseTilTree(referanse, vedtak.grunnlagListe, engangsbeløpNode);
            if (node) engangsbeløpNode.children.push(node);
        });
    });
    vedtak.stønadsendringListe.forEach((stønadsendring, i) => {
        const stønadsendringNode: TreeChild = {
            id: nodeIdStønadsendring(stønadsendring),
            name: `Stønadsendring Barn ${i + 1}`,
            type: TreeChildType.STØNADSENDRING,
            parent: vedtakParent,
            children: [],
            innhold: stønadsendringToTreeDto(stønadsendring),
        };
        vedtakParent.children.push(stønadsendringNode);
        stønadsendring.grunnlagReferanseListe.forEach((referanse) => {
            const node = referanseTilTree(referanse, vedtak.grunnlagListe, stønadsendringNode);
            if (node) stønadsendringNode.children.push(node);
        });
        stønadsendring.periodeListe.forEach((periode) => {
            const periodeNode: TreeChild = {
                id: nodeIdVedtakPeriode(periode, stønadsendring),
                name: `Periode(${toCompactString(periode.periode.fom)})`,
                type: TreeChildType.PERIODE,
                parent: stønadsendringNode,
                children: [],
                innhold: stønadsendringPeriodeToTreeDto(periode, stønadsendring),
            };

            stønadsendringNode.children.push(periodeNode);
            periode.grunnlagReferanseListe.forEach((referanse) => {
                const node = referanseTilTree(referanse, vedtak.grunnlagListe, periodeNode);
                if (node) periodeNode.children.push(node);
            });
        });
    });
    return vedtakParent;
}

function genererGrunnlagSomIkkeErReferert(vedtak: VedtakDto, parent: TreeChild): TreeChild[] {
    return vedtak.grunnlagListe
        .filter((grunnlag) => filtrerBasertPåFremmendReferanse(grunnlag.referanse, vedtak.grunnlagListe).length === 0)
        .filter((g) => !stønadsendringerInneholderReferanse(vedtak.stønadsendringListe, g.referanse))
        .filter((g) => !stønadsendringPerioderInneholderReferanse(vedtak.stønadsendringListe, g.referanse))
        .filter((g) => !engangsbeløpInneholderReferanse(vedtak.engangsbeløpListe, g.referanse))
        .map((g) => referanseTilTree(g.referanse, vedtak.grunnlagListe, parent))
        .filter((item): item is TreeChild => item !== null);
}

function referanseTilTree(
    referanse?: string,
    grunnlagsliste?: GrunnlagDto[],
    parent?: TreeChild | null,
): TreeChild | null {
    if (!referanse || !grunnlagsliste) return null;
    const filtrertGrunnlagsliste = filtrerBasertPåReferanse(referanse, grunnlagsliste);
    if (filtrertGrunnlagsliste.length === 0) {
        return null;
    }

    const grunnlag = filtrertGrunnlagsliste[0];
    if (!grunnlag) return null;
    const children = [
        ...grunnlag.grunnlagsreferanseListe.map((ref) => referanseTilTree(ref, grunnlagsliste)),
        // referanseTilTree(grunnlag.gjelderReferanse, grunnlagsliste),
        referanseTilTree(grunnlag.gjelderBarnReferanse ?? undefined, grunnlagsliste),
    ].filter((item): item is TreeChild => item !== null);

    return {
        name: grunnlagstypeTilVisningsnavn(grunnlag, grunnlagsliste) ?? referanse,
        id: referanse,
        innhold: grunnlag,
        type: TreeChildType.GRUNNLAG,
        parent: parent ?? null,
        children,
    };
}

function tilRolleVisningsnavn(type?: Grunnlagstype) {
    switch (type) {
        case Grunnlagstype.PERSON_BIDRAGSMOTTAKER:
            return "bidragsmottaker";
        case Grunnlagstype.PERSON_BIDRAGSPLIKTIG:
            return "bidragspliktig";
        case Grunnlagstype.PERSON_HUSSTANDSMEDLEM:
            return "husstandsmedlem";
        case Grunnlagstype.PERSON_REELL_MOTTAKER:
            return "reell mottaker";
        case Grunnlagstype.PERSONSOKNADSBARN:
            return "søknadsbarn";
        default:
            return "";
    }
}

function grunnlagstypeTilVisningsnavn(grunnlag: GrunnlagDto, grunnlagsListe: GrunnlagDto[]) {
    // innhold is a JSON string in BidragVedtakApi but treated as a parsed object at runtime
    // biome-ignore lint/suspicious/noExplicitAny: innhold typed as string in API but is a parsed JSON object at runtime
    const innholdObj = grunnlag.innhold as any;
    const gjelder = hentFørsteBasertPåReferanse(grunnlag.gjelderReferanse ?? "", grunnlagsListe);
    const gjelderVisningsnavn = tilRolleVisningsnavn(gjelder?.type);
    switch (grunnlag.type) {
        case Grunnlagstype.SLUTTBEREGNING_FORSKUDD: {
            return `Sluttberegning(${toCompactString(innholdObj?.periode?.fom)})`;
        }
        case Grunnlagstype.SJABLON_SJABLONTALL: {
            return `Sjablon(${innholdObj?.sjablon ?? grunnlag.referanse})`;
        }
        case Grunnlagstype.DELBEREGNING_SUM_INNTEKT: {
            return `Delberegning sum inntekt ${gjelderVisningsnavn} (${toCompactString(innholdObj?.periode?.fom)})`;
        }
        case Grunnlagstype.DELBEREGNING_BARN_I_HUSSTAND: {
            return `Delberegning barn i husstand(${toCompactString(innholdObj?.periode?.fom)})`;
        }
        case Grunnlagstype.INNTEKT_RAPPORTERING_PERIODE: {
            const år = new Date(innholdObj?.periode?.fom).getFullYear();
            const visningsnavn = hentVisningsnavn(innholdObj?.inntektsrapportering, år);
            const manueltRegistrert = innholdObj?.manueltRegistrert ? " (manuelt registrert)" : "";

            return visningsnavn + manueltRegistrert;
        }
        case Grunnlagstype.SIVILSTAND_PERIODE: {
            const visningsnavn = hentVisningsnavn(innholdObj?.sivilstand);
            return `Sivilstand(${visningsnavn}/${toCompactString(innholdObj?.periode?.fom)})`;
        }
        case Grunnlagstype.BOSTATUS_PERIODE: {
            const visningsnavn = hentVisningsnavn(innholdObj?.bostatus);
            return `Bosstatus ${gjelderVisningsnavn} (${visningsnavn}/${toCompactString(innholdObj?.periode?.fom)}})`;
        }
        case Grunnlagstype.NOTAT:
            return `Notat(${innholdObj?.type})`;
        case Grunnlagstype.INNHENTET_HUSSTANDSMEDLEM:
            return `Innhentet husstandsmedlem(${toCompactString(innholdObj?.grunnlag?.fødselsdato)})`;
        case Grunnlagstype.INNHENTET_INNTEKT_SKATTEGRUNNLAG_PERIODE:
            return `Innhentet skattegrunnlag(${innholdObj?.år})`;
        case Grunnlagstype.INNHENTET_SIVILSTAND:
            return "Innhentet sivilstand (Alle)";
        case Grunnlagstype.DELBEREGNING_VOKSNE_I_HUSSTAND:
            return "Delberegning voksne i husstand";
        case Grunnlagstype.DELBEREGNING_BIDRAGSEVNE:
            return "Delberegning bidragsevne";
        case Grunnlagstype.DELBEREGNINGSAMVAeRSFRADRAG:
            return "Delberegning samværsfradrag";
        case Grunnlagstype.BARNETILSYNMEDSTONADPERIODE:
            return "Barnetilsyn med stønad";
        case Grunnlagstype.DELBEREGNING_UNDERHOLDSKOSTNAD:
            return "Delberegning underholdskostnad";
        case Grunnlagstype.DELBEREGNINGBIDRAGSPLIKTIGESANDELSAeRBIDRAG:
            return "Delberegning bidragspliktiges andel særbidrag";
        case Grunnlagstype.DELBEREGNING_NETTO_BARNETILLEGG:
            return "Delberegning netto barnetillegg";
        case Grunnlagstype.DELBEREGNING_BIDRAGSPLIKTIGES_ANDEL:
            return "Delberegning bidragspliktiges andel";

        default:
            if (grunnlag.type.startsWith("PERSON_")) {
                return `${grunnlag.type}(${toCompactString(innholdObj?.fødselsdato)})`;
            } else if (grunnlag.type.startsWith("INNHENTET_")) {
                const gjelderGrunnlag = hentFørsteBasertPåReferanse(grunnlag.gjelderReferanse || "", grunnlagsListe);
                const rolleVisningsnavn = tilRolleVisningsnavn(gjelderGrunnlag?.type);
                const type = innhentetTilVisningsnavn(grunnlag.type);
                return `Innhentet ${type}(${rolleVisningsnavn})`;
            }
    }
}

function innhentetTilVisningsnavn(grunnlagstype: Grunnlagstype): string {
    switch (grunnlagstype) {
        case Grunnlagstype.INNHENTET_ARBEIDSFORHOLD:
            return "Arbeidsforhold";
        case Grunnlagstype.INNHENTETINNTEKTSMABARNSTILLEGG:
            return "Småbarnstillegg";
        case Grunnlagstype.INNHENTET_INNTEKT_AINNTEKT:
            return "Ainntekt";
        case Grunnlagstype.INNHENTET_INNTEKT_UTVIDETBARNETRYGD:
            return "Utvidet barnetrygd";
        case Grunnlagstype.INNHENTETINNTEKTKONTANTSTOTTE:
            return "Kontantstøtte";
        case Grunnlagstype.INNHENTET_BARNETILSYN:
            return "Barnetilsyn";
        case Grunnlagstype.INNHENTET_INNTEKT_BARNETILLEGG:
            return "Barnetillegg";
        case Grunnlagstype.INNHENTETTILLEGGSSTONAD:
            return "Tilleggsstønad";
    }
    return "";
}

function engangsbeløpInneholderReferanse(engangsbeløpListe: EngangsbelopDto[], referanse: string): boolean {
    return engangsbeløpListe.some((s) => inneholderReferanse(referanse, s.grunnlagReferanseListe));
}

function inneholderReferanse(referanse: string, grunnlagReferanseListe?: string[]): boolean {
    if (!grunnlagReferanseListe || grunnlagReferanseListe.length === 0) return false;
    return grunnlagReferanseListe.some((gref) => gref === referanse);
}

function stønadsendringPerioderInneholderReferanse(
    stønadsendringListe: StonadsendringDto[],
    referanse: string,
): boolean {
    return stønadsendringListe.some((s) => s.periodeListe.some((p) => p.grunnlagReferanseListe.includes(referanse)));
}

function stønadsendringerInneholderReferanse(stønadsendringListe: StonadsendringDto[], referanse: string): boolean {
    return stønadsendringListe.some((s) => s.grunnlagReferanseListe.includes(referanse));
}

export function filtrerBasertPåType(type: Grunnlagstype, grunnlagsliste: GrunnlagDto[]): GrunnlagDto[] {
    return grunnlagsliste.filter((grunnlag) => grunnlag.type === type);
}

function hentFørsteBasertPåReferanse(referanse: string, grunnlagsliste: GrunnlagDto[]): GrunnlagDto | null {
    const grunnlag = filtrerBasertPåReferanse(referanse, grunnlagsliste);
    if (grunnlag.length === 0) {
        return null;
    }
    return grunnlag[0] || null;
}

function filtrerBasertPåReferanse(referanse: string, grunnlagsliste: GrunnlagDto[]): GrunnlagDto[] {
    return grunnlagsliste.filter((grunnlag) => grunnlag.referanse === referanse);
}

function filtrerBasertPåFremmendReferanse(referanse: string, grunnlagsliste: GrunnlagDto[]): GrunnlagDto[] {
    return grunnlagsliste.filter(
        (grunnlag) => grunnlag.gjelderReferanse === referanse || grunnlag.grunnlagsreferanseListe.includes(referanse),
    );
}

export function stønadsendringPeriodeToTreeDto(
    periode: VedtakPeriodeDto,
    stønadsendring: StonadsendringDto,
): TreePeriode {
    return {
        nodeId: nodeIdVedtakPeriode(periode, stønadsendring),
        beløp: periode.beløp || null,
        valutakode: periode.valutakode || null,
        resultatkode: periode.resultatkode,
        delytelseId: periode.delytelseId || null,
    };
}

export function engangsbeløpToTreeDto(engangsbeløp: EngangsbelopDto): TreeEngangsbeløp {
    return {
        nodeId: nodeIdEngangsbeløp(engangsbeløp),
        type: engangsbeløp.type,
        sak: engangsbeløp.sak,
        beløp: engangsbeløp.beløp || null,
        referanse: engangsbeløp.referanse,
        valutakode: engangsbeløp.valutakode || null,
        resultatkode: engangsbeløp.resultatkode || null,
        beløpBetalt: engangsbeløp.betaltBeløp || null,
        skyldner: engangsbeløp.skyldner,
        kravhaver: engangsbeløp.kravhaver,
        mottaker: engangsbeløp.mottaker,
        innkreving: engangsbeløp.innkreving,
        beslutning: engangsbeløp.beslutning,
        omgjørVedtakId: engangsbeløp.omgjørVedtakId || null,
        eksternReferanse: engangsbeløp.eksternReferanse || null,
    };
}

export function stønadsendringToTreeDto(stonad: StonadsendringDto): TreeStønad {
    return {
        nodeId: nodeIdStønadsendring(stonad),
        type: stonad.type,
        sak: stonad.sak,
        skyldner: stonad.skyldner,
        kravhaver: stonad.kravhaver,
        mottaker: stonad.mottaker,
        førsteIndeksreguleringsår: stonad.førsteIndeksreguleringsår || null,
        innkreving: stonad.innkreving,
        beslutning: stonad.beslutning,
        omgjørVedtakId: stonad.omgjørVedtakId || null,
        eksternReferanse: stonad.eksternReferanse || null,
    };
}

export function vedtakToTreeDto(vedtak: VedtakDto): TreeVedtak {
    return {
        nodeId: vedtakNodeId(),
        kilde: vedtak.kilde,
        type: vedtak.type,
        opprettetAv: vedtak.opprettetAv,
        opprettetAvNavn: vedtak.opprettetAvNavn || null,
        kildeapplikasjon: vedtak.kildeapplikasjon,
        vedtakstidspunkt: vedtak.vedtakstidspunkt || "",
        enhetsnummer: vedtak.enhetsnummer || null,
        innkrevingUtsattTilDato: vedtak.innkrevingUtsattTilDato || undefined,
        fastsattILand: vedtak.fastsattILand || null,
        opprettetTidspunkt: vedtak.opprettetTidspunkt,
    };
}

function vedtakNodeId(): string {
    return "Vedtak";
}

function nodeIdStønadsendring(stønadsendring: StonadsendringDto): string {
    return `Stønadsendring_${stønadsendring.type}_${stønadsendring.kravhaver}`;
}

function nodeIdEngangsbeløp(engangsbeløp: EngangsbelopDto): string {
    return `Engangsbeløp_${engangsbeløp.type}_${engangsbeløp.kravhaver}`;
}

function nodeIdVedtakPeriode(vedtakPeriode: VedtakPeriodeDto, stønadsendring: StonadsendringDto): string {
    return `Periode${toCompactString(vedtakPeriode.periode.fom)}${stønadsendring.kravhaver}`;
}

export const DateToDDMMYYYYString = (dateValue: Date | string) => {
    if (!dateValue) return "";
    const isYearMonth = typeof dateValue === "string" && dateValue.split("-").length === 2;
    const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString("nb-NO", {
        year: "numeric",
        month: "2-digit",
        day: isYearMonth ? undefined : "2-digit",
    });
};

export const toCompactString = (dateValue: Date | string) => {
    return DateToDDMMYYYYString(dateValue); //.replace(/\./g, "");
};
