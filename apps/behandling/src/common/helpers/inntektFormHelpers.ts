import {
    InntektBelopstype,
    type InntektDtoV2,
    type InntekterDtoRolle,
    Inntektsrapportering,
    type InntektValideringsfeil,
    type InntektValideringsfeilV2Dto,
    Kilde,
    Rolletype,
    TypeBehandling,
} from "@bidrag/api/BidragBehandlingApiV1";
import { toISODateString } from "@bidrag/common";
import type { OppdatereInntektRequestLosnet } from "../../types/apiSpecFix";
import { firstDayOfMonth, isAfterDate, isAfterEqualsDate } from "../../utils/date-utils";
import type { InntektFormPeriode, InntektFormValues } from "../types/inntektFormValues";

export enum InntektTableType {
    SKATTEPLIKTIG = "SKATTEPLIKTIG",
    UTVIDET_BARNETRYGD = "UTVIDET_BARNETRYGD",
    SMÅBARNSTILLEGG = "SMÅBARNSTILLEGG",
    KONTANTSTØTTE = "KONTANTSTØTTE",
    BARNETILLEGG = "BARNETILLEGG",
    BEREGNET_INNTEKTER = "BEREGNET_INNTEKTER",
    TOTAL_INNTEKTER = "TOTAL_INNTEKTER",
}
export const inntekterTablesViewRules = {
    [TypeBehandling.BIDRAG]: {
        [Rolletype.BM]: [
            InntektTableType.SKATTEPLIKTIG,
            InntektTableType.BARNETILLEGG,
            InntektTableType.UTVIDET_BARNETRYGD,
            InntektTableType.SMÅBARNSTILLEGG,
            InntektTableType.KONTANTSTØTTE,
            InntektTableType.BEREGNET_INNTEKTER,
        ],
        [Rolletype.BP]: [
            InntektTableType.SKATTEPLIKTIG,
            InntektTableType.BARNETILLEGG,
            InntektTableType.BEREGNET_INNTEKTER,
        ],
        [Rolletype.BA]: [InntektTableType.SKATTEPLIKTIG, InntektTableType.BEREGNET_INNTEKTER],
    },
    [TypeBehandling.SAeRBIDRAG]: {
        [Rolletype.BM]: [
            InntektTableType.SKATTEPLIKTIG,
            InntektTableType.BARNETILLEGG,
            InntektTableType.UTVIDET_BARNETRYGD,
            InntektTableType.SMÅBARNSTILLEGG,
            InntektTableType.KONTANTSTØTTE,
            InntektTableType.BEREGNET_INNTEKTER,
        ],
        [Rolletype.BP]: [
            InntektTableType.SKATTEPLIKTIG,
            InntektTableType.BARNETILLEGG,
            InntektTableType.BEREGNET_INNTEKTER,
        ],
        [Rolletype.BA]: [InntektTableType.SKATTEPLIKTIG, InntektTableType.BEREGNET_INNTEKTER],
    },
    [TypeBehandling.FORSKUDD]: {
        [Rolletype.BM]: [
            InntektTableType.SKATTEPLIKTIG,
            InntektTableType.BARNETILLEGG,
            InntektTableType.UTVIDET_BARNETRYGD,
            InntektTableType.SMÅBARNSTILLEGG,
            InntektTableType.KONTANTSTØTTE,
            InntektTableType.BEREGNET_INNTEKTER,
        ],
        [Rolletype.BP]: [],
        [Rolletype.BA]: [InntektTableType.SKATTEPLIKTIG],
    },
};

export const ekplisitteYtelser = [
    Inntektsrapportering.KONTANTSTOTTE,
    Inntektsrapportering.UTVIDET_BARNETRYGD,
    Inntektsrapportering.SMABARNSTILLEGG,
    Inntektsrapportering.BARNETILLEGG,
];

