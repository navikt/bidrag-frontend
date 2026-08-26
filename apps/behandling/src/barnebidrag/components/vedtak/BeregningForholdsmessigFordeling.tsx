import { PersonNavn } from "@bidrag/common";
import { BodyShort, Box, Heading, Table, VStack } from "@navikt/ds-react";

import {
    BpsBeregnedeTotalbidragTabell,
    BpsPrivatAvtalerTabell,
    BpsPrivatAvtalerTabellIkkeTilFordeling,
} from "../../../common/components/vedtak/BpsBeregnedeTotalbidragTabell";
import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import { useGetBehandlingV2 } from "../../../common/hooks/useApiData";
import { formatterBeløpForBeregning, formatterProsent } from "../../../utils/number-utils";
import { useBidragBeregningPeriode } from "./DetaljertBeregningBidrag";

export const BeregningForholdsmessigFordelingRevurdering = () => {
    const {
        kanFatteVedtakForRevurderingsbarn,
        periode: { erSistePeriode },
        beregningsdetaljer: { sluttberegning, delberegningBidragsevne, forholdsmessigFordeling },
    } = useBidragBeregningPeriode();
    const { forholdsmessigFordeling: ffBehandling } = useGetBehandlingV2();
    if (!ffBehandling) return null;
    if (!forholdsmessigFordeling) return null;
    if (!forholdsmessigFordeling.beregningFordelingAvBidragSjekkEvnesprekk) return null;

    const beregningFordelingAvBidrag = forholdsmessigFordeling.beregningFordelingAvBidragSjekkEvnesprekk!;

    const bpsSumAndelAvU = beregningFordelingAvBidrag?.sumBidragTilFordeling ?? sluttberegning.bpSumAndelAvU ?? 0;

    const sumAndreBarn =
        beregningFordelingAvBidrag.sumBidragTilFordelingIkkeSøknadsbarn +
        beregningFordelingAvBidrag.sumBidragTilFordelingPrivatAvtale;

    const finnesPriorierteBidrag = beregningFordelingAvBidrag.sumBidragSomIkkeKanFordeles > 0;

    const evne = Math.min(delberegningBidragsevne.bidragsevne, delberegningBidragsevne.sumInntekt25Prosent);
    const harNokEvne = evne >= beregningFordelingAvBidrag.sumBidragTilFordeling;
    const redusertTil25ProsentAvInntekt = sluttberegning?.bidragJustertNedTil25ProsentAvInntekt;
    function renderTekst() {
        const evneTekst = harNokEvne
            ? `Evnen på ${formatterBeløpForBeregning(evne)} er tilstrekkelig for å dekke total andel av U på ${formatterBeløpForBeregning(beregningFordelingAvBidrag.sumBidragTilFordeling)}.`
            : `Evnen på ${formatterBeløpForBeregning(evne)} er ikke tilstrekkelig for å dekke total andel av U på ${formatterBeløpForBeregning(beregningFordelingAvBidrag.sumBidragTilFordeling)}.`;
        const tekstForholdsmessigFordeles =
            redusertTil25ProsentAvInntekt && harNokEvne
                ? "Det nye beregnede bidraget overstiger 25 prosent av inntekten. Bidraget vil derfor forholdsmessig fordeles."
                : harNokEvne
                  ? "Bidraget vil derfor ikke forholdsmessig fordeles."
                  : "Bidraget vil derfor forholdsmessig fordeles.";
        return (
            <BodyShort size="small" className="mt-2">
                {!harNokEvne
                    ? `${evneTekst}${erSistePeriode ? ` ${tekstForholdsmessigFordeles}` : ""}`
                    : `${evneTekst}${erSistePeriode ? ` ${tekstForholdsmessigFordeles}` : ""}`}
            </BodyShort>
        );
    }

    function renderFFBeregning() {
        if (!kanFatteVedtakForRevurderingsbarn) {
            return (
                <>
                    {forholdsmessigFordeling.beregningFordelingAvBidrag
                        ?.finnesBarnMedLøpendeBidragSomIkkeErSøknadsbarn && (
                        <ResultatDescription
                            title="Forholdsmessig fordeling"
                            className="pb-8"
                            data={[
                                forholdsmessigFordeling.beregningFordelingAvBidrag
                                    ?.finnesBarnMedLøpendeBidragSomIkkeErSøknadsbarn && {
                                    label: "BPs totale underholdskostnad",
                                    textRight: false,
                                    labelBold: true,
                                    value: `${formatterBeløpForBeregning(sumAndreBarn)} + ${formatterBeløpForBeregning(beregningFordelingAvBidrag.sumBidragTilFordelingSøknadsbarn)}`,
                                    result: `${formatterBeløpForBeregning(beregningFordelingAvBidrag.sumBidragTilFordeling)}`,
                                },

                                finnesPriorierteBidrag && {
                                    label: "BPs evne som kan fordeles",
                                    textRight: false,
                                    labelBold: true,
                                    value: `${formatterBeløpForBeregning(delberegningBidragsevne.bidragsevne)} - ${formatterBeløpForBeregning(beregningFordelingAvBidrag.sumPrioriterteBidragTilFordeling)}`,
                                    result: `${formatterBeløpForBeregning(forholdsmessigFordeling.evneJustertForPrioriterteBidrag)}`,
                                },
                            ].filter((d) => d)}
                        />
                    )}
                    <BodyShort size="small" className="mt-2">
                        Evnen på {formatterBeløpForBeregning(evne)} er tilstrekkelig for å dekke total andel av U på{" "}
                        {formatterBeløpForBeregning(beregningFordelingAvBidrag.sumBidragTilFordeling)}. Det vil derfor
                        ikke fattes vedtak for revurderingsbarn.
                    </BodyShort>
                </>
            );
        }
        return (
            <>
                <ResultatDescription
                    title="Forholdsmessig fordeling"
                    data={[
                        !forholdsmessigFordeling && {
                            label: "BPs totale underholdskostnad",
                            textRight: false,
                            labelBold: true,
                            value: `${formatterBeløpForBeregning(bpsSumAndelAvU)}`,
                        },
                        {
                            label: "BPs totale underholdskostnad",
                            textRight: false,
                            labelBold: true,
                            value: `${formatterBeløpForBeregning(sumAndreBarn)} + ${formatterBeløpForBeregning(beregningFordelingAvBidrag.sumBidragTilFordelingSøknadsbarn)}`,
                            result: `${formatterBeløpForBeregning(beregningFordelingAvBidrag.sumBidragTilFordeling)}`,
                        },
                    ].filter((d) => d)}
                />

                {renderTekst()}
            </>
        );
    }
    return (
        <>
            <ForholdsmessigFordelingBeregningAndreBarn nyBeregningRevurdering={true} />
            <ForholdsmessigFordelingSøknadsbarn nyBeregningRevurdering={true} />
            {renderFFBeregning()}
        </>
    );
};
export const BeregningForholdsmessigFordeling = () => {
    const { forholdsmessigFordeling: ffBehandling, roller } = useGetBehandlingV2();
    const {
        kanFatteVedtakForRevurderingsbarn,
        beregningsdetaljer: { sluttberegning, forholdsmessigFordeling },
    } = useBidragBeregningPeriode();
    if (!forholdsmessigFordeling) return null;
    const inneholderRevurderingsbarn = roller.some((r) => r.erRevurdering);
    const periodeInneholderRevurderingsbarn =
        forholdsmessigFordeling.beregningFordelingAvBidrag.bidragTilFordelingAlle.some(
            (r) => r.erSøknadsbarn && r.barn.erRevurderingsbarn,
        );
    const foreløpigBidragSøknadsbarn =
        forholdsmessigFordeling?.bidragEtterFordeling ?? sluttberegning.bruttoBidragJustertForEvneOg25Prosent ?? 0;

    // TODO: Og sjekk om det er siste periode
    if (ffBehandling && periodeInneholderRevurderingsbarn && kanFatteVedtakForRevurderingsbarn) {
        return (
            <VStack gap="space-6">
                <Box
                    background="neutral-soft"
                    borderColor="neutral-subtle"
                    borderWidth="1"
                    borderRadius="4"
                    padding="space-4"
                >
                    <VStack gap="space-4">
                        <Heading level="3" size="xsmall">
                            {forholdsmessigFordeling.beregningFordelingAvBidrag
                                .finnesBarnMedLøpendeBidragSomIkkeErSøknadsbarn
                                ? "Vurdering av revurderingsbarn og andre barn mot beløpshistorikk"
                                : "Vurdering av revurderingsbarn mot beløpshistorikk"}
                        </Heading>
                        {/* <BodyShort size="small">{revurderingsbarnStatus}</BodyShort> */}
                        <BeregningForholdsmessigFordelingRevurdering />
                    </VStack>
                </Box>

                {kanFatteVedtakForRevurderingsbarn && (
                    <Box
                        background="neutral-soft"
                        borderColor="neutral-subtle"
                        borderWidth="1"
                        borderRadius="4"
                        padding="space-4"
                    >
                        <VStack gap="space-4">
                            <Heading level="3" size="xsmall">
                                {kanFatteVedtakForRevurderingsbarn
                                    ? "Beregning for søknadsbarn og revurderingsbarn"
                                    : "Beregning for søknadsbarn"}
                            </Heading>
                            <BodyShort size="small">
                                {`Foreløpig bidrag for søknadsbarn er ${formatterBeløpForBeregning(foreløpigBidragSøknadsbarn)}.`}
                            </BodyShort>
                            <BeregningForholdsmessigFordelingSøknadsbarn />
                        </VStack>
                    </Box>
                )}
            </VStack>
        );
    } else if (inneholderRevurderingsbarn && forholdsmessigFordeling.beregningFordelingAvBidragSjekkEvnesprekk) {
        return <BeregningForholdsmessigFordelingRevurdering />;
    }
    return <BeregningForholdsmessigFordelingSøknadsbarn />;
};
export const BeregningForholdsmessigFordelingSøknadsbarn = () => {
    const {
        beregningsdetaljer: { sluttberegning, bpsAndel, delberegningBidragsevne, forholdsmessigFordeling },
    } = useBidragBeregningPeriode();

    if (!forholdsmessigFordeling) return null;
    const erRedusertEvne =
        sluttberegning.bidragJustertNedTilEvne || sluttberegning.bidragJustertNedTil25ProsentAvInntekt;
    function renderResult() {
        if (sluttberegning.bidragJustertNedTil25ProsentAvInntekt) {
            return ` (redusert ned til 25% av inntekt)`;
        } else if (sluttberegning.bidragJustertNedTilEvne) {
            return ` (redusert ned til evne)`;
        }
        return "";
    }
    const bpAndelAvUVedForholdsmessigFordelingFaktor =
        sluttberegning.bpAndelAvUVedForholdsmessigFordelingFaktor ??
        forholdsmessigFordeling?.andelAvSumBidragTilFordelingFaktor;
    const bpEvneVedForholdsmessigFordeling =
        forholdsmessigFordeling?.andelAvEvneBeløp ?? sluttberegning.bpEvneVedForholdsmessigFordeling;
    const sumFordeling = forholdsmessigFordeling.beregningFordelingAvBidrag;

    const foreløpigBidrag =
        forholdsmessigFordeling?.bidragEtterFordeling ?? sluttberegning.bruttoBidragJustertForEvneOg25Prosent ?? 0;
    const bpsSumAndelAvU = sumFordeling?.sumBidragTilFordeling ?? sluttberegning.bpSumAndelAvU ?? 0;
    const andelFordeltTilBarnet = forholdsmessigFordeling?.bidragTilFordelingForBarnet ?? bpsAndel.andelBeløp ?? 0;

    const sumAndreBarn =
        sumFordeling.sumBidragTilFordelingIkkeSøknadsbarn + sumFordeling.sumBidragTilFordelingPrivatAvtale;

    const finnesPriorierteBidrag = sumFordeling.sumBidragSomIkkeKanFordeles > 0;

    const bidragTilFordelingMinusUtlandsbidrag =
        sumFordeling.sumBidragTilFordeling - sumFordeling.sumBidragSomIkkeKanFordeles;
    const evne = Math.min(delberegningBidragsevne.bidragsevne, delberegningBidragsevne.sumInntekt25Prosent);

    function renderFFBeregning() {
        if (!erRedusertEvne) {
            return (
                <>
                    {forholdsmessigFordeling.beregningFordelingAvBidrag
                        .finnesBarnMedLøpendeBidragSomIkkeErSøknadsbarn && (
                        <ResultatDescription
                            title="Forholdsmessig fordeling"
                            className="pb-8"
                            data={[
                                forholdsmessigFordeling.beregningFordelingAvBidrag
                                    .finnesBarnMedLøpendeBidragSomIkkeErSøknadsbarn && {
                                    label: "BPs totale underholdskostnad",
                                    textRight: false,
                                    labelBold: true,
                                    value: `${formatterBeløpForBeregning(sumAndreBarn)} + ${formatterBeløpForBeregning(sumFordeling.sumBidragTilFordelingSøknadsbarn)}`,
                                    result: `${formatterBeløpForBeregning(sumFordeling.sumBidragTilFordeling)}`,
                                },

                                finnesPriorierteBidrag && {
                                    label: "BPs evne som kan fordeles",
                                    textRight: false,
                                    labelBold: true,
                                    value: `${formatterBeløpForBeregning(delberegningBidragsevne.bidragsevne)} - ${formatterBeløpForBeregning(sumFordeling.sumPrioriterteBidragTilFordeling)}`,
                                    result: `${formatterBeløpForBeregning(forholdsmessigFordeling.evneJustertForPrioriterteBidrag)}`,
                                },
                            ].filter((d) => d)}
                        />
                    )}
                    <BodyShort size="small" className="mt-2">
                        Evnen på {formatterBeløpForBeregning(evne)} er tilstrekkelig for å dekke total andel av U på{" "}
                        {formatterBeløpForBeregning(sumFordeling.sumBidragTilFordeling)}
                    </BodyShort>
                </>
            );
        }

        return (
            <ResultatDescription
                title="Forholdsmessig fordeling"
                data={[
                    !forholdsmessigFordeling && {
                        label: "BPs totale underholdskostnad",
                        textRight: false,
                        labelBold: true,
                        value: `${formatterBeløpForBeregning(bpsSumAndelAvU)}`,
                    },
                    forholdsmessigFordeling.beregningFordelingAvBidrag
                        .finnesBarnMedLøpendeBidragSomIkkeErSøknadsbarn && {
                        label: "BPs totale underholdskostnad",
                        textRight: false,
                        labelBold: true,
                        value: `${formatterBeløpForBeregning(sumAndreBarn)} + ${formatterBeløpForBeregning(sumFordeling.sumBidragTilFordelingSøknadsbarn)}`,
                        result: `${formatterBeløpForBeregning(sumFordeling.sumBidragTilFordeling)}`,
                    },

                    {
                        label: "Barnets andel av underholdskostnad",
                        textRight: false,
                        labelBold: true,
                        value: `${formatterBeløpForBeregning(andelFordeltTilBarnet)} / ${formatterBeløpForBeregning(bidragTilFordelingMinusUtlandsbidrag)}`,
                        result: `${formatterProsent(bpAndelAvUVedForholdsmessigFordelingFaktor)}`,
                    },
                    finnesPriorierteBidrag && {
                        label: "BPs evne som kan fordeles",
                        textRight: false,
                        labelBold: true,
                        value: `${formatterBeløpForBeregning(delberegningBidragsevne.bidragsevne)} - ${formatterBeløpForBeregning(sumFordeling.sumPrioriterteBidragTilFordeling)}`,
                        result: `${formatterBeløpForBeregning(forholdsmessigFordeling.evneJustertForPrioriterteBidrag)}`,
                    },
                    {
                        label: "Barnets andel etter forholdsmessig fordeling",
                        textRight: false,
                        labelBold: true,
                        value: `${formatterProsent(bpAndelAvUVedForholdsmessigFordelingFaktor)} x ${formatterBeløpForBeregning(forholdsmessigFordeling.evneJustertForPrioriterteBidrag)}`,
                        result: `${formatterBeløpForBeregning(bpEvneVedForholdsmessigFordeling)}`,
                    },
                    {
                        label: "Foreløpig bidrag",
                        textRight: false,
                        labelBold: true,
                        value: ` ${formatterBeløpForBeregning(foreløpigBidrag)}${renderResult()}`,
                    },
                ].filter((d) => d)}
            />
        );
    }
    console.log("forholdsmessigFordeling", forholdsmessigFordeling);
    return (
        <>
            <ForholdsmessigFordelingBeregningAndreBarn />
            <ForholdsmessigFordelingSøknadsbarn />
            {renderFFBeregning()}
        </>
    );
};

