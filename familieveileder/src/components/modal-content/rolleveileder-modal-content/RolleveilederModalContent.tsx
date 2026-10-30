import { Loader, Modal } from "@navikt/ds-react";
import React, { SyntheticEvent, useEffect, useMemo, useState } from "react";

import { IFamilieveilederProps } from "../../../pages/familieveileder/FamilieveilederPage";
import PersonSearchService from "../../../service/PersonSearchService";
import { PersonFamilierelasjonerResponse } from "../../../types/personsearch";
import { RolleType } from "../../../types/rolleveileder";
import RolleveilederTable from "../../table/rolleveileder-table/RolleveilederTable";
import BarnModalContent from "../barn-modal-content/BarnModalContent";
import ForeldreModalContent from "../foreldre-modal-content/ForeldreModalContent";

export interface IRolleveilederModalProps extends IFamilieveilederProps {
    onClose: (e?: SyntheticEvent) => void;
    testId?: string;
}

export default function RolleveilederModalContent({
    fodselsnummer,
    rolle,
    valgteRoller,
    onSubmit,
    onClose,
    testId,
}: IRolleveilederModalProps) {
    const [familierelasjoner, setFamilierelasjoner] = useState<PersonFamilierelasjonerResponse>();

    // Remove duplicate barn by fnr. Memoized so the identity is stable across renders,
    // otherwise ForeldreModalContent resets the selected motpart on every render.
    const uniquePersonensFamilieenheter = useMemo(
        () =>
            (familierelasjoner?.personensFamilieenheter ?? []).map((f) => ({
                ...f,
                fellesBarn: f.fellesBarn.filter(
                    (value, index, self) => index === self.findIndex((t) => t.ident === value.ident)
                ),
            })),
        [familierelasjoner]
    );

    useEffect(() => {
        new PersonSearchService().hentFamilierelasjoner(fodselsnummer).then((response) => {
            setFamilierelasjoner(response);
        });
    }, [fodselsnummer, rolle]);

    if (!familierelasjoner) {
        return (
            <Modal.Body data-testid={testId}>
                <div className="flex justify-center py-8">
                    <Loader size="large" title="Henter familierelasjoner" />
                </div>
            </Modal.Body>
        );
    }

    const { person } = familierelasjoner;
    return (
        <Modal.Body className="grid gap-8" data-testid={testId}>
            <RolleveilederTable rolle={rolle} fodselsnummer={fodselsnummer} navn={person.visningsnavn} />
            {rolle === RolleType.BA ? (
                <BarnModalContent
                    familierelasjoner={familierelasjoner}
                    valgteRoller={valgteRoller}
                    onSubmit={onSubmit}
                    onClose={onClose}
                />
            ) : (
                <ForeldreModalContent
                    fodselsnummer={fodselsnummer}
                    rolle={rolle}
                    valgteRoller={valgteRoller}
                    personensFamilieenheter={uniquePersonensFamilieenheter}
                    onClose={onClose}
                    onSubmit={onSubmit}
                />
            )}
        </Modal.Body>
    );
}
