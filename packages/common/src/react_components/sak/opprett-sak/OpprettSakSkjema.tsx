import { TextField } from "@navikt/ds-react";
import { type ChangeEvent, useEffect, useState } from "react";

import { useHentPersonMotpartBarnRelasjonSuspense, useKanOppretteSakUtenBm } from "../../../api/useOpprettSakApiData.ts";
import SakErrorMessage from "./components/SakErrorMessage.tsx";
import FamilieenheterBAContainer from "./components/FamilieenheterBAContainer.tsx";
import FamilieenheterContainer from "./components/FamilieenheterContainer.tsx";
import RoleSelect, { type ISelectData } from "./components/RoleSelect.tsx";
import { PERSON_IKKE_FINNES } from "./constants.ts";
import { useSakContext } from "./OpprettSakContext.tsx";
import { RolleType } from "./RolleType.ts";

// Lokal versjon av `@bidrag/utils`s `removePlaceholder` — kan ikke importere
// @bidrag/utils herfra, siden den pakken selv har @bidrag/common som
// avhengighet (ville gitt en sirkulær import).
function removePlaceholder(stringWithPlaceholders: string, ...args: string[]): string {
    let result = stringWithPlaceholders;
    for (const arg of args) {
        result = result.replace("{}", arg);
    }
    return result;
}

/**
 * Selve skjemainnholdet for "Opprett ny sak" — uten `<Modal>`-elementet rundt,
 * slik at forbrukere (apps/web sin rute og apps/behandling sin innebygde
 * modal) kan style/åpne modalen på sin egen måte og fortsatt gjenbruke
 * skjemalogikken. Må rendres innenfor en `<SakProvider>` og bør pakkes inn i
 * `<Suspense>` siden `useHentPersonMotpartBarnRelasjonSuspense` bruker
 * suspense-query.
 */
export default function OpprettSakSkjema() {
    const { ident, navn, rolle, initialSelectedForeldre, updateErrorMessage } = useSakContext();
    const [personensRolle, setPersonensRolle] = useState<RolleType>(rolle || RolleType.BM);
    const [reellMottaker, setReellMottaker] = useState<string>("");
    const [isReelMottakerInvalid, setIsReelMottakerInvalid] = useState<boolean>(false);

    // Sørger for at tilgangssjekken er hentet før familieenheter-containeren trenger den.
    useKanOppretteSakUtenBm();

    const { data: familieenheter } = useHentPersonMotpartBarnRelasjonSuspense({ ident });

    useEffect(() => {
        if (!familieenheter) {
            updateErrorMessage(
                "Ingen tilgang til å se en eller flere av rollene gjelder er knyttet til. Det kan skyldes at rollen er egenansatt eller har adressebeskyttelse.",
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [familieenheter]);

    function onSelectRole({ value }: ISelectData) {
        setPersonensRolle(value as RolleType);
        setReellMottaker("");
    }

    function onTextfieldChange({ target }: ChangeEvent<HTMLInputElement>) {
        setIsReelMottakerInvalid(false);
        setReellMottaker(target.value);
    }

    function onValidateRM(isInvalid: boolean) {
        setIsReelMottakerInvalid(isInvalid);
    }

    function isBarn(): boolean {
        return personensRolle === RolleType.BA;
    }

    return (
        <div className="grid gap-4">
            <SakErrorMessage />
            <div className="grid gap-5">
                <RoleSelect
                    roles={[RolleType.BP, RolleType.BM, RolleType.BA]}
                    name={`${navn} / ${ident}`}
                    ident={ident}
                    defaultValue={personensRolle}
                    onSelectRole={onSelectRole}
                    hideLabel={false}
                    className="text-ax-neutral-800"
                    testId="test-opprettsak-mainperson-role"
                />
                {isBarn() && (
                    <TextField
                        className="text-ax-neutral-800"
                        type="text"
                        label="Reell mottaker"
                        size="small"
                        onChange={onTextfieldChange}
                        value={reellMottaker}
                        error={isReelMottakerInvalid && removePlaceholder(PERSON_IKKE_FINNES, reellMottaker)}
                    />
                )}
            </div>
            {isBarn() && (
                <FamilieenheterBAContainer
                    reellMottaker={reellMottaker}
                    onValidateRM={onValidateRM}
                    initialSelectedForeldre={initialSelectedForeldre}
                />
            )}
            {familieenheter && [RolleType.BM, RolleType.BP].includes(personensRolle) && (
                <FamilieenheterContainer
                    personensRolle={personensRolle}
                    personensMotpartBarnRelasjon={familieenheter.personensMotpartBarnRelasjon}
                />
            )}
        </div>
    );
}
