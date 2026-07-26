import type { RolleDto } from "@bidrag/api/SakApi";
import { ChevronLeftIcon, ChevronRightIcon } from "@navikt/aksel-icons";
import { Box, Button, Detail, Heading, HStack, VStack } from "@navikt/ds-react";
import { DokumentTre } from "./DokumentTre";
import { FilterBoks } from "./FilterBoks";
import type { DokumentData, FilterState, MenyState, MenyVisning } from "./hooks/useDokumentState";
import { SaksdokumentTabell } from "./SaksdokumentTabell";

export interface VenstreMenyProps {
    sakRoller: RolleDto[];
    data: DokumentData;
    filterState: FilterState;
    menyState: MenyState;
}

const BREDDE_PER_VISNING: Record<MenyVisning, string> = {
    liste: "21em",
    tabell: "56em",
};

export function VenstreMeny({ sakRoller, data, filterState, menyState }: VenstreMenyProps) {
    const { visning, setVisning, valgteDokumentreferanser, handleVelgAlle, handleFjernAlle } = menyState;

    const erTabell = visning === "tabell";
    const toggleVisning = () => setVisning(erTabell ? "liste" : "tabell");

    return (
        <Box
            as="nav"
            aria-label="Dokumentliste"
            width={BREDDE_PER_VISNING[visning]}
            background="neutral-soft"
            borderWidth="1"
            borderColor="neutral-subtle"
            borderRadius="4"
            padding="space-4"
            className="overflow-hidden transition-[width] duration-300 ease-in-out"
        >
            <HStack justify="space-between" align="center" wrap={false}>
                <HStack gap="space-2" align="center" wrap={false}>
                    <Heading size="small">Dokumenter</Heading>
                    {valgteDokumentreferanser.size > 0 && (
                        <Detail className="text-gray-600">{valgteDokumentreferanser.size} valgt</Detail>
                    )}
                </HStack>
                <Button
                    variant="tertiary"
                    size="small"
                    icon={erTabell ? <ChevronLeftIcon aria-hidden /> : <ChevronRightIcon aria-hidden />}
                    onClick={toggleVisning}
                    title={erTabell ? "Minimer dokumentliste" : "Utvid dokumentliste"}
                >
                    {erTabell ? "Minimer" : "Utvid"}
                </Button>
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

            <VStack gap="space-2" marginBlock="space-2 space-0">
                <FilterBoks data={data} filterState={filterState} menyState={menyState} />

                {erTabell ? (
                    <SaksdokumentTabell
                        journalposter={data.journalposter}
                        dokumenter={data.dokumenter}
                        sakRoller={sakRoller}
                        menyState={menyState}
                    />
                ) : (
                    <DokumentTre data={data} menyState={menyState} sakRoller={sakRoller} />
                )}
            </VStack>
        </Box>
    );
}
