import { type ManuellVedtakDto, Vedtakstype } from "@bidrag/api/BidragBehandlingApiV1";
import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Alert, BodyShort, Checkbox, Link, Table } from "@navikt/ds-react";
import { useState } from "react";
import { OverlayLoader } from "../../common/components/OverlayLoader";
import text from "../../common/constants/texts";
import { useBehandlingProvider } from "../../common/context/BehandlingContext";
import { useGetBehandlingV2, useGetBeregningBidrag, useOppdaterManuelleVedtak } from "../../common/hooks/useApiData";
import { DateToDDMMYYYYString, dateOrNull } from "../../utils/date-utils";

const omgjøringsvedtakFiktivVedtaksid = -1;
type VedtaksListeProps = {
    barnIdent: string;
    aldersjusteringForÅr?: number;
    onSelectVedtak?: () => void;
    omgjøring: boolean;
};
export const VedtaksListeBeregning = (props: VedtaksListeProps) => {
    const { data: beregning } = useGetBeregningBidrag(true);
    const { virkningstidspunktV3: virkningstidspunkt, vedtakstype } = useGetBehandlingV2();
    const selectedBarn = virkningstidspunkt.barn.find(({ rolle }) => rolle.ident === props.barnIdent);
    const barn = beregning.resultat?.resultatBarn?.find((b) => b.barn.ident === props.barnIdent);

    const grunnlagFraVedtak = barn?.barn?.grunnlagFraVedtak?.find(
        (g) => g.aldersjusteringForÅr === props.aldersjusteringForÅr,
    );
    const vedtaksid =
        grunnlagFraVedtak?.grunnlagFraOmgjøringsvedtak === true
            ? omgjøringsvedtakFiktivVedtaksid
            : grunnlagFraVedtak?.vedtak;

    const omgjøringsVedtak = [
        {
            vedtaksid: omgjøringsvedtakFiktivVedtaksid,
            vedtakstype,
            søknadstype: vedtakstype === Vedtakstype.KLAGE ? "Klage" : "Omgjøring",
            virkningsDato: selectedBarn.virkningstidspunkt,
            resultatSistePeriode: vedtakstype === Vedtakstype.KLAGE ? "Klagevedtak" : "Omgjøringsvedtak",
        } as ManuellVedtakDto,
    ];
    const omgjøringsvedtak = props.omgjøring ? omgjøringsVedtak : [];
    return (
        <VedtaksListe
            {...props}
            valgVedtak={vedtaksid ?? selectedBarn?.grunnlagFraVedtak}
            vedtaksLista={omgjøringsvedtak.concat(
                selectedBarn.manuelleVedtak.filter((p) => {
                    if (!props.omgjøring) return true;
                    const fattetDate = new Date(p.fattetTidspunkt);
                    const cutoffDate = new Date(`${props.aldersjusteringForÅr}-07-01`);
                    return fattetDate < cutoffDate;
                }),
            )}
        />
    );
};

export const VedtaksListeVirkningstidspunkt = (props: VedtaksListeProps) => {
    const { virkningstidspunktV3, vedtakstype } = useGetBehandlingV2();
    const selectedBarn = virkningstidspunktV3.barn.find(({ rolle }) => rolle.ident === props.barnIdent);

    if (![Vedtakstype.ALDERSJUSTERING].includes(vedtakstype)) return null;

    return (
        <VedtaksListe
            {...props}
            vedtaksLista={selectedBarn.manuelleVedtak}
            valgVedtak={selectedBarn.grunnlagFraVedtak}
        />
    );
};

export const VedtaksListe = ({
    barnIdent,
    aldersjusteringForÅr,
    onSelectVedtak,
    vedtaksLista,
    valgVedtak,
}: VedtaksListeProps & { vedtaksLista: ManuellVedtakDto[]; valgVedtak?: number }) => {
    const { virkningstidspunktV3: virkningstidspunkt, saksnummer } = useGetBehandlingV2();
    const selectedBarn = virkningstidspunkt.barn.find(({ rolle }) => rolle.ident === barnIdent);
    const { lesemodus } = useBehandlingProvider();
    const { mutate, isError: mutationError, isPending } = useOppdaterManuelleVedtak(onSelectVedtak);
    const [val, setVal] = useState<number>(valgVedtak);

    const onSelect = (vedtaksid: number, checked: boolean) => {
        const updatedValue = checked ? vedtaksid : null;
        const grunnlagFraOmgjøringsvedtak = updatedValue === omgjøringsvedtakFiktivVedtaksid;
        setVal(grunnlagFraOmgjøringsvedtak ? omgjøringsvedtakFiktivVedtaksid : updatedValue);
        mutate({
            barnId: selectedBarn.rolle.id,
            vedtaksid: grunnlagFraOmgjøringsvedtak ? null : updatedValue,
            aldersjusteringForÅr,
            grunnlagFraOmgjøringsvedtak,
        });
    };

    return (
        <div>
            <BodyShort size="small" weight="semibold" className="mb-2 mt-4">
                {text.description.velgVedtak}
            </BodyShort>
            <div className={`${isPending ? "relative" : "inherit"} block overflow-x-auto whitespace-nowrap`}>
                <OverlayLoader loading={isPending} />
                <Table size="small" zebraStripes>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell scope="col"></Table.HeaderCell>
                            <Table.HeaderCell scope="col" textSize="small">
                                Virkingsdato
                            </Table.HeaderCell>
                            <Table.HeaderCell scope="col" textSize="small">
                                Vedtaksdato
                            </Table.HeaderCell>
                            <Table.HeaderCell scope="col" textSize="small">
                                Søknadstype
                            </Table.HeaderCell>
                            <Table.HeaderCell scope="col" textSize="small">
                                Resultat siste periode
                            </Table.HeaderCell>
                            <Table.HeaderCell scope="col" textSize="small">
                                Vedtak
                            </Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {vedtaksLista.map((vedtak) => (
                            <Table.Row key={vedtak.vedtaksid}>
                                <Table.HeaderCell scope="row">
                                    <Checkbox
                                        hideLabel
                                        value={vedtak.vedtaksid}
                                        checked={val === vedtak.vedtaksid}
                                        onChange={(e) => onSelect(vedtak.vedtaksid, e.target.checked)}
                                        size="small"
                                        readOnly={lesemodus}
                                    >
                                        {vedtak.vedtaksid}
                                    </Checkbox>
                                </Table.HeaderCell>
                                <Table.DataCell>
                                    {DateToDDMMYYYYString(dateOrNull(vedtak.virkningsDato))}
                                </Table.DataCell>
                                <Table.DataCell>
                                    {DateToDDMMYYYYString(dateOrNull(vedtak.fattetTidspunkt))}
                                </Table.DataCell>
                                <Table.DataCell>{vedtak.søknadstype}</Table.DataCell>
                                <Table.DataCell>{vedtak.resultatSistePeriode}</Table.DataCell>
                                <Table.DataCell>
                                    {vedtak.vedtaksid !== omgjøringsvedtakFiktivVedtaksid && (
                                        <Link
                                            variant="action"
                                            href={`/sak/${saksnummer}/vedtak/${vedtak.vedtaksid}/?steg=vedtak`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLinkIcon title="vedtak lenken" fontSize="1.5rem" />
                                        </Link>
                                    )}
                                </Table.DataCell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </div>
            {mutationError && <Alert variant="error">{text.error.feilVedOppdatering}</Alert>}
        </div>
    );
};
