import type { PersonDto } from "@bidrag/api/PersonApi";

import PersonSamhandlerSøk from "./PersonSamhandlerSøk.tsx";

type Props = {
    label: string;
    personInformasjon: (person: PersonDto) => void | Promise<void>;
    onError?: (feil: string) => void;
    onQueryChange?: () => void;
};

export default function SøkPerson({ label, personInformasjon, onError, onQueryChange }: Props) {
    return (
        <PersonSamhandlerSøk
            label={label}
            onResult={personInformasjon}
            onError={onError ?? (() => undefined)}
            onQueryChange={onQueryChange}
        />
    );
}
