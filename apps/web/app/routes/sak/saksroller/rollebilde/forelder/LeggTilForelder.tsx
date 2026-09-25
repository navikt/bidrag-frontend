import type { PersonDto } from "@bidrag/api/PersonApi";
import { PersonPlusIcon } from "@navikt/aksel-icons";
import { BodyLong, Box, Button, Heading, HStack, VStack } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import PersonInfo from "../../felles/person/PersonInfo.tsx";
import { PersonSøkInnhold } from "../../felles/person-søk/PersonSøkWrapper.tsx";
import RedigeringsRamme from "../../felles/RedigeringsRamme.tsx";
import type { Rolle, SakRedigeringData } from "../../felles/sakvisning-schema.ts";
import { useRegistrerÅpenRedigering } from "../RedigeringRegisterContext.tsx";
import { finnDuplikatForelderFeil } from "./forelder-regler.ts";

interface LeggTilForelderProps {
    form: UseFormReturn<SakRedigeringData>;
    rolleType: "BP" | "BM";
    rolleNavn: string;
    muligeAndreForeldre?: PersonDto[];
}

export default function LeggTilForelder({
    form,
    rolleType,
    rolleNavn,
    muligeAndreForeldre = [],
}: LeggTilForelderProps) {
    const [visSøk, setVisSøk] = useState(false);
    useRegistrerÅpenRedigering(`legg-til-forelder-${rolleType}`, visSøk);
    const roller = form.watch("roller") || [];

    const handlePersonValgt = (person: PersonDto) => {
        const duplikatFeil = finnDuplikatForelderFeil(roller, rolleType, person);
        if (duplikatFeil) {
            throw new Error(duplikatFeil);
        }

        const eksisterendeRolle = roller.find((r) => r.type === rolleType);
        const nyForelder: Rolle = {
            ...eksisterendeRolle,
            fodselsnummer: person.ident,
            foedselsnummer: person.ident,
            navn: person.visningsnavn ?? undefined,
            fødselsdato: person.fødselsdato ?? undefined,
            diskresjonskode: person.diskresjonskode ?? undefined,
            type: rolleType,
            rolleType,
            objektnummer: eksisterendeRolle?.objektnummer ?? "",
            reellMottager: undefined,
            reellMottaker: undefined,
            mottagerErVerge: false,
            samhandlerIdent: undefined,
        };
        const oppdaterteRoller = eksisterendeRolle
            ? roller.map((r) => (r.type === rolleType ? nyForelder : r))
            : [...roller, nyForelder];
        form.setValue("roller", oppdaterteRoller, { shouldValidate: true });
        setVisSøk(false);
    };

    if (!visSøk) {
        return (
            <Box background="warning-soft" borderRadius="12" padding="space-24">
                <HStack justify="space-between" align="center" gap="space-16">
                    <VStack gap="space-4">
                        <Heading level="3" size="xsmall">
                            {rolleNavn}
                        </Heading>
                        <BodyLong size="small" textColor="subtle">
                            Ukjent - ikke registrert
                        </BodyLong>
                    </VStack>
                    <Button
                        icon={<PersonPlusIcon aria-hidden />}
                        variant="secondary"
                        size="small"
                        onClick={() => setVisSøk(true)}
                    >
                        Legg til person
                    </Button>
                </HStack>
            </Box>
        );
    }

    return (
        <RedigeringsRamme tittel={`Legg til ${rolleNavn.toLowerCase()}`} onAvbryt={() => setVisSøk(false)}>
            <PersonSøkInnhold
                beskrivelse={`Søk opp personen som skal være ${rolleNavn.toLowerCase()} i saken`}
                søkeLabel={`Søk etter ${rolleNavn.toLowerCase()}`}
                onPersonValgt={handlePersonValgt}
            >
                {muligeAndreForeldre.length > 0 && (
                    <Box
                        background="raised"
                        borderColor="neutral-subtleA"
                        borderWidth="1"
                        borderRadius="12"
                        padding="space-16"
                    >
                        <Heading level="4" size="xsmall" spacing>
                            Foreslåtte foreldre ({muligeAndreForeldre.length})
                        </Heading>
                        <BodyLong size="small" textColor="subtle" spacing>
                            Klikk på en person for å legge til
                        </BodyLong>
                        <VStack gap="space-8">
                            {muligeAndreForeldre.map((forelder) => (
                                <Button
                                    key={forelder.ident}
                                    type="button"
                                    variant="tertiary"
                                    size="small"
                                    className="w-full justify-start"
                                    onClick={() => handlePersonValgt(forelder)}
                                >
                                    <PersonInfo
                                        navn={forelder.visningsnavn}
                                        ident={forelder.ident}
                                        fødselsdato={forelder.fødselsdato || ""}
                                    />
                                </Button>
                            ))}
                        </VStack>
                    </Box>
                )}
            </PersonSøkInnhold>
        </RedigeringsRamme>
    );
}
