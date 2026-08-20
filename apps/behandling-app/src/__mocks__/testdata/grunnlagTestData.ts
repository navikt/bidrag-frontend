import { type BehandlingDtoV2, Rolletype } from "@bidrag/api/BidragBehandlingApiV1";
import {
    type ArbeidsforholdGrunnlagDto,
    type HentGrunnlagDto,
    SivilstandskodePDL,
    type SkattegrunnlagGrunnlagDto,
} from "@bidrag/api/BidragGrunnlagApi";
import { IdentUtils } from "@bidrag/common";
import { deductMonths, toISODateString } from "../../utils/date-utils";

export const createHustandsmedlemmer = () => {
    const behandlingId = JSON.parse(localStorage.getItem(`behandlingId`));
    const behandling = JSON.parse(localStorage.getItem(`behandling-${behandlingId}`));
    return {
        husstandListe: [
            {
                gyldigFraOgMed: "2022-05-03",
                gyldigTilOgMed: "2022-12-31",
                adressenavn: "Frystikkalleen",
                husnummer: "1",
                husbokstav: "A",
                bruksenhetsnummer: "1234",
                postnummer: "0560",
                bydelsnummer: "1234",
                kommunenummer: "1234",
                matrikkelId: 0,
                husstandsmedlemListe: behandling.roller.map((rolle, index) => ({
                    gyldigFraOgMed: "2022-05-03",
                    gyldigTilOgMed: index % 2 === 1 ? "2022-10-31" : "2022-12-31",
                    personId: rolle.ident,
                    foedselsdato: "2020-05-03",
                })),
            },
            {
                gyldigFraOgMed: "2023-01-01",
                adressenavn: "Frystikkalleen",
                husnummer: "2",
                husbokstav: "B",
                bruksenhetsnummer: "1234",
                postnummer: "0560",
                bydelsnummer: "1234",
                kommunenummer: "1234",
                matrikkelId: 0,
                husstandsmedlemListe: behandling.roller.map((rolle, index) => ({
                    gyldigFraOgMed: index % 2 === 1 ? "2023-03-01" : "2023-01-01",
                    gyldigTilOgMed: index % 2 === 1 ? "2023-05-31" : null,
                    personId: rolle.ident,
                    foedselsdato: "2020-05-03",
                })),
            },
        ],
    };
};

export const createGrunnlagspakkeOppdaterData = (behandling: BehandlingDtoV2) => {
    const bmIdent = behandling?.roller?.find((rolle) => rolle.rolletype === Rolletype.BM).ident;
    const barn = behandling?.roller?.filter((rolle) => rolle.rolletype === Rolletype.BA);
    const periodeFra = toISODateString(deductMonths(new Date(), 36));
    const periodeTil = toISODateString(new Date());

    const skattegrunnlagBarnRequests = barn.map((b) => ({
        type: "SKATTEGRUNNLAG",
        personId: b.ident,
        periodeFra,
        periodeTil,
    }));
    const bmRequests = [
        "SKATTEGRUNNLAG",
        "UTVIDET_BARNETRYGD_OG_SMAABARNSTILLEGG",
        "BARNETILLEGG",
        "HUSSTANDSMEDLEMMER_OG_EGNE_BARN",
        "SIVILSTAND",
    ].map((type) => ({
        type: type,
        personId: bmIdent,
        periodeFra,
        periodeTil,
    }));

    return {
        gyldigTil: periodeTil,
        grunnlagRequestDtoListe: bmRequests.concat(skattegrunnlagBarnRequests),
    };
};

const barnHusstandsData = [
    {
        fodselsdato: "2020-06-05",
        borISammeHusstandDtoListe: [
            {
                periodeFra: null,
                periodeTil: "2020-06-05",
            },
            {
                periodeFra: "2020-06-06",
                periodeTil: null,
            },
        ],
    },
    {
        fodselsdato: "2002-06-05",
        borISammeHusstandDtoListe: [
            {
                periodeFra: null,
                periodeTil: "2017-06-05",
            },
            {
                periodeFra: "2018-06-06",
                periodeTil: "2020-03-01",
            },
            {
                periodeFra: "2020-04-01",
                periodeTil: "2021-07-07",
            },
            {
                periodeFra: "2022-01-01",
                periodeTil: null,
            },
        ],
    },
];

const getEgneBarnIHusstandenListe = (barn, bmIdent, today, barnHusstandsData) =>
    barn.map((b, i) => ({
        partPersonId: bmIdent,
        relatertPersonPersonId: b.ident,
        navn: "",
        fodselsdato: barnHusstandsData[i].fodselsdato,
        erBarnAvBmBp: true,
        aktiv: true,
        brukFra: today,
        brukTil: null,
        hentetTidspunkt: today,
        borISammeHusstandDtoListe: barnHusstandsData[i].borISammeHusstandDtoListe,
    }));

