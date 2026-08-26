import {
    type AktivereGrunnlagRequestV2,
    type AndreVoksneIHusstandenDetaljerDto,
    Bostatuskode,
    OpplysningerType,
    type PeriodeAndreVoksneIHusstanden,
    Rolletype,
} from "@bidrag/api/BidragBehandlingApiV1";
import { BodyShort, Box, Button, Heading, HStack, Popover, ReadMore, Table } from "@navikt/ds-react";
import { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { DateToDDMMYYYYString, dateOrNull, isBeforeDate } from "../../../../utils/date-utils";
import elementIds from "../../../constants/elementIds";
import text from "../../../constants/texts";
import { useBehandlingProvider } from "../../../context/BehandlingContext";
import { useGetBehandlingV2, useGetOpplysningeAndreVoksneIHusstand } from "../../../hooks/useApiData";
import { useOnActivateGrunnlag } from "../../../hooks/useOnActivateGrunnlag";
import { useVirkningsdato } from "../../../hooks/useVirkningsdato";
import { hentVisningsnavn } from "../../../hooks/useVisningsnavn";
import type { BoforholdFormValues } from "../../../types/boforholdFormValues";

const Header = () => (
    <BodyShort size="small" className="flex h-2">
        {text.title.opplysningerFraFolkeregistret}
    </BodyShort>
);
const Opplysninger = ({ perioder }: { perioder: PeriodeAndreVoksneIHusstanden[] }) => {
    const virkningsOrSoktFraDato = useVirkningsdato();
    if (!perioder || perioder.length === 0) {
        return null;
    }

    return (
        <ReadMore header={<Header />} size="small">
            <Table className="w-[650px] opplysninger" size="small">
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell className="w-[150px]">{text.label.periode}</Table.HeaderCell>
                        <Table.HeaderCell className="w-[500px]">{text.label.status}</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {perioder.map((periode, index) => (
                        <Table.Row key={`${periode.status}-${index}`}>
                            <Table.DataCell className="flex justify-start gap-2">
                                {virkningsOrSoktFraDato &&
                                new Date(periode.periode.fom) < new Date(virkningsOrSoktFraDato)
                                    ? DateToDDMMYYYYString(virkningsOrSoktFraDato)
                                    : DateToDDMMYYYYString(new Date(periode.periode.fom))}
                                <div>{"-"}</div>
                                {periode.periode.til ? DateToDDMMYYYYString(new Date(periode.periode.til)) : ""}
                            </Table.DataCell>
                            <Table.DataCell>
                                <div className="flex flex-row gap-[10px]">
                                    {hentVisningsnavn(periode.status)}{" "}
                                    {periode.status === Bostatuskode.BOR_MED_ANDRE_VOKSNE &&
                                    periode.husstandsmedlemmer.some((r) => r.harRelasjonTilBp)
                                        ? `(${periode.totalAntallHusstandsmedlemmer}, relasjon til BP)`
                                        : `(${periode.totalAntallHusstandsmedlemmer})`}
                                    <VoksneIHusstandPeriodePersonerButton
                                        husstandsmedlemmer={periode.husstandsmedlemmer}
                                    />
                                </div>
                            </Table.DataCell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
        </ReadMore>
    );
};

const VoksneIHusstandPeriodePersonerButton = ({
    husstandsmedlemmer,
}: {
    husstandsmedlemmer: AndreVoksneIHusstandenDetaljerDto[];
}) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [openState, setOpenState] = useState(false);
    if (husstandsmedlemmer.length === 0) return null;
    return (
        <>
            <Button variant="tertiary" size="xsmall" onClick={() => setOpenState(!openState)} ref={buttonRef}>
                Hvem bor på adresse?
            </Button>
            <Popover
                open={openState}
                aria-label="Hvem bor på adresse?"
                onClose={() => setOpenState(false)}
                anchorEl={buttonRef.current}
            >
                <Popover.Content style={{ padding: "8px" }}>
                    <ul className="list-decimal">
                        {husstandsmedlemmer.map((husstandsmedlem, index) => {
                            return (
                                <li key={`${husstandsmedlem.navn}-${index}`}>
                                    <span className="personnavn">{husstandsmedlem.navn}</span> (
                                    {DateToDDMMYYYYString(dateOrNull(husstandsmedlem.fødselsdato))})
                                    {husstandsmedlem.harRelasjonTilBp && ", relasjon til BP"}
                                </li>
                            );
                        })}
                    </ul>
                </Popover.Content>
            </Popover>
        </>
    );
};
export const AndreVoksneIHusstandOpplysninger = ({
    showResetButton,
    resetTilDataFraFreg,
    onActivateOpplysninger,
}: {
    showResetButton: boolean;
    resetTilDataFraFreg: () => void;
    onActivateOpplysninger: (overskriveManuelleOpplysninger: boolean) => void;
}) => {
    const { aktiveOpplysninger, ikkeAktiverteOpplysninger } = useGetOpplysningeAndreVoksneIHusstand();
    const activateGrunnlag = useOnActivateGrunnlag();
    const { roller } = useGetBehandlingV2();
    const { setSaveErrorState } = useBehandlingProvider();
    const { setValue } = useFormContext<BoforholdFormValues>();
    const aktivePerioder = aktiveOpplysninger.perioder;
    const ikkeAktivertePerioder = ikkeAktiverteOpplysninger?.perioder;
    const hasOpplysningerFraFolkeregistre = aktivePerioder?.length > 0;
    const hasNewOpplysningerFraFolkeregistre = ikkeAktivertePerioder?.length > 0;

    const bpRolle = roller.find((rolle) => rolle.rolletype === Rolletype.BP);
    const onActivate = (overskriveManuelleOpplysninger: boolean) => {
        activateGrunnlag.mutation.mutate(
            {
                overskriveManuelleOpplysninger,
                personident: bpRolle.ident,
                grunnlagstype: OpplysningerType.BOFORHOLD_ANDRE_VOKSNE_I_HUSSTANDEN,
            },
            {
                onSuccess: (response) => {
                    activateGrunnlag.queryClientUpdater((currentData) => {
                        const oppdatertVoksneIHusstand = response.boforhold.andreVoksneIHusstanden;
                        setValue("andreVoksneIHusstanden", oppdatertVoksneIHusstand);

                        onActivateOpplysninger(overskriveManuelleOpplysninger);
                        return {
                            ...currentData,
                            boforhold: {
                                ...currentData.boforhold,
                                andreVoksneIHusstanden: oppdatertVoksneIHusstand,
                                valideringsfeil: {
                                    ...currentData.boforhold.valideringsfeil,
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

    return (
        <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-4" data-section={elementIds.seksjon_offentlige_opplysninger}>
                <Opplysninger perioder={aktivePerioder} />

                {!hasNewOpplysningerFraFolkeregistre && hasOpplysningerFraFolkeregistre && showResetButton && (
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
            {hasNewOpplysningerFraFolkeregistre && (
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
    ikkeAktivertePerioder: PeriodeAndreVoksneIHusstanden[];
    pendingActivate?: AktivereGrunnlagRequestV2;
}) {
    const virkningsOrSoktFraDato = useVirkningsdato();
    return (
        <Box
            padding="space-4"
            background="default"
            borderWidth="1"
            borderRadius="4"
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
                        <tr key={index + periode.periode.fom}>
                            <td width="100px">
                                {virkningsOrSoktFraDato && isBeforeDate(periode.periode.fom, virkningsOrSoktFraDato)
                                    ? DateToDDMMYYYYString(virkningsOrSoktFraDato)
                                    : DateToDDMMYYYYString(new Date(periode.periode.fom))}
                            </td>
                            <td width="100px">
                                {" "}
                                {periode.periode.til ? DateToDDMMYYYYString(new Date(periode.periode.til)) : ""}
                            </td>
                            <td width="400px" className="flex flex-row gap-[10px]">
                                {hentVisningsnavn(periode.status)}{" "}
                                {periode.status === Bostatuskode.BOR_MED_ANDRE_VOKSNE &&
                                    `(${periode.totalAntallHusstandsmedlemmer})`}
                                <VoksneIHusstandPeriodePersonerButton husstandsmedlemmer={periode.husstandsmedlemmer} />
                            </td>
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
