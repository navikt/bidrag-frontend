import { Rolletype } from "@bidrag/api/BidragDokumentProduksjonApi";
import { Heading } from "@navikt/ds-react";
import React, { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { BarnPerioder } from "../../../../common/components/boforhold/BarnPerioder";
import { NyOpplysningerAlert } from "../../../../common/components/boforhold/BoforholdOpplysninger";
import { NewFormLayout } from "../../../../common/components/layout/grid/NewFormLayout";
import { QueryErrorWrapper } from "../../../../common/components/query-error-boundary/QueryErrorWrapper";
import elementIds from "../../../../common/constants/elementIds";
import text from "../../../../common/constants/texts";
import { createInitialValues } from "../../../../common/helpers/boforholdFormHelpers";
import { useGetBehandlingV2 } from "../../../../common/hooks/useApiData";
import { useVirkningsdato } from "../../../../common/hooks/useVirkningsdato";
import { scrollToHash } from "../../../../utils/window-utils";

import { Notat } from "./Notat";
import { Sivilstand } from "./Sivilstand";

const Main = () => {
    useEffect(scrollToHash, []);

    return (
        <>
            <Heading level="2" size="small" id={elementIds.seksjon_boforhold}>
                {text.label.barn}
            </Heading>
            <BarnPerioder />
            <Sivilstand />
        </>
    );
};

const BoforholdsForm = () => {
    // Behold dette for debugging i prod
    // useGrunnlag();
    const { boforhold, roller } = useGetBehandlingV2();
    const virkningsOrSoktFraDato = useVirkningsdato();
    const barnMedISaken = useMemo(() => roller.filter((rolle) => rolle.rolletype === Rolletype.BA), [roller]);
    const initialValues = useMemo(
        () => createInitialValues(boforhold),
        [boforhold, virkningsOrSoktFraDato, barnMedISaken],
    );

    const useFormMethods = useForm({
        defaultValues: initialValues,
        criteriaMode: "all",
    });

    return (
        <FormProvider {...useFormMethods}>
            <form onSubmit={(e) => e.preventDefault()}>
                <NewFormLayout
                    title={text.title.boforholdBM}
                    main={<Main />}
                    side={<Notat />}
                    pageAlert={<NyOpplysningerAlert />}
                />
            </form>
        </FormProvider>
    );
};

export default () => {
    return (
        <QueryErrorWrapper>
            <BoforholdsForm />
        </QueryErrorWrapper>
    );
};
