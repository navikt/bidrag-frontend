import { Button, HStack } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import ForeslåPersonPanel from "../../../felles/ForeslåPersonPanel";
import ValgtMotpart from "../../motpart-felles/ValgtMotpart";
import type { ForelderUtenBarnSkjemaData } from "../../opprett-sak-schema";
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

    const forslag = foreslåttMotparter.map((forelder) => ({
        navn: forelder.visningsnavn,
        fødselsdato: forelder.fødselsdato ?? undefined,
        onBruk: () => {
            setVisMotpartInfoPanel(true);
            brukForeslåttMotpart(forelder);
        },
    }));

    if (!visMotpartInfoPanel) {
        return (
            <ForeslåPersonPanel
                tittel={tittel}
                beskrivelse="Vi fant flere foreldre som er registrert som forelder til valgte barn"
                variant="success"
                forslag={forslag}
            >
                <HStack justify="center" gap="space-8" wrap>
                    <Button type="button" size="small" onClick={håndterVelgAnnen}>
                        Velg annen person
                    </Button>
                    <Button type="button" size="small" variant="secondary-neutral" onClick={håndterSettUkjent}>
                        Sett som ukjent
                    </Button>
                </HStack>
            </ForeslåPersonPanel>
        );
    }

    return <ValgtMotpart visningsnavn={visningsnavn} onFjern={håndterFjernMotpart} />;
}
