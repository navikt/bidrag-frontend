import type { PersonDto } from "@bidrag/api/PersonApi";
import { PencilIcon, XMarkIcon } from "@navikt/aksel-icons";
import { BodyLong, Box, Button, Heading, HStack, Tag, VStack } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import DiskresjonAlert from "./components/DiskresjonAlert.tsx";
import PersonInfo from "./components/PersonInfo.tsx";
import SøkPerson from "./components/SøkPerson.tsx";
import RollehistorikkVisning from "./RollehistorikkVisning.tsx";
import type { Rolle, SakRedigeringData } from "./sakvisning-schema.ts";

interface ForelderVisningProps {
    form: UseFormReturn<SakRedigeringData>;
    rolle: Rolle;
    erNyForelder: boolean;
}

export default function ForelderVisning({ form, rolle, erNyForelder }: ForelderVisningProps) {
    const [visSøk, setVisSøk] = useState(false);
    const roller = form.watch("roller") || [];

    const forelderRolleNavn = rolle.type === "BP" ? "bidragspliktig" : "bidragsmottaker";

    const handlePersonValgt = (person: PersonDto) => {
        const nyForelder: Rolle = {
            ...rolle,
            fodselsnummer: person.ident,
            foedselsnummer: person.ident,
            navn: person.visningsnavn ?? undefined,
            fødselsdato: person.fødselsdato ?? undefined,
            diskresjonskode: person.diskresjonskode ?? undefined,
        };

        const finnesAllerede = roller.some((r) => r.type === rolle.type);

        if (finnesAllerede) {
            const oppdaterteRoller = roller.map((r) => {
                if (r.type === rolle.type) {
                    return nyForelder;
                }
                return r;
            });

            form.setValue("roller", oppdaterteRoller, { shouldValidate: true });
        } else {
            const oppdaterteRoller = [...roller, nyForelder];
            form.setValue("roller", oppdaterteRoller, { shouldValidate: true });
        }

        setVisSøk(false);
    };

    const handleFjernForelder = () => {
        const oppdaterteRoller = roller.filter((r) => r.fodselsnummer !== rolle.fodselsnummer);
        form.setValue("roller", oppdaterteRoller, { shouldValidate: true });
    };

    return (
        <VStack gap="space-4">
            <HStack gap="space-4" align="start" justify="space-between" wrap={false}>
                <PersonInfo
                    navn={rolle.navn}
                    ident={rolle.fodselsnummer}
                    fødselsdato={rolle.fødselsdato}
                    rolle={rolle.type}
                    visModiaLenke
                    tags={
                        erNyForelder && (
                            <Tag variant="alt1" size="xsmall">
                                Ny
                            </Tag>
                        )
                    }
                >
                    {rolle.diskresjonskode && <DiskresjonAlert diskresjonskode={rolle.diskresjonskode} />}
                    <RollehistorikkVisning rollehistorikk={rolle.rollehistorikk} rolle={rolle} />
                </PersonInfo>
                <HStack gap="space-8" wrap={false}>
                    {!visSøk && erNyForelder && (
                        <Button
                            variant="tertiary"
                            type="button"
                            size="small"
                            icon={<PencilIcon aria-hidden />}
                            onClick={() => setVisSøk(true)}
                        >
                            Endre
                        </Button>
                    )}
                    {erNyForelder && (
                        <Button
                            type="button"
                            size="small"
                            variant="tertiary"
                            icon={<XMarkIcon aria-hidden />}
                            onClick={handleFjernForelder}
                        >
                            Fjern
                        </Button>
                    )}
                </HStack>
            </HStack>

            {visSøk && (
                <Box background="accent-soft" borderColor="accent" borderWidth="1" borderRadius="12" padding="space-16">
                    <VStack gap="space-16">
                        <VStack gap="space-4">
                            <Heading level="3" size="small">
                                Endre {forelderRolleNavn}
                            </Heading>
                            <BodyLong size="small" textColor="subtle">
                                Søk opp personen som skal være {forelderRolleNavn} i saken
                            </BodyLong>
                        </VStack>

                        <SøkPerson label={`Søk etter ${forelderRolleNavn}`} personInformasjon={handlePersonValgt} />

                        <Button size="small" variant="tertiary" onClick={() => setVisSøk(false)} type="button">
                            Avbryt
                        </Button>
                    </VStack>
                </Box>
            )}
        </VStack>
    );
}