const ForholdsmessigFordelingBeregningAndreBarn = ({
    nyBeregningRevurdering,
}: {
    nyBeregningRevurdering?: boolean;
}) => {
    const {
        beregningsdetaljer: { forholdsmessigFordeling },
        kanFatteVedtakForRevurderingsbarn,
    } = useBidragBeregningPeriode();

    const sumFordeling = nyBeregningRevurdering
        ? forholdsmessigFordeling?.beregningFordelingAvBidragSjekkEvnesprekk
        : forholdsmessigFordeling?.beregningFordelingAvBidrag;
    if (!sumFordeling || sumFordeling?.bidragTilFordelingAlle?.length === 0) return null;
    const beregningBarn = sumFordeling?.bidragTilFordelingAlle.flatMap((b) => ({
        beregnetBidragPerBarn: { ...b.beregnetBidrag, gjelderBarn: b.barn.ident },
        personidentBarn: b.barn.ident,
        erRevurderingsbarn: b.barn.erRevurderingsbarn,
        erSøknadsbarn: b.erSøknadsbarn,
        privatAvtale: b.privatAvtale,
        erBidragIkkeTilFordeling: b.erBidragSomIkkeKanFordeles,
        erUtenlandskbidrag: b.utenlandskbidrag,
    }));
    const bpsBarnIkkeSøknadsbarn = beregningBarn.filter(
        (b) =>
            !b.erSøknadsbarn && (nyBeregningRevurdering || !kanFatteVedtakForRevurderingsbarn || !b.erRevurderingsbarn),
    );

    return (
        <VStack gap={"space-2"} className="mb-2">
            <BpsPrivatAvtalerTabellIkkeTilFordeling
                beregning={bpsBarnIkkeSøknadsbarn}
                sumBidrag={sumFordeling.sumBidragSomIkkeKanFordeles}
            />
            <BpsBeregnedeTotalbidragTabell
                beregning={bpsBarnIkkeSøknadsbarn}
                bidragspliktigesBeregnedeTotalbidrag={sumFordeling.sumBidragTilFordelingIkkeSøknadsbarn}
            />

            <BpsPrivatAvtalerTabell
                beregning={bpsBarnIkkeSøknadsbarn}
                sumBidragPrivatAvtale={sumFordeling.sumBidragTilFordelingPrivatAvtale}
            />
        </VStack>
    );
};

