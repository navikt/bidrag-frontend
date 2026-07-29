import type { RolleDto } from "@bidrag/api/SakApi";
import { ChevronLeftIcon, ChevronRightIcon } from "@navikt/aksel-icons";
import { BodyShort, Box, Button, Detail, Heading, HStack, Popover, VStack } from "@navikt/ds-react";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SaksDokument } from "../types";
import { DokumentTre } from "./DokumentTre";
import { FilterBoks } from "./FilterBoks";
import type { DokumentData, FilterState, MenyState, MenyVisning } from "./hooks/useDokumentState";
import { SaksdokumentTabell } from "./SaksdokumentTabell";

export interface VenstreMenyProps {
    sakRoller: RolleDto[];
    data: DokumentData;
    filterState: FilterState;
    menyState: MenyState;
    skjulKontroller?: boolean;
    /** Flat dokumentliste uten journalpost-gruppering. */
    flatDokumentliste?: boolean;
    /** Ekstra innhold vist øverst i venstremenyen, over "Dokumenter"-tittelen. */
    header?: ReactNode;
}

const BREDDE_PER_VISNING: Record<MenyVisning, string> = {
    skjult: "3.25em",
    liste: "21em",
    tabell: "59em",
};

/** Visningene sortert fra minst til mest plass. Minimer/utvid flytter brukeren ett steg om gangen. */
const VISNING_STEG: MenyVisning[] = ["skjult", "liste", "tabell"];

/** Uten kontroller (én enkelt journalpost) finnes ikke tabellvisningen, men menyen kan fortsatt skjules. */
const VISNING_STEG_UTEN_KONTROLLER: MenyVisning[] = ["skjult", "liste"];

/** Tastatursnarveier som er tilgjengelig i dokumentvisningen. */
const TASTATURSNARVEIER: { taster: string; beskrivelse: string }[] = [
    { taster: "↑ / ↓", beskrivelse: "Naviger til forrige/neste dokument i listen" },
    { taster: "← / →", beskrivelse: "Minimer/utvid dokumentlisten" },
];

/** Enkelt tastatur-ikon (finnes ikke i @navikt/aksel-icons), tegnet i samme stil som Aksels ikonsett. */
function KeyboardIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path
                d="M5.5 9.5h1M9 9.5h1M12.5 9.5h1M16 9.5h1M5.5 12.5h1M9 12.5h1M12.5 12.5h1M16 12.5h1M7.5 15.5h9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

function SnarveierKnapp() {
    const [åpen, setÅpen] = useState(false);
    const knappRef = useRef<HTMLButtonElement>(null);

    return (
        <>
            <Button
                ref={knappRef}
                variant="tertiary-neutral"
                size="small"
                icon={<KeyboardIcon />}
                onClick={() => setÅpen((forrige) => !forrige)}
                title="Vis tastatursnarveier"
            />
            <Popover open={åpen} onClose={() => setÅpen(false)} anchorEl={knappRef.current} placement="bottom-end">
                <Popover.Content>
                    <VStack gap="space-2" className="min-w-[15rem]">
                        <BodyShort weight="semibold" size="small">
                            Tastatursnarveier
                        </BodyShort>
                        {TASTATURSNARVEIER.map(({ taster, beskrivelse }) => (
                            <HStack key={taster} gap="space-2" align="center" wrap={false}>
                                <Box
                                    as="kbd"
                                    paddingInline="space-2"
                                    background="neutral-moderate"
                                    borderRadius="4"
                                    className="font-mono text-sm shrink-0"
                                >
                                    {taster}
                                </Box>
                                <Detail>{beskrivelse}</Detail>
                            </HStack>
                        ))}
                    </VStack>
                </Popover.Content>
            </Popover>
        </>
    );
}

/**
 * Innholdet i den helt minimerte menyen: en smal kolonne med utvid-knapp og – når det valgte
 * dokumentet har vedlegg – en nummerert stripe slik at man kan bla mellom underdokumentene
 * uten å utvide menyen igjen.
 */
function SkjultMenyInnhold({
    dokumenterIValgtJournalpost,
    selectedId,
    onSelectDocument,
    onUtvid,
}: {
    dokumenterIValgtJournalpost: SaksDokument[];
    selectedId?: string;
    onSelectDocument: (id: string) => void;
    onUtvid: () => void;
}) {
    const harUnderdokumenter = dokumenterIValgtJournalpost.length > 1;

    return (
        <VStack gap="space-2" align="center" flexGrow="1" minHeight="0">
            <Button
                variant="tertiary"
                size="small"
                icon={<ChevronRightIcon aria-hidden />}
                onClick={onUtvid}
                title="Vis dokumentliste (→)"
                aria-label="Vis dokumentliste"
                className="shrink-0"
            />
            {harUnderdokumenter ? (
                <VStack gap="space-1" align="center" flexGrow="1" minHeight="0" className="overflow-y-auto">
                    {dokumenterIValgtJournalpost.map((dok, indeks) => {
                        const nummer = indeks + 1;
                        const beskrivelse = `${dok.erHoveddokument ? "Hoveddokument" : `Vedlegg ${indeks}`}: ${dok.tittel}`;

                        return (
                            <Button
                                key={dok.id}
                                variant={dok.id === selectedId ? "primary" : "tertiary-neutral"}
                                size="xsmall"
                                disabled={!dok.kanÅpnes}
                                onClick={() => onSelectDocument(dok.id)}
                                title={beskrivelse}
                                aria-label={beskrivelse}
                                aria-current={dok.id === selectedId}
                                icon={<span aria-hidden>{nummer}</span>}
                                className="shrink-0"
                            />
                        );
                    })}
                </VStack>
            ) : (
                <BodyShort size="small" textColor="subtle" style={{ writingMode: "vertical-rl" }}>
                    Dokumenter
                </BodyShort>
            )}
        </VStack>
    );
}

