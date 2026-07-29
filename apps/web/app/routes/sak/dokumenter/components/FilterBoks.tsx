import { ArrowDownIcon, ArrowUpIcon, TasklistIcon, XMarkIcon } from "@navikt/aksel-icons";
import { Box, Button, Checkbox, Detail, HStack } from "@navikt/ds-react";
import { type DokumentFilterItem, DokumentFilterMeny } from "~/common/dokument/DokumentFilterMeny";
import { type DokumentSorterItem, DokumentSorterMeny } from "~/common/dokument/DokumentSorterMeny";
import type { DokumentData, DokumentSortKey, FilterState, MenyState } from "./hooks/useDokumentState";

export interface FilterBoksProps {
    data: DokumentData;
    filterState: FilterState;
    menyState: MenyState;
}

interface DokumentutvalgKontrollProps {
    aktiv: boolean;
    antallValgt: number;
    onToggleAktiv: () => void;
    onVelgAlle: () => void;
    onFjernAlle: () => void;
    visKunValgte: boolean;
    onVisKunValgteChange: (checked: boolean) => void;
}

/**
 * Kontroll for å plukke ut dokumenter i tabellen og filtrere listen ned til utvalget.
 *
 * Inaktiv er den én enkelt knapp. Aktiv samles status og alle tilhørende handlinger i én markert
 * gruppe, slik at det er tydelig at de hører sammen – og at tabellen er i en egen utvalgsmodus.
 */
function DokumentutvalgKontroll({
    aktiv,
    antallValgt,
    onToggleAktiv,
    onVelgAlle,
    onFjernAlle,
    visKunValgte,
    onVisKunValgteChange,
}: DokumentutvalgKontrollProps) {
    if (!aktiv) {
        return (
            <Button
                variant="tertiary"
                size="xsmall"
                icon={<TasklistIcon aria-hidden />}
                onClick={onToggleAktiv}
                title="Huk av dokumenter i tabellen for å filtrere listen"
                className="shrink-0 whitespace-nowrap"
            >
                Velg dokumenter
            </Button>
        );
    }

    return (
        <Box
            background="info-soft"
            borderColor="info-subtle"
            borderWidth="1"
            borderRadius="4"
            paddingInline="space-2"
            paddingBlock="space-1"
            className="shrink-0"
        >
            <HStack gap="space-2" align="center" wrap={false}>
                <TasklistIcon aria-hidden className="shrink-0" />
                <Detail className="whitespace-nowrap">
                    {antallValgt > 0 ? `${antallValgt} valgt` : "Huk av dokumenter i tabellen"}
                </Detail>
                <Button
                    variant="tertiary"
                    size="xsmall"
                    className="shrink-0 whitespace-nowrap"
                    onClick={antallValgt > 0 ? onFjernAlle : onVelgAlle}
                >
                    {antallValgt > 0 ? "Fjern valg" : "Velg alle"}
                </Button>
                {antallValgt > 0 && (
                    <Checkbox
                        size="small"
                        checked={visKunValgte}
                        onChange={(e) => onVisKunValgteChange(e.target.checked)}
                        className="shrink-0 whitespace-nowrap"
                    >
                        Vis kun valgte
                    </Checkbox>
                )}
                <Button
                    variant="tertiary"
                    size="xsmall"
                    icon={<XMarkIcon aria-hidden />}
                    onClick={onToggleAktiv}
                    title="Avslutt utvalg"
                    aria-label="Avslutt utvalg"
                    className="shrink-0"
                />
            </HStack>
        </Box>
    );
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
        velgDokumenterAktiv,
        handterToggleVelgDokumenter,
        handleVelgAlle,
        handleFjernAlle,
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

    const antallValgt = valgteDokumentreferanser.size;

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
                <DokumentFilterMeny filtere={filtere} />
                {erTabell && (
                    <DokumentutvalgKontroll
                        aktiv={velgDokumenterAktiv}
                        antallValgt={antallValgt}
                        onToggleAktiv={handterToggleVelgDokumenter}
                        onVelgAlle={handleVelgAlle}
                        onFjernAlle={handleFjernAlle}
                        visKunValgte={visKunValgte}
                        onVisKunValgteChange={setVisKunValgte}
                    />
                )}
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
