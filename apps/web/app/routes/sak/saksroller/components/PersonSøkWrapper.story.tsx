import type { PersonDto } from "@bidrag/api/PersonApi";
import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { useTestQueryClient } from "@ct/saksroller/useTestQueryClient.ts";
import { Button } from "@navikt/ds-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import PersonInfo from "./PersonInfo.tsx";
import PersonSøkWrapper from "./PersonSøkWrapper.tsx";

function StandardScenario() {
    const queryClient = useTestQueryClient();
    const [vis, setVis] = useState(true);
    const [valgtPerson, setValgtPerson] = useState<PersonDto | null>(null);

    if (!vis) {
        return <p>Søk avbrutt</p>;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <BidragCommonsProviderMock>
                <PersonSøkWrapper
                    tittel="Legg til person"
                    beskrivelse="Søk opp personen som skal legges til"
                    søkeLabel="Søk etter person"
                    onPersonValgt={setValgtPerson}
                    onAvbryt={() => setVis(false)}
                    resultat={
                        valgtPerson && (
                            <PersonInfo navn={valgtPerson.visningsnavn} ident={valgtPerson.ident} rolle="BA" />
                        )
                    }
                />
            </BidragCommonsProviderMock>
        </QueryClientProvider>
    );
}

function MedCustomActionsScenario() {
    const queryClient = useTestQueryClient();
    const [vis, setVis] = useState(true);
    const [valgtPerson, setValgtPerson] = useState<PersonDto | null>(null);
    const [lagtTil, setLagtTil] = useState(false);
    const [feil, setFeil] = useState<string | null>(null);

    if (!vis) {
        return <p>Lukket</p>;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <PersonSøkWrapper
                tittel="Legg til person"
                beskrivelse="Søk opp personen som skal legges til"
                søkeLabel="Søk etter person"
                onPersonValgt={(person) => {
                    setValgtPerson(person);
                    setFeil(null);
                }}
                onAvbryt={() => setVis(false)}
                actions={
                    <>
                        <Button
                            type="button"
                            size="small"
                            onClick={() => {
                                if (!valgtPerson) {
                                    setFeil("Søk opp en person før du legger til.");
                                    return;
                                }
                                setLagtTil(true);
                            }}
                        >
                            Legg til
                        </Button>
                        <Button type="button" size="small" variant="secondary" onClick={() => setVis(false)}>
                            Avbryt
                        </Button>
                    </>
                }
                resultat={
                    <>
                        {feil && <p role="alert">{feil}</p>}
                        {lagtTil && valgtPerson ? <p>{valgtPerson.visningsnavn} er lagt til</p> : null}
                    </>
                }
            />
        </QueryClientProvider>
    );
}

export const Standard = () => <StandardScenario />;

export const MedCustomActions = () => <MedCustomActionsScenario />;
