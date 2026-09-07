import { zodResolver } from "@hookform/resolvers/zod";
import { Box } from "@navikt/ds-react";
import { useForm } from "react-hook-form";

import EnhetInfoAlert from "../components/EnhetInfoAlert";
import SubmitButtons from "../components/SubmitButtons";
import EksisterendeSakAlert from "../EksisterendeSakAlert";
import EktefellebidragOppsummering from "../ektefellebidrag/EktefellebidragOppsummering";
import EktefelleMotpartVelger from "../ektefellebidrag/EktefelleMotpartVelger";
import { useFlowSubmission } from "../hooks/useFlowSubmission";
import useSyncKategori from "../hooks/useSyncKategori";
import {
    type EktefellebidragSkjemaData,
    EktefellebidragSkjemaSchema,
    type ForelderPartRolle,
} from "../opprett-sak-schema";
import { useSaksrolleroversikt } from "../saksrolleroversiktContext";
import { hentMotsattRolle } from "../utils";

export default function EktefellebidragFlyt() {
    const { partISaken, saksrolleFlyt, sakskategori } = useSaksrolleroversikt();

    if (!partISaken || !saksrolleFlyt || saksrolleFlyt.type !== "EKTEFELLEBIDRAG") {
        return null;
    }

    const { motpart: forslagMotpart } = saksrolleFlyt;

    const motsattRolle = hentMotsattRolle(partISaken.rolle as ForelderPartRolle);

    const form = useForm<EktefellebidragSkjemaData>({
        resolver: zodResolver(EktefellebidragSkjemaSchema),
        defaultValues: {
            arbeidsfordeling: "EFS",
            partISaken: partISaken,
            motpart: {
                ident: "",
                navn: "",
                rolle: motsattRolle,
                erKjent: true,
            },
            kategori: sakskategori,
        },
        mode: "onChange",
    });

    useSyncKategori(form);

    const motpart = form.watch("motpart");

    const {
        enhet,
        enhetNavn,
        isLoadingEnhet,
        enhetError,
        harEksisterendeSak,
        eksisterendeSak,
        isLoadingHentSak,
        onSubmit,
        error: submitError,
        saksnummer,
    } = useFlowSubmission({
        form,
        partISaken: { ...partISaken, erKjent: true },
        motpart,
        valgteBarn: [],
        arbeidsfordeling: "EFS",
        eksisterendeSakPartISaken: {
            ident: partISaken.ident,
            rolle: partISaken.rolle,
            navn: partISaken.navn,
            erKjent: true,
        },
        eksisterendeSakMotpart: {
            ident: motpart.ident,
            rolle: motpart.rolle,
            erKjent: motpart.erKjent,
            navn: motpart.navn,
        },
    });

    return (
        <Box
            as="form"
            onSubmit={onSubmit}
            borderRadius={"2"}
            background="default"
            padding={"space-12"}
            className="gap-4 flex flex-col"
        >
            {harEksisterendeSak && eksisterendeSak && (
                <EksisterendeSakAlert
                    eksisterendeSak={eksisterendeSak}
                    partISakenNavn={partISaken.navn}
                    motpartNavn={motpart.navn}
                />
            )}
            <EktefelleMotpartVelger form={form} forslagMotpart={forslagMotpart ?? []} motsattRolle={motsattRolle} />
            {motpart.ident && <EktefellebidragOppsummering form={form} />}
            <EnhetInfoAlert enhet={enhet} enhetNavn={enhetNavn} isLoading={isLoadingEnhet} error={enhetError} />
            <SubmitButtons
                disabled={harEksisterendeSak || isLoadingHentSak || isLoadingEnhet}
                error={submitError}
                saksnummer={saksnummer}
            />
        </Box>
    );
}
