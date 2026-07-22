import { ArrowDownIcon, ArrowUpIcon } from "@navikt/aksel-icons";
import { Button, Checkbox, CheckboxGroup, HStack } from "@navikt/ds-react";
import type React from "react";

export interface FilterBoksProps {
    kunVedtak: boolean;
    setKunVedtak: (val: boolean) => void;
    visFarskapUtelukket: boolean;
    setVisFarskapUtelukket: (val: boolean) => void;
    visFeilregistrerte: boolean;
    setVisFeilregistrerte: (val: boolean) => void;
    kunFerdigstilte: boolean;
    setKunFerdigstilte: (val: boolean) => void;
    harBlandingFarBid: boolean;
    setExpandedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    alleJpMedFlereDokumenter: string[];
}

export function FilterBoks({
    kunVedtak,
    setKunVedtak,
    visFarskapUtelukket,
    setVisFarskapUtelukket,
    visFeilregistrerte,
    setVisFeilregistrerte,
    kunFerdigstilte,
    setKunFerdigstilte,
    harBlandingFarBid,
    setExpandedIds,
    alleJpMedFlereDokumenter,
}: FilterBoksProps) {
    const handterAapneAlle = () => setExpandedIds(new Set(alleJpMedFlereDokumenter));
    const handterLukkAlle = () => setExpandedIds(new Set());

    return (
        <div
            style={{
                padding: "0.5rem 0.75rem",
                borderBottom: "1px solid var(--a-border-default)",
                background: "var(--a-surface-default)",
            }}
        >
            <CheckboxGroup legend="Filtrer" hideLegend size="small">
                <HStack gap="space-12" wrap={true}>
                    <Checkbox checked={kunVedtak} onChange={(e) => setKunVedtak(e.target.checked)}>
                        Kun vedtak
                    </Checkbox>
                    <Checkbox checked={kunFerdigstilte} onChange={(e) => setKunFerdigstilte(e.target.checked)}>
                        Kun ferdigstilte
                    </Checkbox>
                    {harBlandingFarBid && (
                        <Checkbox
                            disabled={kunVedtak}
                            checked={!kunVedtak && visFarskapUtelukket}
                            onChange={(e) => setVisFarskapUtelukket(e.target.checked)}
                        >
                            Vis farskap
                        </Checkbox>
                    )}
                    <Checkbox
                        disabled={kunVedtak}
                        checked={!kunVedtak && visFeilregistrerte}
                        onChange={(e) => setVisFeilregistrerte(e.target.checked)}
                    >
                        Vis feilreg.
                    </Checkbox>
                </HStack>
            </CheckboxGroup>
            <HStack gap="space-8" style={{ marginTop: "0.75rem" }}>
                <Button
                    variant="tertiary"
                    size="xsmall"
                    onClick={handterAapneAlle}
                    icon={<ArrowDownIcon aria-hidden />}
                >
                    Åpne alle
                </Button>
                <Button variant="tertiary" size="xsmall" onClick={handterLukkAlle} icon={<ArrowUpIcon aria-hidden />}>
                    Lukk alle
                </Button>
            </HStack>
        </div>
    );
}
