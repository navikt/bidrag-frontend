import { type RolleDto, Rolletype } from "@bidrag/api/BidragBehandlingApiV1";

export type Nullable<T> = T | null;
export type MaybeList<T> = T[] | [];
export interface Periode {
    fraDato: string;
    tilDato: string;
}
export interface GjennomsnittInntekt {
    aarsInntekt: number;
    maanedInntekt: number;
}

export interface Inntekt {
    aar: string;
    beskrivelse: string;
    fraDato: string | null;
    fraGrunnlag: boolean;
    selected: boolean;
    tekniskNavn: string;
    tilDato: string | null;
    totalt: number | string;
}
export interface InntektSomLeggesTilGrunn {
    ident: string;
    inntekt: Inntekt[];
}

export interface Barn {
    foedselnummer: string;
    navn: string;
}

export interface BarneTilleg {
    fraDato: Date | string;
    tilDato: Date | string;
    barn: Barn;
    beloep: number;
}

export interface UtvidetBarnetrygd {
    fraDato: Date | string;
    tilDato: Date | string;
    deltBosted: boolean;
    beloep: number;
}
export interface InntektData {
    gjennomsnittInntektSisteTreMaaneder: Nullable<GjennomsnittInntekt>;
    gjennomsnittInntektSisteTolvMaaneder: Nullable<GjennomsnittInntekt>;
    inntekteneSomLeggesTilGrunn: InntektSomLeggesTilGrunn[];
    barnetillegg: MaybeList<BarneTilleg>;
    utvidetBarnetrygd: MaybeList<UtvidetBarnetrygd>;
    notat: { [key: string]: string };
}

const randomSalary = (max = 1.5e6) => {
    const min = 2e5;
    return Math.round(min + Math.random() * (max - min));
};

export const createInntektSomLeggesTilGrunn = (roller: RolleDto[]) => {
    const inntekt: Inntekt[] = [
        {
            aar: "2022",
            beskrivelse: "3 Måneder Beregnet",
            fraDato: null,
            tilDato: null,
            fraGrunnlag: true,
            selected: false,
            totalt: 520000,
            tekniskNavn: "gjennomsnittInntektSisteTreMaaneder",
        },
        {
            aar: "2022",
            beskrivelse: "12 Måneder Beregnet",
            fraDato: null,
            tilDato: null,
            fraGrunnlag: true,
            selected: false,
            totalt: 480000,
            tekniskNavn: "gjennomsnittInntektSisteTolvMaaneder",
        },
        {
            aar: "2022",
            beskrivelse: "Skattegrunnlag 2022",
            fraDato: null,
            tilDato: null,
            fraGrunnlag: true,
            selected: false,
            totalt: randomSalary().toString(),
            tekniskNavn: "skattegrunnlag",
        },
        {
            aar: "2021",
            beskrivelse: "Lønn og trekk 2021",
            fraDato: null,
            tilDato: null,
            fraGrunnlag: true,
            selected: false,
            totalt: randomSalary().toString(),
            tekniskNavn: "loenn_og_trekk",
        },
        {
            aar: "2020",
            beskrivelse: "Skattegrunnlag 2020",
            fraDato: null,
            tilDato: null,
            fraGrunnlag: true,
            selected: false,
            totalt: randomSalary().toString(),
            tekniskNavn: "skattegrunnlag",
        },
        {
            aar: "2019",
            beskrivelse: "Kapitalinntekt 2019",
            fraDato: null,
            tilDato: null,
            fraGrunnlag: true,
            selected: false,
            totalt: 103,
            tekniskNavn: "kapitalinntekt",
        },
        {
            aar: "2021",
            beskrivelse: "Kapitalinntekt 2021",
            fraDato: null,
            tilDato: null,
            fraGrunnlag: true,
            selected: false,
            totalt: 6060,
            tekniskNavn: "kapitalinntekt",
        },
        {
            aar: "2021",
            beskrivelse: "Dagpenger 2021",
            fraDato: null,
            tilDato: null,
            fraGrunnlag: true,
            selected: false,
            totalt: 3400,
            tekniskNavn: "dagpenger",
        },
    ];

    const barnInntekt = [
        {
            aar: "2022",
            beskrivelse: "3 Måneder Beregnet",
            fraDato: null,
            tilDato: null,
            fraGrunnlag: true,
            selected: false,
            totalt: 320000,
            tekniskNavn: "gjennomsnittInntektSisteTreMaaneder",
        },
        {
            aar: "2022",
            beskrivelse: "12 Måneder Beregnet",
            fraDato: null,
            tilDato: null,
            fraGrunnlag: true,
            selected: false,
            totalt: 240000,
            tekniskNavn: "gjennomsnittInntektSisteTolvMaaneder",
        },
        {
            aar: "2022",
            beskrivelse: "Skattegrunnlag 2022",
            fraDato: null,
            tilDato: null,
            fraGrunnlag: true,
            selected: false,
            totalt: randomSalary(4e5).toString(),
            tekniskNavn: "skattegrunnlag",
        },
        {
            aar: "2021",
            beskrivelse: "Lønn og trekk 2021",
            fraDato: null,
            tilDato: null,
            fraGrunnlag: true,
            selected: false,
            totalt: randomSalary(4e5).toString(),
            tekniskNavn: "loenn_og_trekk",
        },
    ];

    return roller.map((rolle, index) => ({
        ident: rolle.ident,
        inntekt: rolle.rolletype === Rolletype.BM ? inntekt : index % 2 === 0 ? barnInntekt : [],
    }));
};

export const inntektData = (roller: RolleDto[]) => ({
    inntekteneSomLeggesTilGrunn: createInntektSomLeggesTilGrunn(roller),
    barnetillegg: [],
    utvidetBarnetrygd: [],
    notat: {
        medIVedtaket: "",
        kunINotat: "",
    },
});
