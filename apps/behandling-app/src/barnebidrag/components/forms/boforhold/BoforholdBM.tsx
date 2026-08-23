import { type BostatusperiodeGrunnlagDto, OpplysningerType, Rolletype } from "@bidrag/api/BidragBehandlingApiV1";
import { PersonNavnIdent, RolleTag, RolleTypeAbbreviation } from "@bidrag/common";
import { BodyShort, Box, Button, ExpansionCard, Heading, HStack, Table, Tag } from "@navikt/ds-react";
import { Fragment } from "react";
import elementIds from "../../../../common/constants/elementIds";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { useGetBehandlingV2 } from "../../../../common/hooks/useApiData";
import { useOnActivateGrunnlag } from "../../../../common/hooks/useOnActivateGrunnlag";
import { useVirkningsdato } from "../../../../common/hooks/useVirkningsdato";
import { hentVisningsnavn } from "../../../../common/hooks/useVisningsnavn";
import { DateToDDMMYYYYString, dateOrNull, isBeforeDate } from "../../../../utils/date-utils";

export const BoforholdBM = () => {
    const {
        aktiveGrunnlagsdata: { husstandsmedlemBMV2 },
        ikkeAktiverteEndringerIGrunnlagsdata: { husstandsmedlemBMV2: ikkeAktiverteEndringerHusstandsmedlemBMV2 },
        roller,
    } = useGetBehandlingV2();
    const { lesemodus, selectedRoller, selectedSaksnummer } = useBehandlingProvider();

    const selectedBmFromRoller = selectedRoller.find((rolle) => rolle.rolleType === RolleTypeAbbreviation.BM);

    const selectedBM =
        roller.find((rolle) => rolle.id === selectedBmFromRoller?.id) ??
        roller.find((rolle) => rolle.rolletype === Rolletype.BM && rolle.saksnummer === selectedSaksnummer) ??
        roller.find((rolle) => rolle.rolletype === Rolletype.BM);

    const aktivtHusstandsmedlemBMV2 =
        husstandsmedlemBMV2.find((husstandsmedlem) => husstandsmedlem.gjelderBM.id === selectedBM?.id) ??
        husstandsmedlemBMV2[0];
    const ikkeAktivtHusstandsmedlemBMV2 =
        ikkeAktiverteEndringerHusstandsmedlemBMV2.find(
            (husstandsmedlem) => husstandsmedlem.gjelderBM.id === selectedBM?.id,
        ) ?? ikkeAktiverteEndringerHusstandsmedlemBMV2[0];

    const harNyeOpplysninger = (ikkeAktivtHusstandsmedlemBMV2?.husstandsmedlem ?? []).some(
        (husstandsmedlem) => !!husstandsmedlem.perioder.length,
    );
    const husstandsmedlemForAktivBM = aktivtHusstandsmedlemBMV2?.husstandsmedlem ?? [];

    return (
        <ExpansionCard size="small" aria-label="Small-variant" defaultOpen={!lesemodus && harNyeOpplysninger}>
            <ExpansionCard.Header>
                <ExpansionCard.Title size="small">
                    {text.title.opplysningerFraFolkeregistret}{" "}
                    {!lesemodus && harNyeOpplysninger && (
                        <Tag size="xsmall" variant="success" className="ml-2">
                            {text.label.nytt}
                        </Tag>
                    )}
                </ExpansionCard.Title>
            </ExpansionCard.Header>
            <ExpansionCard.Content>
                {!lesemodus && harNyeOpplysninger && <NyOpplysningerFraFolkeregistreTabell />}
                {husstandsmedlemForAktivBM.length === 0 && (
                    <Box background="neutral-soft" padding="space-8">
                        <BodyShort size="small">BM har ingen husstandsmedlem.</BodyShort>
                    </Box>
                )}
                {husstandsmedlemForAktivBM.map((husstandsmedlem) => (
                    <Fragment key={husstandsmedlem.ident}>
                        <Box
                            background="neutral-soft"
                            className="overflow-hidden grid gap-2 py-2 px-4"
                            id={`${elementIds.seksjon_boforhold}_${husstandsmedlem.ident}`}
                        >
                            <div className="grid grid-cols-[max-content_max-content_auto] p-2 bg-[white] border-0 border-[var(--ax-border-neutral)]">
                                <div>
                                    <RolleTag rolleType={RolleTypeAbbreviation.BA} ident={husstandsmedlem.ident} />
                                </div>
                                <div className="flex items-center gap-4">
                                    <PersonNavnIdent ident={husstandsmedlem.ident} />
                                </div>
                            </div>
                            <Perioder perioder={husstandsmedlem.perioder} />
                        </Box>
                    </Fragment>
                ))}
            </ExpansionCard.Content>
        </ExpansionCard>
    );
};

