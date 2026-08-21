import {
    type AktivereGrunnlagRequestV2,
    type BostatusperiodeGrunnlagDto,
    OpplysningerType,
    Rolletype,
    TypeBehandling,
} from "@bidrag/api/BidragBehandlingApiV1";
import { BodyShort, Box, Button, Heading, HStack, ReadMore, Table } from "@navikt/ds-react";
import { useFormContext } from "react-hook-form";
import { DateToDDMMYYYYHHMMString, DateToDDMMYYYYString, dateOrNull, isBeforeDate } from "../../../utils/date-utils";
import elementIds from "../../constants/elementIds";
import text from "../../constants/texts";
import { useBehandlingProvider } from "../../context/BehandlingContext";
import { useGetBehandlingV2, useGetOpplysningerBoforhold } from "../../hooks/useApiData";
import { useOnActivateGrunnlag } from "../../hooks/useOnActivateGrunnlag";
import { useVirkningsdato } from "../../hooks/useVirkningsdato";
import { hentVisningsnavn } from "../../hooks/useVisningsnavn";
import type { BoforholdFormValues } from "../../types/boforholdFormValues";
import { BehandlingAlert } from "../BehandlingAlert";

const Header = () => (
    <BodyShort size="small" className="flex h-2">
        {text.title.opplysningerFraFolkeregistret}
    </BodyShort>
);
export const NyOpplysningerAlert = () => {
    const { ikkeAktiverteEndringerIGrunnlagsdata, type } = useGetBehandlingV2();
    const isBidragBehandling = [TypeBehandling.BIDRAG, TypeBehandling.BIDRAG18AR].includes(type);
    const ikkeAktiverteEndringerBoforhold = ikkeAktiverteEndringerIGrunnlagsdata.husstandsmedlem;
    const ikkeAktiverteEndringerSivilstand = ikkeAktiverteEndringerIGrunnlagsdata.sivilstand;
    const ikkeAktiverteEndringerHusstandsmedlemBM = ikkeAktiverteEndringerIGrunnlagsdata.husstandsmedlemBM;
    const isBidragAndNoIkkeAktiverteEndringerHusstandsmedlemBM = isBidragBehandling
        ? ikkeAktiverteEndringerHusstandsmedlemBM.length === 0
        : true;

    if (
        ikkeAktiverteEndringerBoforhold.length === 0 &&
        ikkeAktiverteEndringerSivilstand == null &&
        isBidragAndNoIkkeAktiverteEndringerHusstandsmedlemBM
    )
        return null;

    const arrOfDates = [
        dateOrNull(ikkeAktiverteEndringerSivilstand?.innhentetTidspunkt),
        dateOrNull(ikkeAktiverteEndringerBoforhold[0]?.innhentetTidspunkt),
        isBidragBehandling ? dateOrNull(ikkeAktiverteEndringerHusstandsmedlemBM[0]?.innhentetTidspunkt) : null,
    ]
        .filter((date) => date)
        .map((date) => date.getTime());

    const innhentetTidspunkt = new Date(Math.max(...arrOfDates));
    return (
        <BehandlingAlert variant="info">
            <Heading size="xsmall" level="3">
                {text.alert.nyOpplysningerInfo}
            </Heading>
            <BodyShort size="small">
                Nye opplysninger fra offentlige registre er tilgjengelig. Oppdatert{" "}
                {DateToDDMMYYYYHHMMString(innhentetTidspunkt)}
            </BodyShort>
        </BehandlingAlert>
    );
};
const Opplysninger = ({ perioder }: { perioder: BostatusperiodeGrunnlagDto[] }) => {
    const virkningsOrSoktFraDato = useVirkningsdato();

    if (!perioder) {
        return null;
    }

    return (
        <ReadMore header={<Header />} size="small">
            <Table className="w-[350px] opplysninger" size="small">
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>{text.label.periode}</Table.HeaderCell>
                        <Table.HeaderCell>{text.label.status}</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {perioder.map((periode, index) => (
                        <Table.Row key={`${periode.bostatus}-${index}`}>
                            <Table.DataCell className="flex justify-start gap-2" textSize="small">
                                {virkningsOrSoktFraDato && new Date(periode.datoFom) < new Date(virkningsOrSoktFraDato)
                                    ? DateToDDMMYYYYString(virkningsOrSoktFraDato)
                                    : DateToDDMMYYYYString(new Date(periode.datoFom))}
                                <div>{"-"}</div>
                                {periode.datoTom ? DateToDDMMYYYYString(new Date(periode.datoTom)) : ""}
                            </Table.DataCell>
                            <Table.DataCell textSize="small">{hentVisningsnavn(periode.bostatus)}</Table.DataCell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
        </ReadMore>
    );
};
export const BoforholdOpplysninger = ({
    ident,
    showResetButton,
    resetTilDataFraFreg,
    onActivateOpplysninger,
    fieldName,
}: {
    ident: string;
    showResetButton: boolean;
    resetTilDataFraFreg: () => void;
    onActivateOpplysninger: (overskriveManuelleOpplysninger: boolean) => void;
    fieldName: `husstandsmedlem.${number}.perioder`;
}) => {
    const { aktiveOpplysninger, ikkeAktiverteOpplysninger } = useGetOpplysningerBoforhold();
    const activateGrunnlag = useOnActivateGrunnlag();
    const { lesemodus, setSaveErrorState } = useBehandlingProvider();
    const { roller, type } = useGetBehandlingV2();
    const { setValue } = useFormContext<BoforholdFormValues>();
    const aktivePerioder = aktiveOpplysninger.find((opplysning) => opplysning.ident === ident)?.perioder;
    const ikkeAktivertePerioder = ikkeAktiverteOpplysninger.find((opplysning) => opplysning.ident === ident)?.perioder;
    const hasOpplysningerFraFolkeregistre = aktivePerioder?.length > 0;
    const hasNewOpplysningerFraFolkeregistre = ikkeAktivertePerioder?.length > 0;

    const finnRolleGrunnlagTilhører = () =>
        roller.find((rolle) => rolle.rolletype === (type === TypeBehandling.FORSKUDD ? Rolletype.BM : Rolletype.BP));
    const onActivate = (overskriveManuelleOpplysninger: boolean) => {
        activateGrunnlag.mutation.mutate(
            {
                overskriveManuelleOpplysninger,
                personident: finnRolleGrunnlagTilhører()?.ident,
                gjelderIdent: ident,
                grunnlagstype: OpplysningerType.BOFORHOLD,
            },
            {
                onSuccess: (response) => {
                    activateGrunnlag.queryClientUpdater((currentData) => {
                        const oppdatertHusstandsmedlem = response.boforhold.husstandsmedlem.find(
                            (barn) => barn.ident === ident,
                        );
                        setValue(fieldName, oppdatertHusstandsmedlem.perioder);

                        onActivateOpplysninger(overskriveManuelleOpplysninger);
                        return {
                            ...currentData,
                            boforhold: {
                                ...currentData.boforhold,
                                husstandsmedlem: response.boforhold.husstandsmedlem,
                                egetBarnErEnesteVoksenIHusstanden: response.boforhold.egetBarnErEnesteVoksenIHusstanden,
                                valideringsfeil: {
                                    ...currentData.boforhold.valideringsfeil,
                                    husstandsmedlem: currentData.boforhold.valideringsfeil.husstandsmedlem.filter(
                                        (h) => h.barn.husstandsmedlemId !== oppdatertHusstandsmedlem.id,
                                    ),
                                },
                            },
                            aktiveGrunnlagsdata: response.aktiveGrunnlagsdata,
                            ikkeAktiverteEndringerIGrunnlagsdata: response.ikkeAktiverteEndringerIGrunnlagsdata,
                        };
                    });
                },
                onError: () => {
                    setSaveErrorState({
                        error: true,
                        retryFn: () => onActivate(overskriveManuelleOpplysninger),
                    });
                },
            },
        );
    };

    if (!hasOpplysningerFraFolkeregistre) return null;

    return (
        <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-4" data-section={elementIds.seksjon_offentlige_opplysninger}>
                <Opplysninger perioder={aktivePerioder} />

                {!hasNewOpplysningerFraFolkeregistre &&
                    hasOpplysningerFraFolkeregistre &&
                    showResetButton &&
                    !lesemodus && (
                        <div className="flex justify-end">
                            <Button
                                variant="tertiary"
                                type="button"
                                size="small"
                                className="w-fit h-fit"
                                onClick={resetTilDataFraFreg}
                            >
                                {text.resetTilOpplysninger}
                            </Button>
                        </div>
                    )}
            </div>
            {hasNewOpplysningerFraFolkeregistre && !lesemodus && (
                <NyOpplysningerFraFolkeregistreTabell
                    ikkeAktivertePerioder={ikkeAktivertePerioder}
                    onActivate={onActivate}
                    pendingActivate={activateGrunnlag.mutation.isPending ? activateGrunnlag.mutation.variables : null}
                />
            )}
        </div>
    );
};

function NyOpplysningerFraFolkeregistreTabell({
    onActivate,
    ikkeAktivertePerioder,
    pendingActivate,
}: {
    onActivate: (overskriveManuelleOpplysninger: boolean) => void;
    ikkeAktivertePerioder: BostatusperiodeGrunnlagDto[];
    pendingActivate?: AktivereGrunnlagRequestV2;
}) {
    const virkningsOrSoktFraDato = useVirkningsdato();
    return (
        <Box
            padding="space-8"
            background="info-soft"
            borderWidth="1"
            borderRadius="8"
            borderColor="neutral"
            className="w-[708px]"
        >
            <Heading size="xsmall">{text.alert.nyOpplysningerBoforhold}</Heading>
            <table className="mt-2">
                <thead>
                    <tr>
                        <th align="left">{text.label.fraOgMed}</th>
                        <th align="left">{text.label.tilOgMed}</th>
                        <th align="left">{text.label.status}</th>
                    </tr>
                </thead>
                <tbody>
                    {ikkeAktivertePerioder?.map((periode, index) => (
                        <tr key={index + periode.datoFom}>
                            <td width="100px">
                                {virkningsOrSoktFraDato && isBeforeDate(periode.datoFom, virkningsOrSoktFraDato)
                                    ? DateToDDMMYYYYString(virkningsOrSoktFraDato)
                                    : DateToDDMMYYYYString(new Date(periode.datoFom))}
                            </td>
                            <td width="100px">
                                {" "}
                                {periode.datoTom ? DateToDDMMYYYYString(new Date(periode.datoTom)) : ""}
                            </td>
                            <td width="250px">{hentVisningsnavn(periode.bostatus)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <HStack gap="space-6" className="mt-4">
                <Button
                    type="button"
                    variant="secondary"
                    size="xsmall"
                    onClick={() => onActivate(true)}
                    loading={pendingActivate?.overskriveManuelleOpplysninger === true}
                    disabled={pendingActivate?.overskriveManuelleOpplysninger === false}
                >
                    Ja
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    size="xsmall"
                    onClick={() => onActivate(false)}
                    loading={pendingActivate?.overskriveManuelleOpplysninger === false}
                    disabled={pendingActivate?.overskriveManuelleOpplysninger === true}
                >
                    Nei
                </Button>
            </HStack>
        </Box>
    );
}
