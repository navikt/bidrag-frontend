import {
    GrunnlagInntektEndringstype,
    type IkkeAktivInntektDto,
    type InntektBarn,
    OpplysningerType,
} from "@bidrag/api/BidragBehandlingApiV1";
import { PersonNavn, RolleTag, type RolleTypeAbbreviation } from "@bidrag/common";
import { BodyShort, Box, Button, Heading } from "@navikt/ds-react";
import { Fragment } from "react";
import { useFormContext } from "react-hook-form";
import { formatterBeløp } from "../../../utils/number-utils";
import text from "../../constants/texts";
import { useBehandlingProvider } from "../../context/BehandlingContext";
import { transformInntekt } from "../../helpers/inntektFormHelpers";
import { useAktiveGrunnlagsdata, useGetBehandlingV2 } from "../../hooks/useApiData";
import { useVirkningsdato } from "../../hooks/useVirkningsdato";
import { hentVisningsnavn } from "../../hooks/useVisningsnavn";
import type { InntektFormValues } from "../../types/inntektFormValues";
import { BehandlingAlert } from "../BehandlingAlert";

import { useInntektTableProvider } from "./InntektTableContext";

const inntektTypeToOpplysningerMapper = {
    småbarnstillegg: OpplysningerType.SMABARNSTILLEGG,
    utvidetBarnetrygd: OpplysningerType.UTVIDET_BARNETRYGD,
    barnetillegg: OpplysningerType.BARNETILLEGG,
    kontantstøtte: OpplysningerType.KONTANTSTOTTE,
    årsinntekter: OpplysningerType.SKATTEPLIKTIGE_INNTEKTER,
};

type FieldName =
    | `småbarnstillegg.${string}`
    | `utvidetBarnetrygd.${string}`
    | `årsinntekter.${string}`
    | `barnetillegg.${string}.${string}`
    | `kontantstøtte.${string}.${string}`;

const FeilVedInnhentingAvOffentligData = ({ fieldName }: { fieldName: FieldName }) => {
    const { ident } = useInntektTableProvider();
    const { feilOppståttVedSisteGrunnlagsinnhenting } = useGetBehandlingV2();
    const { lesemodus } = useBehandlingProvider();
    const [inntektType] = fieldName.split(".");
    const feilVedInnhentingAvOffentligData = feilOppståttVedSisteGrunnlagsinnhenting?.some(
        (innhentingsFeil) =>
            ident === innhentingsFeil.rolle.ident &&
            innhentingsFeil.grunnlagsdatatype === inntektTypeToOpplysningerMapper[inntektType],
    );

    return (
        <>
            {!lesemodus && feilVedInnhentingAvOffentligData && (
                <BehandlingAlert variant="info">
                    <Heading size="small" level="3">
                        {text.alert.feilVedInnhentingAvOffentligData}
                    </Heading>
                    {text.feilVedInnhentingAvOffentligData}
                </BehandlingAlert>
            )}
        </>
    );
};