export const manuelleInntekterValg = {
    [TypeBehandling.FORSKUDD]: [
        Inntektsrapportering.LONNMANUELTBEREGNET,
        Inntektsrapportering.KAPITALINNTEKT_EGNE_OPPLYSNINGER,
        Inntektsrapportering.PERSONINNTEKT_EGNE_OPPLYSNINGER,
        Inntektsrapportering.SAKSBEHANDLER_BEREGNET_INNTEKT,
        Inntektsrapportering.NAeRINGSINNTEKTMANUELTBEREGNET,
        Inntektsrapportering.YTELSE_FRA_OFFENTLIG_MANUELT_BEREGNET,
    ],
    [TypeBehandling.SAeRBIDRAG]: [
        Inntektsrapportering.LONNMANUELTBEREGNET,
        Inntektsrapportering.KAPITALINNTEKT_EGNE_OPPLYSNINGER,
        Inntektsrapportering.PERSONINNTEKT_EGNE_OPPLYSNINGER,
        Inntektsrapportering.SAKSBEHANDLER_BEREGNET_INNTEKT,
        Inntektsrapportering.NAeRINGSINNTEKTMANUELTBEREGNET,
        Inntektsrapportering.YTELSE_FRA_OFFENTLIG_MANUELT_BEREGNET,
        Inntektsrapportering.SKJONNMANGLENDEBRUKAVEVNE,
        Inntektsrapportering.SKJONNMANGLERDOKUMENTASJON,
    ],
    [TypeBehandling.BIDRAG]: [
        Inntektsrapportering.LONNMANUELTBEREGNET,
        Inntektsrapportering.KAPITALINNTEKT_EGNE_OPPLYSNINGER,
        Inntektsrapportering.PERSONINNTEKT_EGNE_OPPLYSNINGER,
        Inntektsrapportering.SAKSBEHANDLER_BEREGNET_INNTEKT,
        Inntektsrapportering.NAeRINGSINNTEKTMANUELTBEREGNET,
        Inntektsrapportering.YTELSE_FRA_OFFENTLIG_MANUELT_BEREGNET,
        Inntektsrapportering.SKJONNMANGLENDEBRUKAVEVNE,
        Inntektsrapportering.SKJONNMANGLERDOKUMENTASJON,
    ],
};
export const transformInntekt =
    (virkningsdato: Date) =>
    (inntekt: InntektDtoV2): InntektFormPeriode => {
        return {
            ...inntekt,
            angittPeriode: {
                fom: inntekt.datoFom ?? toISODateString(virkningsdato),
                til: inntekt.datoTom ?? null,
            },
            datoFom:
                inntekt.datoFom ??
                (ekplisitteYtelser.includes(inntekt.rapporteringstype) &&
                isAfterDate(inntekt.opprinneligFom, virkningsdato)
                    ? inntekt.opprinneligFom
                    : toISODateString(virkningsdato)),
            datoTom:
                inntekt.datoTom ??
                (ekplisitteYtelser.includes(inntekt.rapporteringstype) && inntekt.opprinneligTom
                    ? inntekt.opprinneligTom
                    : null),
            inntektstype: inntekt.inntektstyper.length ? inntekt.inntektstyper[0] : "",
            beløpstype: inntekt.beløpstype,
            beløpMånedDagsats: inntekt.beløpMånedDagsats,
            skattesats: inntekt.skatteprosent,
            kanRedigeres:
                inntekt.kilde === Kilde.MANUELL ||
                (!ekplisitteYtelser.includes(inntekt.rapporteringstype) &&
                    !(
                        inntekt.kilde === Kilde.OFFENTLIG &&
                        isAfterEqualsDate(virkningsdato, firstDayOfMonth(new Date()))
                    )),
        };
    };

export const createInitialValues = (inntekter: InntekterDtoRolle[], virkningsdato: Date): InntektFormValues => {
    const transformFn = transformInntekt(virkningsdato);

    return {
        årsinntekter: inntekter.reduce(
            (acc, inntektRolle) => ({
                // biome-ignore lint/performance/noAccumulatingSpread: false positive
                ...acc,
                [inntektRolle.gjelder.id]: inntektRolle.inntekter.årsinntekter.map(transformFn),
            }),
            {},
        ),
        barnetillegg: inntekter.reduce(
            (acc, inntektRolle) => ({
                // biome-ignore lint/performance/noAccumulatingSpread: false positive
                ...acc,
                [inntektRolle.gjelder.id]: inntektRolle.inntekter.barnetillegg.reduce((acc, inntektBarn) => {
                    const barnetillegFraSammeSak =
                        inntektBarn.gjelderBarn.saksnummer === inntektRolle.gjelder.saksnummer;

                    if (barnetillegFraSammeSak) {
                        return {
                            // biome-ignore lint/performance/noAccumulatingSpread: false positive
                            ...acc,
                            [inntektBarn.gjelderBarn.id]: inntektBarn.inntekter.map(transformFn),
                        };
                    }
                    return acc;
                }, {}),
            }),
            {},
        ),
        kontantstøtte: inntekter.reduce(
            (acc, inntektRolle) => ({
                // biome-ignore lint/performance/noAccumulatingSpread: false positive
                ...acc,
                [inntektRolle.gjelder.id]: inntektRolle.inntekter.kontantstøtte.reduce((acc, inntektBarn) => {
                    const kontantstøtteFraSammeSak =
                        inntektBarn.gjelderBarn.saksnummer === inntektRolle.gjelder.saksnummer;

                    if (kontantstøtteFraSammeSak) {
                        return {
                            // biome-ignore lint/performance/noAccumulatingSpread: false positive
                            ...acc,
                            [inntektBarn.gjelderBarn.id]: inntektBarn.inntekter.map(transformFn),
                        };
                    }
                    return acc;
                }, {}),
            }),
            {},
        ),
        småbarnstillegg: inntekter.reduce(
            (acc, inntektRolle) => ({
                // biome-ignore lint/performance/noAccumulatingSpread: false positive
                ...acc,
                [inntektRolle.gjelder.id]: inntektRolle.inntekter.småbarnstillegg.map(transformFn),
            }),
            {},
        ),
        utvidetBarnetrygd: inntekter.reduce(
            (acc, inntektRolle) => ({
                // biome-ignore lint/performance/noAccumulatingSpread: false positive
                ...acc,
                [inntektRolle.gjelder.id]: inntektRolle.inntekter.utvidetBarnetrygd.map(transformFn),
            }),
            {},
        ),
        begrunnelser: inntekter.reduce(
            (acc, inntektRolle) => ({
                // biome-ignore lint/performance/noAccumulatingSpread: false positive
                ...acc,
                [inntektRolle.gjelder.id]: inntektRolle.inntekter.begrunnelse?.innhold ?? "",
            }),
            {},
        ),
    };
};

