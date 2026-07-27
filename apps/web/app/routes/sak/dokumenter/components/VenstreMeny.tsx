import type { RolleDto } from "@bidrag/api/SakApi";
import { ChevronLeftIcon, ChevronRightIcon } from "@navikt/aksel-icons";
import { Box, Button, Detail, Heading, HStack, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";
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
    liste: "21em",
    tabell: "56em",
};

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

    const erTabell = !skjulKontroller && visning === "tabell";
    const toggleVisning = () => setVisning(erTabell ? "liste" : "tabell");
    const aktivVisning = skjulKontroller ? "liste" : visning;

    return (
        <Box
            as="nav"
            aria-label="Dokumentliste"
            width={BREDDE_PER_VISNING[aktivVisning]}
            background="neutral-soft"
            borderWidth="1"
            borderColor="neutral-subtle"
            borderRadius="4"
            padding="space-4"
            className="overflow-hidden transition-[width] duration-300 ease-in-out"
            height="100%"
            minHeight="0"
            style={{ display: "flex", flexDirection: "column" }}
        >
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
                {!skjulKontroller && (
                    <Button
                        variant="tertiary"
                        size="small"
                        icon={erTabell ? <ChevronLeftIcon aria-hidden /> : <ChevronRightIcon aria-hidden />}
                        onClick={toggleVisning}
                        title={erTabell ? "Minimer dokumentliste" : "Utvid dokumentliste"}
                    >
                        {erTabell ? "Minimer" : "Utvid"}
                    </Button>
                )}
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
        </Box>
    );
}
