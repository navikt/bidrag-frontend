import { Button, Heading, Loader } from "@navikt/ds-react";
import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { RolleType } from "../RolleType.ts";
import { useHentFlerePersoninformasjon, useHentForelderBarnRelasjon, useOpprettSak } from "../../../../api/useOpprettSakApiData.ts";
import { OBLIGATORISK_FELT } from "../constants.ts";
import { useSakContext } from "../OpprettSakContext.tsx";
import { getMotpartRolleType } from "../personUtils.ts";
import { createSakPayloadForBA } from "../sakUtils.ts";
import type { IForeldreRoleData, IPersonensReellMottakerRolle } from "../types.ts";
import DefaultButton from "./DefaultButton.tsx";
import RoleRadio from "./RoleRadio.tsx";
import type { ISelectData } from "./RoleSelect.tsx";

// Migrert fra bidrag-ui
// (apps/sak-ui/src/pages/opprett-sak/container/familieenheter/familieenheter-ba-container/FamilieenheterBAContainer.tsx).
// `PersonSearchService.hentForeldreBarnRelasjon` er erstattet med hooken
// `useHentForelderBarnRelasjon`, og navneopplysninger på foreldrene (som
// tidligere ble beriket av søketjenesten) hentes nå separat via
// `useHentFlerePersoninformasjon`.
interface IFamilieenheterBAContainerProps {
    initialSelectedForeldre?: {
        ident: string;
        rolle: RolleType;
    };
    reellMottaker?: string;
    onValidateRM: (isInvalid: boolean) => void;
}

export default function FamilieenheterBAContainer({
    reellMottaker,
    onValidateRM,
    initialSelectedForeldre,
}: IFamilieenheterBAContainerProps) {
    const [selectForeldreData, setSelectForeldreData] = useState<IForeldreRoleData[] | undefined>();
    const [showError, setShowError] = useState<boolean>(false);
    const { eierfogd, ident, onSubmit, onClose, updateErrorMessage, resetErrorMessage } = useSakContext();
    const { data: forelderBarnRelasjon, isLoading } = useHentForelderBarnRelasjon({ ident });
    const foreldreIdenter = useMemo(
        () =>
            (forelderBarnRelasjon?.forelderBarnRelasjon ?? [])
                .filter((relasjon) => relasjon.minRolleForPerson === "BARN")
                .map((relasjon) => relasjon.relatertPersonsIdent)
                .filter((relatertIdent): relatertIdent is string => !!relatertIdent),
        [forelderBarnRelasjon],
    );
    const foreldreNavn = useHentFlerePersoninformasjon(foreldreIdenter);
    const { data: saksnummer, error, isPending, mutate: opprettSak } = useOpprettSak();

    useEffect(() => {
        resetErrorMessage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isLoading) return;

        if (!forelderBarnRelasjon || foreldreIdenter.length === 0) {
            setSelectForeldreData(undefined);
            return;
        }

        const foreldredata: IForeldreRoleData[] = foreldreIdenter.map((relatertPersonsIdent, i) => {
            const relasjon = forelderBarnRelasjon.forelderBarnRelasjon.find(
                (rel) => rel.relatertPersonsIdent === relatertPersonsIdent,
            );
            return {
                minRolleForPerson: relasjon?.minRolleForPerson ?? "",
                relatertPersonsIdent,
                relatertPersonsRolle: relasjon?.relatertPersonsRolle ?? "",
                relatertPersonsNavn: foreldreNavn[i]?.data?.navn ?? undefined,
            };
        });

        if (initialSelectedForeldre) {
            const rolleFinnes = foreldredata.some(
                (data) => data.relatertPersonsIdent === initialSelectedForeldre.ident,
            );
            if (rolleFinnes) {
                onSelectRole(
                    { name: initialSelectedForeldre.ident, value: initialSelectedForeldre.rolle },
                    foreldredata,
                );
                return;
            }
        }
        setSelectForeldreData(foreldredata);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [forelderBarnRelasjon, isLoading, foreldreIdenter, foreldreNavn.map((q) => q.data?.navn).join(",")]);

    useEffect(() => {
        if (error) {
            updateErrorMessage(error.message);
        } else if (saksnummer) {
            onSubmit(saksnummer);
            onClose();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saksnummer, error]);

    if (isLoading || !selectForeldreData) {
        return (
            <div className="flex justify-center">
                <Loader size="3xlarge" title="venter..." variant="interaction" />
            </div>
        );
    }

    function isNotSelectedRole() {
        return selectForeldreData?.every((i) => i.role === undefined) ?? true;
    }

    async function validate(event: MouseEvent<HTMLButtonElement>): Promise<void> {
        if (isNotSelectedRole()) {
            setShowError(true);
            return;
        }

        // NB: bidrag-ui validerte at reell mottaker fantes som person via
        // `PersonValidator.validatePerson`. Det finnes ikke noe tilsvarende
        // hook i bidrag-frontend ennå, så denne kontrollen er midlertidig
        // droppet — backend vil uansett avvise en ugyldig reell mottaker ved
        // opprettelse av saken (se `error`-håndteringen under).
        onValidateRM(false);
        const rolle = (selectForeldreData ?? []).map((data) => ({
            ident: data.relatertPersonsIdent,
            rolle: data.role,
        })) as IPersonensReellMottakerRolle[];

        opprettSak(createSakPayloadForBA(eierfogd, ident, RolleType.BA, rolle, reellMottaker));
        event.stopPropagation();
    }

    function onSelectRole(
        selectData: ISelectData,
        initialSelectForeldreData: IForeldreRoleData[] = selectForeldreData ?? [],
    ) {
        if (showError) {
            setShowError(false);
        }

        const updated = initialSelectForeldreData.map((data) => {
            if (data.relatertPersonsIdent === selectData.name) {
                return { ...data, role: selectData.value as unknown as RolleType };
            }

            return { ...data, role: getMotpartRolleType(selectData.value as unknown as RolleType) };
        });

        setSelectForeldreData(updated);
    }

    return (
        <div>
            <Heading spacing level="2" size="medium">
                Familieenheter
            </Heading>
            <div className="grid gap-5">
                <div className="grid gap-2">
                    {selectForeldreData.map((person, i) => (
                        <RoleRadio
                            key={i}
                            className="text-ax-neutral-800"
                            fodselsnummer={person.relatertPersonsIdent}
                            defaultValue={person.role ?? ""}
                            onSelectRole={onSelectRole}
                            legend={`${person.relatertPersonsNavn ?? ""} / ${person.relatertPersonsIdent}`}
                            required={true}
                            error={OBLIGATORISK_FELT}
                            showError={showError}
                        />
                    ))}
                </div>
                <div className="flex gap-4 justify-end">
                    <DefaultButton title="Avbryt" type="button" onClick={onClose} />
                    <Button type="button" loading={isPending} size="xsmall" onClick={validate}>
                        Opprett
                    </Button>
                </div>
            </div>
        </div>
    );
}
