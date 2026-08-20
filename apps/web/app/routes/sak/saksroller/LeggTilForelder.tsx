import { PersonPlusIcon } from "@navikt/aksel-icons";
import { BodyLong, Button, Heading } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { PersonDto } from "@bidrag/api/PersonApi";
import PersonInfo from "./components/PersonInfo.tsx";
import PersonSøkWrapper from "./PersonSøkWrapper.tsx";
import type { Rolle, SakRedigeringData } from "./sakvisning-schema.ts";

interface LeggTilForelderProps {
    form: UseFormReturn<SakRedigeringData>;
    rolleType: "BP" | "BM";
    rolleNavn: string;
    muligeAndreForeldre?: PersonDto[];
}

export default function LeggTilForelder({ form, rolleType, rolleNavn, muligeAndreForeldre = [] }: LeggTilForelderProps) {
    const [visSøk, setVisSøk] = useState<boolean>(false);
    const roller = form.watch("roller") || [];

    const handlePersonValgt = (person: PersonDto) => {
        const denAndreForelderen = roller.find((r) => r.type !== rolleType);
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
            navn: person.visningsnavn,
            fødselsdato: person?.fødselsdato,
            diskresjonskode: person.diskresjonskode,
            type: rolleType,
            rolleType: rolleType,
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
            <div className="p-6 bg-ax-warning-200 rounded-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <BodyLong className="font-medium">{rolleNavn}</BodyLong>
                        <BodyLong size="small" className="text-ax-neutral-800">
                            Ukjent - ikke registrert
                        </BodyLong>
                    </div>
                    <Button
                        icon={<PersonPlusIcon aria-hidden />}
                        variant="secondary"
                        size="small"
                        onClick={() => setVisSøk(true)}
                    >
                        Legg til person
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <PersonSøkWrapper
            tittel={`Legg til ${rolleNavn.toLowerCase()}`}
            beskrivelse={`Søk opp personen som skal være ${rolleNavn.toLowerCase()} i saken`}
            søkeLabel={`Søk etter ${rolleNavn.toLowerCase()}`}
            onPersonValgt={handlePersonValgt}
            onAvbryt={() => setVisSøk(false)}
        >
            {muligeAndreForeldre.length > 0 && (
                <div className="mb-4 p-3 bg-ax-bg-default rounded-lg">
                    <Heading level="4" size="xsmall" spacing>
                        Foreslåtte foreldre ({muligeAndreForeldre.length})
                    </Heading>
                    <BodyLong size="small" className="text-ax-neutral-800 mb-3">
                        Klikk på en person for å legge til
                    </BodyLong>
                    <div className="space-y-2">
                        {muligeAndreForeldre.map((forelder) => {
                            return (
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
                                        fødselsdato={forelder?.fødselsdato || ""}
                                    />
                                </Button>
                            );
                        })}
                    </div>
                </div>
            )}
        </PersonSøkWrapper>
    );
}
