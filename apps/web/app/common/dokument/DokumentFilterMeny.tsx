import { FilterIcon } from "@navikt/aksel-icons";
import { ActionMenu, Button } from "@navikt/ds-react";

export interface DokumentFilterItem {
    id: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export interface DokumentFilterMenyProps {
    /**
     * Filtervalg som vises i action-menyen. Utelates `filtere` (eller sendes tom liste)
     * rendres ingenting – nyttig i visninger uten egne filtervalg.
     */
    filtere?: DokumentFilterItem[];
}

/**
 * Felles filterkontroll for dokumentlister: en action-meny med filtervalg som gjelder hele listen.
 *
 * "Vis kun valgte" hører derimot sammen med dokumentutvalget i tabellen, og bor derfor sammen med
 * "Filtrer dokumenter" i `VenstreMeny` i stedet for her.
 */
export function DokumentFilterMeny({ filtere = [] }: DokumentFilterMenyProps) {
    if (filtere.length === 0) return null;

    return (
        <ActionMenu>
            <ActionMenu.Trigger>
                <Button
                    variant="tertiary"
                    size="xsmall"
                    icon={<FilterIcon aria-hidden />}
                    className="shrink-0 whitespace-nowrap"
                >
                    Filter
                </Button>
            </ActionMenu.Trigger>
            <ActionMenu.Content>
                <ActionMenu.Label>Filtrer</ActionMenu.Label>
                {filtere.map((filter) => (
                    <ActionMenu.CheckboxItem
                        key={filter.id}
                        checked={filter.checked}
                        disabled={filter.disabled}
                        onCheckedChange={filter.onChange}
                    >
                        {filter.label}
                    </ActionMenu.CheckboxItem>
                ))}
            </ActionMenu.Content>
        </ActionMenu>
    );
}
