import "./StepIndicator.css";

import { Stepper } from "@navikt/ds-react";

import type { AvvikViewModel } from "../model/AvvikViewModel";

interface StepIndicatorProps {
    activeStep: number;
    onChange: (step: number) => void;
    selectedAvvik: AvvikViewModel;
}

interface StepIndicatorStepProps {
    label: string;
    disabled: boolean;
}

function StepIndicator(props: StepIndicatorProps) {
    const getStepIndicatorLabels = (avvikViewModel: AvvikViewModel) => {
        return avvikViewModel.stepIndicators.map((label) => {
            if (typeof label.title === "function") return label.title(avvikViewModel.metadata);
            return label.title;
        });
    };
    const getSteps = (avvikViewModel: AvvikViewModel): StepIndicatorStepProps[] => {
        const stepLabels = ["Avvik meny", ...getStepIndicatorLabels(avvikViewModel), "Bekreftelse"];

        return stepLabels.map((stepLabel, index) => ({
            index,
            label: stepLabel,
            disabled:
                index > props.activeStep ||
                (props.activeStep === stepLabels.length - 1 && index !== 0 && index !== props.activeStep),
        }));
    };

    const activeStepStepper = props.activeStep + 1;
    return (
        <Stepper
            className={"step-indicator"}
            orientation={"horizontal"}
            activeStep={activeStepStepper}
            onStepChange={(step) => {
                props.onChange(step - 1);
            }}
        >
            {getSteps(props.selectedAvvik).map((step) => (
                <Stepper.Step href="#" aria-disabled={step.disabled} className={step.disabled ? "disabled" : ""}>
                    {step.label}
                </Stepper.Step>
            ))}
        </Stepper>
    );
}

export default StepIndicator;
