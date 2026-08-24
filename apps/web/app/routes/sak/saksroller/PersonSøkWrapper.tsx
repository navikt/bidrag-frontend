import { BodyLong, Button, Heading } from "@navikt/ds-react";
import type { ReactNode } from "react";

import type { PersonDto } from "@bidrag/api/PersonApi";
import SøkPerson from "./components/SøkPerson.tsx";

interface PersonSøkWrapperProps {
    tittel: string;
    beskrivelse: string;
    søkeLabel: string;
    onPersonValgt: (person: PersonDto) => void;
    onAvbryt: () => void;
    children?: ReactNode;
}

export default function PersonSøkWrapper({
    tittel,
    beskrivelse,
    søkeLabel,
    onPersonValgt,
    onAvbryt,
    children,
}: PersonSøkWrapperProps) {
    return (
        <div className="mt-3 p-4 bg-ax-accent-100 rounded-lg border border-ax-accent-300">
            <Heading level="3" size="small" spacing>
                {tittel}
            </Heading>
            <BodyLong size="small" className="text-ax-neutral-800" spacing>
                {beskrivelse}
            </BodyLong>

            {children}

            <SøkPerson label={søkeLabel} personInformasjon={(person) => onPersonValgt(person)} />

            <div className="mt-3">
                <Button size="small" type="button" variant="tertiary" onClick={onAvbryt}>
                    Avbryt
                </Button>
            </div>
        </div>
    );
}
