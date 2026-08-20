import { BodyShort, Heading, Table } from "@navikt/ds-react";
import type { ReactElement } from "react";

//file:@ts-expect-error
interface CalculationTableData {
    label: string | ReactElement;
    labelBold?: boolean;
    value?: string | number | ReactElement;
    result: string | number | ReactElement;
}

interface CalculationTableProps {
    data: CalculationTableData[]; // Array of data objects
    title?: string;
    zebraStripes?: boolean;
    titleLink?: string | ReactElement;
    result?: {
        label: string;
        value: string | number | ReactElement;
    };
    message?: string | ReactElement;
    className?: string;
}

export const CalculationTabell: React.FC<CalculationTableProps> = ({
    data,
    title,
    result,
    message,
    className,
    titleLink,
    zebraStripes = true,
}) => {
    const harBeregning = data.some((d) => d.value);
    return (
        <div className={className}>
            <>
                {title && (
                    <Heading as="h4" className="inline-block align-middle" size="xsmall">
                        {title}
                    </Heading>
                )}
                {titleLink}
            </>
            <Table size="small" zebraStripes={zebraStripes} className="w-full">
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell textSize="small" className="w-[250px]">
                            Beskrivelse
                        </Table.HeaderCell>
                        {harBeregning && (
                            <Table.HeaderCell textSize="small" align="right" className="w-[150px]">
                                Beregning
                            </Table.HeaderCell>
                        )}
                        <Table.HeaderCell textSize="small" align="right" className="w-[150px]">
                            Beløp
                        </Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {data.map((row, rowIndex) => (
                        <Table.Row key={rowIndex}>
                            <Table.DataCell textSize="small" className={`${row.labelBold ? "font-ax-bold" : ""}`}>
                                {row.label}
                            </Table.DataCell>
                            {harBeregning && (
                                <Table.DataCell textSize="small" align="right">
                                    {row.value}
                                </Table.DataCell>
                            )}
                            <Table.DataCell textSize="small" align="right">
                                {row.result}
                            </Table.DataCell>
                        </Table.Row>
                    ))}
                    {result && (
                        <Table.Row>
                            <Table.DataCell textSize="small" colSpan={harBeregning ? 2 : 1}>
                                <span className="font-ax-bold">{result.label}</span>
                            </Table.DataCell>
                            <Table.DataCell textSize="small" align="right">
                                {result.value}
                            </Table.DataCell>
                        </Table.Row>
                    )}
                    {message && (
                        <Table.Row className="mt-1">
                            <Table.DataCell textSize="small" colSpan={3}>
                                {message}
                            </Table.DataCell>
                        </Table.Row>
                    )}
                </Table.Body>
            </Table>
        </div>
    );
};

interface MathDivisionProps {
    negativeValue?: boolean;
    top: string;
    bottom: number | string;
}

export const MathDivision: React.FC<MathDivisionProps> = ({ negativeValue, top, bottom }) => {
    return (
        <BodyShort as="span" size="small">
            {negativeValue && <span>-</span>}
            <span>{top}</span>
            <span> &#247;</span> {/* Multiplication symbol */}
            <span>{bottom}</span>
        </BodyShort>
    );
};

export const MathValue: React.FC<{ value: string | number; negativeValue?: boolean }> = ({ value, negativeValue }) => {
    return (
        <BodyShort as="span" size="small">
            {negativeValue && <span>-</span>}
            <span>{value}</span>
        </BodyShort>
    );
};
interface MathMultiplicationProps {
    negativeValue?: boolean;
    left: string;
    right: string | number;
}

export const MathMultiplication: React.FC<MathMultiplicationProps> = ({ negativeValue, left, right }) => {
    return (
        <BodyShort as="span" size="small">
            {negativeValue && <span>-</span>}
            <span>{left}</span>
            <span> &#xD7;</span> {/* Multiplication symbol */}
            <span>{right}</span>
        </BodyShort>
    );
};