export function VenstreMeny({
    sakRoller,
    data,
    filterState,
    menyState,
    skjulKontroller = false,
    flatDokumentliste = false,
    header,
}: VenstreMenyProps) {
    const { visning, setVisning, valgteDokumentreferanser, handleVelgAlle, handleFjernAlle } = menyState;

    const steg = skjulKontroller ? VISNING_STEG_UTEN_KONTROLLER : VISNING_STEG;
    const aktivVisning = steg.includes(visning) ? visning : "liste";
    const stegIndeks = steg.indexOf(aktivVisning);

    const erSkjult = aktivVisning === "skjult";
    const erTabell = aktivVisning === "tabell";
    const kanUtvide = stegIndeks < steg.length - 1;

    const minimer = useCallback(() => setVisning(steg[stegIndeks - 1] ?? "skjult"), [setVisning, steg, stegIndeks]);
    const utvid = useCallback(
        () => setVisning(steg[stegIndeks + 1] ?? aktivVisning),
        [setVisning, steg, stegIndeks, aktivVisning],
    );

    // Piltast venstre/høyre flytter menyen ett steg, som et raskt alternativ til minimer/utvid-knappene.
    // Opp/ned er allerede reservert til dokumentnavigasjon i `useDokumentState`.
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            // Slipp gjennom nettleserens egne snarveier, f.eks. Cmd/Alt + pil for fram/tilbake.
            if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;

            const target = event.target as HTMLElement | null;
            const tagName = target?.tagName;
            if (tagName === "INPUT" || tagName === "TEXTAREA" || target?.isContentEditable) return;

            event.preventDefault();
            event.key === "ArrowLeft" ? minimer() : utvid();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [minimer, utvid]);

    // Dokumentene i journalposten som vises nå – brukes av den minimerte stripen.
    const valgtJournalpostId = data.selectedDocument?.journalpostId;
    const dokumenterIValgtJournalpost = useMemo(
        () => (valgtJournalpostId ? data.dokumenter.filter((dok) => dok.journalpostId === valgtJournalpostId) : []),
        [data.dokumenter, valgtJournalpostId],
    );

    return (
        <Box
            as="nav"
            aria-label="Dokumentliste"
            width={BREDDE_PER_VISNING[aktivVisning]}
            background="neutral-soft"
            borderWidth="1"
            borderColor="neutral-subtle"
            borderRadius="4"
            padding={erSkjult ? "space-2" : "space-4"}
            className="overflow-hidden transition-[width] duration-100 ease-in-out"
            height="100%"
            minHeight="0"
            style={{ display: "flex", flexDirection: "column" }}
        >
            {erSkjult ? (
                <SkjultMenyInnhold
                    dokumenterIValgtJournalpost={dokumenterIValgtJournalpost}
                    selectedId={menyState.selectedId}
                    onSelectDocument={menyState.handleSelectDocument}
                    onUtvid={utvid}
                />
            ) : (
                <>
                    {header && (
                        <Box marginBlock="space-0 space-4" className="shrink-0">
                            {header}
                        </Box>
                    )}
                    <HStack justify="space-between" align="center" wrap={false}>
                        <HStack gap="space-2" align="center" wrap={false}>
                            <Heading size="small">Dokumenter</Heading>
                            {!skjulKontroller && valgteDokumentreferanser.size > 0 && (
                                <Detail className="text-gray-600">{valgteDokumentreferanser.size} valgt</Detail>
                            )}
                        </HStack>
                        <HStack gap="space-1" align="center" wrap={false}>
                            {!skjulKontroller && <SnarveierKnapp />}
                            <Button
                                variant="tertiary"
                                size="small"
                                icon={<ChevronLeftIcon aria-hidden />}
                                onClick={minimer}
                                title={erTabell ? "Minimer dokumentliste (←)" : "Skjul dokumentliste (←)"}
                                aria-label={erTabell ? "Minimer dokumentliste" : "Skjul dokumentliste"}
                            />
                            {!skjulKontroller && (
                                <Button
                                    variant="tertiary"
                                    size="small"
                                    icon={<ChevronRightIcon aria-hidden />}
                                    onClick={utvid}
                                    disabled={!kanUtvide}
                                    title="Utvid dokumentliste (→)"
                                    aria-label="Utvid dokumentliste"
                                />
                            )}
                        </HStack>
                    </HStack>

                    {erTabell && (
                        <HStack justify="start" align="center" wrap={false} marginBlock="space-4 space-2">
                            <Button
                                variant="tertiary"
                                size="xsmall"
                                onClick={valgteDokumentreferanser.size > 0 ? handleFjernAlle : handleVelgAlle}
                            >
                                {valgteDokumentreferanser.size > 0 ? "Fjern valg" : "Velg alle"}
                            </Button>
                        </HStack>
                    )}

                    <VStack gap="space-2" marginBlock="space-2 space-0" flexGrow="1" minHeight="0" overflow="hidden">
                        {!skjulKontroller && <FilterBoks data={data} filterState={filterState} menyState={menyState} />}

                        <div style={{ flexGrow: 1, minHeight: 0, overflowY: "auto" }}>
                            {erTabell ? (
                                <SaksdokumentTabell
                                    journalposter={data.journalposter}
                                    dokumenter={data.dokumenter}
                                    sakRoller={sakRoller}
                                    menyState={menyState}
                                />
                            ) : (
                                <DokumentTre
                                    data={data}
                                    menyState={menyState}
                                    sakRoller={sakRoller}
                                    flatListe={flatDokumentliste}
                                />
                            )}
                        </div>
                    </VStack>
                </>
            )}
        </Box>
    );
}
