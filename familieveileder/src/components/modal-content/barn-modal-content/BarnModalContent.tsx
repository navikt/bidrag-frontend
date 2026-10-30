import { Alert, Button, Heading } from "@navikt/ds-react";
import { SyntheticEvent, useEffect, useState } from "react";
import React from "react";

import { PersonFamilierelasjonerResponse } from "../../../types/personsearch";
import { RolleType, Rolleveileder } from "../../../types/rolleveileder";
import { IBarnRolleTableData } from "../../../types/table";
import { getMotpartRolleType } from "../../../utils/personUtils";
import DefaultButton from "../../button/default-button/DefaultButton";
import { ISelectData } from "../../select/role-select/RoleSelect";
import BarnRolleTable from "../../table/barn-rolle-tabel/BarnRolleTable";
import { createBarnRolleTableData } from "../../table/barn-rolle-tabel/BarnRolleTableUtils";

interface IBarnModalContentProps {
    familierelasjoner: PersonFamilierelasjonerResponse;
    valgteRoller: Rolleveileder;
    onSubmit: (rolleveileder: Rolleveileder) => void;
    onClose: (e?: SyntheticEvent) => void;
}

export default function BarnModalContent({
    familierelasjoner,
    valgteRoller,
    onSubmit,
    onClose,
}: IBarnModalContentProps) {
    const [tableData, setTableData] = useState<IBarnRolleTableData[]>();

    useEffect(() => {
        if (familierelasjoner) {
            setTableData(
                createBarnRolleTableData(familierelasjoner?.personensMor, familierelasjoner?.personensFar, valgteRoller)
            );
        }
    }, [familierelasjoner, valgteRoller]);

    if (!familierelasjoner.personensMor && !familierelasjoner.personensFar) {
        return (
            <div className="grid gap-5" data-testid="test-error-barn-modal-content">
                <Alert variant="error">
                    Det finnes ikke registrerte foreldre for barnet. Andre foreldre eller personer må eventuelt legges
                    inn manuelt. Personen har andre relasjoner enn foreldre. For å vise andre relasjoner enn foreldre,
                    legg Fødselsnummer i BM eller BP feltet.
                </Alert>
                <div className="flex justify-end">
                    <Button type="button" size="small" variant="secondary" onClick={onClose}>
                        Avbryt
                    </Button>
                </div>
            </div>
        );
    }

    if (!tableData) {
        return null;
    }

    function onSelectRole(select: ISelectData) {
        const dataWithRole = tableData.map((element) => {
            if (element.visningsnavn === select.name) {
                return { ...element, rolle: select.value };
            }

            if (select.value) {
                return { ...element, rolle: getMotpartRolleType(select.value as RolleType) };
            }

            return { ...element };
        }) as IBarnRolleTableData[];

        setTableData(dataWithRole);
    }

    function findFodselsnummerByRole(role: RolleType): string {
        return tableData.find((data) => data.rolle === role)?.fodselsnummer ?? "";
    }

    function handleSubmit() {
        onSubmit({
            bm: findFodselsnummerByRole(RolleType.BM),
            bp: findFodselsnummerByRole(RolleType.BP),
            barn: valgteRoller.barn,
        });
        onClose();
    }

    return (
        <div className="grid gap-5" data-testid="test-barn-modal-content">
            <div>
                <Heading spacing level="1" size="small">
                    Foreldre
                </Heading>
                <BarnRolleTable tableData={tableData} onSelectRole={onSelectRole} />
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
