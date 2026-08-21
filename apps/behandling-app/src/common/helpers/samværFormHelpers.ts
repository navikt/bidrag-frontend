import {
    type SamvaerBarnDto,
    type SamvaerskalkulatorDetaljer,
    SamvaerskalkulatorFerietype,
    SamvaerskalkulatorNetterFrekvens,
    Samvaersklasse,
    type SamvaersperiodeDto,
} from "@bidrag/api/BidragBehandlingApiV1";

import type {
    SamværBarnformvalues,
    Samværformvalues,
    SamværPeriodeFormvalues,
    SamværskalkulatorFormValues,
} from "../types/samværFormValues";

export const createInitialValues = (samvær: SamvaerBarnDto[]): SamværBarnformvalues => {
    return samvær.reduce(
        (acc, barn) => ({
            ...acc,
            [barn.barn.id]: createSamværInitialValues(barn),
        }),
        {},
    );
};
export const createSamværInitialValues = (samvær: SamvaerBarnDto): Samværformvalues => {
    return {
        begrunnelse: samvær.begrunnelse.innhold,
        perioder: samvær.perioder.map((periode) => createSamværsperiodeInitialValues(periode)),
    };
};

export const createSamværsperiodeInitialValues = (periode: SamvaersperiodeDto): SamværPeriodeFormvalues => {
    return {
        id: periode.id ?? null,
        fom: periode.periode.fom,
        tom: periode.periode.tom ?? null,
        samværsklasse: periode.samværsklasse,
        beregning: createSamværskalkulatorInitialValues(periode),
    };
};

export const createSamværskalkulatorDefaultvalues = (): SamværskalkulatorFormValues => ({
    isSaved: false,
    regelmessigSamværNetter: null,
    gjennomsnittligSamværPerMåned: 0,
    samværsklasse: Samvaersklasse.SAMVAeRSKLASSE0,
    ferier: Object.values(SamvaerskalkulatorFerietype).reduce(
        (acc, ferietype) => ({
            ...acc,
            [ferietype as SamvaerskalkulatorFerietype]: {
                bidragsmottakerNetter: null,
                bidragspliktigNetter: null,
                frekvens:
                    ferietype === SamvaerskalkulatorFerietype.SOMMERFERIE
                        ? SamvaerskalkulatorNetterFrekvens.HVERTAR
                        : SamvaerskalkulatorNetterFrekvens.ANNETHVERTAR,
            },
        }),
        {},
    ),
});
export const createSamværskalkulatorInitialValues = (
    samværsperiode: SamvaersperiodeDto,
): SamværskalkulatorFormValues => {
    const samværskalkulatorBeregning = samværsperiode.beregning;
    if (samværskalkulatorBeregning === null || samværskalkulatorBeregning === undefined) {
        return createSamværskalkulatorDefaultvalues();
    }
    return {
        isSaved: true,
        regelmessigSamværNetter: samværskalkulatorBeregning?.regelmessigSamværNetter ?? null,
        samværsklasse: samværsperiode?.samværsklasse ?? null,
        gjennomsnittligSamværPerMåned: samværsperiode?.gjennomsnittligSamværPerMåned,
        ferier: samværskalkulatorBeregning?.ferier.reduce(
            (acc, ferie) => ({
                ...acc,
                [ferie.type as SamvaerskalkulatorFerietype]: {
                    bidragsmottakerNetter: ferie.bidragsmottakerNetter === 0 ? null : ferie.bidragsmottakerNetter,
                    bidragspliktigNetter: ferie.bidragspliktigNetter === 0 ? null : ferie.bidragspliktigNetter,
                    frekvens: ferie.frekvens,
                },
            }),
            {},
        ),
    };
};

export const mapToSamværskalkulatoDetaljer = (beregning?: SamværskalkulatorFormValues): SamvaerskalkulatorDetaljer => {
    if (!beregning || beregning.isSaved !== true) return null;
    return {
        regelmessigSamværNetter: beregning.regelmessigSamværNetter ?? 0,
        ferier: Object.entries(beregning.ferier).map(([ferietype, item]) => ({
            type: ferietype as SamvaerskalkulatorFerietype,
            bidragsmottakerNetter: item.bidragsmottakerNetter == null ? undefined : item.bidragsmottakerNetter,
            bidragspliktigNetter: item.bidragspliktigNetter == null ? undefined : item.bidragspliktigNetter,
            frekvens: item.frekvens,
        })),
    };
};
