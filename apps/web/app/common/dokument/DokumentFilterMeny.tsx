import { FilterIcon } from "@navikt/aksel-icons";
import { ActionMenu, Button, Checkbox, HStack } from "@navikt/ds-react";

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
     * skjules menyknappen – nyttig i visninger uten egne filtervalg (f.eks. `JournalpostFremviser`).
     */
    filtere?: DokumentFilterItem[];
    /**
     * "Vis kun valgte" holdes utenfor action-menyen som egen avkrysningsboks,
     * siden det er det filtervalget brukere endrer aller oftest.
     */
    visKunValgte: boolean;
    onVisKunValgteChange: (checked: boolean) => void;
    visKunValgteLabel?: string;
    visKunValgteDisabled?: boolean;
}

/**
 * Felles filterkontroll for dokumentlister: en action-meny med sjeldnere brukte filtervalg,
 * og en frittstående "Vis kun valgte"-avkrysningsboks ved siden av.
 *
 * Brukes både i sakens dokumentvisning (`VenstreMeny`/`FilterBoks`) og i `JournalpostFremviser`,
 * der sistnevnte som standard er i kompakt visning (kun valgte dokument(er) vises).
 */
export function DokumentFilterMeny({
    filtere = [],
    visKunValgte,
    onVisKunValgteChange,
    visKunValgteLabel = "Vis kun valgte",
    visKunValgteDisabled,
}: DokumentFilterMenyProps) {
    return (
        <HStack gap="space-2" align="center" wrap={false}>
            {filtere.length > 0 && (
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
            )}
            <Checkbox
                size="small"
                checked={visKunValgte}
                disabled={visKunValgteDisabled}
                onChange={(e) => onVisKunValgteChange(e.target.checked)}
                className="shrink-0 whitespace-nowrap"
            >
                {visKunValgteLabel}
            </Checkbox>
        </HStack>
    );
}
