import type {
    EndringsLoggDto,
    EndringsloggTilhorerSkjermbilde,
    OppdaterEndringsloggEndring,
    OppdaterEndringsloggRequest,
} from "@bidrag/api/BidragAdminApi";
import { useQueryClient } from "@tanstack/react-query";
import { useEditEndringslogg, useHentEndringslogg } from "../api/endringsloggApi.ts";
import EndringsloggForm, { type EndringsloggFormValues } from "./components/EndringsloggForm.tsx";

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

export default function EndringsloggEditPage(params: { id: string }) {
    const id = params.id;
    const queryClient = useQueryClient();
    const endringslogg = useHentEndringslogg(Number(id));
    const mutation = useEditEndringslogg();
    const onSave = (formValues: EndringsloggFormValues, onSuccess: (id: number) => void) => {
        const payload = createPayload(formValues);
        mutation.mutate(
            { endringsloggId: Number(id), payload },
            {
                onSuccess: (response) => {
                    queryClient.setQueryData<EndringsLoggDto[]>(
                        ["endringslogger"],
                        (currentData: NoInfer<EndringsLoggDto[]> | undefined) => {
                            return currentData?.map((endring) => {
                                if (endring.id === response.id) {
                                    return response;
                                }
                                return endring;
                            });
                        },
                    );
                    queryClient.setQueryData<EndringsLoggDto>(["endringslogg", Number(id)], () => response);
                    onSuccess(response.id);
                },
            },
        );
    };
    return <EndringsloggForm onSave={onSave} mutationError={mutation.error} endringslogg={endringslogg.data} />;
}
