import type { PersonDto } from "@bidrag/api/PersonApi";
import { PersonPlusIcon } from "@navikt/aksel-icons";
import { BodyLong, Box, Button, Heading, HStack, VStack } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import PersonInfo from "./components/PersonInfo.tsx";
import PersonSøkWrapper from "./PersonSøkWrapper.tsx";
import type { Rolle, SakRedigeringData } from "./sakvisning-schema.ts";

interface LeggTilForelderProps {
    form: UseFormReturn<SakRedigeringData>;
    rolleType: "BP" | "BM";
    rolleNavn: string;
    muligeAndreForeldre?: PersonDto[];
    saksnummer?: string;
}

export default function LeggTilForelder({
    form,
    rolleType,
    rolleNavn,
    muligeAndreForeldre = [],
    saksnummer,
}: LeggTilForelderProps) {
    const [visSøk, setVisSøk] = useState(false);
    const roller = form.watch("roller") || [];

    const handlePersonValgt = (person: PersonDto) => {
        const denAndreForelderenType = rolleType === "BM" ? "BP" : "BM";
        const denAndreForelderen = roller.find((r) => r.type === denAndreForelderenType);
        const denAndreForelderenRolle = rolleType === "BM" ? "bidragspliktig" : "bidragsmottaker";

        if (denAndreForelderen?.fodselsnummer && denAndreForelderen.fodselsnummer === person.ident) {
            const personInfo = person?.visningsnavn
                ? `${person.visningsnavn} (${person.ident})`
                : person?.ident
                  ? `Denne personen (${person.ident})`
                  : "Denne personen";

            throw new Error(
                `${personInfo} er allerede registrert som ${denAndreForelderenRolle} og kan ikke legges til på nytt.`,
            );
        }

        const nyForelder: Rolle = {
            fodselsnummer: person.ident,
            foedselsnummer: person.ident,
            navn: person.visningsnavn ?? undefined,
            fødselsdato: person.fødselsdato ?? undefined,
            diskresjonskode: person.diskresjonskode ?? undefined,
            type: rolleType,
            rolleType,
            objektnummer: "",
            reellMottager: undefined,
            reellMottaker: undefined,
            mottagerErVerge: false,
            samhandlerIdent: undefined,
        };
        form.setValue("roller", [...roller, nyForelder], { shouldValidate: true });
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
        <PersonSøkWrapper
            tittel={`Legg til ${rolleNavn.toLowerCase()}`}
            beskrivelse={`Søk opp personen som skal være ${rolleNavn.toLowerCase()} i saken`}
            søkeLabel={`Søk etter ${rolleNavn.toLowerCase()}`}
            onPersonValgt={handlePersonValgt}
            onAvbryt={() => setVisSøk(false)}
            saksnummer={saksnummer}
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
        </PersonSøkWrapper>
    );
}
