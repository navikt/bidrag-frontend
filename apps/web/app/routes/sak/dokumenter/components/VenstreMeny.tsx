import type { RolleDto } from "@bidrag/api/SakApi";
import { Box } from "@navikt/ds-react";
import { DokumentTre } from "./DokumentTre";
import { FilterBoks } from "./FilterBoks";
import type { DokumentData, FilterState, MenyState } from "./hooks/useDokumentState";

export interface VenstreMenyProps {
    sakRoller: RolleDto[];
    data: DokumentData;
    filterState: FilterState;
    menyState: MenyState;
}

export function VenstreMeny({ sakRoller, data, filterState, menyState }: VenstreMenyProps) {
    return (
        <Box 
            as="nav" 
            aria-label="Dokumentliste"
            width="21em"
        >
            <FilterBoks data={data} filterState={filterState} menyState={menyState} />
            <DokumentTre data={data} menyState={menyState} sakRoller={sakRoller} />
        </Box>
    );
}