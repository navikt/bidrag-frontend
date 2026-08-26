import { BodyShort, Heading } from "@navikt/ds-react";
import type { ReactElement } from "react";

interface TableData {
    label?: string | number | ReactElement;
    labelBold?: boolean;
    value?: string | number | ReactElement;
    result?: string | number | ReactElement;
    textRight?: boolean;
}
interface GenericTableProps {
    data: TableData[]; // Array of data objects
    title?: string;
    className?: string;
}

export const ResultatDescription: React.FC<GenericTableProps> = ({ data, title, className }) => {
    const harResultat = data.some((d) => d.result);
    return (
        <div>
            {title && <Heading size="xsmall">{title}</Heading>}
            <table>
                <BodyShort as="tbody" size="small" className={className}>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.label && (
                                <td
                                    style={{ paddingRight: "8px" }}
                                    className={`${row.labelBold ? "font-ax-bold" : ""}`}
                                >
                                    {row.label}:{" "}
                                </td>
                            )}
                            <td
                                colSpan={!row.label && !row.result ? 3 : !row.label ? 2 : 1}
                                className={row.textRight === false ? "text-left" : "text-right"}
                            >
                                {row.value}
                            </td>
                            {harResultat && row.result && <td>= {row.result}</td>}
                        </tr>
                    ))}
                </BodyShort>
            </table>
        </div>
    );
};
