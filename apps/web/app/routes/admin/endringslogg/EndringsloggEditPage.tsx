import {useQueryClient} from "@tanstack/react-query";
import React from "react";

import type {Route} from "../../../../.react-router/types/app/routes/bruker/+types/BrukerLayout.ts";
import {
    EndringsLoggDto,
    EndringsloggTilhorerSkjermbilde,
    OppdaterEndringsloggEndring,
    OppdaterEndringsloggRequest
} from "~/api/types/admin.ts";
import {useEditEndringslogg, useHentEndringslogg} from "~/api/useApi.ts";
import {EndringsloggFormValues} from "~/routes/admin/endringslogg/components/EndringsloggForm.tsx";

const createPayload = (formValues: EndringsloggFormValues) => {
    const payload: OppdaterEndringsloggRequest = {
        tittel: formValues.tittel?.trim(),
        tilhørerSkjermbilde: formValues.tilhørerSkjermbilde as EndringsloggTilhorerSkjermbilde,
        sammendrag: formValues.sammendrag?.trim(),
        erPåkrevd: formValues.erPåkrevd,
        endringstyper: formValues.endringer.map((endring) => endring.endringstype),
        endringer: formValues.endringer as OppdaterEndringsloggEndring[],
    };

    return payload;
};

export const EndringsloggEditPage = ({params}: Route.ComponentProps) => {
    const id = params.id;
    const queryClient = useQueryClient();
    const endringslogg = useHentEndringslogg(Number(id));
    const mutation = useEditEndringslogg();

    const onSave = (formValues: EndringsloggFormValues, onSuccess: (id: number) => void) => {
        const payload = createPayload(formValues);
        mutation.mutate(
            {endringsloggId: Number(id), payload},
            {
                onSuccess: (response) => {
                    queryClient.setQueryData<EndringsLoggDto[]>(
                        ["endringslogger"],
                        (currentData: EndringsLoggDto[]) => {
                            return currentData?.map((endring) => {
                                if (endring.id === response.id) {
                                    return response;
                                }
                                return endring;
                            });
                        }
                    );
                    queryClient.setQueryData<EndringsLoggDto>(["endringslogg", Number(id)], () => response);
                    onSuccess(response.id);
                },
            }
        );
    };
    return <div>YO</div>
    //return <EndringsloggForm onSave={onSave} mutationError={mutation.error} endringslogg={endringslogg.data}/>;
};
