import { ArrowDownIcon, ArrowUpIcon } from "@navikt/aksel-icons";
import { Box, Button, HStack } from "@navikt/ds-react";
import { type DokumentFilterItem, DokumentFilterMeny } from "~/common/dokument/DokumentFilterMeny";
import { type DokumentSorterItem, DokumentSorterMeny } from "~/common/dokument/DokumentSorterMeny";
import type { DokumentData, DokumentSortKey, FilterState, MenyState } from "./hooks/useDokumentState";

export interface FilterBoksProps {
    data: DokumentData;
    filterState: FilterState;
    menyState: MenyState;
}

export function FilterBoks({ data, filterState, menyState }: FilterBoksProps) {
    const { harBlandingFarBid } = data;
    const {
        visning,
        expandedIds,
        tableExpandedIds,
        handterAapneAlle,
        handterLukkAlle,
        handterAapneAlleTabellRader,
        handterLukkAlleTabellRader,
        listeSort,
        handleListeSort,
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

    // Én toggle i stedet for to knapper: viser "Lukk alle" så snart noe er utvidet.
    const noeErUtvidet = (erTabell ? tableExpandedIds : expandedIds).size > 0;

    const sorterValg: DokumentSorterItem<DokumentSortKey>[] = [
        { key: "dokumentDato", label: "Dok.dato" },
        { key: "journalfortDato", label: "Journal.dato" },
        { key: "gjelderAktor", label: "Gjelder" },
    ];

    const filtere: DokumentFilterItem[] = [
        {
            id: "kunFerdigstilte",
            label: "Kun ferdigstilte",
            checked: kunFerdigstilte,
            onChange: setKunFerdigstilte,
        },
        {
            id: "kunVedtak",
            label: "Kun vedtak",
            checked: kunVedtak,
            onChange: setKunVedtak,
        },
        ...(harBlandingFarBid
            ? [
                  {
                      id: "visFarskapUtelukket",
                      label: "Vis farskap",
                      checked: !kunVedtak && visFarskapUtelukket,
                      onChange: setVisFarskapUtelukket,
                      disabled: kunVedtak,
                  },
              ]
            : []),
        {
            id: "visFeilregistrerte",
            label: "Vis feilreg.",
            checked: !kunVedtak && visFeilregistrerte,
            onChange: setVisFeilregistrerte,
            disabled: kunVedtak,
        },
    ];

    return (
        <Box paddingBlock="space-2" paddingInline="space-4">
            <HStack gap="space-2" align="center" wrap={false}>
                <DokumentFilterMeny
                    filtere={filtere}
                    visKunValgte={visKunValgte}
                    onVisKunValgteChange={setVisKunValgte}
                    visKunValgteDisabled={valgteDokumentreferanser.size === 0}
                />
                {!erTabell && <DokumentSorterMeny valg={sorterValg} sort={listeSort} onSort={handleListeSort} />}
                <Button
                    variant="tertiary"
                    size="xsmall"
                    className="ml-auto shrink-0"
                    onClick={noeErUtvidet ? handterLukkAlleForVisning : handterAapneAlleForVisning}
                    icon={noeErUtvidet ? <ArrowUpIcon aria-hidden /> : <ArrowDownIcon aria-hidden />}
                    title={noeErUtvidet ? "Lukk alle" : "Åpne alle"}
                    aria-label={noeErUtvidet ? "Lukk alle" : "Åpne alle"}
                />
            </HStack>
        </Box>
    );
}
