import type { ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useController, useFormContext } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RimeligAaInnvilge from "./RimeligAaInnvilge";

type Payload = { rimeligÅInnvilge: { rimeligÅInnvilge: boolean; begrunnelse: string } };
type Lagring = { payload: Payload; resolve: () => void; reject: (e: Error) => void };

const state = vi.hoisted(() => ({
    lagringer: [] as { payload: unknown; resolve: () => void; reject: (e: Error) => void }[],
    pågående: 0,
    maksSamtidige: 0,
    setSaveErrorState: vi.fn(),
}));

vi.mock("../../../../common/context/BehandlingContext", () => ({
    useBehandlingProvider: () => ({
        lesemodus: false,
        setSaveErrorState: state.setSaveErrorState,
        onStepChange: vi.fn(),
        getNextStep: vi.fn(),
    }),
}));
vi.mock("../../../../common/hooks/useApiData", () => ({
    useGetBehandlingV2: () => ({
        utgift: {
            rimeligÅInnvilge: { barnetsInntektErOverGrensen: true, rimeligÅInnvilge: false, begrunnelse: "" },
        },
    }),
}));
vi.mock("../../../hooks/useOnSaveUtgifter", () => ({
    useOnSaveUtgifter: () => ({
        mutation: {
            mutateAsync: (payload: unknown) => {
                state.pågående++;
                state.maksSamtidige = Math.max(state.maksSamtidige, state.pågående);
                return new Promise<void>((resolve, reject) => {
                    state.lagringer.push({
                        payload,
                        resolve: () => {
                            state.pågående--;
                            resolve();
                        },
                        reject: (e: Error) => {
                            state.pågående--;
                            reject(e);
                        },
                    });
                });
            },
        },
    }),
}));
vi.mock("../../../../common/hooks/useDebounce", () => ({
    useDebounce: (callback: (...args: unknown[]) => void) => callback,
}));
vi.mock("../../../../common/hooks/useFieldMutationStatus", () => ({
    useFieldMutationStatus: () => undefined,
}));
vi.mock("../../../../common/components/layout/grid/NewFormLayout", () => ({
    NewFormLayout: ({ main, side }: { main: ReactNode; side: ReactNode }) => (
        <>
            {main}
            {side}
        </>
    ),
}));
vi.mock("../../../../common/components/query-error-boundary/QueryErrorWrapper", () => ({
    QueryErrorWrapper: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("../../../../common/components/ActionButtons", () => ({
    ActionButtons: () => null,
}));
// Tekstredigeringen (Quill) erstattes med et vanlig tekstfelt med samme navn i skjemaet
vi.mock("../../../../common/components/formFields/FormControlledCustomTextEditor", () => ({
    FormControlledCustomTextareaEditor: ({ name }: { name: string }) => {
        const { control } = useFormContext();
        const { field } = useController({ name, control });
        return (
            <textarea data-testid="begrunnelse" value={field.value} onChange={(e) => field.onChange(e.target.value)} />
        );
    },
}));

let container: HTMLDivElement;
let root: Root;

const lagringer = () => state.lagringer as Lagring[];
const sendt = () => lagringer().map((l) => l.payload.rimeligÅInnvilge);
const avkrysning = () => container.querySelector<HTMLInputElement>("input[type=checkbox]")!;
const begrunnelse = () => container.querySelector<HTMLTextAreaElement>("[data-testid=begrunnelse]")!;
const vent = () => act(async () => await new Promise((resolve) => setTimeout(resolve, 0)));

const klikkAvkrysning = () => act(() => avkrysning().click());
const skrivBegrunnelse = (tekst: string) =>
    act(() => {
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
        setter.call(begrunnelse(), tekst);
        begrunnelse().dispatchEvent(new Event("input", { bubbles: true }));
    });

beforeEach(async () => {
    state.lagringer.length = 0;
    state.pågående = 0;
    state.maksSamtidige = 0;
    state.setSaveErrorState.mockReset();
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<RimeligAaInnvilge />));
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
});

describe("RimeligAaInnvilge", () => {
    it("sender én lagring om gangen, og den siste lagringen har den siste avkrysningen", async () => {
        await klikkAvkrysning();
        await klikkAvkrysning();
        await klikkAvkrysning();

        expect(sendt()).toEqual([{ rimeligÅInnvilge: true, begrunnelse: "" }]);

        await act(async () => lagringer()[0].resolve());
        await vent();

        expect(sendt()).toEqual([
            { rimeligÅInnvilge: true, begrunnelse: "" },
            { rimeligÅInnvilge: true, begrunnelse: "" },
        ]);
        expect(avkrysning().checked).toBe(true);
        expect(state.maksSamtidige).toBe(1);
    });

    it("sender begrunnelse skrevet under en lagring av avkrysningen etterpå, med begge verdiene", async () => {
        await klikkAvkrysning();
        await skrivBegrunnelse("Særlige forhold");

        expect(sendt()).toHaveLength(1);

        await act(async () => lagringer()[0].resolve());
        await vent();

        expect(sendt()[1]).toEqual({ rimeligÅInnvilge: true, begrunnelse: "Særlige forhold" });
        expect(state.maksSamtidige).toBe(1);
    });

    it("angre går tilbake til verdiene som sist ble lagret, ikke til tekst som ble skrevet under lagringen", async () => {
        await klikkAvkrysning();
        await skrivBegrunnelse("Ikke lagret");
        await act(async () => lagringer()[0].resolve());
        await vent();
        await act(async () => lagringer()[1].reject(new Error("Feil")));
        await vent();

        const feil = state.setSaveErrorState.mock.calls.at(-1)?.[0];
        expect(feil.error).toBe(true);
        await act(async () => feil.rollbackFn());

        expect(avkrysning().checked).toBe(true);
        expect(begrunnelse().value).toBe("");
    });

    it("prøver på nytt med de nyeste verdiene", async () => {
        await klikkAvkrysning();
        await act(async () => lagringer()[0].reject(new Error("Feil")));
        await vent();
        await skrivBegrunnelse("Ny tekst");
        await act(async () => lagringer()[1].resolve());
        await vent();

        const feil = state.setSaveErrorState.mock.calls[0][0];
        await act(async () => {
            void feil.retryFn();
        });

        expect(sendt().at(-1)).toEqual({ rimeligÅInnvilge: true, begrunnelse: "Ny tekst" });
    });
});