const createSkattegrunnlagListe = (bmIdent, barn): SkattegrunnlagGrunnlagDto[] =>
    [
        {
            personId: bmIdent,
            periodeFra: "2022-01-01",
            periodeTil: "2022-12-31",
            skattegrunnlagspostListe: [
                {
                    skattegrunnlagType: "ordinær",
                    kode: "",
                    inntektType: "LOENNSINNTEKT",
                    belop: 600000,
                    beløp: 600000,
                },
                {
                    skattegrunnlagType: "ordinær",
                    kode: "",
                    inntektType: "YTELSE_FRA_OFFENTLIGE",
                    belop: 120000,
                    beløp: 120000,
                },
            ],
        },
        {
            personId: bmIdent,
            periodeFra: "2021-01-01",
            periodeTil: "2021-12-31",
            skattegrunnlagspostListe: [
                {
                    skattegrunnlagType: "ordinær",
                    kode: "",
                    inntektType: "LOENNSINNTEKT",
                    belop: 550000,
                    beløp: 550000,
                },
            ],
        },
        {
            personId: bmIdent,
            periodeFra: "2020-01-01",
            periodeTil: "2020-12-31",
            skattegrunnlagspostListe: [
                {
                    skattegrunnlagType: "ordinær",
                    kode: "",
                    inntektType: "LOENNSINNTEKT",
                    belop: 500000,
                    beløp: 500000,
                },
            ],
        },
    ].concat(
        barn
            .map((b, i) => {
                if (i % 2) return null;
                else
                    return [
                        {
                            personId: b.ident,
                            periodeFra: "2022-01-01",
                            periodeTil: "2022-12-31",
                            skattegrunnlagspostListe: [
                                {
                                    skattegrunnlagType: "ordinær",
                                    kode: "",
                                    inntektType: "LOENNSINNTEKT",
                                    belop: 200000,
                                },
                            ],
                        },
                        {
                            personId: b.ident,
                            periodeFra: "2021-01-01",
                            periodeTil: "2021-12-31",
                            skattegrunnlagspostListe: [
                                {
                                    skattegrunnlagType: "ordinær",
                                    kode: "",
                                    inntektType: "LOENNSINNTEKT",
                                    belop: 180000,
                                    beløp: 180000,
                                },
                            ],
                        },
                        {
                            personId: b.ident,
                            periodeFra: "2020-01-01",
                            periodeTil: "2020-12-31",
                            skattegrunnlagspostListe: [
                                {
                                    skattegrunnlagType: "ordinær",
                                    kode: "",
                                    inntektType: "LOENNSINNTEKT",
                                    belop: 140000,
                                    beløp: 140000,
                                },
                            ],
                        },
                    ];
            })
            .filter((b) => b !== null)
            .flat(),
    );

export const createGrunnlagsdata = (behandling: BehandlingDtoV2): HentGrunnlagDto => {
    const bmIdent = behandling?.roller?.find((rolle) => rolle.rolletype === Rolletype.BM).ident;
    const barn = behandling?.roller?.filter((rolle) => rolle.rolletype === Rolletype.BA);
    const today = toISODateString(new Date());
    let year = new Date();
    let month = new Date().getMonth() + 1;
    const tolvMaaneder = [];
    let max = 12;

    for (let i = 0; i < max; i++) {
        const res = month - i;
        if (res === 0) {
            month = 12;
            i = 0;
            max = 12 - tolvMaaneder.length;
            year = new Date(year.getFullYear() - 1, 1, 1);
        }
        const m = res === 0 ? 12 : res;
        const fraDate = new Date(year.getFullYear(), m - 1, 1);
        const tilDate = new Date(year.getFullYear(), m, 0);

        tolvMaaneder.push({
            fra: toISODateString(fraDate),
            til: toISODateString(tilDate),
        });
    }

    return {
        arbeidsforholdListe: createArbeidsforholdData,
        feilrapporteringListe: [],
        hentetTidspunkt: today,
        ainntektListe: tolvMaaneder.map((periode) => ({
            personId: bmIdent,
            periodeFra: periode.fra,
            periodeTil: periode.til,
            ainntektspostListe: [
                {
                    utbetalingsperiode: "202303",
                    opptjeningsperiodeFra: periode.fra,
                    opptjeningsperiodeTil: periode.til,
                    opplysningspliktigId: "string",
                    virksomhetId: "string",
                    inntektType: "LOENNSINNTEKT",
                    kategori: "LOENNSINNTEKT",
                    fordelType: "string",
                    beskrivelse: "string",
                    beløp: Math.round(20000 + Math.random() * (80000 - 20000)),
                    belop: 0,
                    etterbetalingsperiodeFra: periode.fra,
                    etterbetalingsperiodeTil: periode.til,
                },
                {
                    utbetalingsperiode: "202303",
                    opptjeningsperiodeFra: periode.fra,
                    opptjeningsperiodeTil: periode.til,
                    opplysningspliktigId: "string",
                    virksomhetId: "string",
                    inntektType: "NAERINGSINNTEKT",
                    kategori: "NAERINGSINNTEKT",
                    fordelType: "string",
                    beskrivelse: "string",
                    belop: 0,
                    beløp: Math.round(20000 + Math.random() * (80000 - 20000)),
                    etterbetalingsperiodeFra: periode.fra,
                    etterbetalingsperiodeTil: periode.til,
                },
            ],
        })),
        skattegrunnlagListe: createSkattegrunnlagListe(bmIdent, barn),
        utvidetBarnetrygdListe: [],
        småbarnstilleggListe: [],
        barnetilleggListe: [],
        kontantstøtteListe: [
            {
                partPersonId: "string",
                barnPersonId: "string",
                periodeFra: "2023-06-06",
                periodeTil: "2023-06-06",
                beløp: 0,
            },
        ],
        husstandsmedlemmerOgEgneBarnListe: getEgneBarnIHusstandenListe(barn, bmIdent, today, barnHusstandsData),
        sivilstandListe: [
            {
                personId: IdentUtils.generateFnr(),
                gyldigFom: "2001-08-27",
                type: SivilstandskodePDL.ENKE_ELLER_ENKEMANN,
            },
            {
                personId: IdentUtils.generateFnr(),
                gyldigFom: "1966-08-27",
                type: SivilstandskodePDL.UGIFT,
            },
            {
                personId: IdentUtils.generateFnr(),
                gyldigFom: "2023-06-21",
                type: SivilstandskodePDL.UGIFT,
            },
        ],
        barnetilsynListe: [
            {
                partPersonId: "string",
                barnPersonId: "string",
                periodeFra: "2023-06-06",
                periodeTil: "2023-06-06",
                beløp: 0,
                tilsynstype: "HELTID",
                skolealder: "OVER",
            },
        ],
    };
};

