import { BidragProgressbar } from "@bidrag/common";
import { Loader } from "@navikt/ds-react";
import { memo, Suspense } from "react";
import text from "../../../common/constants/texts";
import { useBehandlingProvider } from "../../../common/context/BehandlingContext";
import { shouldShowGrunnlagLoadingProgressbar } from "../../../common/helpers/shouldShowGrunnlagProgressbar";
import { BarnebidragStepper } from "../../enum/BarnebidragStepper";
import Klagevedtak from "../vedtak/Klagevedtak";
import Vedtak from "../vedtak/Vedtak";
import VedtakEndelig from "../vedtak/VedtakEndelig";
import Boforhold from "./boforhold/Boforhold";
import Gebyr from "./gebyr/Gebyr";
import Inntekt from "./inntekt/Inntekt";
import PrivatAvtale from "./privatAvtale/PrivatAvtale";
import Samvær from "./samvær/Samvær";
import Underholdskostnad from "./underholdskostnad/Underholdskostnad";
import Virkningstidspunkt from "./virkningstidspunkt/Virkningstidspunkt";

const BarnebidragForm = memo(({ activeStep }: { activeStep: string }) => {
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
        case BarnebidragStepper.VIRKNINGSTIDSPUNKT:
            return <Virkningstidspunkt />;
        case BarnebidragStepper.PRIVAT_AVTALE:
            return <PrivatAvtale />;
        case BarnebidragStepper.UNDERHOLDSKOSTNAD:
            return <Underholdskostnad />;
        case BarnebidragStepper.GEBYR:
            return <Gebyr />;
        case BarnebidragStepper.SAMVÆR:
            return <Samvær />;
        case BarnebidragStepper.INNTEKT:
            return <Inntekt />;
        case BarnebidragStepper.BOFORHOLD:
            return <Boforhold />;
        case BarnebidragStepper.VEDTAK:
            return <Vedtak />;
        case BarnebidragStepper.KLAGEVEDTAK:
            return <Klagevedtak />;
        case BarnebidragStepper.VEDTAK_ENDELIG:
            return <VedtakEndelig />;
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
            <BarnebidragForm activeStep={activeStep} />
        </Suspense>
    );
}
