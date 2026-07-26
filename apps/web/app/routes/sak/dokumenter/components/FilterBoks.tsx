import { ArrowDownIcon, ArrowUpIcon } from "@navikt/aksel-icons";
import { Box, Button, Checkbox, CheckboxGroup, HStack } from "@navikt/ds-react";
import type { DokumentData, FilterState, MenyState } from "./hooks/useDokumentState";

export interface FilterBoksProps {
    data: DokumentData;
    filterState: FilterState;
    menyState: MenyState;
}

export function FilterBoks({ data, filterState, menyState }: FilterBoksProps) {
    const { harBlandingFarBid } = data;
    const {
        visning,
        handterAapneAlle,
        handterLukkAlle,
        handterAapneAlleTabellRader,
        handterLukkAlleTabellRader,
        valgteDokumentreferanser,
        visKunValgte,
        setVisKunValgte,
    } = menyState;
    const {
        kunVedtak,
        setKunVedtak,
        kunFerdigstilte,
        setKunFerdigstilte,
        visFarskapUtelukket,
        setVisFarskapUtelukket,
        visFeilregistrerte,
        setVisFeilregistrerte,
    } = filterState;

    const erTabell = visning === "tabell";
    const handterAapneAlleForVisning = erTabell ? handterAapneAlleTabellRader : handterAapneAlle;
    const handterLukkAlleForVisning = erTabell ? handterLukkAlleTabellRader : handterLukkAlle;

    return (
        <Box paddingBlock="space-2" paddingInline="space-4">
            <CheckboxGroup legend="Filtrer" hideLegend size="small">
                <HStack gap="space-12" wrap>
                    <Checkbox checked={kunFerdigstilte} onChange={(e) => setKunFerdigstilte(e.target.checked)}>
                        Kun ferdigstilte
                    </Checkbox>
                    <Checkbox checked={kunVedtak} onChange={(e) => setKunVedtak(e.target.checked)}>
                        Kun vedtak
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
                    <Checkbox
                        disabled={valgteDokumentreferanser.size === 0}
                        checked={visKunValgte}
                        onChange={(e) => setVisKunValgte(e.target.checked)}
                    >
                        Vis kun valgte
                    </Checkbox>
                </HStack>
            </CheckboxGroup>
            <HStack gap="space-8" marginBlock="space-8 space-0">
                <Button
                    variant="tertiary"
                    size="xsmall"
                    onClick={handterAapneAlleForVisning}
                    icon={<ArrowDownIcon aria-hidden />}
                >
                    Åpne alle
                </Button>
                <Button
                    variant="tertiary"
                    size="xsmall"
                    onClick={handterLukkAlleForVisning}
                    icon={<ArrowUpIcon aria-hidden />}
                >
                    Lukk alle
                </Button>
            </HStack>
        </Box>
    );
}
