import { Select } from "@navikt/ds-react";
import { ChangeEvent, useEffect, useState } from "react";
import React from "react";

import { FamileenhetDto } from "../../../types/personsearch";
import { RolleType, Rolleveileder } from "../../../types/rolleveileder";
import { IFamilierelasjonTableData } from "../../../types/table";
import { includesSomeElement } from "../../../utils/arrayUtils";
import {
    getFamileenhetByMotpartFodselsnummer,
    getFamilieenhetUtenMotpart,
    getFamilierelasjonByRolle,
    getMotpartRolleType,
} from "../../../utils/personUtils";
import DefaultButton from "../../button/default-button/DefaultButton";
import ForeldreRolleTable from "../../table/foreldre-rolle-table/ForeldreRolleTable";
import { IRolleveilederModalProps } from "../rolleveileder-modal-content/RolleveilederModalContent";

interface IForeldreModalContentProps extends IRolleveilederModalProps {
    personensFamilieenheter: FamileenhetDto[];
}

const UKJENT_MOTPART = "ukjent";

// Familieenheter without motpart are grouped under the "Ukjent"-option. If the person has no
// such familieenhet we fall back to an empty one so the user can still deselect motpart.
function ukjentFamilieenhet(personensFamilieenheter: FamileenhetDto[]): FamileenhetDto {
    return (
        getFamilieenhetUtenMotpart(personensFamilieenheter) ?? {
            forelderrolleMotpart: undefined,
            motpart: null,
            fellesBarn: [],
        }
    );
}

export default function ForeldreModalContent({
    fodselsnummer,
    rolle,
    valgteRoller,
    personensFamilieenheter,
    onClose,
    onSubmit,
}: IForeldreModalContentProps) {
    const [selectedFamilieenhet, setSelectedFamilieenhet] = useState<FamileenhetDto>();
    const [selectedPersoner, setSelectedPersoner] = useState<IFamilierelasjonTableData[]>([]);

    useEffect(() => {
        const selectedMotpart = valgteRoller[getMotpartRolleType(rolle).toLowerCase()];
        // Motpart has been selected, find familieenhet motpart belongs to
        if (selectedMotpart) {
            setSelectedFamilieenhet(
                getFamileenhetByMotpartFodselsnummer(personensFamilieenheter, selectedMotpart) ??
                    ukjentFamilieenhet(personensFamilieenheter)
            );
        } else {
            // Motpart and Barn has not been selected, choose the first element as default value
            if (!valgteRoller.barn || valgteRoller.barn.length === 0) {
                setSelectedFamilieenhet(personensFamilieenheter[0]);
            } else {
                // Motpart has not been selected but Barn has been selected, find Motpart that Barn belongs to
                const motpart = personensFamilieenheter.find((familie) =>
                    includesSomeElement(
                        valgteRoller.barn,
                        familie.fellesBarn.map((barn) => barn.ident)
                    )
                );
                setSelectedFamilieenhet(motpart);
            }
        }
    }, [personensFamilieenheter]);

    if (!selectedFamilieenhet) {
        return null;
    }

    function handleSelectMotpart({ target }: ChangeEvent<HTMLSelectElement>) {
        const selected =
            target.value === UKJENT_MOTPART
                ? ukjentFamilieenhet(personensFamilieenheter)
                : getFamileenhetByMotpartFodselsnummer(personensFamilieenheter, target.value);
        setSelectedFamilieenhet(selected);
    }

    function handleSubmit() {
        const motpartRolleType = getMotpartRolleType(rolle);
        const selectedBarn = getFamilierelasjonByRolle(selectedPersoner, RolleType.BA).map(
            (barn) => barn.fodselsnummer
        );
        const selectedMotpart = getFamilierelasjonByRolle(selectedPersoner, motpartRolleType)?.[0]?.fodselsnummer;

        const formData = {
            [rolle.toLowerCase()]: fodselsnummer,
            [motpartRolleType.toLowerCase()]: selectedMotpart ?? "",
            barn: [...selectedBarn],
        } as unknown as Rolleveileder;
        onSubmit(formData);
        onClose();
    }

    return (
        <div className="grid gap-5" data-testid="test-foreldre-modal-content">
            <div className="grid gap-5">
                <Select
                    size="small"
                    label="Velg motpart"
                    value={selectedFamilieenhet?.motpart?.ident ?? UKJENT_MOTPART}
                    onChange={handleSelectMotpart}
                    data-testid="test-foreldre-modal-content-select"
                >
                    {personensFamilieenheter?.map((familieenhet, index) => {
                        return (
                            familieenhet.motpart &&
                            familieenhet.motpart !== null && (
                                <option key={index} value={familieenhet.motpart.ident}>
                                    {familieenhet.motpart.visningsnavn}
                                </option>
                            )
                        );
                    })}
                    <option value={UKJENT_MOTPART}>Ukjent</option>
                </Select>
                <ForeldreRolleTable
                    rolleType={rolle}
                    familieenhet={selectedFamilieenhet}
                    valgteRoller={valgteRoller}
                    onSelect={(personer) => setSelectedPersoner(personer)}
                />
            </div>
            <div className="flex justify-end gap-2">
                <DefaultButton size="small" testId="test-avbryt-knapp" title="Avbryt" type="button" onClick={onClose} />
                <DefaultButton
                    size="small"
                    testId="test-velg-knapp"
                    title="Velg"
                    type="button"
                    isPrimary
                    onClick={handleSubmit}
                />
            </div>
        </div>
    );
}
