import { Alert, Button, Checkbox, ConfirmationPanel, Heading, Select, TextField } from "@navikt/ds-react";
import { type ChangeEvent, type MouseEvent, useEffect, useState } from "react";
import { RolleType } from "../RolleType.ts";
import { useKanOppretteSakUtenBm, useOpprettSak } from "../../../../api/useOpprettSakApiData.ts";
import {
    INGEN_BARN,
    KAN_IKKE_OPPRETTE_SAK_UKJENT_BM,
    KAN_IKKE_OPPRETTE_SAK_UKJENT_BM_OG_BARN,
    OBLIGATORISK_FELT,
} from "../constants.ts";
import { useSakContext } from "../OpprettSakContext.tsx";
import { createSakPayload } from "../sakUtils.ts";
import type { IPersonensReellMottakerRolle } from "../types.ts";
import type { IBarnContainerProps } from "./BarnContainer.tsx";
import DefaultButton from "./DefaultButton.tsx";

// Migrert fra bidrag-ui
// (apps/sak-ui/src/pages/opprett-sak/container/barn/barn-motpart-ukjent-container/BarnMotpartUkjentContainer.tsx).
export default function BarnMotpartUkjentContainer({ personensRolle }: IBarnContainerProps) {
    const [selectedBarn, setSelectedBarn] = useState<IPersonensReellMottakerRolle | undefined>(undefined);
    const [bekreftBarnUtenReelMottaker, setBekreftBarnUtenReelMottaker] = useState<boolean>(false);
    const [opprettUtenBarn, setOpprettUtenBarn] = useState<boolean>(false);
    const { data: kanOppretteSakUtenBM } = useKanOppretteSakUtenBm();
    const [isMainPersonBP, setIsMainPersonBP] = useState<boolean>(false);
    const { data: saksnummer, error, isPending, mutate: opprettSak } = useOpprettSak();
    const { eierfogd, ident, selectedMotpart, onSubmit, onClose, updateErrorMessage, resetErrorMessage } =
        useSakContext();

    useEffect(() => {
        const førsteBarn = selectedMotpart?.fellesBarn[0];
        if (førsteBarn) {
            setSelectedBarn({ ...førsteBarn, checked: true, rolle: RolleType.BA });
        }
        resetErrorMessage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMotpart]);

    useEffect(() => {
        setIsMainPersonBP(personensRolle === RolleType.BP);
        resetErrorMessage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [personensRolle]);

    useEffect(() => {
        if (error) {
            updateErrorMessage(error.message);
        } else if (saksnummer) {
            onSubmit(saksnummer);
            onClose();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saksnummer, error]);

    function onSelected({ target }: ChangeEvent<HTMLSelectElement>) {
        const selected = selectedMotpart?.fellesBarn.find((el) => el.ident === target.value);
        if (!selected) return;
        setSelectedBarn({ ...selected, checked: true, rolle: RolleType.BA, reellMottaker: undefined });
        resetErrorMessage();
    }

    function onTextfieldChange({ target }: ChangeEvent<HTMLInputElement>): void {
        if (!selectedBarn) return;
        setSelectedBarn({ ...selectedBarn, reellMottaker: target.value, error: undefined });
    }

    function håndterOpprettUtenBarn(e: ChangeEvent<HTMLInputElement>): void {
        setOpprettUtenBarn(e.target.checked);
        if (e.target.checked) {
            setSelectedBarn(undefined);
            setBekreftBarnUtenReelMottaker(false);
        } else if (selectedMotpart?.fellesBarn[0]) {
            setSelectedBarn({ ...selectedMotpart.fellesBarn[0], checked: true, rolle: RolleType.BA });
        }
        resetErrorMessage();
    }

    async function onCreateSak(event: MouseEvent<HTMLButtonElement>): Promise<void> {
        event.stopPropagation();

        if (isMainPersonBP && !selectedBarn && kanOppretteSakUtenBM) {
            updateErrorMessage(KAN_IKKE_OPPRETTE_SAK_UKJENT_BM_OG_BARN);
            return;
        }
        if (isMainPersonBP && !kanOppretteSakUtenBM) {
            // skal ikke kunne opprette sak uten barn, BP og ukjent BM
            if (selectedBarn && !selectedBarn?.reellMottaker) {
                setSelectedBarn({ ...selectedBarn, error: OBLIGATORISK_FELT });
            }
            updateErrorMessage(KAN_IKKE_OPPRETTE_SAK_UKJENT_BM);
            return;
        }

        if (isMainPersonBP && kanOppretteSakUtenBM) {
            if (!selectedBarn?.reellMottaker && !bekreftBarnUtenReelMottaker) {
                if (selectedBarn) {
                    setSelectedBarn({ ...selectedBarn, error: OBLIGATORISK_FELT });
                }
                return;
            }
        }

        const payload = createSakPayload(
            eierfogd,
            ident,
            personensRolle,
            selectedBarn ? [selectedBarn] : [],
            selectedMotpart?.motpart?.ident,
        );
        opprettSak(payload);
    }

    return (
        <div className="grid gap-5">
            <Checkbox size="small" checked={opprettUtenBarn} onChange={håndterOpprettUtenBarn}>
                Opprett sak uten barn
            </Checkbox>

            {!opprettUtenBarn && !selectedBarn && (
                <Alert variant="info" data-testid="test-opprettsak-no-barn-information">
                    {INGEN_BARN}
                </Alert>
            )}

            {!opprettUtenBarn && selectedBarn && (
                <>
                    <Select
                        className="text-ax-neutral-800"
                        label="Velg et barn"
                        size="small"
                        value={selectedBarn.ident}
                        onChange={onSelected}
                        data-testid="test-opprettsak-barncontainer-motpartukjent"
                    >
                        {selectedMotpart?.fellesBarn.map((person, i) => (
                            <option key={i} value={person.ident}>
                                {person.navn} / {person.ident}
                            </option>
                        ))}
                    </Select>
                    <TextField
                        className="text-ax-neutral-800"
                        name="reellMottaker"
                        type="text"
                        label="Reell mottaker"
                        value={selectedBarn?.reellMottaker ?? ""}
                        size="small"
                        required={isMainPersonBP && !kanOppretteSakUtenBM}
                        error={!kanOppretteSakUtenBM && selectedBarn?.error}
                        onChange={onTextfieldChange}
                        data-testid="test-opprettsak-person-reellmotaker-card-textfield"
                    />
                    {kanOppretteSakUtenBM && !selectedBarn?.reellMottaker && (
                        <ConfirmationPanel
                            checked={bekreftBarnUtenReelMottaker}
                            error={selectedBarn?.error}
                            label="Jeg bekrefter at jeg skal legge til reell mottaker på barnet senere"
                            onChange={() => setBekreftBarnUtenReelMottaker((prevValue) => !prevValue)}
                            size="small"
                        >
                            <Heading level="2" size="xsmall">
                                Barn mangler reell mottaker
                            </Heading>
                        </ConfirmationPanel>
                    )}
                </>
            )}
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
