import { BarnebidragStepper } from "../../barnebidrag/enum/BarnebidragStepper";
import { ForskuddStepper } from "../../forskudd/enum/ForskuddStepper";
import { SærligeutgifterStepper } from "../../særbidrag/enum/SærligeutgifterStepper";

const showGrunnlagLoadingProgressbarSteps = [
    BarnebidragStepper.VIRKNINGSTIDSPUNKT,
    BarnebidragStepper.SAMVÆR,
    BarnebidragStepper.PRIVAT_AVTALE,
    SærligeutgifterStepper.UTGIFT,
    ForskuddStepper.VIRKNINGSTIDSPUNKT,
].map((step) => step.toString());
export const shouldShowGrunnlagLoadingProgressbar = (step: string): boolean => {
    return !showGrunnlagLoadingProgressbarSteps.includes(step);
};
