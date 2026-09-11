import type { PersonDto } from "@bidrag/api/PersonApi";
import { Button, Modal } from "@navikt/ds-react";
import { type RefObject, useState } from "react";

import FunnetPersonInfo from "../../components/FunnetPersonInfo";
import SøkPerson from "../../components/SøkPerson";
import type { ForelderPartRolle } from "../opprett-sak-schema";

type Props = {
    ref: RefObject<HTMLDialogElement | null>;
    bidragstype: ForelderPartRolle;
    onLeggTil: (person: PersonDto) => void;
};

export default function PartManuellRegistrering({ ref, bidragstype, onLeggTil }: Props) {
    const [funnetPerson, setFunnetPerson] = useState<PersonDto | null>(null);

    const handleLeggTil = () => {
        if (!funnetPerson) {
            return;
        }

        onLeggTil(funnetPerson);
        ref.current?.close();
        setFunnetPerson(null);
    };

    return (
        <Modal ref={ref} header={{ heading: `Legg til ${bidragstype} manuelt` }}>
            <Modal.Body>
                <SøkPerson label={`Søk ${bidragstype}`} personInformasjon={setFunnetPerson} />
                {funnetPerson && (
                    <FunnetPersonInfo
                        navn={funnetPerson.visningsnavn}
                        ident={funnetPerson.ident}
                        fjern={() => setFunnetPerson(null)}
                        diskresjonskode={funnetPerson.diskresjonskode}
                    />
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button size="small" type="button" onClick={() => handleLeggTil()}>
                    Legg til
                </Button>
                <Button
                    size="small"
                    type="button"
                    variant="secondary"
                    onClick={() => {
                        setFunnetPerson(null);
                        ref.current?.close();
                    }}
                >
                    Avbryt
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
