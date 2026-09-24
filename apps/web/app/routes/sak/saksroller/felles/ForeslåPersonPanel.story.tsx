import type { PersonDto } from "@bidrag/api/PersonApi";
import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { Button } from "@navikt/ds-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import SøkPerson from "../components/SøkPerson.tsx";
import ForeslåPersonPanel from "./ForeslåPersonPanel.tsx";

const foreslåttPerson: PersonDto = {
    ident: genererFnr(),
    visningsnavn: "Kari Nordmann",
};

function TestWrapper() {
    const queryClient = useMemo(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: { retry: false, staleTime: Infinity },
                    mutations: { retry: false },
                },
            }),
        [],
    );
    const [valgtPerson, setValgtPerson] = useState<PersonDto | null>(null);
    const [bruktForslag, setBruktForslag] = useState(false);
    const [visSøk, setVisSøk] = useState(false);

    return (
        <QueryClientProvider client={queryClient}>
            <BidragCommonsProviderMock>
                {visSøk ? (
                    <SøkPerson label="Søk etter bidragsmottaker" personInformasjon={setValgtPerson} />
                ) : (
                    <ForeslåPersonPanel
                        tittel="Velg bidragsmottaker"
                        beskrivelse="Velg personen som skal være bidragsmottaker i saken"
                        variant="warning"
                        forslag={[
                            {
                                navn: foreslåttPerson.visningsnavn ?? "",
                                onBruk: () => {
                                    setBruktForslag(true);
                                    setValgtPerson(foreslåttPerson);
                                },
                            },
                        ]}
                    >
                        <Button type="button" size="small" onClick={() => setVisSøk(true)}>
                            Velg annen person
                        </Button>
                    </ForeslåPersonPanel>
                )}
                <output data-testid="brukt-forslag">{String(bruktForslag)}</output>
                <output data-testid="valgt-person">{valgtPerson?.visningsnavn ?? ""}</output>
            </BidragCommonsProviderMock>
        </QueryClientProvider>
    );
}

export const Standard = () => <TestWrapper />;

const forslagListe: PersonDto[] = [
    { ident: genererFnr(), visningsnavn: "Kari Nordmann" },
    { ident: genererFnr(), visningsnavn: "Ola Nordmann" },
];

function FlereForslagWrapper() {
    const queryClient = useMemo(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: { retry: false, staleTime: Infinity },
                    mutations: { retry: false },
                },
            }),
        [],
    );
    const [valgtPerson, setValgtPerson] = useState<PersonDto | null>(null);

    return (
        <QueryClientProvider client={queryClient}>
            <BidragCommonsProviderMock>
                <ForeslåPersonPanel
                    tittel="Velg motpart"
                    beskrivelse="Velg en av de foreslåtte personene, eller søk etter en annen"
                    variant="warning"
                    forslag={forslagListe.map((person) => ({
                        navn: person.visningsnavn ?? "Ukjent",
                        fødselsdato: person.fødselsdato ?? undefined,
                        onBruk: () => setValgtPerson(person),
                    }))}
                />
                <output data-testid="valgt-person">{valgtPerson?.visningsnavn ?? ""}</output>
            </BidragCommonsProviderMock>
        </QueryClientProvider>
    );
}

export const MedFlereForslag = () => <FlereForslagWrapper />;
