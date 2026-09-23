import { BodyShort, Button, HStack, VStack } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ForelderUtenBarnSkjemaData } from "../opprett-sak-schema";

type Props = {
    form: UseFormReturn<ForelderUtenBarnSkjemaData>;
    tittel: string;
    beskrivelse: string;
    settMotpartUkjent?: () => void;
    foreslåtteMotparter?: Array<{
        ident: string;
        navn: string;
        fødselsdato?: string;
    }>;
    brukForeslåttMotpart?: (ident: string) => void;
};

export default function MotpartVelger({
    form,
    tittel,
    beskrivelse,
    settMotpartUkjent,
    foreslåtteMotparter = [],
    brukForeslåttMotpart,
}: Props) {
    const [ukjentErBekreftet, setUkjentErBekreftet] = useState(false);
    const motpart = form.watch("motpart");

    const håndterSettUkjent = () => {
        settMotpartUkjent?.();
        setUkjentErBekreftet(true);
    };

    if (motpart?.erKjent || ukjentErBekreftet) {
        return null;
    }

    return (
        <VStack gap="space-12">
            <VStack gap="space-4">
                <BodyShort size="small" weight="semibold">
                    {tittel}
                </BodyShort>
                <BodyShort size="small">{beskrivelse}</BodyShort>
            </VStack>
            {foreslåtteMotparter.map((forelder) => (
                <Button
                    key={forelder.ident}
                    type="button"
                    size="small"
                    variant="secondary"
                    onClick={() => brukForeslåttMotpart?.(forelder.ident)}
                >
                    Bruk {forelder.navn}
                    {forelder.fødselsdato && ` (${forelder.fødselsdato})`}
                </Button>
            ))}
            {foreslåtteMotparter.length > 1 && settMotpartUkjent && (
                <HStack gap="space-8" wrap>
                    <Button type="button" size="small" variant="secondary-neutral" onClick={håndterSettUkjent}>
                        Sett som ukjent
                    </Button>
                </HStack>
            )}
        </VStack>
    );
}
