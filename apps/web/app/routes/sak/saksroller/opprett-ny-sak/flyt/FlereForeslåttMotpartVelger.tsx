import { PersonIcon, XMarkIcon } from "@navikt/aksel-icons";
import { Alert, BodyLong, BodyShort, Button, Heading, Select } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import MaskerSensitivInfo from "../components/MaskerSensitivInfo";
import type { ForelderUtenBarnSkjemaData } from "../opprett-sak-schema";
import type { ForeslåttForelder } from "./ForelderUtenBarnFlyt";

type Props = {
    form: UseFormReturn<ForelderUtenBarnSkjemaData>;
    tittel: string;
    foreslåttMotparter: ForeslåttForelder[];
    velgAnnenMotpart: () => void;
    settMotpartUkjent: () => void;
    brukForeslåttMotpart: (forelder: ForeslåttForelder) => void;
};

export default function FlereForeslåttMotpartVelger({
    form,
    tittel,
    foreslåttMotparter,
    velgAnnenMotpart,
    settMotpartUkjent,
    brukForeslåttMotpart,
}: Props) {
    const [visMotpartInfoPanel, setVisMotpartInfoPanel] = useState(false);
    const motpart = form.watch("motpart");

    const visningsnavn = motpart?.erKjent ? `${motpart.navn} (${motpart.ident})` : "Ukjent";

    if (foreslåttMotparter.length === 0) {
        return null;
    }

    const håndterVelgForeslått = (forelderIdent: string) => {
        const forelder = foreslåttMotparter.find((f) => f.ident === forelderIdent);
        if (!forelder) return;

        setVisMotpartInfoPanel(true);
        brukForeslåttMotpart(forelder);
    };

    const håndterVelgAnnen = () => {
        setVisMotpartInfoPanel(true);
        velgAnnenMotpart();
    };

    const håndterSettUkjent = () => {
        setVisMotpartInfoPanel(true);
        settMotpartUkjent();
    };

    const håndterFjernMotpart = () => {
        setVisMotpartInfoPanel(false);
        settMotpartUkjent();
    };

    return (
        <div>
            {!visMotpartInfoPanel && (
                <Alert variant="success" size="small">
                    <div className="space-y-3">
                        <div>
                            <Heading level="3" size="small" spacing>
                                {tittel}
                            </Heading>
                            <BodyShort size="small">
                                Vi fant flere foreldre som er registrert som forelder til valgte barn
                            </BodyShort>
                        </div>

                        <Select
                            label="Velg foreslått motpart"
                            onChange={(e) => håndterVelgForeslått(e.target.value)}
                            size="medium"
                        >
                            <option value="">- Velg foreslått motpart -</option>
                            {foreslåttMotparter.map((forelder) => (
                                <option key={forelder.ident} value={forelder.ident}>
                                    {forelder.visningsnavn} ({forelder.ident}) - forelder til {forelder.barnNavn} (
                                    {forelder.barnIdent})
                                </option>
                            ))}
                        </Select>

                        <div className="text-center text-ax-neutral-700">eller</div>

                        <div className="flex gap-2 flex-wrap">
                            <Button type="button" size="small" onClick={håndterVelgAnnen}>
                                Velg annen person
                            </Button>

                            <Button type="button" size="small" variant="secondary-neutral" onClick={håndterSettUkjent}>
                                Sett som ukjent
                            </Button>
                        </div>
                    </div>
                </Alert>
            )}

            {visMotpartInfoPanel && (
                <div className="mt-4 p-3 border bg-ax-success-200 border-solid border-ax-success-600 rounded-lg flex items-center justify-between">
                    <MaskerSensitivInfo className="flex items-center gap-3">
                        <PersonIcon fontSize="1.5rem" aria-hidden className="text-ax-success-700" />
                        <BodyLong size="small" className="font-semibold">
                            Motpart: {visningsnavn}
                        </BodyLong>
                    </MaskerSensitivInfo>
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