export const IkkeAktiverteOpplysninger = ({ fieldName }: { fieldName: FieldName }) => {
    const { ident } = useInntektTableProvider();
    const { ikkeAktiverteEndringerIGrunnlagsdata, roller } = useGetBehandlingV2();
    const aktiverGrunnlagFn = useAktiveGrunnlagsdata();
    const virkningsdato = useVirkningsdato();
    const { lesemodus, setSaveErrorState, selectedRoller } = useBehandlingProvider();
    const { resetField, setValue } = useFormContext<InntektFormValues>();
    const [inntektType, gjelderRolleId] = fieldName.split(".");
    const gjelderRolleIdNumber = Number(gjelderRolleId);
    const transformFn = transformInntekt(virkningsdato);

    if (ikkeAktiverteEndringerIGrunnlagsdata.inntekter[inntektType].length === 0) return null;

    const ikkeAktiverteEndringer: { [p: string]: IkkeAktivInntektDto[] } = selectedRoller.reduce(
        (acc, rolle) => ({
            // biome-ignore lint/performance/noAccumulatingSpread: Ignorer for nå
            ...acc,
            [rolle.ident]: ikkeAktiverteEndringerIGrunnlagsdata.inntekter[inntektType]?.filter((v) => {
                if (["barnetillegg", "kontantstøtte"].includes(inntektType)) {
                    return v.gjelderBarn === rolle.ident && v.ident === ident;
                }
                return v.ident === rolle.ident;
            }),
        }),
        {},
    );

    const onUpdate = async () => {
        for (const gjelderIdent in ikkeAktiverteEndringer) {
            if (ikkeAktiverteEndringer[gjelderIdent].length > 0) {
                await aktiverGrunnlag(ident, gjelderIdent);
                //Bare ta den første da aktivering av ett barn aktiverer alle
                return;
            }
        }
    };
    const aktiverGrunnlag = (aktiverForIdent: string, aktiverForBarn?: string): Promise<unknown> => {
        return aktiverGrunnlagFn.mutateAsync(
            {
                personident: aktiverForIdent,
                gjelderIdent: aktiverForBarn,
                type: inntektTypeToOpplysningerMapper[inntektType],
            },
            {
                onSuccess: ({ data }) => {
                    const inntektRolleFraResponse = data.inntekterV2.find(
                        (rolle) => rolle.gjelder.id === gjelderRolleIdNumber,
                    );

                    if (["barnetillegg", "kontantstøtte"].includes(inntektType)) {
                        inntektRolleFraResponse.inntekter.barnetillegg.forEach((inntekt: InntektBarn) => {
                            setValue(
                                `barnetillegg.${gjelderRolleId}.${inntekt.gjelderBarn.id}`,
                                inntekt.inntekter.map(transformFn) ?? [],
                            );
                        });
                        inntektRolleFraResponse.inntekter.kontantstøtte.forEach((inntekt: InntektBarn) => {
                            setValue(
                                `kontantstøtte.${gjelderRolleId}.${inntekt.gjelderBarn.id}`,
                                inntekt.inntekter.map(transformFn) ?? [],
                            );
                        });
                    } else if (inntektType === "årsinntekter") {
                        resetField(`${inntektType}.${gjelderRolleId}`, {
                            defaultValue: inntektRolleFraResponse.inntekter[inntektType].map(transformFn),
                        });
                    } else {
                        resetField(fieldName, {
                            defaultValue: inntektRolleFraResponse.inntekter[inntektType].map(transformFn),
                        });
                    }
                },
                onError: () => {
                    setSaveErrorState({
                        error: true,
                        retryFn: () => aktiverGrunnlag(aktiverForIdent),
                    });
                },
            },
        );
    };

    function endringstypeTilVisningsnavn(endringstype: GrunnlagInntektEndringstype): string {
        switch (endringstype) {
            case GrunnlagInntektEndringstype.NY:
                return "Ny";
            case GrunnlagInntektEndringstype.SLETTET:
                return "Fjernes";
            default:
                return "Endring";
        }
    }
    if (
        lesemodus ||
        (inntektType === "årsinntekter" && ident && ikkeAktiverteEndringer[ident].length < 1) ||
        Object.values(ikkeAktiverteEndringer).every((ikkeAktiverteEndring) => ikkeAktiverteEndring.length < 1)
    )
        return null;

    return (
        <Box
            padding="space-12"
            background="default"
            borderWidth="1"
            borderRadius="4"
            borderColor="neutral"
            className="w-[708px] ax-sm:max-w-[688px]"
        >
            <Heading size="xsmall" level="6">
                {text.alert.nyOpplysninger}
            </Heading>
            <BodyShort size="small">{text.alert.nyOpplysningerInfomelding}</BodyShort>
            {Object.keys(ikkeAktiverteEndringer).map((key) => {
                if (ikkeAktiverteEndringer[key].length < 1) return null;
                const rolle = roller.find((rolle) => rolle.ident === key);
                return (
                    <Fragment key={key}>
                        <BodyShort className="font-ax-bold	mt-4">
                            <RolleTag rolleType={rolle.rolletype as unknown as RolleTypeAbbreviation} ident={key} />
                            <PersonNavn ident={key} />
                        </BodyShort>
                        <table className="mt-2">
                            <thead>
                                <tr>
                                    <th align="left">{text.label.opplysninger}</th>
                                    <th align="left">{text.label.beløp}</th>
                                    <th align="left">{text.label.status}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ikkeAktiverteEndringer[key].map(
                                    (
                                        { beløp, rapporteringstype, periode, endringstype, inntektsposterSomErEndret },
                                        i,
                                    ) => (
                                        <Fragment key={i + rapporteringstype}>
                                            <tr>
                                                <td width="250px">
                                                    {hentVisningsnavn(rapporteringstype, periode.fom, periode.til)}
                                                </td>
                                                <td width="75px">{formatterBeløp(beløp)}</td>
                                                <td width="100px">{endringstypeTilVisningsnavn(endringstype)}</td>
                                            </tr>
                                            {inntektsposterSomErEndret.map((i, index) => (
                                                <tr
                                                    key={i.visningsnavn + index}
                                                    style={
                                                        index === inntektsposterSomErEndret.length - 1
                                                            ? {
                                                                  borderBottom: "1px solid black",
                                                              }
                                                            : {}
                                                    }
                                                >
                                                    <td>{i.visningsnavn}</td>
                                                    <td>{formatterBeløp(i.beløp)}</td>
                                                    <td>{endringstypeTilVisningsnavn(i.endringstype)}</td>
                                                </tr>
                                            ))}
                                        </Fragment>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </Fragment>
                );
            })}
            <Button
                size="xsmall"
                type="button"
                variant="secondary"
                disabled={aktiverGrunnlagFn.isPending || aktiverGrunnlagFn.isSuccess}
                loading={aktiverGrunnlagFn.isPending}
                className="mt-2"
                onClick={onUpdate}
            >
                {text.label.oppdaterOpplysninger}
            </Button>
        </Box>
    );
};

export const Opplysninger = ({ fieldName }: { fieldName: FieldName }) => {
    return (
        <>
            <FeilVedInnhentingAvOffentligData fieldName={fieldName} />
            <IkkeAktiverteOpplysninger fieldName={fieldName} />
        </>
    );
};
