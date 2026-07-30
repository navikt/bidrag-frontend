import { ArrowCirclepathIcon, ArrowDownIcon, ArrowUpIcon, TasklistIcon, XMarkIcon } from "@navikt/aksel-icons";
import { Box, Button, Checkbox, Detail, HStack, Tag } from "@navikt/ds-react";
import { type DokumentFilterItem, DokumentFilterMeny } from "~/common/dokument/DokumentFilterMeny";
import { type DokumentSorterItem, DokumentSorterMeny } from "~/common/dokument/DokumentSorterMeny";
import type { DokumentData, DokumentSortKey, FilterState, MenyState, MenyVisning } from "./hooks/useDokumentState";

export interface FilterBoksProps {
    data: DokumentData;
    filterState: FilterState;
    menyState: MenyState;
    /** Visningen som faktisk rendres – kan være minimert i forhold til brukerens valg på smale skjermer. */
    aktivVisning: MenyVisning;
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
                Filtrer dokumenter
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

export function FilterBoks({ data, filterState, menyState, aktivVisning }: FilterBoksProps) {
    const { harFarskapUtelukkede, antallDokumenterTotalt, antallJournalposterTotalt, dokumenter, journalposter } = data;
    const {
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
        tabellSort,
        tilbakestillTabellSortering,
    } = menyState;
    const {
        kunVedtak,
        setKunVedtak,
        kunFerdigstilte,
        setKunFerdigstilte,
        setVisFarskapUtelukket,
        visKunFarskapUtelukket,
        visFeilregistrerte,
        setVisFeilregistrerte,
    } = filterState;

    const erTabell = aktivVisning === "tabell";
    const handterAapneAlleForVisning = erTabell ? handterAapneAlleTabellRader : handterAapneAlle;
    const handterLukkAlleForVisning = erTabell ? handterLukkAlleTabellRader : handterLukkAlle;

    // Én toggle i stedet for to knapper: viser "Lukk alle" så snart noe er utvidet.
    const noeErUtvidet = (erTabell ? tableExpandedIds : expandedIds).size > 0;

    const antallValgt = valgteDokumentreferanser.size;

    const antallDokumenterVist = dokumenter.length;
    const antallJournalposterVist = journalposter.length;

    // Kort form i listevisningen, der raden er for smal til hele teksten.
    const tellerTekst = erTabell
        ? `${antallJournalposterVist} av ${antallJournalposterTotalt} journalposter · ${antallDokumenterVist} av ${antallDokumenterTotalt} dokumenter`
        : `${antallJournalposterVist}/${antallJournalposterTotalt} jp · ${antallDokumenterVist}/${antallDokumenterTotalt} dok`;
    const tellerBeskrivelse = `Viser ${antallJournalposterVist} av ${antallJournalposterTotalt} journalposter og ${antallDokumenterVist} av ${antallDokumenterTotalt} dokumenter`;

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
        ...(harFarskapUtelukkede
            ? [
                  {
                      id: "visFarskapUtelukket",
                      label: "Kun farskap utelukket",
                      checked: visKunFarskapUtelukket,
                      onChange: setVisFarskapUtelukket,
                      disabled: kunVedtak,
                  },
              ]
            : []),
        {
            id: "visFeilregistrerte",
            label: "Vis feilreg.",
            checked: visFeilregistrerte,
            onChange: setVisFeilregistrerte,
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
                <Tag
                    variant="neutral-moderate"
                    size="small"
                    className="ml-auto shrink-0 whitespace-nowrap"
                    title={tellerBeskrivelse}
                >
                    {tellerTekst}
                </Tag>
                {erTabell && (
                    <Button
                        variant="tertiary"
                        size="xsmall"
                        className="shrink-0"
                        onClick={tilbakestillTabellSortering}
                        disabled={!tabellSort}
                        icon={<ArrowCirclepathIcon aria-hidden />}
                        title="Tilbakestill sortering"
                        aria-label="Tilbakestill sortering"
                    />
                )}
                <Button
                    variant="tertiary"
                    size="xsmall"
                    className="shrink-0"
                    onClick={noeErUtvidet ? handterLukkAlleForVisning : handterAapneAlleForVisning}
                    icon={noeErUtvidet ? <ArrowUpIcon aria-hidden /> : <ArrowDownIcon aria-hidden />}
                    title={noeErUtvidet ? "Lukk alle" : "Åpne alle"}
                    aria-label={noeErUtvidet ? "Lukk alle" : "Åpne alle"}
                />
            </HStack>
        </Box>
    );
}
