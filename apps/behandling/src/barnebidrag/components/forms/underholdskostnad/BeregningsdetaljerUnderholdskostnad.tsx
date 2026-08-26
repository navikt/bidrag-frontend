import { InntektBelopstype, type UnderholdskostnadPeriodeBeregningsdetaljer } from "@bidrag/api/BidragBehandlingApiV1";
import { PersonNavn } from "@bidrag/common";
import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Link, VStack } from "@navikt/ds-react";
import { CalculationTabell } from "../../../../common/components/vedtak/CalculationTable";
import { ResultatDescription } from "../../../../common/components/vedtak/ResultatDescription";
import { formatterBeløpForBeregning, formatterProsent } from "../../../../utils/number-utils";

export default function BeregningsdetaljerUnderholdskostnad({
    detaljer,
}: {
    detaljer: UnderholdskostnadPeriodeBeregningsdetaljer;
}) {
    if (detaljer?.tilsynsutgifterBarn === undefined) return null;
    const tilleggstønad = detaljer.tilsynsutgifterBarn?.filter((b) => b.tilleggsstønadBeløp !== undefined) ?? [];
    const antallBarnBMBeregnetErUlikAntallBarnBMUnderTolvÅr =
        detaljer.antallBarnBMBeregnet !== detaljer.antallBarnBMUnderTolvÅr;
    const antallBarnBMBeregnetErUlikAntallBarnMedUtgifter =
        detaljer.antallBarnBMBeregnet !== detaljer.antallBarnMedTilsynsutgifter;
    return (
        <VStack className="w-[700px]" gap="space-4">
            <ResultatDescription
                data={[
                    {
                        label: "Antall barn under 12 år",
                        textRight: false,
                        value: `${formatterBeløpForBeregning(detaljer.antallBarnBMUnderTolvÅr)}`,
                    },
                    antallBarnBMBeregnetErUlikAntallBarnMedUtgifter && {
                        label: "Antall barn med tilsynsutgifter",
                        textRight: false,
                        value: `${formatterBeløpForBeregning(detaljer.antallBarnMedTilsynsutgifter)}`,
                    },
                    antallBarnBMBeregnetErUlikAntallBarnBMUnderTolvÅr && {
                        label: "Antall barn over 12 år med tilsynsutgifter",
                        textRight: false,
                        value: `${formatterBeløpForBeregning(detaljer.antallBarnBMOver12ÅrMedTilsynsutgifter)}`,
                    },
                    antallBarnBMBeregnetErUlikAntallBarnBMUnderTolvÅr && {
                        label: "Antall barn i beregningen",
                        textRight: false,
                        value: `${formatterBeløpForBeregning(detaljer.antallBarnBMBeregnet)}`,
                    },
                ].filter((d) => d)}
            />
            {tilleggstønad.length > 0 && (
                <CalculationTabell
                    title="Faktisk Tilsynsutgifter"
                    data={
                        detaljer.tilsynsutgifterBarn
                            ?.flatMap((b) => [
                                {
                                    label: <PersonNavn navn={b.gjelderBarn.navn} />,
                                    value: `(${formatterBeløpForBeregning(b.totalTilsynsutgift)} - ${formatterBeløpForBeregning(b.kostpenger)}) x 11/12`,
                                    result: formatterBeløpForBeregning(b.faktiskUtgiftBeregnet),
                                },
                            ])
                            .filter((d) => d) ?? []
                    }
                />
            )}
            {tilleggstønad.length > 0 && (
                <CalculationTabell
                    title="Tilleggsstønad"
                    data={detaljer.tilsynsutgifterBarn
                        ?.filter((b) => b.tilleggsstønadBeløp !== undefined)
                        .map((b) => ({
                            label: <PersonNavn navn={b.gjelderBarn.navn} />,
                            value:
                                b.beløpstype === InntektBelopstype.DAGSATS
                                    ? `(${formatterBeløpForBeregning(b.tilleggsstønadBeløp)} x 260) / 12 x 11 / 12`
                                    : `${formatterBeløpForBeregning(b.tilleggsstønadBeløp)} x 11 / 12`,
                            result: formatterBeløpForBeregning(b.tilleggsstønad),
                        }))
                        .filter((d) => d)}
                />
            )}
            <CalculationTabell
                title="Tilsynsutgifter"
                data={
                    detaljer.tilsynsutgifterBarn
                        ?.flatMap((b) => [
                            {
                                label: <PersonNavn navn={b.gjelderBarn.navn} />,
                                value: b.tilleggsstønad
                                    ? `${formatterBeløpForBeregning(b.faktiskUtgiftBeregnet)} - ${formatterBeløpForBeregning(b.tilleggsstønad)}`
                                    : undefined,
                                result: formatterBeløpForBeregning(b.beløp),
                            },
                        ])
                        .filter((d) => d) ?? []
                }
                result={{
                    label: "Total",
                    value: `${formatterBeløpForBeregning(detaljer.sumTilsynsutgifter)}`,
                }}
            />

            {detaljer.erBegrensetAvMaksTilsyn && (
                <ResultatDescription
                    data={[
                        {
                            label: "Totalbeløp begrenset av maks tilsynsutgift",
                            textRight: false,
                            labelBold: true,
                            value: `${formatterBeløpForBeregning(detaljer.totalTilsynsutgift)}`,
                        },
                        {
                            label: "Andel søknadsbarn",
                            textRight: false,
                            labelBold: true,
                            value: `${formatterBeløpForBeregning(detaljer.bruttoTilsynsutgift)} / ${formatterBeløpForBeregning(detaljer.sumTilsynsutgifter)} = ${formatterProsent(detaljer.fordelingFaktor)}`,
                        },
                    ].filter((d) => d)}
                />
            )}
            <CalculationTabell
                title="Skattefradrag"
                titleLink={
                    <Link
                        className="pl-2 align-middle"
                        inlineText
                        href="https://lovdata.no/pro/#document/NAV/rundskriv/v1-55-02"
                        target="_blank"
                        rel="noreferrer noopener"
                    >
                        {"Rundskriv"} <ExternalLinkIcon aria-hidden />
                    </Link>
                }
                data={[
                    {
                        label: "Maks fradrag",
                        value: `${formatterBeløpForBeregning(detaljer.sjablonMaksFradrag)} X ${formatterProsent(detaljer.skattesatsFaktor)}`,
                        result: formatterBeløpForBeregning(detaljer.skattefradragMaksFradrag),
                    },
                    {
                        label: "Total tilsynsutgift",
                        value: `${formatterBeløpForBeregning(detaljer.totalTilsynsutgift)} X ${formatterProsent(detaljer.skattesatsFaktor)}`,
                        result: formatterBeløpForBeregning(detaljer.skattefradragTotalTilsynsutgift),
                    },
                ].filter((d) => d)}
                result={{
                    label: "Skattefradrag (laveste verdi)",
                    value: `${formatterBeløpForBeregning(detaljer.skattefradrag)}`,
                }}
            />
            <CalculationTabell
                title="Beregnet tilsynsutgifter"
                data={[
                    {
                        label: "Brutto beløp",
                        value: detaljer.erBegrensetAvMaksTilsyn
                            ? `${formatterBeløpForBeregning(detaljer.totalTilsynsutgift)} x ${formatterProsent(detaljer.fordelingFaktor)}`
                            : undefined,
                        result: `${formatterBeløpForBeregning(detaljer.justertBruttoTilsynsutgift)}`,
                    },
                    {
                        label: "Skattefradrag (per barn)",
                        value: `${formatterBeløpForBeregning(detaljer.skattefradrag)} / ${formatterBeløpForBeregning(detaljer.antallBarnMedTilsynsutgifter)}`,
                        result: `- ${formatterBeløpForBeregning(detaljer.skattefradragPerBarn)}`,
                    },
                ].filter((d) => d)}
                result={{
                    label: "Resultat",
                    value: `${formatterBeløpForBeregning(detaljer.nettoTilsynsutgift)}`,
                }}
            />
        </VStack>
    );
}
