import type { PersonDto } from "@bidrag/api/PersonApi";

import PersonSamhandlerSok from "./PersonSamhandlerSok.tsx";

type Props = {
    label: string;
    personInformasjon: (person: PersonDto) => void | Promise<void>;
};

export default function SøkPerson({ label, personInformasjon }: Props) {
    return <PersonSamhandlerSok label={label} onResult={personInformasjon} />;
}
