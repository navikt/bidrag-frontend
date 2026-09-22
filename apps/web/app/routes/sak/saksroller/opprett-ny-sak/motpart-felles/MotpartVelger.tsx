import { Button } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import ForeslåPersonPanel from "../../felles/ForeslåPersonPanel";
import type { ForelderUtenBarnSkjemaData } from "../opprett-sak-schema";
import ValgtMotpart from "./ValgtMotpart";

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

    if (!visMotpartInfoPanel) {
        return (
            <ForeslåPersonPanel
                tittel={tittel}
                beskrivelse={beskrivelse}
                variant={variant}
                forslag={
                    harForeslåttMotpart ? [{ navn: foreslåttMotpartNavn, onBruk: håndterBrukForeslått }] : undefined
                }
            >
                <Button type="button" size="small" onClick={håndterVelgAnnen}>
                    Velg annen person
                </Button>
            </ForeslåPersonPanel>
        );
    }

    return <ValgtMotpart visningsnavn={visningsnavn} onFjern={håndterFjernMotpart} />;
}
