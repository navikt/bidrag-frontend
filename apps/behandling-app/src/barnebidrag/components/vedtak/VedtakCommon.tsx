import {
    type ResultatBarnebidragsberegningPeriodeDto,
    type ResultatBidragsberegningBarnDto,
    Resultatkode,
    type ResultatRolle,
    Samvaersklasse,
    Stonadstype,
    type UgyldigBeregningDto,
    Vedtakstype,
} from "@bidrag/api/BidragBehandlingApiV1";
import { dateToDDMMYYYYString, deductDays, PersonNavnIdent, RolleTag, RolleTypeAbbreviation } from "@bidrag/common";
import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Alert, BodyShort, Button, Checkbox, Heading, HStack, Link, Modal, Switch, Table } from "@navikt/ds-react";
import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { VedtakstidspunktDisplay } from "../../../common/components/VedtakstidspunktDisplay";
import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import text from "../../../common/constants/texts";
import { useBehandlingProvider } from "../../../common/context/BehandlingContext";
import {
    QueryKeys,
    useGetBehandlingV2,
    useGetBeregningBidrag,
    useOppdaterOpprettP35c,
} from "../../../common/hooks/useApiData";
import useFeatureToogle from "../../../common/hooks/useFeatureToggle";
import { useQueryParams } from "../../../common/hooks/useQueryParams";
import { hentVisningsnavn } from "../../../common/hooks/useVisningsnavn";
import { formatterBeløpForBeregning, formatterProsent } from "../../../utils/number-utils";
import { VedtaksListeBeregning } from "../Vedtakliste";
import { DetaljertBeregningBidrag } from "./DetaljertBeregningBidrag";

type VedtakContextProps = {
    skalIndeksreguleres: Map<string, boolean>;
    setSkalIndeksreguleres: (barnId: string, value: boolean) => void;
};
export const VedtakContext = createContext<VedtakContextProps | null>(null);
export function useVedtakProvider() {
    const context = useContext(VedtakContext);
    if (!context) {
        throw new Error("useVedtakProvider must be used within a VedtakProvider");
    }
    return context;
}

export const NesteIndeksår = ({ nesteIndeksår, barnId }: { nesteIndeksår?: number; barnId: string }) => {
    const { skalIndeksreguleres, setSkalIndeksreguleres } = useVedtakProvider();
    const { vedtakstype, lesemodus } = useGetBehandlingV2();
    const erInnkreving = vedtakstype === Vedtakstype.INNKREVING;
    useEffect(() => {
        setSkalIndeksreguleres(barnId, !!nesteIndeksår);
    }, []);
    return (
        <HStack gap="space-2" className="items-center">
            {erInnkreving && (
                <Switch
                    checked={skalIndeksreguleres.get(barnId)}
                    readOnly={!!lesemodus}
                    size="small"
                    onChange={(e) => setSkalIndeksreguleres(barnId, e.target.checked)}
                >
                    Skal indeksreguleres
                </Switch>
            )}
            {skalIndeksreguleres.get(barnId) && (
                <ResultatDescription
                    data={[
                        {
                            label: "Neste indeksår",
                            textRight: false,
                            labelBold: true,
                            value: nesteIndeksår,
                        },
                    ].filter((d) => d)}
                />
            )}
        </HStack>
    );
};
export const VedtakProvider = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    const [skalIndeksreguleres, setSkalIndeksreguleres] = useState<Map<string, boolean>>(new Map());
    return (
        <VedtakContext
            value={{
                skalIndeksreguleres,
                setSkalIndeksreguleres: (barnId: string, value: boolean) => {
                    setSkalIndeksreguleres((prev) => {
                        const newMap = new Map(prev);
                        newMap.set(barnId, value);
                        return newMap;
                    });
                },
            }}
        >
            <div className={className}>{children}</div>
        </VedtakContext>
    );
};

