import { type BarnDto, SletteUnderholdselementTypeEnum } from "@bidrag/api/BidragBehandlingApiV1";
import { RolleTypeAbbreviation } from "@bidrag/common";
import { PlusIcon } from "@navikt/aksel-icons";
import { BodyShort, Button, Heading } from "@navikt/ds-react";
import { useMemo, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { AddBarnForm } from "../../../../common/components/AddBarnForm";
import StatefulAlert from "../../../../common/components/StatefulAlert";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { calculateAge } from "../../../../utils/date-utils";

import { useOnCreateUnderholdForBarn } from "../../../hooks/useOnCreateUnderholdForBarn";
import { useOnDeleteUnderholdsObjekt } from "../../../hooks/useOnDeleteUnderholdsObjekt";
import type {
    FaktiskTilsynsutgiftPeriode,
    UnderholdskostnadFormValues,
} from "../../../types/underholdskostnadFormValues";
import { displayOver12Alert, mapBeregnetUnderholdskostnadToRole } from "../helpers/UnderholdskostnadFormHelpers";
import { RolleInfoBox } from "./Barnetilsyn";
import { FaktiskeTilsynsutgifterTabel } from "./FaktiskeTilsynsutgifterTabel";

type AndreBarnProps = {
    visibleBarnIds?: number[];
};

export const AndreBarn = ({ visibleBarnIds }: AndreBarnProps) => {
    const { selectedRoller } = useBehandlingProvider();
    const { setSaveErrorState, lesemodus } = useBehandlingProvider();
    const { control, clearErrors, setValue, getValues } = useFormContext<UnderholdskostnadFormValues>();
    const createBarnQuery = useOnCreateUnderholdForBarn();
    const deleteUnderhold = useOnDeleteUnderholdsObjekt();
    const [openForm, setOpenForm] = useState<boolean>(false);
    const bidragsmottaker = useMemo(
        () => selectedRoller.find((rolle) => rolle.rolleType === RolleTypeAbbreviation.BM)?.ident,
        [selectedRoller],
    );
    const bidragsmottakerId = useMemo(
        () => selectedRoller.find((rolle) => rolle.rolleType === RolleTypeAbbreviation.BM)?.id,
        [selectedRoller],
    );
    const fieldArray = useFieldArray({
        control,
        name: "underholdskostnaderAndreBarn",
    });
    const watchFieldArray = useWatch({ control, name: "underholdskostnaderAndreBarn" });
    const andreBarnFieldArray = useMemo(
        () =>
            fieldArray.fields.map((field, index) => ({
                ...field,
                ...watchFieldArray[index],
                fieldIndex: index,
            })),
        [fieldArray.fields, watchFieldArray],
    );
    const andreBarnForBidragsmottaker = useMemo(() => {
        if (bidragsmottakerId == null) {
            return andreBarnFieldArray;
        }

        return andreBarnFieldArray.filter((underhold) => underhold.gjelderBarn.bidragsmottakerId === bidragsmottakerId);
    }, [andreBarnFieldArray, bidragsmottakerId]);

    const visibleAndreBarnFieldArray = useMemo(() => {
        const visibleIds = new Set(visibleBarnIds ?? []);
        if (visibleIds.size === 0) {
            return andreBarnForBidragsmottaker;
        }
        const filtered = andreBarnForBidragsmottaker.filter((underhold) => visibleIds.has(underhold.gjelderBarn.id));
        return filtered.length > 0 ? filtered : andreBarnForBidragsmottaker;
    }, [andreBarnForBidragsmottaker, visibleBarnIds]);

    const onCreateBarn = (barn: BarnDto) => {
        createBarnQuery.mutation.mutate(barn, {
            onSuccess: (response) => {
                fieldArray.append({
                    ...response.underholdskostnad,
                    faktiskTilsynsutgift: [] as FaktiskTilsynsutgiftPeriode[],
                });
                setOpenForm(false);
                createBarnQuery.queryClientUpdater((currentData) => {
                    return {
                        ...currentData,
                        underholdskostnader: currentData.underholdskostnader
                            .concat(response.underholdskostnad)
                            .map(mapBeregnetUnderholdskostnadToRole(response.beregnetUnderholdskostnader)),
                    };
                });
            },
        });
    };

    const onDelete = (index: number) => {
        const underhold = visibleAndreBarnFieldArray[index];
        const payload = {
            idUnderhold: underhold.id,
            idElement: underhold.gjelderBarn.id,
            type: SletteUnderholdselementTypeEnum.BARN,
        };

        deleteUnderhold.mutation.mutate(payload, {
            onSuccess: (response) => {
                clearErrors(`underholdskostnaderAndreBarn.${underhold.fieldIndex}`);
                fieldArray.remove(Number(underhold.fieldIndex));
                const underholdskostnaderAndreBarn = getValues("underholdskostnaderAndreBarn");

                if (!underholdskostnaderAndreBarn.length) {
                    setValue("underholdskostnaderAndreBarnBegrunnelse", "");
                }

                deleteUnderhold.queryClientUpdater((currentData) => {
                    const updatedList = currentData.underholdskostnader
                        .filter((underhold) => underhold.gjelderBarn.id !== payload.idElement)
                        .map(mapBeregnetUnderholdskostnadToRole(response.beregnetUnderholdskostnader));

                    return {
                        ...currentData,
                        underholdskostnader: updatedList,
                    };
                });
            },
            onError: () => {
                setSaveErrorState({
                    error: true,
                    retryFn: () => onDelete(index),
                });
            },
        });
    };

    return (
        <>
            {!openForm && !lesemodus && (
                <Button
                    type="button"
                    onClick={() => setOpenForm(true)}
                    variant="secondary"
                    iconPosition="left"
                    className="w-max"
                    icon={<PlusIcon />}
                    size="small"
                >
                    {text.label.leggTilBarn}
                </Button>
            )}
            {openForm && (
                <AddBarnForm bidragsmottaker={bidragsmottaker} setOpenAddBarnForm={setOpenForm} onSave={onCreateBarn} />
            )}
            {visibleAndreBarnFieldArray.length < 1 && <BodyShort>{text.description.ingenBarn}</BodyShort>}
            {visibleAndreBarnFieldArray.map((underhold, index) => {
                const underholdFieldName = `underholdskostnaderAndreBarn.${underhold.fieldIndex}` as const;
                return (
                    underhold?.gjelderBarn && (
                        <div key={underholdFieldName} id={underhold.gjelderBarn.id.toString()} className="grid gap-y-2">
                            <RolleInfoBox underholdFieldName={underholdFieldName} onDelete={() => onDelete(index)} />
                            {!lesemodus && displayOver12Alert(calculateAge(underhold.gjelderBarn.fødselsdato)) && (
                                <StatefulAlert
                                    variant="info"
                                    size="small"
                                    alertKey={`12åralert-underhold-${underhold.id}`}
                                    className="w-[708px]"
                                    closeButton
                                >
                                    <Heading size="small" level="3">
                                        {text.title.barnOver12}
                                    </Heading>
                                    {text.barnetHarFylt12SjekkPerioder}
                                </StatefulAlert>
                            )}
                            <FaktiskeTilsynsutgifterTabel underholdFieldName={underholdFieldName} />
                        </div>
                    )
                );
            })}
        </>
    );
};
