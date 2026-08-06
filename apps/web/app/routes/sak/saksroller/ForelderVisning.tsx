import { PadlockLockedIcon, PencilIcon, PersonIcon, XMarkIcon } from "@navikt/aksel-icons";
import { BodyLong, Button, Heading, HStack, Tag, VStack } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { PersonDto } from "@bidrag/api/PersonApi";
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
            navn: person.visningsnavn,
            fødselsdato: person.fødselsdato,
            diskresjonskode: person.diskresjonskode,
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
                <div className="flex gap-3 flex-1">
                    {rolle?.diskresjonskode ? (
                        <PadlockLockedIcon
                            aria-hidden
                            fontSize="1.8rem"
                            className="font-semibold text-ax-warning-900 flex-shrink-0 mt-1"
                        />
                    ) : (
                        <PersonIcon
                            aria-hidden
                            fontSize="1.5rem"
                            className="text-ax-brand-blue-600 flex-shrink-0 mt-1"
                        />
                    )}
                    <div className="flex-1">
                        <PersonInfo
                            navn={rolle.navn}
                            ident={rolle.fodselsnummer}
                            fødselsdato={rolle.fødselsdato}
                            tags={
                                <>
                                    {erNyForelder && (
                                        <Tag variant="alt1" size="xsmall">
                                            Ny
                                        </Tag>
                                    )}
                                </>
                            }
                        />
                        {rolle.diskresjonskode && <DiskresjonAlert diskresjonskode={rolle.diskresjonskode} />}
                    </div>
                </div>
                <HStack gap="space-2" className="flex-shrink-0">
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
                <div className="mt-2 p-4 bg-ax-accent-100 rounded-lg border border-ax-accent-300">
                    <VStack gap="space-4">
                        <div>
                            <Heading level="3" size="small">
                                Endre {forelderRolleNavn}
                            </Heading>
                            <BodyLong size="small" className="text-ax-neutral-800 mt-1">
                                Søk opp personen som skal være {forelderRolleNavn} i saken
                            </BodyLong>
                        </div>

                        <SøkPerson label={`Søk etter ${forelderRolleNavn}`} personInformasjon={handlePersonValgt} />

                        <div>
                            <Button size="small" variant="tertiary" onClick={() => setVisSøk(false)} type="button">
                                Avbryt
                            </Button>
                        </div>
                    </VStack>
                </div>
            )}
            <RollehistorikkVisning rollehistorikk={rolle.rollehistorikk} />
        </VStack>
    );
}
