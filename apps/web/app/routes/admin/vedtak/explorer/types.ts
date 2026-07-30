import {GrunnlagDto, Grunnlagstype} from "@bidrag/api/BidragBehandlingApiV1";

export enum MermaidSubgraph {
    STONADSENDRING = "STONADSENDRING",
    PERIODE = "PERIODE",
    NOTAT = "NOTAT",
    SJABLON = "SJABLON",
    PERSON = "PERSON",
    INGEN = "INGEN",
    ACTION = "ACTION",
    ANDRE = "ANDRE",
}

export enum TreeChildType {
    FRITTSTÅENDE = "FRITTSTÅENDE",
    VEDTAK = "VEDTAK",
    STØNADSENDRING = "STØNADSENDRING",
    ENGANGSBELØP = "ENGANGSBELØP",
    PERIODE = "PERIODE",
    GRUNNLAG = "GRUNNLAG",
}

// Interfaces
export interface TreeChild {
    name: string;
    id: string;
    type: TreeChildType;
    children: TreeChild[];
    parent: TreeChild;
    innhold?: POJONode;
    /** Grunnlag */
    grunnlag?: GrunnlagDto;
    /** Grunnlagstype */
    grunnlagstype?: Grunnlagstype;
}

export type POJONode = object;

export enum TreeChildTypeEnum {
    FRITTSTAENDE = "FRITTSTÅENDE",
    VEDTAK = "VEDTAK",
    STONADSENDRING = "STØNADSENDRING",
    ENGANGSBELØP = "ENGANGSBELØP",
    PERIODE = "PERIODE",
    GRUNNLAG = "GRUNNLAG",
}

export interface TreeVedtak {
    nodeId: string;
    kilde: string;
    type: string;
    opprettetAv: string;
    opprettetAvNavn: string | null;
    kildeapplikasjon: string;
    vedtakstidspunkt: string;
    enhetsnummer: string | null;
    innkrevingUtsattTilDato?: string;
    fastsattILand: string | null;
    opprettetTidspunkt: string;
}

export interface TreeEngangsbeløp {
    nodeId: string;
    type: string;
    sak: string;
    resultatkode: string;
    skyldner: string;
    beløp: number;
    beløpBetalt: number;
    kravhaver: string;
    mottaker: string;
    innkreving: string;
    beslutning: string;
    omgjørVedtakId: number | null;
    eksternReferanse: string | null;
}

export interface TreeStønad {
    nodeId: string;
    type: string;
    sak: string;
    skyldner: string;
    kravhaver: string;
    mottaker: string;
    førsteIndeksreguleringsår: number | null;
    innkreving: string;
    beslutning: string;
    omgjørVedtakId: number | null;
    eksternReferanse: string | null;
}

export interface TreePeriode {
    nodeId: string;
    beløp: number | null;
    valutakode: string | null;
    resultatkode: string;
    delytelseId: string | null;
}

export interface MermaidResponse {
    mermaidGraph: string;
    vedtak: TreeVedtak;
    stønadsendringer: TreeStønad[];
    perioder: TreePeriode[];
    grunnlagListe: GrunnlagDto[];
}
