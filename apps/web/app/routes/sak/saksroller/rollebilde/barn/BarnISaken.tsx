import { InformationSquareIcon } from "@navikt/aksel-icons";
import { Box, Heading, HGrid, InfoCard, VStack } from "@navikt/ds-react";
import { type ComponentProps, useState } from "react";
import type { BarnRolle, SakRedigeringData } from "../../felles/sakvisning-schema.ts";
import BarnVisning from "./BarnVisning.tsx";
import LeggTilBarn from "./LeggTilBarn.tsx";

function barnnøkkel(barnRolle: BarnRolle, idx: number) {
    return barnRolle.fodselsnummer || barnRolle.objektnummer || `${barnRolle.type}-${idx}`;
}

function IngenBarnMelding() {
    return (
        <InfoCard data-color="info" size="small">
            <InfoCard.Message icon={<InformationSquareIcon aria-hidden />}>
                Ingen barn registrert i saken ennå
            </InfoCard.Message>
        </InfoCard>
    );
}

export type BarnISakenProps = {
    barn: BarnRolle[];
    roller: SakRedigeringData["roller"];
    bidragsmottakerIdent: string | undefined;
    dataUpdatedAt: number;
    hentOgNullstillSamhandler: ComponentProps<typeof BarnVisning>["hentOgNullstillSamhandler"];
    erOppfostringsbidrag: boolean;
    muligeBarn: ComponentProps<typeof LeggTilBarn>["søsken"];
    funnetPersonISak: (fnr: string) => boolean;
};

/** Barna i saken som kort, med «Legg til barn» og forslag. */
export default function BarnISaken({
    barn,
    roller,
    bidragsmottakerIdent,
    dataUpdatedAt,
    hentOgNullstillSamhandler,
    erOppfostringsbidrag,
    muligeBarn,
    funnetPersonISak,
}: BarnISakenProps) {
    const [visSøk, setVisSøk] = useState(false);

    return (
        <Box background="sunken" padding="space-12">
            <VStack gap="space-4">
                <Heading level="2" size="small">
                    Barn i saken ({barn.length})
                </Heading>
                {barn.length === 0 && <IngenBarnMelding />}
                <HGrid columns={{ xs: 1, lg: 2, xl: 3 }} gap="space-24" align="start">
                    {barn.map((barnRolle, idx) => (
                        <BarnVisning
                            key={barnnøkkel(barnRolle, idx)}
                            rolle={barnRolle}
                            index={roller.indexOf(barnRolle)}
                            bidragsmottakerIdent={bidragsmottakerIdent}
                            closeEditorSignal={dataUpdatedAt}
                            hentOgNullstillSamhandler={hentOgNullstillSamhandler}
                            erNyttBarn={!funnetPersonISak(barnRolle.fodselsnummer)}
                            erOppfostringsbidrag={erOppfostringsbidrag}
                        />
                    ))}
                </HGrid>
                <LeggTilBarn
                    søsken={muligeBarn}
                    erOppfostringsbidrag={erOppfostringsbidrag}
                    setVisSøk={setVisSøk}
                    visSøk={visSøk}
                />
            </VStack>
        </Box>
    );
}
