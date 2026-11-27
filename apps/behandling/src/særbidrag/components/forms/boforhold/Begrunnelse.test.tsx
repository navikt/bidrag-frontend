import type { PropsWithChildren } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { FormProvider, useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STEPS } from "../../../constants/steps";
import { SærligeutgifterStepper } from "../../../enum/SærligeutgifterStepper";
import { Begrunnelse } from "./Begrunnelse";

const context = vi.hoisted(() => ({
    onStepChange: vi.fn(),
    getNextStep: vi.fn(),
    setSaveErrorState: vi.fn(),
}));

vi.mock("../../../../common/context/BehandlingContext", () => ({
    useBehandlingProvider: () => context,
}));
vi.mock("../../../../common/hooks/useApiData", () => ({
    useGetBehandlingV2: () => ({ erBisysVedtak: false, vedtakstype: "FASTSETTELSE", boforhold: {} }),
}));
vi.mock("../../../../common/hooks/useOnSaveBoforhold", () => ({
    useOnSaveBoforhold: () => ({ mutation: { mutate: vi.fn() } }),
}));
vi.mock("../../../../common/hooks/useDebounce", () => ({
    useDebounce: (callback: (...args: unknown[]) => void) => callback,
}));
vi.mock("../../../../common/hooks/useFieldMutationStatus", () => ({
    useFieldMutationStatus: () => undefined,
}));
vi.mock("../../../../common/components/formFields/FormControlledCustomTextEditor", () => ({
    FormControlledCustomTextareaEditor: () => null,
}));
vi.mock("../../../../common/components/CustomEditor", () => ({
    CustomTextareaEditor: () => null,
}));
vi.mock("../../../../common/components/ActionButtons", () => ({
    ActionButtons: ({ onNext }: { onNext: () => void }) => (
        <button type="button" onClick={onNext}>
            Gå videre
        </button>
    ),
}));

const Skjema = ({ children }: PropsWithChildren) => {
    const methods = useForm({ defaultValues: { begrunnelse: "" } });
    return <FormProvider {...methods}>{children}</FormProvider>;
};

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
    context.onStepChange.mockReset();
    context.getNextStep.mockReset();
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () =>
        root.render(
            <Skjema>
                <Begrunnelse />
            </Skjema>,
        ),
    );
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
});

describe("Begrunnelse for boforhold i særbidrag", () => {
    it("går videre til neste aktive steg, som er steg 4 når det er aktivt", async () => {
        context.getNextStep.mockReturnValue(STEPS[SærligeutgifterStepper.RIMELIG_Å_INNVILGE]);

        await act(async () => container.querySelector("button")!.click());

        expect(context.getNextStep).toHaveBeenCalledWith(SærligeutgifterStepper.BOFORHOLD);
        expect(context.onStepChange).toHaveBeenCalledWith(STEPS[SærligeutgifterStepper.RIMELIG_Å_INNVILGE]);
    });
});
