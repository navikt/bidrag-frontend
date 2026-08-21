import { type InntekterDtoRolle, Rolletype } from "@bidrag/api/BidragBehandlingApiV1";
import { transformInntekt } from "../../../../common/helpers/inntektFormHelpers";
import type { InntektFormValues } from "../../../../common/types/inntektFormValues";

export const createInitialForskuddInntektValues = (
    inntekter: InntekterDtoRolle[],
    virkningsdato: Date,
    _erBisysVedtak: boolean,
): InntektFormValues => {
    const transformFn = transformInntekt(virkningsdato);
    const bmInntekt = inntekter.find((inntektRolle) => inntektRolle.gjelder.rolletype === Rolletype.BM);

    return {
        årsinntekter: inntekter.reduce(
            (acc, inntektRolle) => ({
                ...acc,
                [inntektRolle.gjelder.id]: inntektRolle.inntekter.årsinntekter.map(transformFn),
            }),
            {},
        ),
        barnetillegg: inntekter.reduce(
            (acc, inntektRolle) => ({
                ...acc,
                [inntektRolle.gjelder.id]: inntektRolle.inntekter.barnetillegg.reduce(
                    (acc, inntektBarn) => ({
                        ...acc,
                        [inntektBarn.gjelderBarn.id]: inntektBarn.inntekter.map(transformFn),
                    }),
                    {},
                ),
            }),
            {},
        ),
        kontantstøtte: inntekter.reduce(
            (acc, inntektRolle) => ({
                ...acc,
                [inntektRolle.gjelder.id]: inntektRolle.inntekter.kontantstøtte.reduce(
                    (acc, inntektBarn) => ({
                        ...acc,
                        [inntektBarn.gjelderBarn.id]: inntektBarn.inntekter.map(transformFn),
                    }),
                    {},
                ),
            }),
            {},
        ),
        småbarnstillegg: inntekter.reduce(
            (acc, inntektRolle) => ({
                ...acc,
                [inntektRolle.gjelder.id]: inntektRolle.inntekter.småbarnstillegg.map(transformFn),
            }),
            {},
        ),
        utvidetBarnetrygd: inntekter.reduce(
            (acc, inntektRolle) => ({
                ...acc,
                [inntektRolle.gjelder.id]: inntektRolle.inntekter.utvidetBarnetrygd.map(transformFn),
            }),
            {},
        ),
        begrunnelser: {
            [bmInntekt.gjelder.id]: bmInntekt.inntekter.begrunnelse?.innhold ?? "",
        },
    };
};