const Perioder = ({ perioder }: { perioder: BostatusperiodeGrunnlagDto[] }) => {
    const virkningsOrSoktFraDato = useVirkningsdato();
    return (
        <Table size="small" className="table-fixed table bg-[white] w-full">
            <Table.Header>
                <Table.Row className="align-baseline">
                    <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[134px]">
                        {text.label.fraOgMed}
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[134px]">
                        {text.label.tilOgMed}
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" scope="col" align="left">
                        {text.label.status}
                    </Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {perioder.map((periode, index) => (
                    <Table.Row key={`periode-${index}`} className="align-top">
                        <Table.DataCell>
                            <BodyShort size="small">
                                {virkningsOrSoktFraDato && isBeforeDate(periode.datoFom, virkningsOrSoktFraDato)
                                    ? DateToDDMMYYYYString(virkningsOrSoktFraDato)
                                    : DateToDDMMYYYYString(new Date(periode.datoFom))}
                            </BodyShort>
                        </Table.DataCell>
                        <Table.DataCell>
                            <BodyShort size="small">{DateToDDMMYYYYString(dateOrNull(periode.datoTom))}</BodyShort>
                        </Table.DataCell>
                        <Table.DataCell>
                            <BodyShort size="small">{hentVisningsnavn(periode.bostatus)}</BodyShort>
                        </Table.DataCell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    );
};

const NyOpplysningerFraFolkeregistreTabell = () => {
    const {
        ikkeAktiverteEndringerIGrunnlagsdata: { husstandsmedlemBMV2 },
        roller,
    } = useGetBehandlingV2();
    const { selectedRoller, selectedSaksnummer, setSaveErrorState } = useBehandlingProvider();
    const selectedBmFromRoller = selectedRoller.find((rolle) => rolle.rolleType === RolleTypeAbbreviation.BM);
    const bmRolle =
        roller.find((rolle) => rolle.id === selectedBmFromRoller?.id) ??
        roller.find((rolle) => rolle.rolletype === Rolletype.BM && rolle.saksnummer === selectedSaksnummer) ??
        roller.find((rolle) => rolle.rolletype === Rolletype.BM);
    const ikkeAktivtHusstandsmedlemBMV2 =
        husstandsmedlemBMV2.find((husstandsmedlem) => husstandsmedlem.gjelderBM.id === bmRolle?.id) ??
        husstandsmedlemBMV2[0];
    const activateGrunnlag = useOnActivateGrunnlag();

    const onActivate = () => {
        if (!bmRolle?.ident) {
            return;
        }

        activateGrunnlag.mutation.mutate(
            {
                overskriveManuelleOpplysninger: false,
                personident: bmRolle.ident,
                grunnlagstype: OpplysningerType.BOFORHOLDBMSOKNADSBARN,
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
                        retryFn: onActivate,
                    });
                },
            },
        );
    };

    return (
        <Box
            padding="space-8"
            background="default"
            borderWidth="1"
            borderRadius="4"
            borderColor="neutral"
            className="w-[708px]"
        >
            <Heading size="xsmall">{text.label.oppdaterOpplysninger}</Heading>
            <div className="grid gap-4">
                {(ikkeAktivtHusstandsmedlemBMV2?.husstandsmedlem ?? []).map((husstandsmedlem) => (
                    <Box key={husstandsmedlem.ident} background="neutral-soft">
                        <div className="grid grid-cols-[max-content_max-content_auto] p-2 bg-[white] border-0 border-[var(--ax-border-neutral)]">
                            <div>
                                <RolleTag rolleType={RolleTypeAbbreviation.BA} ident={husstandsmedlem.ident} />
                            </div>
                            <div className="flex items-center gap-4">
                                <PersonNavnIdent ident={husstandsmedlem.ident} />
                            </div>
                        </div>
                        <Perioder perioder={husstandsmedlem.perioder} />
                    </Box>
                ))}
            </div>
            <HStack gap="space-6" className="mt-4">
                <Button type="button" variant="secondary" size="xsmall" onClick={onActivate}>
                    {text.label.oppdaterOpplysninger}
                </Button>
            </HStack>
        </Box>
    );
};
