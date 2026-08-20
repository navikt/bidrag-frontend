import { BarnebidragStepper } from "../enum/BarnebidragStepper";

export const STEPS = {
    [BarnebidragStepper.VIRKNINGSTIDSPUNKT]: 1,
    [BarnebidragStepper.PRIVAT_AVTALE]: 2,
    [BarnebidragStepper.UNDERHOLDSKOSTNAD]: 3,
    [BarnebidragStepper.INNTEKT]: 4,
    [BarnebidragStepper.GEBYR]: 5,
    [BarnebidragStepper.BOFORHOLD]: 6,
    [BarnebidragStepper.SAMVÆR]: 7,
    [BarnebidragStepper.VEDTAK]: 8,
    [BarnebidragStepper.KLAGEVEDTAK]: 9,
    [BarnebidragStepper.VEDTAK_ENDELIG]: 10,
};
