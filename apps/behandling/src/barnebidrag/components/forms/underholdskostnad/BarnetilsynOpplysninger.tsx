import { type BarnetilsynGrunnlagDto, OpplysningerType } from "@bidrag/api/BidragBehandlingApiV1";
import { BodyShort, Box, Button, Heading, ReadMore, Table } from "@navikt/ds-react";
import { useEffect, useState } from "react";
import { BehandlingAlert } from "../../../../common/components/BehandlingAlert";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { useGetBehandlingV2, useGetOpplysningerBarnetilsyn } from "../../../../common/hooks/useApiData";
import { useOnActivateGrunnlag } from "../../../../common/hooks/useOnActivateGrunnlag";
import { useVirkningsdato } from "../../../../common/hooks/useVirkningsdato";
import { DateToDDMMYYYYHHMMString, DateToDDMMYYYYString, dateOrNull, isBeforeDate } from "../../../../utils/date-utils";

const Header = () => (
    <BodyShort size="small" className="flex h-2">
        {text.title.opplysningerFraFolkeregistret}
    </BodyShort>
);
export const NyOpplysningerAlert = () => {
    const { ikkeAktiverteEndringerIGrunnlagsdata } = useGetBehandlingV2();
    const ikkeAktiverteEndringer = ikkeAktiverteEndringerIGrunnlagsdata?.stønadTilBarnetilsyn?.grunnlag;

    if (ikkeAktiverteEndringer == null) return null;
    const innhentetTidspunkt = ikkeAktiverteEndringerIGrunnlagsdata?.stønadTilBarnetilsyn?.innhentetTidspunkt;

    return (
        <BehandlingAlert variant="info">
            <Heading size="xsmall" level="3">
                {text.alert.nyOpplysningerInfo}
            </Heading>
            <BodyShort size="small">
                Nye opplysninger fra offentlige registre er tilgjengelig. Oppdatert{" "}
                {DateToDDMMYYYYHHMMString(dateOrNull(innhentetTidspunkt))}
            </BodyShort>
        </BehandlingAlert>
    );
};
const Opplysninger = ({ perioder, ident }: { perioder: BarnetilsynGrunnlagDto[]; ident: string }) => {
    const { underholdskostnader } = useGetBehandlingV2();
    const virkningsOrSoktFraDato = useVirkningsdato();
    const hasAtLeastOneBarnetilsynPerioder = !!underholdskostnader.find((u) => u.gjelderBarn.ident === ident)
        .stønadTilBarnetilsyn.length;
    const [open, setOpen] = useState<boolean>(!hasAtLeastOneBarnetilsynPerioder);

    if (!perioder) {
        return null;
    }

    useEffect(() => {
        if (!hasAtLeastOneBarnetilsynPerioder && !open) {
            setOpen(true);
        }
    }, [hasAtLeastOneBarnetilsynPerioder]);

    return (
        <ReadMore header={<Header />} size="small" open={open} onClick={() => setOpen(!open)}>
            <Table className="opplysninger table-fixed table w-max" size="small">
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>{text.label.periode}</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {perioder.map((periode, index) => (
                        <Table.Row key={`${periode.partPersonId}-${index}`} className="align-top">
                            <Table.DataCell className="flex justify-start gap-2">
                                {virkningsOrSoktFraDato &&
                                new Date(periode.periodeFra) < new Date(virkningsOrSoktFraDato)
                                    ? DateToDDMMYYYYString(virkningsOrSoktFraDato)
                                    : DateToDDMMYYYYString(new Date(periode.periodeFra))}
                                <div>{"-"}</div>
                                {periode.periodeTil ? DateToDDMMYYYYString(new Date(periode.periodeTil)) : ""}
                            </Table.DataCell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
        </ReadMore>
    );
};

const FeilVedInnhentingAvOffentligData = ({ ident }: { ident: string }) => {
    const { feilOppståttVedSisteGrunnlagsinnhenting } = useGetBehandlingV2();
    const { lesemodus } = useBehandlingProvider();
    const feilVedInnhentingAvOffentligData = feilOppståttVedSisteGrunnlagsinnhenting?.some(
        (innhentingsFeil) =>
            ident === innhentingsFeil.rolle.ident && innhentingsFeil.grunnlagsdatatype === OpplysningerType.BARNETILSYN,
    );

    return (
        <>
            {!lesemodus && feilVedInnhentingAvOffentligData && (
                <BehandlingAlert variant="info" className="mb-2">
                    <Heading size="small" level="3">
                        {text.alert.feilVedInnhentingAvOffentligData}
                    </Heading>
                    {text.feilVedInnhentingAvOffentligData}
                </BehandlingAlert>
            )}
        </>
    );
};

export const BarnetilsynOpplysninger = ({ ident, rolleId }: { ident: string; rolleId: number }) => {
    const { aktiveOpplysninger, ikkeAktiverteOpplysninger } = useGetOpplysningerBarnetilsyn();
    const activateGrunnlag = useOnActivateGrunnlag();
    const { lesemodus, setSaveErrorState } = useBehandlingProvider();
    const aktivePerioder = aktiveOpplysninger?.grunnlag[ident];
    const ikkeAktivertePerioder = ikkeAktiverteOpplysninger?.grunnlag[ident];
    const hasNewOpplysningerFraFolkeregistre = ikkeAktivertePerioder?.length > 0;

    const onActivate = () => {
        activateGrunnlag.mutation.mutate(
            {
                overskriveManuelleOpplysninger: false,
                personident: ident,
                gjelderIdent: ident,
                gjelderRolleId: rolleId,
                grunnlagstype: OpplysningerType.BARNETILSYN,
            },
            {
                onSuccess: (response) => {
                    activateGrunnlag.queryClientUpdater((currentData) => {
                        return {
                            ...currentData,
                            aktiveGrunnlagsdata: response.aktiveGrunnlagsdata,
                            ikkeAktiverteEndringerIGrunnlagsdata: response.ikkeAktiverteEndringerIGrunnlagsdata,
                        };
                    });
                },
                onError: () => {
                    setSaveErrorState({
                        error: true,
                        retryFn: () => onActivate(),
                    });
                },
            },
        );
    };

    return (
        <div className="grid gap-2">
            <FeilVedInnhentingAvOffentligData ident={ident} />
            <div className="grid grid-cols-2 gap-4">
                <Opplysninger perioder={aktivePerioder} ident={ident} />
            </div>
            {hasNewOpplysningerFraFolkeregistre && !lesemodus && (
                <NyOpplysningerFraFolkeregistreTabell
                    ikkeAktivertePerioder={ikkeAktivertePerioder}
                    onActivate={onActivate}
                    isPending={activateGrunnlag.mutation.isPending}
                />
            )}
        </div>
    );
};

function NyOpplysningerFraFolkeregistreTabell({
    onActivate,
    ikkeAktivertePerioder,
    isPending,
}: {
    onActivate: () => void;
    ikkeAktivertePerioder: BarnetilsynGrunnlagDto[];
    isPending?: boolean;
}) {
    const virkningsOrSoktFraDato = useVirkningsdato();
    return (
        <Box
            padding="space-4"
            background="default"
            borderWidth="1"
            borderRadius="4"
            borderColor="neutral"
            className="w-[708px] ax-sm:max-w-[688px]"
        >
            <Heading size="xsmall">{text.alert.nyOpplysningerBoforhold}</Heading>
            <Table className="opplysninger table-fixed table w-max mt-2" size="small">
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell align="left">{text.label.fraOgMed}</Table.HeaderCell>
                        <Table.HeaderCell align="left">{text.label.tilOgMed}</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {ikkeAktivertePerioder?.map((periode, index) => (
                        <Table.Row key={index + periode.partPersonId}>
                            <Table.DataCell width="100px" scope="row">
                                {virkningsOrSoktFraDato && isBeforeDate(periode.periodeFra, virkningsOrSoktFraDato)
                                    ? DateToDDMMYYYYString(virkningsOrSoktFraDato)
                                    : DateToDDMMYYYYString(new Date(periode.periodeFra))}
                            </Table.DataCell>
                            <Table.DataCell width="100px">
                                {" "}
                                {periode.periodeTil ? DateToDDMMYYYYString(new Date(periode.periodeTil)) : ""}
                            </Table.DataCell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
            <Button
                className="mt-4"
                type="button"
                variant="secondary"
                size="xsmall"
                onClick={() => onActivate()}
                loading={isPending}
            >
                {text.label.oppdaterOpplysninger}
            </Button>
        </Box>
    );
}
