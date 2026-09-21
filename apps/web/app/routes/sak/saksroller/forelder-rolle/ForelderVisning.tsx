import type { PersonDto } from "@bidrag/api/PersonApi";
import { PencilIcon, XMarkIcon } from "@navikt/aksel-icons";
import { Button, HStack, Tag, VStack } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import DiskresjonAlert from "../components/DiskresjonAlert.tsx";
import PersonInfo from "../components/PersonInfo.tsx";
import PersonSøkWrapper from "../components/PersonSøkWrapper.tsx";
import RollehistorikkVisning from "../RollehistorikkVisning.tsx";
import type { Rolle, SakRedigeringData } from "../sakvisning-schema.ts";

interface ForelderVisningProps {
    form: UseFormReturn<SakRedigeringData>;
    rolle: Rolle;
    erNyForelder: boolean;
    saksnummer?: string;
}

export default function ForelderVisning({ form, rolle, erNyForelder, saksnummer }: ForelderVisningProps) {
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
                <RollehistorikkVisning rollehistorikk={rolle.rollehistorikk} rolle={rolle} saksnummer={saksnummer} />
            </PersonInfo>
            <HStack gap="space-4">
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
                <PersonSøkWrapper
                    tittel={`Endre ${forelderRolleNavn}`}
                    beskrivelse={`Søk opp personen som skal være ${forelderRolleNavn} i saken`}
                    søkeLabel={`Søk etter ${forelderRolleNavn}`}
                    onPersonValgt={handlePersonValgt}
                    onAvbryt={() => setVisSøk(false)}
                />
            )}
        </VStack>
    );
}