export const createPayload = (periode: InntektFormPeriode, virkningsdato: Date): OppdatereInntektRequestLosnet => {
    const erOffentlig = periode.kilde === Kilde.OFFENTLIG;
    if (erOffentlig) {
        return {
            oppdatereInntektsperiode: {
                id: periode.id,
                skatteprosent: periode.skattesats,
                taMedIBeregning: periode.taMed,
                angittPeriode: !ekplisitteYtelser.includes(periode.rapporteringstype as Inntektsrapportering)
                    ? {
                          fom: periode.taMed ? periode.datoFom : toISODateString(virkningsdato),
                          til: periode.taMed ? periode.datoTom : null,
                      }
                    : null,
            },
        };
    }
    const finnBeløp = () => {
        if (periode.rapporteringstype === Inntektsrapportering.BARNETILLEGG) {
            return periode.beløpMånedDagsats;
        }
        return periode.beløp ?? 0;
    };
    return {
        oppdatereManuellInntekt: {
            id: periode.id,
            taMed: periode.taMed,
            type: periode.rapporteringstype as Inntektsrapportering,
            beløp: Number(finnBeløp()),
            datoFom: periode.datoFom,
            beløpstype: periode.beløpstype ?? InntektBelopstype.ValueARSBELOP,
            datoTom: periode.datoTom,
            ident: periode.ident,
            gjelderId: periode.gjelderRolleId,
            gjelderBarnId: periode.gjelderBarnId,
            gjelderBarn: periode.gjelderBarn,
            skatteprosent: periode.skattesats,
            inntektstype: periode.inntektstype ? periode.inntektstype : null,
        },
    };
};

export const checkForValidationErrors = (valideringsfeil: InntektValideringsfeil) => {
    return (
        !!valideringsfeil?.overlappendePerioder?.length ||
        valideringsfeil?.fremtidigPeriode ||
        !!valideringsfeil?.hullIPerioder?.length ||
        valideringsfeil?.manglerPerioder ||
        valideringsfeil?.perioderFørVirkningstidspunkt ||
        valideringsfeil?.ugyldigSluttPeriode ||
        valideringsfeil?.ingenLøpendePeriode ||
        valideringsfeil?.manglerSkatteprosent
    );
};
export const getSaksnummerForIdent = (
    roller: { ident?: string; rolletype: Rolletype; saksnummer?: string }[],
    ident: string,
) => roller.find((r) => r.ident === ident && r.rolletype === Rolletype.BA)?.saksnummer ?? "";

/**
 * Brukes til å filtrere bort personer/roller som ikke tilhører aktivt valgt saksnummer i
 * `BarnebidragSideMenu` (relevant for forholdsmessig fordeling, hvor en behandling kan
 * dekke flere saksnummer samtidig). Dersom `selectedSaksnummer` ikke er satt ennå
 * (f.eks. før `SakHeader` har rukket å synkronisere valgt sak), vises alle.
 * BP (bidragspliktig) er alltid del av alle saker i behandlingen, og filtreres derfor aldri bort.
 */
export const erDelAvValgtSaksnummer = (
    saksnummer: string | undefined | null,
    selectedSaksnummer?: string,
    rolletype?: Rolletype,
) => rolletype === Rolletype.BP || !selectedSaksnummer || saksnummer === selectedSaksnummer;

export const checkIfRolleHasValideringsfeil = (valideringsfeil?: InntektValideringsfeilV2Dto) => {
    return (
        valideringsfeil &&
        Object.values(valideringsfeil)?.some(
            (inntektValideringsfeil: InntektValideringsfeil[] | InntektValideringsfeil) => {
                if (Array.isArray(inntektValideringsfeil)) {
                    return inntektValideringsfeil.some((rolleInntektvalideringsfeil) =>
                        checkForValidationErrors(rolleInntektvalideringsfeil),
                    );
                } else {
                    return checkForValidationErrors(inntektValideringsfeil);
                }
            },
        )
    );
};

export const inntektPageHasValideringsFeil = (inntekter: InntekterDtoRolle[]) =>
    inntekter.some((inntektRolle) => checkIfRolleHasValideringsfeil(inntektRolle?.inntekter?.valideringsfeil));
