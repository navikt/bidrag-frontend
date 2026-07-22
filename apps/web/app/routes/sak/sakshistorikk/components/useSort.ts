import { useState } from "react";

export type SortDirection = "ascending" | "descending";

export interface SortState<TKey extends string> {
    orderBy: TKey;
    direction: SortDirection;
}

export function defaultComparator<T>(a: T, b: T, orderBy: keyof T): number {
    const aVal = a[orderBy];
    const bVal = b[orderBy];

    if (aVal === bVal) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    return aVal < bVal ? -1 : 1;
}

export interface UseSortOptions<TData, TKey extends string> {
    initialSort?: SortState<TKey>;
    defaultUnsorted?: (a: TData, b: TData) => number;
    customComparators?: Partial<Record<TKey, (a: TData, b: TData) => number>>;
}

export function useSort<TData, TKey extends string = Extract<keyof TData, string>>(
    options?: UseSortOptions<TData, TKey>,
) {
    const [sort, setSort] = useState<SortState<TKey> | undefined>(options?.initialSort);

    const handleSort = (sortKey: TKey) => {
        setSort((prevSort) => {
            if (prevSort && sortKey === prevSort.orderBy && prevSort.direction === "descending") {
                return undefined;
            }
            return {
                orderBy: sortKey,
                direction:
                    prevSort && sortKey === prevSort.orderBy && prevSort.direction === "ascending"
                        ? "descending"
                        : "ascending",
            };
        });
    };

    const sortData = (data: TData[]): TData[] => {
        if (!sort) {
            return options?.defaultUnsorted ? [...data].sort(options.defaultUnsorted) : data;
        }

        return [...data].sort((a, b) => {
            const customComp = options?.customComparators?.[sort.orderBy];

            const result = customComp
                ? customComp(a, b)
                : defaultComparator(a, b, sort.orderBy as unknown as keyof TData);

            return sort.direction === "ascending" ? result : -result;
        });
    };

    return { sort, handleSort, sortData, setSort };
}
