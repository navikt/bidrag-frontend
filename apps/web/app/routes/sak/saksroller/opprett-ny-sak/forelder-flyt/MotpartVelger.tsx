import { PersonIcon, XMarkIcon } from "@navikt/aksel-icons";
import { Alert, BodyLong, BodyShort, Button, Heading } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { ForelderUtenBarnSkjemaData } from "../opprett-sak-schema";

type Props = {
    form: UseFormReturn<ForelderUtenBarnSkjemaData>;
    tittel: string;
    beskrivelse: string;
    variant: "warning" | "success";
    velgAnnenMotpart: () => void;
    settMotpartUkjent: () => void;
    foreslåttMotpartNavn?: string;
    brukForeslåttMotpart?: () => void;
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
                <Alert variant={variant} size="small">
                    <div className="space-y-3">
                        <div>
                            <Heading level="3" size="small" spacing>
                                {tittel}
                            </Heading>
                            <BodyShort size="small">{beskrivelse}</BodyShort>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            {harForeslåttMotpart && (
                                <Button type="button" size="small" onClick={håndterBrukForeslått}>
                                    Bruk {foreslåttMotpartNavn}
                                </Button>
                            )}

                            <Button type="button" size="small" onClick={håndterVelgAnnen}>
                                Velg annen person
                            </Button>
                        </div>
                    </div>
                </Alert>
            )}

            {visMotpartInfoPanel && (
                <div className="mt-4 p-3 border bg-ax-success-200 border-solid border-ax-success-600 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <PersonIcon fontSize="1.5rem" aria-hidden className="text-ax-success-700" />
                        <BodyLong size="small" className="font-semibold">
                            Motpart: {visningsnavn}
                        </BodyLong>
                    </div>
                    <Button
                        type="button"
                        size="xsmall"
                        variant="secondary"
                        onClick={håndterFjernMotpart}
                        icon={<XMarkIcon title="Fjern motpart" />}
                    />
                </div>
            )}
        </div>
    );
}
