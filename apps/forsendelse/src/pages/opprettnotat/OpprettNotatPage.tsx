import { ForsendelseTypeTo, JournalTema } from "@bidrag/api/BidragForsendelseApi";
import { dateToDDMMYYYYString, LoggerService } from "@bidrag/common";
import { Button, ErrorSummary, Heading, Page, VStack } from "@navikt/ds-react";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect } from "react";
import { type FieldErrors, FormProvider, useForm, useFormContext } from "react-hook-form";
import { useBidragForsendelseApi } from "../../api/api";
import GjelderSelect from "../../components/detaljer/GjelderSelect";
import TemaSelect from "../../components/detaljer/TemaSelect";
import type { DokumentFormProps } from "../../components/dokument/DokumentValg";
import DokumentValgNotat from "../../components/dokument/DokumentValgNotat";
import BidragErrorPanel from "../../context/BidragErrorPanel";
import { useErrorContext } from "../../context/ErrorProvider";
import { useHentRoller } from "../../hooks/useForsendelseApi";
import { ENHET_FARSKAP } from "../../types/EnhetTypes";
import { mapToBehandlingInfoDto } from "../../types/Forsendelse";
import { parseErrorMessageFromAxiosError } from "../../utils/ErrorUtils";
import { updateUrlSearchParam } from "../../utils/window-utils";
import { useSession } from "../forsendelse/context/SessionContext";
import AvbrytOpprettForsendelseButton from "../opprettforsendelse/AvbrytOpprettForsendelseButton";
import { useOpprettForsendelse } from "../opprettforsendelse/OpprettForsendelseContext";
import Dokumentdato from "./Dokumentdato";

export type OpprettForsendelseFormProps = {
    gjelderIdent: string;
    mottakerIdent: string;
    dokumentdato: string;
    dokumenter: DokumentFormProps[];
    språk: string;
    tema: "BID" | "FAR";
    enhet: string;
};

export default function OpprettNotatPage() {
    const { saksnummer, enhet, navigateToForsendelse } = useSession();
    const { addError } = useErrorContext();
    const options = useOpprettForsendelse();
    const bidragForsendelseApi = useBidragForsendelseApi();
    async function opprettNotat(data: OpprettForsendelseFormProps, dokument: DokumentFormProps) {
        const result = await bidragForsendelseApi.api.opprettForsendelse({
            gjelderIdent: data.gjelderIdent,
            mottaker: {
                ident: data.gjelderIdent,
            },
            saksnummer,
            opprettTittel: true,
            enhet: enhet,
            tema: data.tema as JournalTema,
            språk: data.språk,
            behandlingInfo: mapToBehandlingInfoDto(options),
            distribuerAutomatiskEtterFerdigstilling: false,
            dokumenter: [
                {
                    dokumentmalId: dokument.malId,
                    tittel: dokument.tittel,
                    språk: data.språk,
                    bestillDokument: true,
                    dokumentDato: data.dokumentdato ? `${data.dokumentdato}-00-00-00` : null,
                    ferdigstill: false,
                },
            ],
        });

        LoggerService.info(`Opprettet notat med forsendelseId ${result.data.forsendelseId}`);
    }
    const opprettForsendelseFn = useMutation({
        mutationFn: async (data: OpprettForsendelseFormProps) => {
            for (const dokument of data.dokumenter.filter((dokument) => dokument !== undefined)) {
                await opprettNotat(data, dokument);
            }
            return null;
        },
        onSuccess: () => {
            navigateToForsendelse(null, ForsendelseTypeTo.NOTAT);
        },
        onError: (error: AxiosError) => {
            const errorMessage = parseErrorMessageFromAxiosError(error);
            addError({ message: `Kunne ikke opprettet notat: ${errorMessage}`, source: "opprettnotat" });
        },
    });

    const roller = useHentRoller();
    const methods = useForm<OpprettForsendelseFormProps>({
        defaultValues: {
            dokumentdato: dateToDDMMYYYYString(new Date()),
            tema: enhet === ENHET_FARSKAP ? JournalTema.FAR : JournalTema.BID,
            språk: "NB",
        },
    });
    function onSubmit(data: OpprettForsendelseFormProps) {
        opprettForsendelseFn.mutate(data);
    }
    const isLoading = opprettForsendelseFn.isPending || opprettForsendelseFn.isSuccess;
    useEffect(() => {
        updateUrlSearchParam("page", `Opprett notat`);
    }, []);

    return (
        <Page className="pt-4">
            <Page.Block width="xl" gutters>
                <VStack gap={{ xs: "space-12", md: "space-12", lg: "space-8" }}>
                    <div className={"leading-ax-xlarge tracking-wide"}>
                        <Heading spacing size="large">
                            Opprett notat
                        </Heading>
                        <FormProvider {...methods}>
                            <form onSubmit={methods.handleSubmit(onSubmit)}>
                                <GjelderSelect roller={roller} />
                                <div className="flex flex-row gap-4 pb-4">
                                    <TemaSelect />
                                    <Dokumentdato />
                                </div>
                                <div className="w-2/3">
                                    <DokumentValgNotat />
                                </div>
                                <BidragErrorPanel />
                                <OpprettNotatValidationErrorSummary />
                                <div className="flex flex-row gap-2 pt-4">
                                    <Button size="small" loading={isLoading}>
                                        Opprett
                                    </Button>
                                    <AvbrytOpprettForsendelseButton disabled={isLoading} />
                                </div>
                            </form>
                        </FormProvider>
                    </div>
                </VStack>
            </Page.Block>
        </Page>
    );
}

function OpprettNotatValidationErrorSummary() {
    const {
        formState: { errors },
    } = useFormContext<OpprettForsendelseFormProps>();

    function getAllErrors(errors: FieldErrors<OpprettForsendelseFormProps>): string[] {
        const allErrors = [];
        Object.keys(errors).forEach((key) => {
            const errorsValue = errors[key];
            if (errorsValue && !errorsValue.ref) {
                const errorMessages = getAllErrors(errorsValue);
                errorMessages.forEach((d) => allErrors.push(d));
            } else {
                const message = errors[key].message;
                if (message) {
                    allErrors.push(message);
                }
            }
        });
        return allErrors.filter((error) => error && error.trim().length > 0);
    }
    if (getAllErrors(errors).length === 0) {
        return null;
    }

    return (
        <ErrorSummary heading={"Følgende må rettes opp før notat kan opprettes"} className="mt-4">
            {getAllErrors(errors)?.map((err, i) => (
                <ErrorSummary.Item key={`err${i}`}>{err}</ErrorSummary.Item>
            ))}
        </ErrorSummary>
    );
}