export const GrunnlagFraVedtakButton = () => {
    const { grunnlagFraVedtaksid, saksnummer } = useGetBehandlingV2();
    const enhet = useQueryParams().get("enhet");
    const sessionState = useQueryParams().get("sessionState");

    if (!grunnlagFraVedtaksid) return null;
    return (
        <Link
            className="ml-auto flex flex-row gap-2"
            href={`/sak/${saksnummer}/vedtak/${grunnlagFraVedtaksid}/?steg=vedtak&enhet=${enhet}&sessionState=${sessionState}`}
            target="_blank"
            rel="noreferrer"
        >
            <div>
                Grunnlag fra vedtak <ExternalLinkIcon aria-hidden />
            </div>
            <VedtakstidspunktDisplay vedtakId={grunnlagFraVedtaksid} />
        </Link>
    );
};
export const TableRowResultatAvslag = ({
    periode,
    barn,
}: {
    periode: ResultatBarnebidragsberegningPeriodeDto;
    barn: ResultatBidragsberegningBarnDto;
}) => {
    const { virkningstidspunktV3 } = useGetBehandlingV2();
    const barnDetaljer = virkningstidspunktV3.barn.find((b) => b.rolle.ident === barn.barn.ident);
    return (
        <>
            <Table.DataCell textSize="small">
                {dateToDDMMYYYYString(new Date(periode.periode.fom))} -{" "}
                {periode.periode.til ? dateToDDMMYYYYString(deductDays(new Date(periode.periode.til), 1)) : ""}
            </Table.DataCell>

            <Table.DataCell textSize="small" colSpan={5}></Table.DataCell>

            <Table.DataCell textSize="small">{barnDetaljer.harLøpendeBidrag ? "Opphør" : "Avslag"}</Table.DataCell>

            <Table.DataCell textSize="small">{periode.resultatkodeVisningsnavn}</Table.DataCell>
        </>
    );
};
export const TableRowResultat = ({ periode }: { periode: ResultatBarnebidragsberegningPeriodeDto }) => {
    const { erBisysVedtak, vedtakstype } = useGetBehandlingV2();
    const visEvne = erBisysVedtak || vedtakstype !== Vedtakstype.ALDERSJUSTERING;
    const erDirekteAvslag = periode.erDirekteAvslag;
    const samværsklasse =
        periode.beregningsdetaljer?.samværsfradrag?.samværsklasse === Samvaersklasse.DELT_BOSTED
            ? "D"
            : hentVisningsnavn(periode.beregningsdetaljer?.samværsfradrag?.samværsklasse);
    return (
        <>
            <Table.DataCell textSize="small">
                {dateToDDMMYYYYString(new Date(periode.periode.fom))} -{" "}
                {periode.periode.til ? dateToDDMMYYYYString(deductDays(new Date(periode.periode.til), 1)) : ""}
            </Table.DataCell>

            <Table.DataCell textSize="small">
                {erDirekteAvslag ? "-" : formatterBeløpForBeregning(periode.underholdskostnad)}
            </Table.DataCell>
            <Table.DataCell textSize="small">
                {erDirekteAvslag ? (
                    "-"
                ) : (
                    <table>
                        <tbody>
                            <tr>
                                <td className="w-[45px]" align="right">
                                    {formatterProsent(periode.bpsAndelU)}
                                </td>
                                <td className="w-[10px]">/</td>
                                <td>{formatterBeløpForBeregning(periode.bpsAndelBeløp)}</td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </Table.DataCell>
            <Table.DataCell textSize="small">
                {erDirekteAvslag ? (
                    "-"
                ) : (
                    <table>
                        <tbody>
                            {periode.beregningsdetaljer?.samværsfradrag != null ? (
                                <tr>
                                    <td className="w-[45px]" align="right">
                                        {formatterBeløpForBeregning(periode.samværsfradrag)}
                                    </td>
                                    <td className="w-[10px]">/</td>
                                    <td>{samværsklasse}</td>
                                </tr>
                            ) : (
                                <tr></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </Table.DataCell>
            {visEvne && (
                <Table.DataCell textSize="small">
                    {erDirekteAvslag ? (
                        "-"
                    ) : (
                        <table>
                            <tbody>
                                <tr>
                                    <td className="w-[45px]" align="right">
                                        {formatterBeløpForBeregning(
                                            periode.beregningsdetaljer.delberegningBidragsevne?.bidragsevne,
                                        )}
                                    </td>
                                    <td className="w-[10px]">/</td>
                                    <td>
                                        {formatterBeløpForBeregning(
                                            periode.beregningsdetaljer.delberegningBidragsevne?.sumInntekt25Prosent,
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </Table.DataCell>
            )}

            <Table.DataCell textSize="small">
                {erDirekteAvslag ? "-" : formatterBeløpForBeregning(periode.beregnetBidrag)}
            </Table.DataCell>

            <Table.DataCell textSize="small">
                {erDirekteAvslag ? "Avslag" : formatterBeløpForBeregning(periode.faktiskBidrag)}
            </Table.DataCell>

            <Table.DataCell textSize="small">
                <div className="flex flex-row gap-1 w-max">
                    <div>{periode.resultatkodeVisningsnavn}</div>
                    {periode.klageOmgjøringDetaljer?.resultatFraVedtak && (
                        <VedtakLenke vedtaksid={periode.klageOmgjøringDetaljer?.resultatFraVedtak} />
                    )}
                </div>
            </Table.DataCell>
        </>
    );
};

export const GammelVersjonAvBeregningVarsel = () => {
    const { data: beregning } = useGetBeregningBidrag(false);
    const { lesemodus } = useBehandlingProvider();
    const { bidragBeregningV2, isAdminEnabled } = useFeatureToogle();
    if (!lesemodus && isAdminEnabled && !bidragBeregningV2 && beregning.resultat?.resultatBarn?.length === 1) {
        return (
            <Alert variant="info" size="small">
                <Heading size="xsmall">Eldre versjon av beregning</Heading>
                Eldre versjon av beregningen er brukt. Beregningen tar ikke hensyn til forholdsmessig fordeling når
                flere barn er med i beregningen.
            </Alert>
        );
    }
};
export const KanFatteVedtakVarsel = () => {
    const { data: beregning } = useGetBeregningBidrag(false);
    const kanFatteVedtakBegrunnelse = beregning?.resultat?.kanFatteVedtakBegrunnelse;
    if (kanFatteVedtakBegrunnelse === undefined) return null;
    return (
        <Alert variant="warning" size="small">
            <Heading size="xsmall">Kan ikke fatte vedtak</Heading>
            <BodyShort size="small" className="w-max">
                {kanFatteVedtakBegrunnelse}
            </BodyShort>
        </Alert>
    );
};

export const ForholdsmessigFordelingVarsel = () => {
    const { data: beregning } = useGetBeregningBidrag(false);
    const { bidragBeregningV2, bidragFlereBarn } = useFeatureToogle();
    if (bidragFlereBarn && !bidragBeregningV2 && beregning.resultat?.resultatBarn?.length > 1) {
        return (
            <Alert variant="info" size="small">
                <Heading size="xsmall">Ufullstendig beregning</Heading>
                Eldre versjon av beregningen er brukt. Beregningen tar ikke hensyn til forholdsmessig fordeling når
                flere barn er med i beregningen.
            </Alert>
        );
    }
    if (!bidragBeregningV2 || !bidragFlereBarn) return null;

    const minstEnPeriodeHarSlåttUtTilFF = beregning?.resultat?.minstEnPeriodeHarSlåttUtTilFF;

    const enPeriodeHarSlåttUtTilFFPga25Prosent = beregning?.resultat?.perioderSlåttUtTilFF?.some(
        (b) => b.erEvneJustertNedTil25ProsentAvInntekt,
    );
    const enPeriodeHarSlåttUtTilFFPgaRedusertEvne = beregning?.resultat?.perioderSlåttUtTilFF?.some(
        (b) => !b.erEvneJustertNedTil25ProsentAvInntekt,
    );
    if (!minstEnPeriodeHarSlåttUtTilFF) return null;
    return (
        <Alert variant="info" size="small">
            <Heading size="xsmall">Forholdsmessig fordeling</Heading>
            <BodyShort size="small" className="w-max">
                {enPeriodeHarSlåttUtTilFFPga25Prosent
                    ? "BPs totale andel av U overstiger 25% av inntekten. Bidraget er derfor forholdsmessig fordelt i minst en av periodene"
                    : enPeriodeHarSlåttUtTilFFPgaRedusertEvne &&
                      "BP har ikke full bidragsevne. Bidraget er derfor forholdsmessig fordelt i minst en av periodene"}
            </BodyShort>
        </Alert>
    );
};
export const VedtakResultatBarn = ({ barn }: { barn: ResultatRolle }) => (
    <div className="my-4 flex items-center gap-x-2">
        <RolleTag
            rolleType={RolleTypeAbbreviation.BA}
            ident={barn.ident}
            stønad18År={barn.stønadstype === Stonadstype.BIDRAG18AAR}
        />
        <BodyShort>
            <PersonNavnIdent
                ident={barn.ident}
                navn={barn.navn}
                variant="compact"
                stønad18År={barn.stønadstype === Stonadstype.BIDRAG18AAR}
            />
        </BodyShort>
    </div>
);
export const VedtakTableHeader = ({
    resultatBarn,
    avslag = false,
    avvistAldersjustering = false,
    resultatUtenBeregning = false,
    bareVisResultat = false,
    orkestrertVedtak = false,
    manuellAldersjustering = false,
}: {
    resultatBarn?: ResultatBidragsberegningBarnDto;
    avslag: boolean;
    avvistAldersjustering: boolean;
    resultatUtenBeregning: boolean;
    bareVisResultat?: boolean;
    orkestrertVedtak?: boolean;
    manuellAldersjustering?: boolean;
}) => {
    const { erBisysVedtak, vedtakstype } = useGetBehandlingV2();
    const visEvne = erBisysVedtak || vedtakstype !== Vedtakstype.ALDERSJUSTERING;
    function renderRows() {
        if (avvistAldersjustering) {
            return (
                <Table.Row>
                    <Table.HeaderCell textSize="small" scope="col">
                        {text.label.periode}
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" scope="col">
                        {text.label.resultat}
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" scope="col">
                        {"Aldersjusteres manuelt"}
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" scope="col">
                        {text.label.årsak}
                    </Table.HeaderCell>
                </Table.Row>
            );
        }

        if (resultatUtenBeregning || bareVisResultat)
            return (
                <Table.Row>
                    <Table.HeaderCell textSize="small" scope="col" className="w-[62%]">
                        {text.label.periode}
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" scope="col" className="w-[12%]">
                        Beløp
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" scope="col">
                        {text.label.resultat}
                    </Table.HeaderCell>
                </Table.Row>
            );

        if (avslag && !orkestrertVedtak) {
            return (
                <Table.Row>
                    <Table.HeaderCell textSize="small" scope="col">
                        {text.label.periode}
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" scope="col">
                        {text.label.resultat}
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" scope="col">
                        {text.label.årsak}
                    </Table.HeaderCell>
                </Table.Row>
            );
        }
        if (orkestrertVedtak) {
            const inneholder35C = resultatBarn?.perioder?.some((p) => p?.klageOmgjøringDetaljer?.kanOpprette35c);
            return (
                <Table.Row>
                    {inneholder35C && (
                        <Table.HeaderCell textSize="small" scope="col" className="w-[16%]">
                            Vurder ugyldighet
                        </Table.HeaderCell>
                    )}
                    <Table.HeaderCell
                        textSize="small"
                        scope="col"
                        className={manuellAldersjustering ? "w-[32%]" : "w-[52%]"}
                    >
                        {text.label.periode}
                    </Table.HeaderCell>
                    {manuellAldersjustering && (
                        <Table.HeaderCell className="w-[20%]" textSize="small">
                            {"Manuell aldersjustering"}
                        </Table.HeaderCell>
                    )}
                    <Table.HeaderCell textSize="small" scope="col" className="w-[23%]">
                        Type
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" scope="col" className="w-[12%]">
                        Beløp
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" scope="col">
                        {text.label.resultat}
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" scope="col" style={{ width: "24px" }}></Table.HeaderCell>
                </Table.Row>
            );
        }
        return (
            <Table.Row>
                <Table.HeaderCell textSize="small" scope="col" style={{ width: "350px" }}>
                    {text.label.periode}
                </Table.HeaderCell>
                <Table.HeaderCell textSize="small" scope="col" style={{ width: "80px" }}>
                    U
                </Table.HeaderCell>
                <Table.HeaderCell textSize="small" scope="col" style={{ width: "150px" }}>
                    BPs andel U
                </Table.HeaderCell>
                <Table.HeaderCell textSize="small" scope="col" style={{ width: "80px" }}>
                    Samvær
                </Table.HeaderCell>
                {visEvne && (
                    <Table.HeaderCell textSize="small" scope="col" style={{ width: "110px" }}>
                        Evne / 25%
                    </Table.HeaderCell>
                )}
                <Table.HeaderCell textSize="small" scope="col" style={{ width: "210px" }}>
                    Beregnet bidrag
                </Table.HeaderCell>
                <Table.HeaderCell textSize="small" scope="col" style={{ width: "210px" }}>
                    Endelig bidrag
                </Table.HeaderCell>
                <Table.HeaderCell textSize="small" scope="col" style={{ width: "390px" }}>
                    Resultat
                </Table.HeaderCell>
                <Table.HeaderCell textSize="small" scope="col" style={{ width: "24px" }}></Table.HeaderCell>
            </Table.Row>
        );
    }
    return <Table.Header>{renderRows()}</Table.Header>;
};

export const OpprettParagraf35cCheckbox = ({
    periode,
    resultatBarn,
}: {
    periode: ResultatBarnebidragsberegningPeriodeDto;
    resultatBarn?: ResultatBidragsberegningBarnDto;
}) => {
    const { mutate, isError: _, isPending } = useOppdaterOpprettP35c(periode);
    const { lesemodus } = useGetBehandlingV2();

    const detaljer = periode.klageOmgjøringDetaljer;
    if (!detaljer) return null;
    return (
        <Checkbox
            hideLabel
            readOnly={isPending || lesemodus !== undefined}
            size="small"
            checked={detaljer.skalOpprette35c}
            onChange={() =>
                mutate({
                    ident: resultatBarn.barn.ident,
                    vedtaksid: detaljer.resultatFraVedtak,
                    opprettP35c: !periode.klageOmgjøringDetaljer.skalOpprette35c,
                })
            }
        >
            {" "}
        </Checkbox>
    );
};
export const VedtakUgyldigBeregning = ({ resultat }: { resultat?: UgyldigBeregningDto }) => {
    if (!resultat) return null;
    return (
        <Alert variant="warning" size="small" className="mb-2">
            <Heading size="small">{resultat.tittel}</Heading>
            <BodyShort size="small">Kan ikke fatte vedtak</BodyShort>
            <BodyShort size="small">{resultat.begrunnelse}</BodyShort>
        </Alert>
    );
};
export const VelgManuellVedtakModal = ({
    barnIdent,
    aldersjusteringForÅr,
}: {
    barnIdent: string;
    aldersjusteringForÅr: number;
}) => {
    const queryClient = useQueryClient();

    const [showModal, setShowModal] = useState(false);
    return (
        <>
            <Button variant="tertiary" size="xsmall" onClick={() => setShowModal(true)}>
                Velg vedtak
            </Button>
            <Modal
                aria-label="Velg manuell vedtak"
                open={showModal}
                onClose={() => setShowModal(false)}
                closeOnBackdropClick
            >
                <Modal.Header closeButton>
                    <Heading size="medium">Velg vedtak for aldersjustering</Heading>
                </Modal.Header>
                <Modal.Body>
                    <VedtaksListeBeregning
                        barnIdent={barnIdent}
                        omgjøring
                        aldersjusteringForÅr={aldersjusteringForÅr}
                        onSelectVedtak={() =>
                            queryClient.refetchQueries({ queryKey: QueryKeys.beregnBarnebidrag(true) })
                        }
                    />
                </Modal.Body>
            </Modal>
        </>
    );
};
export const VedtakLenke = ({
    vedtaksid,
    visText = false,
    label,
}: {
    vedtaksid?: number;
    visText?: boolean;
    label?: string;
}) => {
    const { saksnummer } = useGetBehandlingV2();
    const enhet = useQueryParams().get("enhet");
    const sessionState = useQueryParams().get("sessionState");

    if (!vedtaksid) return null;
    return (
        <Link
            className="ml-auto"
            href={`/sak/${saksnummer}/vedtak/${vedtaksid}/?steg=vedtak&enhet=${enhet}&sessionState=${sessionState}`}
            target="_blank"
            rel="noreferrer"
        >
            {visText ? label || "Grunnlag fra vedtak" : ""} <ExternalLinkIcon aria-hidden />
        </Link>
    );
};
export const VedtakTableBody = ({
    resultatBarn,
    avslag,
    opphør,
    bareVisResultat = false,
    orkestrertVedtak = false,
    manuellAldersjustering = false,
    kanFatteVedtakForRevurderingsbarn = false,
    anbefalesÅFatteVedtakForRevurderingsbarn = false,
}: {
    resultatBarn: ResultatBidragsberegningBarnDto;
    avslag: boolean;
    opphør: boolean;
    kanFatteVedtakForRevurderingsbarn: boolean;
    anbefalesÅFatteVedtakForRevurderingsbarn: boolean;
    bareVisResultat?: boolean;
    orkestrertVedtak?: boolean;
    manuellAldersjustering?: boolean;
}) => {
    const { erBisysVedtak, vedtakstype } = useGetBehandlingV2();
    const lastVedtakRef = useRef<number | undefined>(undefined);
    const currentColorIndexRef = useRef(0);

    // Predefined background colors for zebra scheme
    const bgColors = ["bg-ax-neutral-300", "bg-ax-neutral-200"];

    function getRowClassName(periode: ResultatBarnebidragsberegningPeriodeDto): string {
        let classes = "border-solid border-0";
        const currentVedtak = periode.klageOmgjøringDetaljer?.resultatFraVedtak;

        // Check if vedtaksid has changed and toggle color if so
        if (currentVedtak !== lastVedtakRef.current && currentVedtak !== undefined) {
            currentColorIndexRef.current = 1 - currentColorIndexRef.current; // Toggle between 0 and 1
            lastVedtakRef.current = currentVedtak;
        }

        if (periode.klageOmgjøringDetaljer?.kanOpprette35c) {
            classes += ` ${bgColors[currentColorIndexRef.current]}`;
        }
        if (periode.klageOmgjøringDetaljer?.delAvVedtaket === false) {
            classes += " opacity-40"; // Existing opacity
            classes += ` ${bgColors[currentColorIndexRef.current]}`;
        }

        return classes.trim();
    }
    function findPeriodWithLowestFom(
        periods: ResultatBarnebidragsberegningPeriodeDto[],
    ): ResultatBarnebidragsberegningPeriodeDto | undefined {
        if (periods.length === 0) return undefined;

        // Find the minimum timestamp
        const minTimestamp = Math.min(...periods.map((p) => new Date(p.periode.fom).getTime()));

        // Find the period with that timestamp
        return periods.find((p) => new Date(p.periode.fom).getTime() === minTimestamp);
    }

    function vis35CCheckbox(periode: ResultatBarnebidragsberegningPeriodeDto) {
        if (periode.klageOmgjøringDetaljer?.kanOpprette35c === false) return false;
        const vedtaksid = periode.klageOmgjøringDetaljer.resultatFraVedtak;
        const perioderMedSammeVedtak = resultatBarn.perioder.filter(
            (p) => p.klageOmgjøringDetaljer?.resultatFraVedtak === vedtaksid,
        );
        if (perioderMedSammeVedtak.length < 2) return true;
        const førstePeriode = findPeriodWithLowestFom(perioderMedSammeVedtak);
        if (førstePeriode.periode.fom === periode.periode.fom) return true;
        return false;
    }
    function renderTable(periode: ResultatBarnebidragsberegningPeriodeDto) {
        const skjulBeregning =
            periode.beregningsdetaljer === undefined ||
            periode.erBeregnetAvslag ||
            periode.erDirekteAvslag ||
            periode.erOpphør ||
            periode.resultatKode === Resultatkode.INNVILGET_VEDTAK ||
            (!erBisysVedtak && vedtakstype === Vedtakstype.ALDERSJUSTERING);

        if (!orkestrertVedtak && periode.aldersjusteringDetaljer?.aldersjustert === false) {
            return (
                <Table.Row>
                    <Table.DataCell textSize="small">
                        {dateToDDMMYYYYString(new Date(periode.periode.fom))} -{" "}
                        {periode.periode.til ? dateToDDMMYYYYString(deductDays(new Date(periode.periode.til), 1)) : ""}
                    </Table.DataCell>
                    <Table.DataCell textSize="small">{"Avvist (Automatisk aldersjustering)"}</Table.DataCell>
                    <Table.DataCell textSize="small">
                        {periode.aldersjusteringDetaljer?.aldersjusteresManuelt ? "Ja" : "Nei"}
                    </Table.DataCell>
                    <Table.DataCell textSize="small" width="500px">
                        {periode.resultatkodeVisningsnavn}
                    </Table.DataCell>
                </Table.Row>
            );
        }

        if (resultatBarn.resultatUtenBeregning || bareVisResultat) {
            return (
                <Table.Row>
                    <Table.DataCell textSize="small">
                        {dateToDDMMYYYYString(new Date(periode.periode.fom))} -{" "}
                        {periode.periode.til ? dateToDDMMYYYYString(deductDays(new Date(periode.periode.til), 1)) : ""}
                    </Table.DataCell>
                    <Table.DataCell textSize="small">
                        {periode.erOpphør ? "-" : formatterBeløpForBeregning(periode.faktiskBidrag)}
                    </Table.DataCell>
                    <Table.DataCell textSize="small" width="500px">
                        {periode.resultatkodeVisningsnavn}
                    </Table.DataCell>
                </Table.Row>
            );
        }

        if (avslag && !orkestrertVedtak) {
            return (
                <Table.Row>
                    <Table.DataCell textSize="small">
                        {dateToDDMMYYYYString(new Date(periode.periode.fom))} -{" "}
                        {periode.periode.til ? dateToDDMMYYYYString(deductDays(new Date(periode.periode.til), 1)) : ""}
                    </Table.DataCell>
                    <Table.DataCell textSize="small">{opphør ? text.label.opphør : text.label.avslag}</Table.DataCell>
                    <Table.DataCell textSize="small">{periode.resultatkodeVisningsnavn}</Table.DataCell>
                </Table.Row>
            );
        }
        if (orkestrertVedtak) {
            const inneholder35C = resultatBarn?.perioder?.some((p) => p?.klageOmgjøringDetaljer?.kanOpprette35c);

            return (
                <Table.ExpandableRow
                    togglePlacement="right"
                    expandOnRowClick
                    className={getRowClassName(periode)}
                    expansionDisabled={skjulBeregning}
                    content={!skjulBeregning && <DetaljertBeregningBidrag periode={periode} />}
                >
                    {inneholder35C && (
                        <Table.DataCell textSize="small">
                            {vis35CCheckbox(periode) && (
                                <OpprettParagraf35cCheckbox periode={periode} resultatBarn={resultatBarn} />
                            )}
                        </Table.DataCell>
                    )}
                    <Table.DataCell textSize="small">
                        {dateToDDMMYYYYString(new Date(periode.periode.fom))} -{" "}
                        {periode.periode.til ? dateToDDMMYYYYString(deductDays(new Date(periode.periode.til), 1)) : ""}
                    </Table.DataCell>
                    {manuellAldersjustering && (
                        <Table.DataCell textSize="small">
                            {periode.klageOmgjøringDetaljer?.manuellAldersjustering ? (
                                <VelgManuellVedtakModal
                                    barnIdent={resultatBarn.barn.ident}
                                    aldersjusteringForÅr={new Date(periode.periode.fom).getFullYear()}
                                />
                            ) : (
                                ""
                            )}
                        </Table.DataCell>
                    )}
                    <Table.DataCell textSize="small">{periode.delvedtakstypeVisningsnavn}</Table.DataCell>
                    <Table.DataCell textSize="small">
                        {periode.erOpphør ? "-" : formatterBeløpForBeregning(periode.faktiskBidrag)}
                    </Table.DataCell>
                    <Table.DataCell textSize="small" width="500px">
                        <div className="flex flex-row gap-1 w-max">
                            <div>{periode.resultatkodeVisningsnavn}</div>
                            {periode.klageOmgjøringDetaljer?.resultatFraVedtak && (
                                <VedtakLenke vedtaksid={periode.klageOmgjøringDetaljer?.resultatFraVedtak} />
                            )}
                        </div>
                    </Table.DataCell>
                </Table.ExpandableRow>
            );
        }

        const periodeHarRedusertEvneIkkeSøknadsbarn =
            periode.beregningsdetaljer?.forholdsmessigFordeling?.beregningFordelingAvBidrag
                .finnesBarnMedLøpendeBidragSomIkkeErSøknadsbarn === true;
        return (
            <Table.ExpandableRow
                togglePlacement="right"
                expandOnRowClick
                className={
                    periode.klageOmgjøringDetaljer?.resultatFraVedtak || periodeHarRedusertEvneIkkeSøknadsbarn
                        ? "bg-ax-neutral-200"
                        : ""
                }
                expansionDisabled={skjulBeregning}
                content={
                    !skjulBeregning && (
                        <DetaljertBeregningBidrag
                            periode={periode}
                            anbefalesÅFatteVedtakForRevurderingsbarn={anbefalesÅFatteVedtakForRevurderingsbarn}
                            kanFatteVedtakForRevurderingsbarn={kanFatteVedtakForRevurderingsbarn}
                        />
                    )
                }
            >
                {periode.erBeregnetAvslag && !periode.erEndringUnderGrense ? (
                    <TableRowResultatAvslag periode={periode} barn={resultatBarn} />
                ) : (
                    <TableRowResultat periode={periode} />
                )}
            </Table.ExpandableRow>
        );
    }
    return (
        <Table.Body>
            {resultatBarn.perioder.map((periode) => {
                return renderTable(periode);
            })}
        </Table.Body>
    );
};
