import {
    Bostatuskode,
    type BostatusperiodeDto,
    Kilde,
    type RolleDto,
    Rolletype,
    type SivilstandGrunnlagDto,
    TypeBehandling,
} from "@bidrag/api/BidragBehandlingApiV1";
import { type RelatertPersonGrunnlagDto, SivilstandskodePDL } from "@bidrag/api/BidragGrunnlagApi";
import { IdentUtils } from "@bidrag/common";
import { describe, expect, it } from "vitest";
import {
    checkOverlappingPeriods,
    compareOpplysninger,
    editPeriods,
    fillInPeriodGaps,
    getBarnPerioderFromHusstandsListe,
    getSivilstandPerioder,
    mapGrunnlagSivilstandToBehandlingSivilstandType,
    mapHusstandsMedlemmerToBarn,
} from "../../common/helpers/boforholdFormHelpers";
import { toISODateString } from "../../utils/date-utils";

describe("BoforholdFormHelpers", () => {
    it("should merge periods if there is no gap between 2 periods in Folkeregistre", () => {
        const egneBarnIHusstand: RelatertPersonGrunnlagDto = {
            partPersonId: IdentUtils.generateFnr(),
            relatertPersonPersonId: IdentUtils.generateFnr(),
            navn: "",
            fødselsdato: "2018-06-05",
            erBarnAvBmBp: true,
            borISammeHusstandDtoListe: [
                {
                    periodeFra: "2018-06-05",
                    periodeTil: "2020-03-01",
                },
                {
                    periodeFra: "2020-03-02",
                    periodeTil: "2021-07-07",
                },
                {
                    periodeFra: "2022-01-01",
                    periodeTil: null,
                },
            ],
        };
        const expectedResult = [
            {
                fraDato: new Date("2018-06-05"),
                tilDato: new Date("2021-07-07"),
                bostatus: "MED_FORELDER",
            },
            {
                fraDato: new Date("2021-07-08"),
                tilDato: new Date("2021-12-31"),
                bostatus: "IKKE_MED_FORELDER",
            },
            {
                fraDato: new Date("2022-01-01"),
                tilDato: null,
                bostatus: "MED_FORELDER",
            },
        ];
        const husstandsOpplysningerFraFolkRegistre = fillInPeriodGaps(egneBarnIHusstand);
        expect(husstandsOpplysningerFraFolkRegistre.length).equals(expectedResult.length);
        husstandsOpplysningerFraFolkRegistre.forEach((husstandsOpplysning, i) => {
            expect(husstandsOpplysning.fraDato?.toDateString()).equals(expectedResult[i].fraDato?.toDateString());
            expect(husstandsOpplysning.tilDato?.toDateString()).equals(expectedResult[i].tilDato?.toDateString());
            expect(husstandsOpplysning.bostatus).equals(expectedResult[i].bostatus);
        });
    });

    it("should fill in a period with status MED_FORELDER if there is a gap between foedselsdato and first period has null for periodeFra in Folkeregistre", () => {
        const egneBarnIHusstand: RelatertPersonGrunnlagDto = {
            partPersonId: IdentUtils.generateFnr(),
            relatertPersonPersonId: IdentUtils.generateFnr(),
            navn: "",
            fødselsdato: "2002-05-05",
            erBarnAvBmBp: true,
            borISammeHusstandDtoListe: [
                {
                    periodeFra: null,
                    periodeTil: "2017-07-05",
                },
                {
                    periodeFra: "2018-06-06",
                    periodeTil: "2020-03-01",
                },
                {
                    periodeFra: "2020-05-01",
                    periodeTil: "2021-07-07",
                },
                {
                    periodeFra: "2022-01-01",
                    periodeTil: null,
                },
            ],
        };
        const expectedResult = [
            {
                fraDato: new Date("2002-05-05"),
                tilDato: new Date("2017-07-05"),
                bostatus: "MED_FORELDER",
            },
            {
                fraDato: new Date("2017-07-06"),
                tilDato: new Date("2018-06-05"),
                bostatus: "IKKE_MED_FORELDER",
            },
            {
                fraDato: new Date("2018-06-06"),
                tilDato: new Date("2020-03-01"),
                bostatus: "MED_FORELDER",
            },
            {
                fraDato: new Date("2020-03-02"),
                tilDato: new Date("2020-04-30"),
                bostatus: "IKKE_MED_FORELDER",
            },
            {
                fraDato: new Date("2020-05-01"),
                tilDato: new Date("2021-07-07"),
                bostatus: "MED_FORELDER",
            },
            {
                fraDato: new Date("2021-07-08"),
                tilDato: new Date("2021-12-31"),
                bostatus: "IKKE_MED_FORELDER",
            },
            {
                fraDato: new Date("2022-01-01"),
                tilDato: null,
                bostatus: "MED_FORELDER",
            },
        ];
        const husstandsOpplysningerFraFolkRegistre = fillInPeriodGaps(egneBarnIHusstand);
        expect(husstandsOpplysningerFraFolkRegistre.length).equals(expectedResult.length);
        husstandsOpplysningerFraFolkRegistre.forEach((husstandsOpplysning, i) => {
            expect(husstandsOpplysning.fraDato?.toDateString()).equals(expectedResult[i].fraDato?.toDateString());
            expect(husstandsOpplysning.tilDato?.toDateString()).equals(expectedResult[i].tilDato?.toDateString());
            expect(husstandsOpplysning.bostatus).equals(expectedResult[i].bostatus);
        });
    });

    it("should fill in a period with status IKKE_MED_FORELDER if there is a gap between foedselsdato and first period in Folkeregistre", () => {
        const egneBarnIHusstand: RelatertPersonGrunnlagDto = {
            partPersonId: IdentUtils.generateFnr(),
            relatertPersonPersonId: IdentUtils.generateFnr(),
            navn: "",
            fødselsdato: "2014-01-10",
            erBarnAvBmBp: true,
            borISammeHusstandDtoListe: [
                {
                    periodeFra: "2022-09-05",
                    periodeTil: null,
                },
            ],
        };
        const expectedResult = [
            {
                fraDato: new Date("2014-01-10"),
                tilDato: new Date("2022-09-04"),
                bostatus: "IKKE_MED_FORELDER",
            },
            {
                fraDato: new Date("2022-09-05"),
                tilDato: null,
                bostatus: "MED_FORELDER",
            },
        ];
        const husstandsOpplysningerFraFolkRegistre = fillInPeriodGaps(egneBarnIHusstand);
        expect(husstandsOpplysningerFraFolkRegistre.length).equals(expectedResult.length);
        husstandsOpplysningerFraFolkRegistre.forEach((husstandsOpplysning, i) => {
            expect(husstandsOpplysning.fraDato?.toDateString()).equals(expectedResult[i].fraDato?.toDateString());
            expect(husstandsOpplysning.tilDato?.toDateString()).equals(expectedResult[i].tilDato?.toDateString());
            expect(husstandsOpplysning.bostatus).equals(expectedResult[i].bostatus);
        });
    });

    it("should add a period with status IKKE_MED_FORELDER if last period has periodeTil dato", () => {
        const egneBarnIHusstand: RelatertPersonGrunnlagDto = {
            partPersonId: IdentUtils.generateFnr(),
            relatertPersonPersonId: IdentUtils.generateFnr(),
            navn: "",
            fødselsdato: "2002-05-05",
            erBarnAvBmBp: true,
            borISammeHusstandDtoListe: [
                {
                    periodeFra: null,
                    periodeTil: "2017-07-05",
                },
                {
                    periodeFra: "2018-06-06",
                    periodeTil: "2020-03-01",
                },
                {
                    periodeFra: "2020-05-01",
                    periodeTil: "2021-07-07",
                },
                {
                    periodeFra: "2022-01-01",
                    periodeTil: "2022-04-01",
                },
            ],
        };
        const expectedResult = [
            {
                fraDato: new Date("2002-05-05"),
                tilDato: new Date("2017-07-05"),
                bostatus: "MED_FORELDER",
            },
            {
                fraDato: new Date("2017-07-06"),
                tilDato: new Date("2018-06-05"),
                bostatus: "IKKE_MED_FORELDER",
            },
            {
                fraDato: new Date("2018-06-06"),
                tilDato: new Date("2020-03-01"),
                bostatus: "MED_FORELDER",
            },
            {
                fraDato: new Date("2020-03-02"),
                tilDato: new Date("2020-04-30"),
                bostatus: "IKKE_MED_FORELDER",
            },
            {
                fraDato: new Date("2020-05-01"),
                tilDato: new Date("2021-07-07"),
                bostatus: "MED_FORELDER",
            },
            {
                fraDato: new Date("2021-07-08"),
                tilDato: new Date("2021-12-31"),
                bostatus: "IKKE_MED_FORELDER",
            },
            {
                fraDato: new Date("2022-01-01"),
                tilDato: new Date("2022-04-01"),
                bostatus: "MED_FORELDER",
            },
            {
                fraDato: new Date("2022-04-02"),
                tilDato: null,
                bostatus: "IKKE_MED_FORELDER",
            },
        ];
        const husstandsOpplysningerFraFolkRegistre = fillInPeriodGaps(egneBarnIHusstand);
        expect(husstandsOpplysningerFraFolkRegistre.length).equals(expectedResult.length);
        husstandsOpplysningerFraFolkRegistre.forEach((husstandsOpplysning, i) => {
            expect(husstandsOpplysning.fraDato?.toDateString()).equals(expectedResult[i].fraDato?.toDateString());
            expect(husstandsOpplysning.tilDato?.toDateString()).equals(expectedResult[i].tilDato?.toDateString());
            expect(husstandsOpplysning.bostatus).equals(expectedResult[i].bostatus);
        });
    });

    it("should deal with invalid data from folkeregistre", () => {
        const egneBarnIHusstand: RelatertPersonGrunnlagDto = {
            partPersonId: IdentUtils.generateFnr(),
            relatertPersonPersonId: IdentUtils.generateFnr(),
            navn: "",
            fødselsdato: "2002-05-05",
            erBarnAvBmBp: true,
            borISammeHusstandDtoListe: [
                {
                    periodeFra: "2021-01-04",
                    periodeTil: "2023-06-20",
                },
                {
                    periodeFra: "2023-06-20",
                    periodeTil: null,
                },
            ],
        };
        const expectedResult = [
            {
                fraDato: new Date("2002-05-05"),
                tilDato: new Date("2021-01-03"),
                bostatus: "IKKE_MED_FORELDER",
            },
            {
                fraDato: new Date("2021-01-04"),
                tilDato: null,
                bostatus: "MED_FORELDER",
            },
        ];
        const husstandsOpplysningerFraFolkRegistre = fillInPeriodGaps(egneBarnIHusstand);
        expect(husstandsOpplysningerFraFolkRegistre.length).equals(expectedResult.length);
        husstandsOpplysningerFraFolkRegistre.forEach((husstandsOpplysning, i) => {
            expect(husstandsOpplysning.fraDato?.toDateString()).equals(expectedResult[i].fraDato?.toDateString());
            expect(husstandsOpplysning.tilDato?.toDateString()).equals(expectedResult[i].tilDato?.toDateString());
            expect(husstandsOpplysning.bostatus).equals(expectedResult[i].bostatus);
        });
    });

    it("should create correct hustands periods from grunnlag husstandmedlemmerOgEgneBarnListe", () => {
        const husstandmedlemmerOgEgneBarnListe: RelatertPersonGrunnlagDto[] = [
            {
                partPersonId: IdentUtils.generateFnr(),
                relatertPersonPersonId: IdentUtils.generateFnr(),
                navn: "HEVNGJERRIG ALT",
                fødselsdato: "2016-02-05",
                erBarnAvBmBp: false,
                borISammeHusstandDtoListe: [
                    {
                        periodeFra: "2016-02-05",
                        periodeTil: null,
                    },
                ],
            },
            {
                partPersonId: IdentUtils.generateFnr(),
                relatertPersonPersonId: IdentUtils.generateFnr(),
                navn: "AKTVERDIG ODDE",
                fødselsdato: "2022-09-05",
                erBarnAvBmBp: true,
                borISammeHusstandDtoListe: [
                    {
                        periodeFra: "2022-09-05",
                        periodeTil: null,
                    },
                ],
            },
            {
                partPersonId: IdentUtils.generateFnr(),
                relatertPersonPersonId: IdentUtils.generateFnr(),
                navn: "ALMINNELIG GÅTE",
                fødselsdato: "1976-02-08",
                erBarnAvBmBp: false,
                borISammeHusstandDtoListe: [
                    {
                        periodeFra: "2016-02-05",
                        periodeTil: null,
                    },
                ],
            },
            {
                partPersonId: IdentUtils.generateFnr(),
                relatertPersonPersonId: IdentUtils.generateFnr(),
                navn: "EKSTRA FAMILIEBARNEHAGE",
                fødselsdato: "2014-01-10",
                erBarnAvBmBp: true,
                borISammeHusstandDtoListe: [
                    {
                        periodeFra: "2022-09-05",
                        periodeTil: null,
                    },
                ],
            },
        ];
        const husstandsOpplysningerFraFolkRegistre = mapHusstandsMedlemmerToBarn(husstandmedlemmerOgEgneBarnListe);
        expect(husstandsOpplysningerFraFolkRegistre.length).equals(2);
        expect(husstandsOpplysningerFraFolkRegistre[0].navn).equals("AKTVERDIG ODDE");
        expect(husstandsOpplysningerFraFolkRegistre[0].perioder.length).equals(1);
        expect(toISODateString(husstandsOpplysningerFraFolkRegistre[0].perioder[0].fraDato)).equals("2022-09-05");
        expect(husstandsOpplysningerFraFolkRegistre[0].perioder[0].tilDato).equals(null);
        expect(husstandsOpplysningerFraFolkRegistre[0].perioder[0].bostatus).equals("MED_FORELDER");
        expect(husstandsOpplysningerFraFolkRegistre[1].navn).equals("EKSTRA FAMILIEBARNEHAGE");
        expect(husstandsOpplysningerFraFolkRegistre[1].perioder.length).equals(2);
        expect(toISODateString(husstandsOpplysningerFraFolkRegistre[1].perioder[0].fraDato)).equals("2014-01-10");
        expect(toISODateString(husstandsOpplysningerFraFolkRegistre[1].perioder[0].tilDato)).equals("2022-09-04");
        expect(husstandsOpplysningerFraFolkRegistre[1].perioder[0].bostatus).equals("IKKE_MED_FORELDER");
        expect(toISODateString(husstandsOpplysningerFraFolkRegistre[1].perioder[1].fraDato)).equals("2022-09-05");
        expect(husstandsOpplysningerFraFolkRegistre[1].perioder[1].tilDato).equals(null);
        expect(husstandsOpplysningerFraFolkRegistre[1].perioder[1].bostatus).equals("MED_FORELDER");
    });

    it("should create hustands periods from grunnlag husstandmedlemmerOgEgneBarnListe", () => {
        const husstandmedlemmerOgEgneBarnListe: RelatertPersonGrunnlagDto[] = [
            {
                partPersonId: IdentUtils.generateFnr(),
                relatertPersonPersonId: IdentUtils.generateFnr(),
                navn: "Hans Hansen",
                fødselsdato: "2001-11-02",
                erBarnAvBmBp: true,
                borISammeHusstandDtoListe: [
                    {
                        periodeFra: "2016-12-09",
                        periodeTil: "2023-08-14",
                    },
                ],
            },
        ];

        const husstandsOpplysningerFraFolkRegistre = mapHusstandsMedlemmerToBarn(husstandmedlemmerOgEgneBarnListe);
        expect(husstandsOpplysningerFraFolkRegistre[0].perioder.length).equals(3);
        expect(toISODateString(husstandsOpplysningerFraFolkRegistre[0].perioder[0].fraDato)).equals("2001-11-02");
        expect(toISODateString(husstandsOpplysningerFraFolkRegistre[0].perioder[0].tilDato)).equals("2016-12-08");
        expect(husstandsOpplysningerFraFolkRegistre[0].perioder[0].bostatus).equals("IKKE_MED_FORELDER");
        expect(toISODateString(husstandsOpplysningerFraFolkRegistre[0].perioder[1].fraDato)).equals("2016-12-09");
        expect(toISODateString(husstandsOpplysningerFraFolkRegistre[0].perioder[1].tilDato)).equals("2023-08-14");
        expect(husstandsOpplysningerFraFolkRegistre[0].perioder[1].bostatus).equals("MED_FORELDER");
        expect(toISODateString(husstandsOpplysningerFraFolkRegistre[0].perioder[2].fraDato)).equals("2023-08-15");
        expect(husstandsOpplysningerFraFolkRegistre[0].perioder[2].tilDato).equals(null);
        expect(husstandsOpplysningerFraFolkRegistre[0].perioder[2].bostatus).equals("IKKE_MED_FORELDER");
    });

    it("getBarnPerioderFromHusstandsListe should create initial values from grunnlag husstandmedlemmerOgEgneBarnListe", () => {
        const husstandmedlemmerOgEgneBarnListe: RelatertPersonGrunnlagDto[] = [
            {
                partPersonId: IdentUtils.generateFnr(),
                relatertPersonPersonId: IdentUtils.generateFnr(),
                navn: "Hans Hansen",
                fødselsdato: "2020-11-02",
                erBarnAvBmBp: true,
                borISammeHusstandDtoListe: [
                    {
                        periodeFra: "2016-12-09",
                        periodeTil: "2023-08-14",
                    },
                ],
            },
        ];
        const barnMedISaken: RolleDto[] = [
            {
                søknader: [],
                id: 1,
                rolletype: Rolletype.BA,
                ident: IdentUtils.generateFnr(),
                navn: "Hans Hansen",
                fødselsdato: "2020-11-02",
                saksnummer: "12",
            },
        ];

        const datoFom = new Date("2023-06-01");
        const husstandsOpplysningerFraFolkRegistre = mapHusstandsMedlemmerToBarn(husstandmedlemmerOgEgneBarnListe);
        const result = getBarnPerioderFromHusstandsListe(
            husstandsOpplysningerFraFolkRegistre,
            datoFom,
            barnMedISaken,
            TypeBehandling.FORSKUDD,
        );
        expect(result[0].perioder.length).equals(2);
        expect(result[0].perioder[0].datoFom).equals("2023-06-01");
        expect(result[0].perioder[0].datoTom).equals("2023-08-31");
        expect(result[0].perioder[0].bostatus).equals("MED_FORELDER");
        expect(result[0].perioder[1].datoFom).equals("2023-09-01");
        expect(result[0].perioder[1].datoTom).equals(null);
        expect(result[0].perioder[1].bostatus).equals("IKKE_MED_FORELDER");
    });

    it("should set a default period - regnes_ikke som barn, after a kid has turned 18", () => {
        const husstandmedlemmerOgEgneBarnListe: RelatertPersonGrunnlagDto[] = [
            {
                partPersonId: IdentUtils.generateFnr(),
                relatertPersonPersonId: IdentUtils.generateFnr(),
                navn: "",
                fødselsdato: "2002-06-05",
                erBarnAvBmBp: true,
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

        const barnMedISaken: RolleDto[] = [
            {
                søknader: [],
                id: 1,
                rolletype: Rolletype.BA,
                ident: IdentUtils.generateFnr(),
                navn: "Hans Hansen",
                fødselsdato: "2002-06-05",
                saksnummer: "12",
            },
        ];
        const expectedResult: BostatusperiodeDto[] = [
            {
                datoFom: "2019-04-01",
                datoTom: "2020-06-30",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2020-07-01",
                datoTom: null,
                bostatus: Bostatuskode.REGNES_IKKE_SOM_BARN,
                kilde: Kilde.MANUELL,
            },
        ];

        const datoFom = new Date("2019-04-01");
        const husstandsOpplysningerFraFolkRegistre = mapHusstandsMedlemmerToBarn(husstandmedlemmerOgEgneBarnListe);
        const result = getBarnPerioderFromHusstandsListe(
            husstandsOpplysningerFraFolkRegistre,
            datoFom,
            barnMedISaken,
            TypeBehandling.FORSKUDD,
        );
        result.forEach((barn) => {
            barn.perioder.forEach((periode, j) => {
                expect(periode.datoFom).equals(expectedResult[j].datoFom);
                expect(periode.datoTom).equals(expectedResult[j].datoTom);
                expect(periode.bostatus).equals(expectedResult[j].bostatus);
            });
        });
    });

    it("should set only one periode - regnes_ikke som barn, if virkningstidspunkt is after a kid has turned 18", () => {
        const husstandmedlemmerOgEgneBarnListe: RelatertPersonGrunnlagDto[] = [
            {
                partPersonId: IdentUtils.generateFnr(),
                relatertPersonPersonId: IdentUtils.generateFnr(),
                navn: "",
                fødselsdato: "2002-06-05",
                erBarnAvBmBp: true,
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

        const barnMedISaken: RolleDto[] = [
            {
                søknader: [],
                id: 1,
                rolletype: Rolletype.BA,
                ident: IdentUtils.generateFnr(),
                navn: "Hans Hansen",
                fødselsdato: "2002-06-05",
                saksnummer: "12",
            },
        ];
        const expectedResult: BostatusperiodeDto[] = [
            {
                datoFom: "2020-08-01",
                datoTom: null,
                bostatus: Bostatuskode.REGNES_IKKE_SOM_BARN,
                kilde: Kilde.MANUELL,
            },
        ];

        const datoFom = new Date("2020-08-01");
        const husstandsOpplysningerFraFolkRegistre = mapHusstandsMedlemmerToBarn(husstandmedlemmerOgEgneBarnListe);
        const result = getBarnPerioderFromHusstandsListe(
            husstandsOpplysningerFraFolkRegistre,
            datoFom,
            barnMedISaken,
            TypeBehandling.FORSKUDD,
        );
        result.forEach((barn) => {
            barn.perioder.forEach((periode, j) => {
                expect(periode.datoFom).equals(expectedResult[j].datoFom);
                expect(periode.datoTom).equals(expectedResult[j].datoTom);
                expect(periode.bostatus).equals(expectedResult[j].bostatus);
            });
        });
    });

    it("should create husstands periods from the folkeregistre data", () => {
        const datoFom = new Date("2020-06-01");
        const barnMedISaken: RolleDto[] = [
            {
                søknader: [],
                id: 1,
                rolletype: Rolletype.BA,
                ident: IdentUtils.generateFnr(),
                saksnummer: "12",
            },
            {
                søknader: [],
                id: 2,
                rolletype: Rolletype.BA,
                ident: IdentUtils.generateFnr(),
                saksnummer: "12",
            },
        ];
        const husstandsOpplysningerFraFolkRegistre = [
            {
                ident: IdentUtils.generateFnr(),
                navn: "",
                perioder: [
                    {
                        fraDato: null,
                        tilDato: null,
                        bostatus: Bostatuskode.MED_FORELDER,
                    },
                ],
            },
            {
                ident: IdentUtils.generateFnr(),
                navn: "",
                perioder: [
                    {
                        fraDato: new Date("2018-06-05"),
                        tilDato: new Date("2020-03-01"),
                        bostatus: Bostatuskode.MED_FORELDER,
                    },
                    {
                        fraDato: new Date("2020-03-02"),
                        tilDato: new Date("2020-03-31"),
                        bostatus: Bostatuskode.IKKE_MED_FORELDER,
                    },
                    {
                        fraDato: new Date("2020-04-01"),
                        tilDato: new Date("2021-07-07"),
                        bostatus: Bostatuskode.MED_FORELDER,
                    },
                    {
                        fraDato: new Date("2021-07-08"),
                        tilDato: new Date("2021-12-31"),
                        bostatus: Bostatuskode.IKKE_MED_FORELDER,
                    },
                    {
                        fraDato: new Date("2022-01-01"),
                        tilDato: null,
                        bostatus: Bostatuskode.MED_FORELDER,
                    },
                ],
            },
        ];
        const expectedResult = [
            {
                ident: IdentUtils.generateFnr(),
                navn: "",
                perioder: [
                    {
                        datoFom: "2020-06-01",
                        datoTom: null,
                        bostatus: Bostatuskode.MED_FORELDER,
                        kilde: "offentlig",
                    },
                ],
                medISaken: true,
            },
            {
                ident: IdentUtils.generateFnr(),
                navn: "",
                perioder: [
                    {
                        datoFom: "2020-06-01",
                        datoTom: "2021-07-31",
                        bostatus: Bostatuskode.MED_FORELDER,
                        kilde: "offentlig",
                    },
                    {
                        datoFom: "2021-08-01",
                        datoTom: "2021-12-31",
                        bostatus: Bostatuskode.IKKE_MED_FORELDER,
                        kilde: "offentlig",
                    },
                    {
                        datoFom: "2022-01-01",
                        datoTom: null,
                        bostatus: Bostatuskode.MED_FORELDER,
                        kilde: "offentlig",
                    },
                ],
                medISaken: true,
            },
        ];
        const result = getBarnPerioderFromHusstandsListe(
            husstandsOpplysningerFraFolkRegistre,
            datoFom,
            barnMedISaken,
            TypeBehandling.FORSKUDD,
        );
        result.forEach((r, i) => {
            r.perioder.forEach((periode, j) => {
                expect(periode.datoFom).equals(expectedResult[i].perioder[j].datoFom);
                expect(periode.datoTom).equals(expectedResult[i].perioder[j].datoTom);
                expect(periode.bostatus).equals(expectedResult[i].perioder[j].bostatus);
            });
        });
    });

    it("periods should get registrert status if there is 1 or more days with registrert status, only if a whole month is ikke registrert it should get status ikke registrert", () => {
        const datoFom = new Date("2019-04-01");
        const barnMedISaken: RolleDto[] = [
            {
                søknader: [],
                id: 1,
                rolletype: Rolletype.BA,
                ident: IdentUtils.generateFnr(),
                saksnummer: "12",
            },
        ];
        const husstandsOpplysningerFraFolkRegistre = [
            {
                ident: IdentUtils.generateFnr(),
                navn: "",
                perioder: [
                    {
                        fraDato: new Date("2019-04-01"),
                        tilDato: new Date("2020-03-01"),
                        bostatus: Bostatuskode.MED_FORELDER,
                    },
                    {
                        fraDato: new Date("2020-03-02"),
                        tilDato: new Date("2020-03-31"),
                        bostatus: Bostatuskode.IKKE_MED_FORELDER,
                    },
                    {
                        fraDato: new Date("2020-04-01"),
                        tilDato: new Date("2021-07-07"),
                        bostatus: Bostatuskode.MED_FORELDER,
                    },
                    {
                        fraDato: new Date("2021-07-08"),
                        tilDato: new Date("2021-12-31"),
                        bostatus: Bostatuskode.IKKE_MED_FORELDER,
                    },
                    {
                        fraDato: new Date("2022-01-01"),
                        tilDato: null,
                        bostatus: Bostatuskode.MED_FORELDER,
                    },
                ],
            },
        ];
        const expectedResult = [
            {
                ident: IdentUtils.generateFnr(),
                navn: "",
                perioder: [
                    {
                        datoFom: "2019-04-01",
                        datoTom: "2021-07-31",
                        bostatus: Bostatuskode.MED_FORELDER,
                        kilde: "offentlig",
                    },
                    {
                        datoFom: "2021-08-01",
                        datoTom: "2021-12-31",
                        bostatus: Bostatuskode.IKKE_MED_FORELDER,
                        kilde: "offentlig",
                    },
                    {
                        datoFom: "2022-01-01",
                        datoTom: null,
                        bostatus: Bostatuskode.MED_FORELDER,
                        kilde: "offentlig",
                    },
                ],
                medISaken: true,
            },
        ];
        const result = getBarnPerioderFromHusstandsListe(
            husstandsOpplysningerFraFolkRegistre,
            datoFom,
            barnMedISaken,
            TypeBehandling.FORSKUDD,
        );
        expect(result[0].perioder.length).equals(expectedResult[0].perioder.length);
        result.forEach((r, i) => {
            r.perioder.forEach((periode, j) => {
                expect(periode.datoFom).equals(expectedResult[i].perioder[j].datoFom);
                expect(periode.datoTom).equals(expectedResult[i].perioder[j].datoTom);
                expect(periode.bostatus).equals(expectedResult[i].perioder[j].bostatus);
            });
        });
    });

    it("should return an array with overlapping periods if there are overlaps", () => {
        const testPeriods = [
            { datoFom: "2022-01-01", datoTom: "2022-03-31" },
            { datoFom: "2022-03-01", datoTom: "2022-04-30" },
            { datoFom: "2022-04-01", datoTom: "2022-07-31" },
        ];
        const expectedResult = [
            ["2022-03-31", "2022-03-01"],
            ["2022-04-30", "2022-04-01"],
        ];
        const overlappingPeriods = checkOverlappingPeriods(testPeriods);
        expect(overlappingPeriods.length).equals(expectedResult.length);
        overlappingPeriods.forEach((periods, i) => {
            expect(periods[0]).equals(expectedResult[i][0]);
            expect(periods[1]).equals(expectedResult[i][1]);
        });
    });

    it("should return an array with overlapping periods if one of the periods that is not last has null as datoTom", () => {
        const testPeriods = [
            { datoFom: "2022-01-01", datoTom: "2022-03-31" },
            { datoFom: "2022-04-01", datoTom: null },
            { datoFom: "2022-05-01", datoTom: "2022-07-01" },
        ];
        const expectedResult = [["null", "2022-05-01"]];
        const overlappingPeriods = checkOverlappingPeriods(testPeriods);
        expect(overlappingPeriods.length).equals(expectedResult.length);
        overlappingPeriods.forEach((periods, i) => {
            expect(periods[0]).equals(expectedResult[i][0]);
            expect(periods[1]).equals(expectedResult[i][1]);
        });
    });

    it("should return an empty array with overlapping periods if the last period that has null as datoTom", () => {
        const testPeriods = [
            { datoFom: "2022-01-01", datoTom: "2022-03-31" },
            { datoFom: "2022-04-01", datoTom: "2022-04-30" },
            { datoFom: "2022-05-01", datoTom: null },
        ];
        const overlappingPeriods = checkOverlappingPeriods(testPeriods);
        expect(overlappingPeriods.length).equals(0);
    });

    it("compareOpplysninger should return empty array when there are no changes in the latest opplysninger", () => {
        const firstBarnsIdent = IdentUtils.generateFnr();
        const secondBarnsIdent = IdentUtils.generateFnr();
        const savedOpplysninger = {
            husstand: [
                {
                    ident: firstBarnsIdent,
                    navn: "AKTVERDIG ODDE",
                    perioder: [
                        {
                            fraDato: "2022-09-05T00:00:00.000Z",
                            tilDato: null,
                            bostatus: Bostatuskode.MED_FORELDER,
                        },
                    ],
                },
                {
                    ident: secondBarnsIdent,
                    navn: "EKSTRA FAMILIEBARNEHAGE",
                    perioder: [
                        {
                            fraDato: "2014-01-10T00:00:00.000Z",
                            tilDato: "2022-09-04T00:00:00.000Z",
                            bostatus: Bostatuskode.IKKE_MED_FORELDER,
                        },
                        {
                            fraDato: "2022-09-05T00:00:00.000Z",
                            tilDato: null,
                            bostatus: Bostatuskode.MED_FORELDER,
                        },
                    ],
                },
            ],
            sivilstand: [
                {
                    gyldigFom: "1985-06-20",
                    type: SivilstandskodePDL.SEPARERT,
                },
                {
                    gyldigFom: "2023-07-04",
                    type: SivilstandskodePDL.SEPARERT,
                },
            ],
        };
        const latestOpplysninger = {
            husstand: [
                {
                    ident: firstBarnsIdent,
                    navn: "AKTVERDIG ODDE",
                    perioder: [
                        {
                            fraDato: new Date("2022-09-05T00:00:00.000Z"),
                            tilDato: null,
                            bostatus: Bostatuskode.MED_FORELDER,
                        },
                    ],
                },
                {
                    ident: secondBarnsIdent,
                    navn: "EKSTRA FAMILIEBARNEHAGE",
                    perioder: [
                        {
                            fraDato: new Date("2014-01-10T00:00:00.000Z"),
                            tilDato: new Date("2022-09-04T00:00:00.000Z"),
                            bostatus: Bostatuskode.IKKE_MED_FORELDER,
                        },
                        {
                            fraDato: new Date("2022-09-05T00:00:00.000Z"),
                            tilDato: null,
                            bostatus: Bostatuskode.MED_FORELDER,
                        },
                    ],
                },
            ],
            sivilstand: [
                {
                    gyldigFom: "1985-06-20",
                    type: SivilstandskodePDL.SEPARERT,
                },
                {
                    gyldigFom: "2023-07-04",
                    type: SivilstandskodePDL.SEPARERT,
                },
            ],
        };
        const result = compareOpplysninger(savedOpplysninger, latestOpplysninger);
        expect(result.length).equals(0);
    });

    it("compareOpplysninger should return an array with changes for husstand per child when there are changes in the latest opplysninger", () => {
        const firstBarnsIdent = IdentUtils.generateFnr();
        const secondBarnsIdent = IdentUtils.generateFnr();
        const savedOpplysninger = {
            husstand: [
                {
                    ident: firstBarnsIdent,
                    navn: "AKTVERDIG ODDE",
                    perioder: [
                        {
                            fraDato: "2022-09-05T00:00:00.000Z",
                            tilDato: null,
                            bostatus: Bostatuskode.MED_FORELDER,
                        },
                    ],
                },
                {
                    ident: secondBarnsIdent,
                    navn: "EKSTRA FAMILIEBARNEHAGE",
                    perioder: [
                        {
                            fraDato: "2014-01-10T00:00:00.000Z",
                            tilDato: "2022-09-04T00:00:00.000Z",
                            bostatus: Bostatuskode.IKKE_MED_FORELDER,
                        },
                        {
                            fraDato: "2022-09-05T00:00:00.000Z",
                            tilDato: null,
                            bostatus: Bostatuskode.MED_FORELDER,
                        },
                    ],
                },
            ],
            sivilstand: [
                {
                    gyldigFom: "1985-06-20",
                    type: SivilstandskodePDL.SEPARERT,
                },
                {
                    gyldigFom: "2023-07-04",
                    type: SivilstandskodePDL.SEPARERT,
                },
            ],
        };
        const latestOpplysninger = {
            husstand: [
                {
                    ident: firstBarnsIdent,
                    navn: "AKTVERDIG ODDE",
                    perioder: [
                        {
                            fraDato: new Date("2022-09-05T00:00:00.000Z"),
                            tilDato: new Date("2022-10-07T00:00:00.000Z"),
                            bostatus: Bostatuskode.IKKE_MED_FORELDER,
                        },
                        {
                            fraDato: new Date("2022-10-08T00:00:00.000Z"),
                            tilDato: null,
                            bostatus: Bostatuskode.MED_FORELDER,
                        },
                    ],
                },
                {
                    ident: secondBarnsIdent,
                    navn: "EKSTRA FAMILIEBARNEHAGE",
                    perioder: [
                        {
                            fraDato: new Date("2014-01-10T00:00:00.000Z"),
                            tilDato: new Date("2022-09-04T00:00:00.000Z"),
                            bostatus: Bostatuskode.IKKE_MED_FORELDER,
                        },
                        {
                            fraDato: new Date("2022-09-05T00:00:00.000Z"),
                            tilDato: null,
                            bostatus: Bostatuskode.MED_FORELDER,
                        },
                    ],
                },
            ],
            sivilstand: [
                {
                    gyldigFom: "1985-06-20",
                    type: SivilstandskodePDL.SEPARERT,
                },
                {
                    gyldigFom: "2023-07-04",
                    type: SivilstandskodePDL.SEPARERT,
                },
            ],
        };
        const result = compareOpplysninger(savedOpplysninger, latestOpplysninger);
        expect(result.length).equals(1);
        expect(result[0]).equals(`En eller flere perioder har blitt endret for barn med ident - ${firstBarnsIdent}`);
    });

    it("compareOpplysninger should return an array with changes for husstand per child and sivilstand when there are changes in the latest opplysninger", () => {
        const firstBarnsIdent = IdentUtils.generateFnr();
        const secondBarnsIdent = IdentUtils.generateFnr();
        const savedOpplysninger = {
            husstand: [
                {
                    ident: firstBarnsIdent,
                    navn: "AKTVERDIG ODDE",
                    perioder: [
                        {
                            fraDato: "2022-09-05T00:00:00.000Z",
                            tilDato: null,
                            bostatus: Bostatuskode.MED_FORELDER,
                        },
                    ],
                },
                {
                    ident: secondBarnsIdent,
                    navn: "EKSTRA FAMILIEBARNEHAGE",
                    perioder: [
                        {
                            fraDato: "2014-01-10T00:00:00.000Z",
                            tilDato: "2022-09-04T00:00:00.000Z",
                            bostatus: Bostatuskode.IKKE_MED_FORELDER,
                        },
                        {
                            fraDato: "2022-09-05T00:00:00.000Z",
                            tilDato: null,
                            bostatus: Bostatuskode.MED_FORELDER,
                        },
                    ],
                },
            ],
            sivilstand: [
                {
                    gyldigFom: "1985-06-20",
                    type: SivilstandskodePDL.SEPARERT,
                },
                {
                    gyldigFom: "2023-07-05",
                    type: SivilstandskodePDL.SEPARERT,
                },
                {
                    gyldigFom: "2023-10-05",
                    type: SivilstandskodePDL.SEPARERT,
                },
            ],
        };
        const latestOpplysninger = {
            husstand: [
                {
                    ident: firstBarnsIdent,
                    navn: "AKTVERDIG ODDE",
                    perioder: [
                        {
                            fraDato: new Date("2022-09-05T00:00:00.000Z"),
                            tilDato: new Date("2022-10-07T00:00:00.000Z"),
                            bostatus: Bostatuskode.IKKE_MED_FORELDER,
                        },
                        {
                            fraDato: new Date("2022-10-08T00:00:00.000Z"),
                            tilDato: null,
                            bostatus: Bostatuskode.MED_FORELDER,
                        },
                    ],
                },
                {
                    ident: secondBarnsIdent,
                    navn: "EKSTRA FAMILIEBARNEHAGE",
                    perioder: [
                        {
                            fraDato: new Date("2014-01-10T00:00:00.000Z"),
                            tilDato: new Date("2022-09-04T00:00:00.000Z"),
                            bostatus: Bostatuskode.IKKE_MED_FORELDER,
                        },
                        {
                            fraDato: new Date("2022-09-05T00:00:00.000Z"),
                            tilDato: null,
                            bostatus: Bostatuskode.MED_FORELDER,
                        },
                    ],
                },
            ],
            sivilstand: [
                {
                    gyldigFom: "1985-06-20",
                    type: SivilstandskodePDL.SEPARERT,
                },
                {
                    gyldigFom: "2023-07-04",
                    type: SivilstandskodePDL.SEPARERT,
                },
            ],
        };
        const result = compareOpplysninger(savedOpplysninger, latestOpplysninger);
        expect(result.length).equals(2);
        expect(result[0]).equals(`En eller flere perioder har blitt endret for barn med ident - ${firstBarnsIdent}`);
        expect(result[1]).equals("Antall sivilstandsperioder har blitt endret i Folkeregisteret");
    });

    it("compareOpplysninger should return an array with changes for sivilstand status when there are changes in the latest opplysninger", () => {
        const firstBarnsIdent = IdentUtils.generateFnr();
        const secondBarnsIdent = IdentUtils.generateFnr();
        const savedOpplysninger = {
            husstand: [
                {
                    ident: firstBarnsIdent,
                    navn: "AKTVERDIG ODDE",
                    perioder: [
                        {
                            fraDato: "2022-09-05T00:00:00.000Z",
                            tilDato: null,
                            bostatus: Bostatuskode.MED_FORELDER,
                        },
                    ],
                },
                {
                    ident: secondBarnsIdent,
                    navn: "EKSTRA FAMILIEBARNEHAGE",
                    perioder: [
                        {
                            fraDato: "2014-01-10T00:00:00.000Z",
                            tilDato: "2022-09-04T00:00:00.000Z",
                            bostatus: Bostatuskode.IKKE_MED_FORELDER,
                        },
                        {
                            fraDato: "2022-09-05T00:00:00.000Z",
                            tilDato: null,
                            bostatus: Bostatuskode.MED_FORELDER,
                        },
                    ],
                },
            ],
            sivilstand: [
                {
                    gyldigFom: "1985-06-20",
                    type: SivilstandskodePDL.SEPARERT,
                },
                {
                    gyldigFom: "2023-07-04",
                    type: SivilstandskodePDL.SEPARERT,
                },
            ],
        };
        const latestOpplysninger = {
            husstand: [
                {
                    ident: firstBarnsIdent,
                    navn: "AKTVERDIG ODDE",
                    perioder: [
                        {
                            fraDato: new Date("2022-09-05T00:00:00.000Z"),
                            tilDato: new Date("2022-10-07T00:00:00.000Z"),
                            bostatus: Bostatuskode.IKKE_MED_FORELDER,
                        },
                        {
                            fraDato: new Date("2022-10-08T00:00:00.000Z"),
                            tilDato: null,
                            bostatus: Bostatuskode.MED_FORELDER,
                        },
                    ],
                },
                {
                    ident: secondBarnsIdent,
                    navn: "EKSTRA FAMILIEBARNEHAGE",
                    perioder: [
                        {
                            fraDato: new Date("2014-01-10T00:00:00.000Z"),
                            tilDato: new Date("2022-09-04T00:00:00.000Z"),
                            bostatus: Bostatuskode.IKKE_MED_FORELDER,
                        },
                        {
                            fraDato: new Date("2022-09-05T00:00:00.000Z"),
                            tilDato: null,
                            bostatus: Bostatuskode.MED_FORELDER,
                        },
                    ],
                },
            ],
            sivilstand: [
                {
                    gyldigFom: "1985-06-20",
                    type: SivilstandskodePDL.SKILT,
                },
                {
                    gyldigFom: "2023-07-04",
                    type: SivilstandskodePDL.GIFT,
                },
            ],
        };
        const result = compareOpplysninger(savedOpplysninger, latestOpplysninger);
        expect(result.length).equals(2);
        expect(result[0]).equals(`En eller flere perioder har blitt endret for barn med ident - ${firstBarnsIdent}`);
        expect(result[1]).equals("En eller flere sivilstandsperioder har blitt endret");
    });

    it("should remove all periods after edited period if edited period has no datoTom", () => {
        const testPeriods = [
            {
                datoFom: "2022-04-01",
                datoTom: "2022-04-30",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-05-01",
                datoTom: null,
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
            {
                datoFom: "2022-06-01",
                datoTom: "2022-06-30",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-07-01",
                datoTom: "2022-07-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
        ];

        const expectedResult = [
            {
                datoFom: "2022-04-01",
                datoTom: "2022-04-30",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-05-01",
                datoTom: null,
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
        ];

        const updatedPeriods = editPeriods(testPeriods, 1, TypeBehandling.FORSKUDD);
        expect(updatedPeriods.length).equals(2);
        updatedPeriods.forEach((period, index) => {
            expect(period.datoFom).equals(expectedResult[index].datoFom);
            expect(period.datoTom).equals(expectedResult[index].datoTom);
            expect(period.bostatus).equals(expectedResult[index].bostatus);
        });
    });

    it("should only have edited period if all periods are after it and edited has no datoTom", () => {
        const testPeriods = [
            {
                datoFom: "2022-04-01",
                datoTom: "2022-04-30",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-05-01",
                datoTom: "2022-05-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-03-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
            {
                datoFom: "2022-07-01",
                datoTom: "2022-07-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
        ];

        const expectedResult = [
            {
                datoFom: "2022-03-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
        ];

        const updatedPeriods = editPeriods(testPeriods, 2, TypeBehandling.FORSKUDD);
        expect(updatedPeriods.length).equals(1);
        expect(updatedPeriods[0].datoFom).equals(expectedResult[0].datoFom);
        expect(updatedPeriods[0].datoTom).equals(expectedResult[0].datoTom);
        expect(updatedPeriods[0].bostatus).equals(expectedResult[0].bostatus);
        expect(updatedPeriods[0].kilde).equals(expectedResult[0].kilde);
    });

    it("should remove all periods that overlap with editedPeriod and merge the ones that have same status", () => {
        const testPeriods = [
            {
                datoFom: "2022-04-01",
                datoTom: "2022-04-30",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-05-01",
                datoTom: "2022-05-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-06-01",
                datoTom: "2022-06-30",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-07-01",
                datoTom: "2022-07-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-08-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-05-01",
                datoTom: "2022-07-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
        ];

        const expectedResult = [
            {
                datoFom: "2022-04-01",
                datoTom: "2022-04-30",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-05-01",
                datoTom: "2022-07-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
            {
                datoFom: "2022-08-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
        ];

        const updatedPeriods = editPeriods(testPeriods, 5, TypeBehandling.FORSKUDD);
        expect(updatedPeriods.length).equals(expectedResult.length);
        updatedPeriods.forEach((period, index) =>
            expect(JSON.stringify(period)).equals(JSON.stringify(expectedResult[index])),
        );
    });

    it("should modify all periods that overlap with editedPeriod and merge the ones that have the same status", () => {
        const testPeriods = [
            {
                datoFom: "2022-04-01",
                datoTom: "2022-04-30",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-05-01",
                datoTom: "2022-05-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-06-01",
                datoTom: "2022-06-30",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-07-01",
                datoTom: "2022-07-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-08-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-05-01",
                datoTom: "2022-07-31",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
        ];

        const expectedResult = [
            {
                datoFom: "2022-04-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
        ];

        const updatedPeriods = editPeriods(testPeriods, 5, TypeBehandling.FORSKUDD);
        expect(updatedPeriods.length).equals(expectedResult.length);
        updatedPeriods.forEach((period, index) =>
            expect(JSON.stringify(period)).equals(JSON.stringify(expectedResult[index])),
        );
    });

    it("should modify dates and kilde for periods that overlap with editedPeriod", () => {
        const testPeriods = [
            {
                datoFom: "2022-04-01",
                datoTom: "2022-05-31",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-06-01",
                datoTom: "2022-07-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-08-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-05-01",
                datoTom: "2022-06-30",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
        ];

        const expectedResult = [
            {
                datoFom: "2022-04-01",
                datoTom: "2022-06-30",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
            {
                datoFom: "2022-07-01",
                datoTom: "2022-07-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
            {
                datoFom: "2022-08-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
        ];

        const updatedPeriods = editPeriods(testPeriods, 3, TypeBehandling.FORSKUDD);
        expect(updatedPeriods.length).equals(expectedResult.length);
        updatedPeriods.forEach((period, index) =>
            expect(JSON.stringify(period)).equals(JSON.stringify(expectedResult[index])),
        );
    });

    it("should only modify adjacent periods dates if edited period is in the middle and only dates are changed", () => {
        const testPeriods = [
            {
                datoFom: "2022-04-01",
                datoTom: "2022-05-31",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-05-01",
                datoTom: "2022-08-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
            {
                datoFom: "2022-08-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
        ];

        const expectedResult = [
            {
                datoFom: "2022-04-01",
                datoTom: "2022-04-30",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
            {
                datoFom: "2022-05-01",
                datoTom: "2022-08-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
            {
                datoFom: "2022-09-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
        ];

        const updatedPeriods = editPeriods(testPeriods, 1, TypeBehandling.FORSKUDD);
        expect(updatedPeriods.length).equals(expectedResult.length);
        updatedPeriods.forEach((period, index) =>
            expect(JSON.stringify(period)).equals(JSON.stringify(expectedResult[index])),
        );
    });

    it("should modify and merge adjacent periods if edited period is in the middle and status is changed", () => {
        const testPeriods = [
            {
                datoFom: "2022-04-01",
                datoTom: "2022-05-31",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-05-01",
                datoTom: "2022-08-31",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
            {
                datoFom: "2022-08-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
        ];

        const expectedResult = [
            {
                datoFom: "2022-04-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
        ];

        const updatedPeriods = editPeriods(testPeriods, 1, TypeBehandling.FORSKUDD);
        expect(updatedPeriods.length).equals(expectedResult.length);
        updatedPeriods.forEach((period, index) =>
            expect(JSON.stringify(period)).equals(JSON.stringify(expectedResult[index])),
        );
    });

    it("should change kilde to manuelt to all periods edited by a change", () => {
        const testPeriods = [
            {
                datoFom: "2022-04-01",
                datoTom: "2022-05-31",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-05-01",
                datoTom: "2022-08-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-08-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
        ];

        const expectedResult = [
            {
                datoFom: "2022-04-01",
                datoTom: "2022-04-30",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
            {
                datoFom: "2022-05-01",
                datoTom: "2022-08-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
            {
                datoFom: "2022-09-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
        ];

        const updatedPeriods = editPeriods(testPeriods, 1, TypeBehandling.FORSKUDD);
        expect(updatedPeriods.length).equals(expectedResult.length);
        updatedPeriods.forEach((period, index) =>
            expect(JSON.stringify(period)).equals(JSON.stringify(expectedResult[index])),
        );
    });

    it("should remove all periods where datoFom is equal or bigger than new period datoFom", () => {
        const testPeriods = [
            {
                datoFom: "2021-04-01",
                datoTom: "2021-07-31",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2021-08-01",
                datoTom: "2021-12-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
            {
                datoFom: "2022-01-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2021-08-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
        ];

        const expectedResult = [
            {
                datoFom: "2021-04-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
        ];

        const updatedPeriods = editPeriods(testPeriods, 3, TypeBehandling.FORSKUDD);

        expect(updatedPeriods.length).equals(expectedResult.length);
        updatedPeriods.forEach((period, index) =>
            expect(JSON.stringify(period)).equals(JSON.stringify(expectedResult[index])),
        );
    });

    it("should split a period in 3 parts if edited period has different status and datoFom and datoTom in a period", () => {
        const testPeriods = [
            {
                datoFom: "2021-04-01",
                datoTom: "2021-07-31",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2021-08-01",
                datoTom: "2021-12-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-01-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2021-09-01",
                datoTom: "2021-10-31",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
        ];

        const expectedResult = [
            {
                datoFom: "2021-04-01",
                datoTom: "2021-07-31",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2021-08-01",
                datoTom: "2021-08-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
            {
                datoFom: "2021-09-01",
                datoTom: "2021-10-31",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
            {
                datoFom: "2021-11-01",
                datoTom: "2021-12-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
            {
                datoFom: "2022-01-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
        ];

        const updatedPeriods = editPeriods(testPeriods, 3, TypeBehandling.FORSKUDD);

        expect(updatedPeriods.length).equals(expectedResult.length);
        updatedPeriods.forEach((period, index) =>
            expect(JSON.stringify(period)).equals(JSON.stringify(expectedResult[index])),
        );
    });

    it("should edit first period", () => {
        const testPeriods = [
            {
                datoFom: "2021-04-01",
                datoTom: "2021-08-31",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2021-08-01",
                datoTom: "2021-12-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-01-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
        ];

        const expectedResult = [
            {
                datoFom: "2021-04-01",
                datoTom: "2021-08-31",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
            {
                datoFom: "2021-09-01",
                datoTom: "2021-12-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
            {
                datoFom: "2022-01-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
        ];

        const updatedPeriods = editPeriods(testPeriods, 0, TypeBehandling.FORSKUDD);

        expect(updatedPeriods.length).equals(expectedResult.length);
        updatedPeriods.forEach((period, index) =>
            expect(JSON.stringify(period)).equals(JSON.stringify(expectedResult[index])),
        );
    });

    it("should edit first period and merge", () => {
        const testPeriods = [
            {
                datoFom: "2021-04-01",
                datoTom: "2021-12-31",
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2021-08-01",
                datoTom: "2021-12-31",
                bostatus: Bostatuskode.IKKE_MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
            {
                datoFom: "2022-01-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.OFFENTLIG,
            },
        ];

        const expectedResult = [
            {
                datoFom: "2021-04-01",
                datoTom: null,
                bostatus: Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            },
        ];

        const updatedPeriods = editPeriods(testPeriods, 0, TypeBehandling.FORSKUDD);

        expect(updatedPeriods.length).equals(expectedResult.length);
        updatedPeriods.forEach((period, index) =>
            expect(JSON.stringify(period)).equals(JSON.stringify(expectedResult[index])),
        );
    });

    it.skip("should map to a correct type and build sivilstand perioder", () => {
        const sivilstandListe: SivilstandGrunnlagDto[] = [
            {
                personId: IdentUtils.generateFnr(),
                gyldigFom: "2018-04-14",
                type: SivilstandskodePDL.GIFT,
            },
            {
                personId: IdentUtils.generateFnr(),
                gyldigFom: "2023-09-19",
                type: SivilstandskodePDL.SEPARERT,
            },
        ];

        const expectedResult = [
            {
                sivilstand: "GIFT_SAMBOER",
                datoFom: "2019-05-01",
                datoTom: "2023-08-31",
                kilde: "OFFENTLIG",
            },
            {
                sivilstand: "BOR_ALENE_MED_BARN",
                datoFom: "2023-09-01",
                datoTom: null,
                kilde: "OFFENTLIG",
            },
        ];

        const sivilstandPerioderWithNarrowedStatus = mapGrunnlagSivilstandToBehandlingSivilstandType(sivilstandListe);
        const sivilstandPerioder = getSivilstandPerioder(sivilstandPerioderWithNarrowedStatus, new Date("2019-05-01"));

        expect(sivilstandPerioder.length).equals(expectedResult.length);
        sivilstandPerioder.forEach((period, index) =>
            expect(JSON.stringify(period)).equals(JSON.stringify(expectedResult[index])),
        );
    });

    it.skip("should map to a correct type and merge sivilstand perioder with same status", () => {
        const sivilstandListe: SivilstandGrunnlagDto[] = [
            {
                personId: IdentUtils.generateFnr(),
                gyldigFom: "2018-04-14",
                type: SivilstandskodePDL.GIFT,
            },
            {
                personId: IdentUtils.generateFnr(),
                gyldigFom: "2021-09-19",
                type: SivilstandskodePDL.REGISTRERT_PARTNER,
            },
            {
                personId: IdentUtils.generateFnr(),
                gyldigFom: "2021-11-15",
                type: SivilstandskodePDL.SEPARERT,
            },
            {
                personId: IdentUtils.generateFnr(),
                gyldigFom: "2022-04-03",
                type: SivilstandskodePDL.ENKE_ELLER_ENKEMANN,
            },
            {
                personId: IdentUtils.generateFnr(),
                gyldigFom: "2022-04-03",
                type: SivilstandskodePDL.SKILT,
            },
            {
                personId: IdentUtils.generateFnr(),
                gyldigFom: "2022-07-31",
                type: SivilstandskodePDL.SEPARERT,
            },
            {
                personId: IdentUtils.generateFnr(),
                gyldigFom: "2022-09-15",
                type: SivilstandskodePDL.REGISTRERT_PARTNER,
            },
        ];

        const expectedResult = [
            {
                sivilstand: "GIFT_SAMBOER",
                datoFom: "2019-05-01",
                datoTom: null,
                kilde: "OFFENTLIG",
            },
            {
                sivilstand: "BOR_ALENE_MED_BARN",
                datoFom: "2021-11-01",
                datoTom: null,
                kilde: "OFFENTLIG",
            },
            {
                sivilstand: "GIFT_SAMBOER",
                datoFom: "2022-09-01",
                datoTom: null,
                kilde: "OFFENTLIG",
            },
        ];

        const sivilstandPerioderWithNarrowedStatus = mapGrunnlagSivilstandToBehandlingSivilstandType(sivilstandListe);
        const sivilstandPerioder = getSivilstandPerioder(sivilstandPerioderWithNarrowedStatus, new Date("2019-05-01"));

        expect(sivilstandPerioder.length).equals(expectedResult.length);
        sivilstandPerioder.forEach((period, index) =>
            expect(JSON.stringify(period)).equals(JSON.stringify(expectedResult[index])),
        );
    });

    it.skip("should set virkningsdato if null is set on first sivilstand period periodeFra date", () => {
        const personId = IdentUtils.generateFnr();
        const sivilstandListe: SivilstandGrunnlagDto[] = [
            {
                personId,
                gyldigFom: null,
                type: SivilstandskodePDL.GIFT,
            },
            {
                personId,
                gyldigFom: "2021-09-19",
                type: SivilstandskodePDL.REGISTRERT_PARTNER,
            },
            {
                personId,
                gyldigFom: "2021-11-15",
                type: SivilstandskodePDL.SEPARERT,
            },
            {
                personId,
                gyldigFom: "2022-04-03",
                type: SivilstandskodePDL.ENKE_ELLER_ENKEMANN,
            },
            {
                personId,
                gyldigFom: "2022-04-03",
                type: SivilstandskodePDL.ENKE_ELLER_ENKEMANN,
            },
            {
                personId,
                gyldigFom: "2022-07-31",
                type: SivilstandskodePDL.SEPARERT_PARTNER,
            },
            {
                personId,
                gyldigFom: "2022-09-15",
                type: SivilstandskodePDL.REGISTRERT_PARTNER,
            },
        ];

        const expectedResult = [
            {
                sivilstand: "GIFT_SAMBOER",
                datoFom: "2019-05-01",
                datoTom: null,
                kilde: "OFFENTLIG",
            },
            {
                sivilstand: "BOR_ALENE_MED_BARN",
                datoFom: "2021-11-01",
                datoTom: null,
                kilde: "OFFENTLIG",
            },
            {
                sivilstand: "GIFT_SAMBOER",
                datoFom: "2022-09-01",
                datoTom: null,
                kilde: "OFFENTLIG",
            },
        ];

        const sivilstandPerioderWithNarrowedStatus = mapGrunnlagSivilstandToBehandlingSivilstandType(sivilstandListe);
        const sivilstandPerioder = getSivilstandPerioder(sivilstandPerioderWithNarrowedStatus, new Date("2019-05-01"));

        expect(sivilstandPerioder.length).equals(expectedResult.length);
        sivilstandPerioder.forEach((period, index) =>
            expect(JSON.stringify(period)).equals(JSON.stringify(expectedResult[index])),
        );
    });

    it("should merge sivilstand perioder with same status", () => {
        const personId = IdentUtils.generateFnr();
        const sivilstandListe: SivilstandGrunnlagDto[] = [
            {
                personId,
                gyldigFom: "1966-08-27",
                type: SivilstandskodePDL.UGIFT,
            },
            {
                personId,
                gyldigFom: "2023-06-21",
                type: SivilstandskodePDL.UGIFT,
            },
        ];

        const expectedResult = [
            {
                sivilstand: "BOR_ALENE_MED_BARN",
                datoFom: "2022-01-12",
                datoTom: null,
                kilde: "OFFENTLIG",
            },
        ];

        const sivilstandPerioderWithNarrowedStatus = mapGrunnlagSivilstandToBehandlingSivilstandType(sivilstandListe);
        const sivilstandPerioder = getSivilstandPerioder(sivilstandPerioderWithNarrowedStatus, new Date("2022-01-12"));

        expect(sivilstandPerioder.length).equals(expectedResult.length);
        sivilstandPerioder.forEach((period, index) =>
            expect(JSON.stringify(period)).equals(JSON.stringify(expectedResult[index])),
        );
    });
});