export const createArbeidsforholdData: ArbeidsforholdGrunnlagDto[] = [
    {
        partPersonId: IdentUtils.generateFnr(),
        startdato: "2002-11-03",
        sluttdato: null,
        arbeidsgiverNavn: "SAUEFABRIKK",
        arbeidsgiverOrgnummer: "896929119",
        ansettelsesdetaljerListe: [
            {
                periodeFra: "2002-11",
                periodeTil: null,
                arbeidsforholdType: "Forenklet",
                arbeidstidsordningBeskrivelse: null,
                ansettelsesformBeskrivelse: null,
                yrkeBeskrivelse: "ALLMENNLÆRER",
                antallTimerPrUke: null,
                avtaltStillingsprosent: null,
                sisteStillingsprosentendringDato: null,
                sisteLønnsendringDato: null,
            },
        ],
        permisjonListe: [],
        permitteringListe: [],
    },
    {
        partPersonId: IdentUtils.generateFnr(),
        startdato: "2022-12-07",
        sluttdato: null,
        arbeidsgiverNavn: "SAUEFABRIKK",
        arbeidsgiverOrgnummer: "896929119",
        ansettelsesdetaljerListe: [
            {
                periodeFra: "2022-12",
                periodeTil: null,
                arbeidsforholdType: "Forenklet",
                arbeidstidsordningBeskrivelse: null,
                ansettelsesformBeskrivelse: null,
                yrkeBeskrivelse: "BYGNINGSSNEKKER",
                antallTimerPrUke: null,
                avtaltStillingsprosent: null,
                sisteStillingsprosentendringDato: null,
                sisteLønnsendringDato: null,
            },
        ],
        permisjonListe: [],
        permitteringListe: [],
    },
    {
        partPersonId: IdentUtils.generateFnr(),
        startdato: "2023-04-01",
        sluttdato: "2023-12-23",
        arbeidsgiverNavn: "KLONELABBEN",
        arbeidsgiverOrgnummer: "907670201",
        ansettelsesdetaljerListe: [
            {
                periodeFra: "2023-12",
                periodeTil: null,
                arbeidsforholdType: "Forenklet",
                arbeidstidsordningBeskrivelse: null,
                ansettelsesformBeskrivelse: null,
                yrkeBeskrivelse: "ACCOUNT MANAGER",
                antallTimerPrUke: null,
                avtaltStillingsprosent: null,
                sisteStillingsprosentendringDato: null,
                sisteLønnsendringDato: null,
            },
        ],
        permisjonListe: [],
        permitteringListe: [],
    },
    {
        partPersonId: IdentUtils.generateFnr(),
        startdato: "2003-12-08",
        sluttdato: null,
        arbeidsgiverNavn: "SJOKKERENDE ELEKTRIKER",
        arbeidsgiverOrgnummer: "947064649",
        ansettelsesdetaljerListe: [
            {
                periodeFra: "2023-12",
                periodeTil: null,
                arbeidsforholdType: "Ordinaer",
                arbeidstidsordningBeskrivelse: "Ikke skift",
                ansettelsesformBeskrivelse: "Fast ansettelse",
                yrkeBeskrivelse: "ALLMENNLÆRER",
                antallTimerPrUke: 37.5,
                avtaltStillingsprosent: 88.0,
                sisteStillingsprosentendringDato: null,
                sisteLønnsendringDato: null,
            },
        ],
        permisjonListe: [],
        permitteringListe: [],
    },
];
