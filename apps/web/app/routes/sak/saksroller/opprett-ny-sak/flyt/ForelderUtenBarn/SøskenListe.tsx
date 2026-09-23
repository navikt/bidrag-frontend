import { PersonNavn } from "@bidrag/common";
import { CheckmarkHeavyIcon, PersonGroupIcon } from "@navikt/aksel-icons";
import { BodyShort, Button, Heading, HStack, VStack } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";
import PersonKort from "../../../felles/PersonKort";
import AlderTag from "../../components/AlderTag";
import { SkjemaSeksjonKort } from "../../felles/SkjemaSeksjon";
import type { BarnMedAlder, ForelderUtenBarnSkjemaData } from "../../opprett-sak-schema";

type Props = {
    form: UseFormReturn<ForelderUtenBarnSkjemaData>;
    søsken: BarnMedAlder[];
};
export default function SøskenListe({ form, søsken }: Props) {
    const motpart = form.watch("motpart");
    const valgteBarn = form.watch("valgteBarn");

    if (søsken.length === 0) {
        return;
    }

    const leggTilSøsken = (barn: BarnMedAlder) => {
        const currentValgteBarn = form.getValues("valgteBarn") || [];
        if (!currentValgteBarn.some((b) => b.ident === barn.ident)) {
            form.setValue("valgteBarn", [...currentValgteBarn, barn]);
        }
    };
    return (
        <SkjemaSeksjonKort>
            <VStack gap="space-12">
                <VStack gap="space-4">
                    <HStack asChild align="center" gap="space-8">
                        <Heading level="3" size="small" spacing>
                            <PersonGroupIcon aria-hidden fontSize="1.5rem" />
                            Søsken funnet ({søsken.length})
                        </Heading>
                    </HStack>
                    <BodyShort size="small">
                        Vi fant barn som har samme forelder (
                        <PersonNavn bareFornavn={false} navn={motpart.navn || "ukjent"} />
                        ). Disse kan legges til i samme sak.
                    </BodyShort>
                </VStack>
                <VStack gap="space-8">
                    {søsken.map((barn, i) => {
                        const erAlleredeValgt = valgteBarn.some((b) => b.ident === barn.ident);
                        return (
                            <PersonKort
                                key={i}
                                person={{
                                    ident: barn.ident,
                                    visningsnavn: barn.navn,
                                    diskresjonskode: barn.diskresjonskode,
                                }}
                            >
                                <HStack align="center" justify="space-between" gap="space-8">
                                    <AlderTag {...barn} deaktivert={false} />
                                    {erAlleredeValgt ? (
                                        <HStack asChild align="center" gap="space-4">
                                            <BodyShort size="small" weight="semibold">
                                                <CheckmarkHeavyIcon aria-hidden fontSize="1.5rem" /> Valgt
                                            </BodyShort>
                                        </HStack>
                                    ) : (
                                        <Button type="button" size="xsmall" onClick={() => leggTilSøsken(barn)}>
                                            Legg til
                                        </Button>
                                    )}
                                </HStack>
                            </PersonKort>
                        );
                    })}
                </VStack>
            </VStack>
        </SkjemaSeksjonKort>
    );
}
