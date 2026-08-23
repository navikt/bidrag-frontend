import { Kilde, Stonadstype } from "@bidrag/api/BidragBehandlingApiV1";
import { PersonNavnIdent, RolleTag, RolleTypeAbbreviation } from "@bidrag/common";
import { Box, Button, Heading } from "@navikt/ds-react";
import { Fragment, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import elementIds from "../../constants/elementIds";
import text from "../../constants/texts";
import { useBehandlingProvider } from "../../context/BehandlingContext";
import { useOnSaveBoforhold } from "../../hooks/useOnSaveBoforhold";
import type { BoforholdFormValues } from "../../types/boforholdFormValues";
import { AddBarnForm } from "./AddBarnForm";
import { Perioder } from "./Perioder";
import { RemoveButton } from "./RemoveButton";

export const BarnPerioder = () => {
    const { setPageErrorsOrUnsavedState, lesemodus, setSaveErrorState } = useBehandlingProvider();
    const saveBoforhold = useOnSaveBoforhold();
    const [openAddBarnForm, setOpenAddBarnForm] = useState(false);
    const { control, getValues } = useFormContext<BoforholdFormValues>();
    const barnFieldArray = useFieldArray({
        control,
        name: "husstandsmedlem",
    });
    const watchFieldArray = useWatch({ control, name: "husstandsmedlem" });
    const controlledFields = barnFieldArray.fields.map((field, index) => {
        return {
            ...field,
            ...watchFieldArray[index],
        };
    });

    const onOpenAddBarnForm = () => {
        setOpenAddBarnForm(true);
        setPageErrorsOrUnsavedState((state) => ({
            ...state,
            boforhold: {
                ...state.boforhold,
                openFields: { ...state.boforhold.openFields, newBarn: true },
            },
        }));
    };

    const onRemoveBarn = (index: number) => {
        const barn = getValues(`husstandsmedlem.${index}`);

        saveBoforhold.mutation.mutate(
            { triggeredBy: "removeBarn", oppdatereHusstandsmedlem: { slettHusstandsmedlem: barn.id } },
            {
                onSuccess: () => {
                    barnFieldArray.remove(index);

                    setPageErrorsOrUnsavedState((state) => {
                        const openFields = { ...state.boforhold.openFields };
                        delete openFields[`husstandsmedlem.${index}`];

                        return {
                            ...state,
                            boforhold: {
                                ...state.boforhold,
                                openFields,
                            },
                        };
                    });
                },
                onError: () => {
                    setSaveErrorState({
                        error: true,
                        retryFn: () => onRemoveBarn(index),
                        rollbackFn: () => {},
                    });
                },
            },
        );
    };

    return (
        <Box background="neutral-soft" className="grid gap-2 py-2 px-4">
            <Heading level="2" size="small">
                {text.title.barn}
            </Heading>
            <div className="grid gap-4">
                {controlledFields.map((item, index) => (
                    <Fragment key={item.id}>
                        <Box
                            background="default"
                            className="overflow-hidden grid gap-2"
                            id={`${elementIds.seksjon_boforhold}_${item.id}`}
                        >
                            <div className="grid grid-cols-[max-content_max-content_auto] p-2 bg-[white] border-0 border-[var(--ax-border-neutral)]">
                                <div>
                                    {item.medIBehandling && (
                                        <RolleTag
                                            rolleType={RolleTypeAbbreviation.BA}
                                            ident={item.ident}
                                            stønad18År={item.stønadstype === Stonadstype.BIDRAG18AAR}
                                        />
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <PersonNavnIdent
                                        navn={item.navn}
                                        ident={item.ident}
                                        skjulIdent={!item.medIBehandling}
                                        fødselsdato={item.fødselsdato}
                                        stønad18År={item.stønadstype === Stonadstype.BIDRAG18AAR}
                                    />
                                </div>
                                {!item.medIBehandling && !lesemodus && item.kilde === Kilde.MANUELL && (
                                    <RemoveButton index={index} onRemoveBarn={onRemoveBarn} />
                                )}
                            </div>
                            <Perioder barnIndex={index} />
                        </Box>
                    </Fragment>
                ))}
                {openAddBarnForm && (
                    <AddBarnForm setOpenAddBarnForm={setOpenAddBarnForm} barnFieldArray={barnFieldArray} />
                )}
                {!openAddBarnForm && !lesemodus && (
                    <Button
                        variant="secondary"
                        type="button"
                        size="small"
                        className="w-fit"
                        onClick={onOpenAddBarnForm}
                    >
                        + Legg til barn
                    </Button>
                )}
            </div>
        </Box>
    );
};
