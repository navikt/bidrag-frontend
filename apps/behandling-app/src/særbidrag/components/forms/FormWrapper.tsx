import { Loader } from "@navikt/ds-react";
import React, { memo, Suspense } from "react";
import { BidragProgressbar } from "../../../barnebidrag/components/BidragProgressbar";
import text from "../../../common/constants/texts";
import { useBehandlingProvider } from "../../../common/context/BehandlingContext";
import { shouldShowGrunnlagLoadingProgressbar } from "../../../common/helpers/shouldShowGrunnlagProgressbar";
import { SærligeutgifterStepper } from "../../enum/SærligeutgifterStepper";
import Vedtak from "../vedtak/Vedtak";
import Boforhold from "./boforhold/Boforhold";
import Inntekt from "./inntekt/Inntekt";
import Utgifter from "./utgifter/Utgifter";

const SærligeutgifterForm = memo(({ activeStep }: { activeStep: string }) => {
    const { isGrunnlagLoading } = useBehandlingProvider();
    const normalizedActiveStep = String(activeStep).split(",")[0];

    if (isGrunnlagLoading && shouldShowGrunnlagLoadingProgressbar(activeStep)) {
        return (
            <div className="mx-auto flex min-h-[50vh] w-full max-w-2xl flex-col items-center justify-center">
                <BidragProgressbar melding="Laster grunnlag. Straks i mål" />
            </div>
        );
    }

    switch (normalizedActiveStep) {
        case SærligeutgifterStepper.UTGIFT:
            return <Utgifter />;
        case SærligeutgifterStepper.INNTEKT:
            return <Inntekt />;
        case SærligeutgifterStepper.BOFORHOLD:
            return <Boforhold />;
        case SærligeutgifterStepper.VEDTAK:
            return <Vedtak />;
        default:
            return null;
    }
});

export default function FormWrapper() {
    const { activeStep } = useBehandlingProvider();

    return (
        <Suspense
            fallback={
                <div className="flex justify-center overflow-hidden">
                    <Loader size="3xlarge" title={text.loading} variant="interaction" />
                </div>
            }
        >
            <SærligeutgifterForm activeStep={activeStep} />
        </Suspense>
    );
}
