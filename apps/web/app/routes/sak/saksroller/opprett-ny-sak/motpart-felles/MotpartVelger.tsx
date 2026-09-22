import type { PersonDto } from "@bidrag/api/PersonApi";
import { PersonIcon, XMarkIcon } from "@navikt/aksel-icons";
import { BodyLong, Box, Button, HStack } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { ForelderUtenBarnSkjemaData } from "../opprett-sak-schema";
import ForeslåPersonPanel from "../../felles/ForeslåPersonPanel";

type Props = {
    form: UseFormReturn<ForelderUtenBarnSkjemaData>;
    tittel: string;
    beskrivelse: string;
    variant: "warning" | "success";
    velgAnnenMotpart: () => void;
    settMotpartUkjent: () => void;
    foreslåttMotpartNavn?: string;
    brukForeslåttMotpart?: () => void;
    settMotpartManuelt: (person: PersonDto) => void;
};

export default function MotpartVelger({
    form,
    tittel,
    beskrivelse,
    variant,
    velgAnnenMotpart,
    settMotpartUkjent,
    foreslåttMotpartNavn,
    brukForeslåttMotpart,
    settMotpartManuelt,
}: Props) {
    const [visMotpartInfoPanel, setVisMotpartInfoPanel] = useState(false);
    const motpart = form.watch("motpart");

    const visningsnavn = motpart?.erKjent ? `${motpart.navn} (${motpart.ident})` : "Ukjent";
    const harForeslåttMotpart = !!foreslåttMotpartNavn && !!brukForeslåttMotpart;

    const håndterBrukForeslått = () => {
        if (!brukForeslåttMotpart) return;

        setVisMotpartInfoPanel(true);
        brukForeslåttMotpart();
    };

    const håndterVelgAnnen = () => {
        setVisMotpartInfoPanel(true);
        velgAnnenMotpart();
    };

    const håndterFjernMotpart = () => {
        setVisMotpartInfoPanel(false);
        settMotpartUkjent();
    };

    return (
        <div>
            {!visMotpartInfoPanel && (
                <ForeslåPersonPanel
                    tittel={tittel}
                    beskrivelse={beskrivelse}
                    variant={variant}
                    forslagNavn={harForeslåttMotpart ? foreslåttMotpartNavn : undefined}
                    onBrukForslag={harForeslåttMotpart ? håndterBrukForeslått : undefined}
                    onVelgPerson={(person: PersonDto) => {
                        setVisMotpartInfoPanel(true);
                        settMotpartManuelt(person);
                    }}
                />
            )}

            {visMotpartInfoPanel && (
                <Box
                    asChild
                    background="success-moderate"
                    borderWidth="1"
                    borderColor="success-strong"
                    borderRadius="8"
                >
                    <HStack align="center" justify="space-between" marginBlock="space-16 space-0" padding="space-12">
                        <HStack align="center" gap="space-12">
                            <PersonIcon fontSize="1.5rem" aria-hidden className="text-ax-success-700" />
                            <BodyLong size="small" weight="semibold">
                                Motpart: {visningsnavn}
                            </BodyLong>
                        </HStack>
                        <Button
                            type="button"
                            size="xsmall"
                            variant="secondary"
                            onClick={håndterFjernMotpart}
                            icon={<XMarkIcon title="Fjern motpart" />}
                        />
                    </HStack>
                </Box>
            )}
        </div>
    );
}
