import type { PersonDto } from "@bidrag/api/PersonApi";
import { Button, Checkbox } from "@navikt/ds-react";
import { type ChangeEvent, type MouseEvent, useEffect, useState } from "react";
import { RolleType } from "../RolleType.ts";
import { useOpprettSak } from "../../../../api/useOpprettSakApiData.ts";
import { useSakContext } from "../OpprettSakContext.tsx";
import { createSakPayload } from "../sakUtils.ts";
import type { IPersonensReellMottakerRolle } from "../types.ts";
import DefaultButton from "./DefaultButton.tsx";
import PersonReellMottakerCard from "./PersonReellMottakerCard.tsx";

// Migrert fra bidrag-ui
// (apps/sak-ui/src/pages/opprett-sak/container/barn/barn-container/BarnContainer.tsx).
// Den lokale hooken `useCreateSak` er erstattet med `useOpprettSak` fra
// `~/api/useApi.ts`, som allerede finnes for resten av applikasjonen.
export interface IBarnContainerProps {
    personensRolle: RolleType;
}

export default function BarnContainer({ personensRolle }: IBarnContainerProps) {
    const [selectedBarn, setSelectedBarn] = useState<IPersonensReellMottakerRolle[]>([]);
    const [opprettUtenBarn, setOpprettUtenBarn] = useState<boolean>(false);
    const { data: saksnummer, error, isPending, mutate: opprettSak } = useOpprettSak();
    const { eierfogd, ident, selectedMotpart, onSubmit, onClose, updateErrorMessage, resetErrorMessage } =
        useSakContext();

    useEffect(() => {
        if (selectedMotpart && selectedMotpart.fellesBarn.length > 0) {
            setSelectedBarn(createBarnCheckboxData(selectedMotpart.fellesBarn));
        }
        resetErrorMessage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMotpart, personensRolle]);

    useEffect(() => {
        if (error) {
            updateErrorMessage(error.message);
        } else if (saksnummer) {
            onSubmit(saksnummer);
            onClose();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saksnummer, error]);

    if (!selectedMotpart && selectedBarn.length === 0) {
        return null;
    }

    function createBarnCheckboxData(barn: PersonDto[]): IPersonensReellMottakerRolle[] {
        return barn.map((i) => ({ ...i, checked: true, rolle: RolleType.BA }));
    }

    function onTextfieldChange(barnIdent: string, value: string): void {
        setSelectedBarn(
            selectedBarn.map((barn) =>
                barn.ident === barnIdent ? { ...barn, reellMottaker: value, error: undefined } : { ...barn },
            ),
        );
    }

    function onCheckboxChange({ target }: ChangeEvent<HTMLInputElement>): void {
        setSelectedBarn(
            selectedBarn.map((barn) =>
                barn.ident === target.value ? { ...barn, checked: !barn.checked } : { ...barn },
            ),
        );
    }

    function håndterOpprettUtenBarn(e: ChangeEvent<HTMLInputElement>): void {
        setOpprettUtenBarn(e.target.checked);
        if (e.target.checked) {
            setSelectedBarn([]);
        } else if (selectedMotpart) {
            setSelectedBarn(
                selectedMotpart.fellesBarn.map((barn) => ({ ...barn, checked: true, rolle: RolleType.BA })),
            );
        }
        resetErrorMessage();
    }

    async function onCreateSak(event: MouseEvent<HTMLButtonElement>): Promise<void> {
        const selected = selectedBarn.filter((barn) => barn.checked);
        opprettSak(createSakPayload(eierfogd, ident, personensRolle, selected, selectedMotpart?.motpart?.ident));
        event.stopPropagation();
    }

    return (
        <div className="grid gap-5">
            <Checkbox size="small" checked={opprettUtenBarn} onChange={håndterOpprettUtenBarn}>
                Opprett sak uten barn
            </Checkbox>
            <div className="grid grid-cols-2 gap-5">
                {selectedBarn.map((barn, i) => (
                    <PersonReellMottakerCard
                        key={i}
                        value={barn.ident}
                        textfieldValue={barn?.reellMottaker ?? ""}
                        checked={barn.checked}
                        error={barn?.error}
                        onCheckboxChange={onCheckboxChange}
                        onTextfieldChange={onTextfieldChange}
                    />
                ))}
            </div>
            <div className="flex gap-4 justify-end">
                <DefaultButton title="Avbryt" type="button" onClick={onClose} />
                <Button
                    type="button"
                    size="xsmall"
                    loading={isPending}
                    variant="primary"
                    onClick={onCreateSak}
                    data-testid="test-opprettsak-person-submit-button"
                >
                    Opprett
                </Button>
            </div>
        </div>
    );
}
