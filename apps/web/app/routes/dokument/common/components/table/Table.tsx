import { Table } from "@navikt/ds-react";
import type React from "react";
import type { ReactElement } from "react";

export interface ColumnData {
    label: string;
    className?: string;
}

interface RowComponentType
    extends React.DetailedHTMLProps<React.TdHTMLAttributes<HTMLTableDataCellElement>, HTMLTableDataCellElement> {
    content: ReactElement | string;
    className?: string;
}

export interface RowData
    extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement> {
    onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
    components: RowComponentType[];
    isSelected?: boolean;
}

interface TableProps<T> {
    columns: ColumnData[];
    rows: (data: T) => RowData;
    data: T[];
    id?: string;
    expandableContent?: (data: T) => ReactElement;
}

export default function TableInternal<T>(props: TableProps<T>) {
    return (
        <Table id={props.id} size="small" className="[&_p]:p-0 [&_p]:m-1">
            <Table.Header>
                <Table.Row>
                    {props.expandableContent && <Table.HeaderCell textSize="small" />}
                    {props.columns.map((column, index) => (
                        <Table.HeaderCell textSize="small" key={index} className={column.className}>
                            {column.label}
                        </Table.HeaderCell>
                    ))}
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {props.data.map((data, index) => (
                    <Table.ExpandableRow
                        className="p-2"
                        key={index}
                        selected={props.rows(data).isSelected}
                        shadeOnHover={true}
                        content={props.expandableContent?.(data)}
                        expansionDisabled={props.expandableContent === undefined}
                    >
                        {props.rows(data).components.map((component, index) => (
                            <Table.DataCell textSize="small" key={index} className={`${component.className} pt-1 pb-1`}>
                                {component.content}
                            </Table.DataCell>
                        ))}
                    </Table.ExpandableRow>
                ))}
            </Table.Body>
        </Table>
    );
}

interface TableHeadProps {
    columns: ColumnData[];
}

function TableHead(props: TableHeadProps) {
    return (
        <thead>
            <tr>
                {props.columns.map((column, index) => (
                    <th key={index}>{column.label}</th>
                ))}
            </tr>
        </thead>
    );
}

interface TableRowProps {
    row: RowData;
}

function TableRow({ row }: TableRowProps) {
    const { components, ...tableProps } = row;
    return (
        <tr {...tableProps}>
            {components.map((component, index) => {
                const { content, ...tdProps } = component;
                return (
                    <td key={"row_" + index} {...tdProps}>
                        {content}
                    </td>
                );
            })}
        </tr>
    );
}

interface TableBodyProps<T> {
    rows: (data: T) => RowData;
    data: T[];
}

function TableBody<T>(props: TableBodyProps<T>) {
    return (
        <tbody>
            {props.data.map((data, index) => (
                <TableRow key={index} row={props.rows(data)} />
            ))}
        </tbody>
    );
}
