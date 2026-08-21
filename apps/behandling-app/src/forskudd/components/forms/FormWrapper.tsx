import { Loader } from "@navikt/ds-react";
import { memo, Suspense } from "react";
import { BidragProgressbar } from "../../../barnebidrag/components/BidragProgressbar";
import text from "../../../common/constants/texts";
import { useBehandlingProvider } from "../../../common/context/BehandlingContext";
import { shouldShowGrunnlagLoadingProgressbar } from "../../../common/helpers/shouldShowGrunnlagProgressbar";
import { ForskuddStepper } from "../../enum/ForskuddStepper";
import Boforhold from "./boforhold/Boforhold";
import Inntekt from "./inntekt/Inntekt";
import Vedtak from "./vedtak/Vedtak";
import Virkningstidspunkt from "./virkningstidspunkt/Virkningstidspunkt";

const ForskuddForm = memo(({ activeStep }: { activeStep: string }) => {
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
        case ForskuddStepper.VIRKNINGSTIDSPUNKT:
            return <Virkningstidspunkt />;
        case ForskuddStepper.INNTEKT:
            return <Inntekt />;
        case ForskuddStepper.BOFORHOLD:
            return <Boforhold />;
        case ForskuddStepper.VEDTAK:
            return <Vedtak />;
        default:
            return <Virkningstidspunkt />;
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
            <ForskuddForm activeStep={activeStep} />
        </Suspense>
    );
}
