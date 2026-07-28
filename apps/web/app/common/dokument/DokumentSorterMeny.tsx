import { ArrowDownIcon, ArrowsUpDownIcon, ArrowUpIcon } from "@navikt/aksel-icons";
import { ActionMenu, Button } from "@navikt/ds-react";
import type { SortState } from "~/routes/sak/sakshistorikk/components/useSort";

export interface DokumentSorterItem<TKey extends string> {
    key: TKey;
    label: string;
}

export interface DokumentSorterMenyProps<TKey extends string> {
    valg: DokumentSorterItem<TKey>[];
    sort?: SortState<TKey>;
    onSort: (key: TKey) => void;
}

/**
 * Sorteringsmeny for tre-/listevisningen (`DokumentTre`). Klikk på et valg bytter mellom
 * stigende/synkende/ingen sortering – samme oppførsel som kolonnesortering i tabellvisningen
 * (`useSort`).
 */
export function DokumentSorterMeny<TKey extends string>({ valg, sort, onSort }: DokumentSorterMenyProps<TKey>) {
    return (
        <ActionMenu>
            <ActionMenu.Trigger>
                <Button
                    variant="tertiary"
                    size="xsmall"
                    icon={<ArrowsUpDownIcon aria-hidden />}
                    className="shrink-0 whitespace-nowrap"
                >
                    Sorter
                </Button>
            </ActionMenu.Trigger>
            <ActionMenu.Content>
                <ActionMenu.Label>Sorter etter</ActionMenu.Label>
                {valg.map((item) => {
                    const erAktiv = sort?.orderBy === item.key;
                    const retningIkon = erAktiv ? (
                        sort?.direction === "ascending" ? (
                            <ArrowUpIcon aria-hidden />
                        ) : (
                            <ArrowDownIcon aria-hidden />
                        )
                    ) : undefined;

                    return (
                        <ActionMenu.Item key={item.key} icon={retningIkon} onSelect={() => onSort(item.key)}>
                            {item.label}
                        </ActionMenu.Item>
                    );
                })}
            </ActionMenu.Content>
        </ActionMenu>
    );
}
