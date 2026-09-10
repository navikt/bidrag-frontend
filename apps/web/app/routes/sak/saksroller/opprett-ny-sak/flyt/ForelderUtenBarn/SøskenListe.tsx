import { PersonNavn } from "@bidrag/common";
import { CheckmarkHeavyIcon, PersonGroupIcon } from "@navikt/aksel-icons";
import { Alert, BodyShort, Box, Button, Heading, HStack, VStack } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";
import DiskresjonAlert from "../../../components/DiskresjonAlert";
import AlderTag from "../../components/AlderTag";
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
        <Alert variant="info">
            <VStack gap="space-12">
                <div>
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
                </div>
                <VStack gap="space-8">
                    {søsken.map((barn, i) => {
                        const erAlleredeValgt = valgteBarn.some((b) => b.ident === barn.ident);
                        return (
                            <Box
                                key={i}
                                background="default"
                                borderRadius="4"
                                borderWidth="1"
                                borderColor="neutral-subtleA"
                                asChild
                            >
                                <HStack align="center" justify="space-between" padding="space-12">
                                    <VStack>
                                        <HStack asChild align="center" gap="space-8">
                                            <BodyShort size="small">
                                                {barn.navn} ({barn.ident})
                                                <AlderTag {...barn} deaktivert={false} />
                                            </BodyShort>
                                        </HStack>
                                        {barn?.diskresjonskode && (
                                            <DiskresjonAlert diskresjonskode={barn.diskresjonskode} />
                                        )}
                                    </VStack>
                                    {erAlleredeValgt ? (
                                        <HStack asChild align="center">
                                            <BodyShort
                                                size="small"
                                                weight="semibold"
                                                className="text-ax-success-700"
                                            >
                                                <CheckmarkHeavyIcon aria-hidden fontSize="1.5rem" /> Valgt
                                            </BodyShort>
                                        </HStack>
                                    ) : (
                                        <Button type="button" size="xsmall" onClick={() => leggTilSøsken(barn)}>
                                            Legg til
                                        </Button>
                                    )}
                                </HStack>
                            </Box>
                        );
                    })}
                </VStack>
            </VStack>
        </Alert>
    );
}
