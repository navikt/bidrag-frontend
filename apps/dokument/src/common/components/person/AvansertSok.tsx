import type { PersonBroadcastMessage } from "@bidrag/common";
import { usePopupSøk } from "@bidrag/common";
import { Button, Modal } from "@navikt/ds-react";
import type { ReactElement } from "react";

import { useAppContext } from "../../../store/AppContext";

const PERSONSOK_RESULT_EVENT = "personsok-result";

interface AvansertSokProps {
    onResult: (data: PersonBroadcastMessage) => void;
}

/**
 * Personsøk åpnes tidligere via globale funksjoner (`window.openPersonsok`/
 * `waitForPersonSokResult`) som ble satt opp av bidrag-ui-skallet. De finnes ikke i
 * bidrag-frontend; her brukes i stedet `usePopupSøk`-hooken (samme mekanisme som
 * `PersonSøkButton` i @bidrag/common), som åpner `/personsok` i et nytt vindu og lytter
 * på resultatet via en `BroadcastChannel`.
 */
export default function AvansertSok({ onResult }: AvansertSokProps): ReactElement {
    const { showErrorMessage } = useAppContext();

    const { avbryt, åpne, venter } = usePopupSøk<PersonBroadcastMessage>({
        channelName: PERSONSOK_RESULT_EVENT,
        søkPath: "/personsok",
        søkNavn: "avansert søk",
        parseResultat: (data) => {
            const resultat = data as { ok?: boolean; ident?: string; navn?: string; aktoerId?: string };
            return resultat.ok && resultat.ident
                ? { ident: resultat.ident, navn: resultat.navn ?? "", aktoerId: resultat.aktoerId }
                : null;
        },
        onResult: (result) => {
            if (result) {
                onResult(result);
            } else {
                showErrorMessage(["Det skjedde en feil ved henting av personinfo"]);
            }
        },
        onError: (melding) => showErrorMessage([melding]),
    });

    return (
        <>
            {venter && (
                <Modal aria-label="Venter på resultat fra avansert søk" id={"avansertsok_modal"} onClose={() => null}>
                    <Modal.Header>Venter på resultat fra avansert søk ...</Modal.Header>
                    <Modal.Body style={{ width: "100%", height: "max-content", padding: "1rem" }}>
                        <Button onClick={avbryt} style={{ marginTop: "1rem" }}>
                            Avbryt
                        </Button>
                    </Modal.Body>
                </Modal>
            )}

            <div
                className={"pdlSearchButton"}
                style={{ padding: "30px 10px 0px 10px", height: "min-content", alignSelf: "baseline" }}
            >
                <Button size="small" variant="secondary" type={"button"} onClick={åpne}>
                    Personsøk
                </Button>
            </div>
        </>
    );
}
