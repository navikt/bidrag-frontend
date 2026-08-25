import { dateToDDMMYYYYString } from "@bidrag/common";
import { BodyShort } from "@navikt/ds-react";
import { addMonthsIgnoreDay, firstDayOfMonth, isAfterDate } from "../../../utils/date-utils";
import { formatterBeløp } from "../../../utils/number-utils";
import type { InntektFormPeriode } from "../../types/inntektFormValues";

export const ExpandableContent = ({
    item,
    showInnteksposter = false,
    showLøpendeTilOgMed = false,
}: {
    item: InntektFormPeriode;
    showInnteksposter?: boolean;
    showLøpendeTilOgMed?: boolean;
}) => {
    const tilOgMedDato = () => {
        if (!item.opprinneligTom) {
            return null;
        }
        const tilOgMed = new Date(item.opprinneligTom);
        const startOfNextMonth = firstDayOfMonth(addMonthsIgnoreDay(new Date(), 1));
        if (!showLøpendeTilOgMed && isAfterDate(tilOgMed, startOfNextMonth)) {
            return null;
        }
        return dateToDDMMYYYYString(new Date(item.opprinneligTom));
    };
    return (
        <>
            <BodyShort size="small">
                Periode: {item.opprinneligFom && dateToDDMMYYYYString(new Date(item.opprinneligFom))} - {tilOgMedDato()}
            </BodyShort>
            {showInnteksposter && (
                <dl className="bd_datadisplay">
                    {item.inntektsposter.map((inntektpost) => (
                        <BodyShort size="small" key={inntektpost.kode}>
                            <dt>{inntektpost.visningsnavn}</dt>
                            <dd>{formatterBeløp(inntektpost.beløp)}</dd>
                        </BodyShort>
                    ))}
                </dl>
            )}
        </>
    );
};