function ForholdsmessigFordelingSøknadsbarn({ nyBeregningRevurdering = false }: { nyBeregningRevurdering?: boolean }) {
    const { forholdsmessigFordeling: ffBehandling } = useGetBehandlingV2();
    const {
        beregningsdetaljer: { forholdsmessigFordeling },
        kanFatteVedtakForRevurderingsbarn,
    } = useBidragBeregningPeriode();
    const sumFordeling = nyBeregningRevurdering
        ? forholdsmessigFordeling?.beregningFordelingAvBidragSjekkEvnesprekk
        : forholdsmessigFordeling?.beregningFordelingAvBidrag;
    if (!sumFordeling || sumFordeling?.bidragTilFordelingAlle?.length === 0) return null;

    const beregningBarn = sumFordeling?.bidragTilFordelingAlle.flatMap((b) => ({
        beregnetBidragPerBarn: { ...b.beregnetBidrag, gjelderBarn: b.barn.ident },
        personidentBarn: b.barn.ident,
        erRevurderingsbarn: b.barn.erRevurderingsbarn,
        erSøknadsbarn: b.erSøknadsbarn,
        privatAvtale: b.privatAvtale,
        erBidragIkkeTilFordeling: b.erBidragSomIkkeKanFordeles,
        erUtenlandskbidrag: b.utenlandskbidrag,
    }));
    const bpsBarnSøknadsbarn = beregningBarn.filter((b) => b.erSøknadsbarn);

    const beregningForSøknadsbarnOgRevurderingsbarn =
        ffBehandling && !nyBeregningRevurdering && kanFatteVedtakForRevurderingsbarn;

    return (
        <div
            className={
                forholdsmessigFordeling.beregningFordelingAvBidrag.finnesBarnMedLøpendeBidragSomIkkeErSøknadsbarn
                    ? "mt-2"
                    : ""
            }
        >
            <Heading size="xsmall">
                {forholdsmessigFordeling.beregningFordelingAvBidrag.finnesBarnMedLøpendeBidragSomIkkeErSøknadsbarn
                    ? !beregningForSøknadsbarnOgRevurderingsbarn
                        ? "BPs totale underholdskostnad for søknadsbarn"
                        : "BPs totale underholdskostnad for søknadsbarn og revurderingsbarn"
                    : "BPs totale underholdskostnad"}
            </Heading>
            <Table size="small" zebraStripes={true} className="w-full">
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell textSize="small" className="w-[70%]">
                            Barn
                        </Table.HeaderCell>
                        <Table.HeaderCell textSize="small" align="right">
                            Andel U
                        </Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {bpsBarnSøknadsbarn.map(({ beregnetBidragPerBarn: row, personidentBarn }) => (
                        <Table.Row key={personidentBarn}>
                            <Table.DataCell textSize="small">
                                <PersonNavn ident={personidentBarn} />
                            </Table.DataCell>

                            <Table.DataCell textSize="small" align="right">
                                {`${formatterBeløpForBeregning(row.beregnetBidrag)}`}
                            </Table.DataCell>
                        </Table.Row>
                    ))}

                    <Table.Row className="!bg-inherit">
                        <Table.DataCell textSize="small" colSpan={1} align="right" className="font-ax-bold">
                            <span className="font-ax-bold">{"Sum:"}</span>
                        </Table.DataCell>

                        <Table.DataCell textSize="small" align="right" className="w-[7%]">
                            {formatterBeløpForBeregning(sumFordeling.sumBidragTilFordelingSøknadsbarn, true)}
                        </Table.DataCell>
                    </Table.Row>
                </Table.Body>
            </Table>
        </div>
    );
}
