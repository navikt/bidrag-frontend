import "./StepIndicator.less";

import { Stepper } from "@navikt/ds-react";
import React from "react";

import { AvvikViewModel } from "../model/AvvikViewModel";

interface StepIndicatorProps {
    activeStep: number;
    onChange: (step: number) => void;
    selectedAvvik: AvvikViewModel;
    disableAvvikMeny: boolean;
}

interface StepIndicatorStepProps {
    label: string;
    disabled: boolean;
}

function StepIndicator(props: StepIndicatorProps) {
    const getSteps = (avvikViewModel: AvvikViewModel): StepIndicatorStepProps[] => {
        const stepLabels = ["Avvik meny", ...avvikViewModel.stepIndicators, "Bekreftelse"];

        return stepLabels.map((stepLabel, index) => ({
            index,
            label: stepLabel,
            disabled:
                props.disableAvvikMeny ||
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
