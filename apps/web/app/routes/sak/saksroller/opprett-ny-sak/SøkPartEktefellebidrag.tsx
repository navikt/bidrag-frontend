import type { PersonDto } from "@bidrag/api/PersonApi";
import { Alert, Radio, RadioGroup } from "@navikt/ds-react";
import { useState } from "react";
import SøkPerson from "../components/SøkPerson";
import type { ForelderPartRolle } from "./opprett-sak-schema";

type Props = {
    onLeggTil: (person: PersonDto, rolle: ForelderPartRolle) => void;
};

export default function SøkPartEktefellebidrag({ onLeggTil }: Props) {
    const [rolle, setRolle] = useState<ForelderPartRolle>("bidragspliktig");

    return (
        <div className="space-y-6">
            <Alert variant="info" size="small">
                Du oppretter en ektefellebidragssak.
            </Alert>

            <RadioGroup legend="Hvem søker du etter?" value={rolle} onChange={setRolle}>
                <Radio value="bidragspliktig">Bidragspliktig</Radio>
                <Radio value="bidragsmottaker">Bidragsmottaker</Radio>
            </RadioGroup>

            <SøkPerson
                label={`Søk ${rolle === "bidragspliktig" ? "bidragspliktig" : "bidragsmottaker"}`}
                personInformasjon={(person) => {
                    onLeggTil(person, rolle);
                }}
            />
        </div>
    );
}
