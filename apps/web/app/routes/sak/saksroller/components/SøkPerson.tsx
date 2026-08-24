import type { PersonDto } from "@bidrag/api/PersonApi";

import PersonSamhandlerSøk from "./PersonSamhandlerSøk.tsx";

type Props = {
    label: string;
    personInformasjon: (person: PersonDto) => void | Promise<void>;
};

export default function SøkPerson({ label, personInformasjon }: Props) {
    return <PersonSamhandlerSøk label={label} onResult={personInformasjon} />;
}
