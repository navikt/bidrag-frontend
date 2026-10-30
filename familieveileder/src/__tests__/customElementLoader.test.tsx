import { act, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import {
    createCustomElement,
    createEventListener,
    createEventsForFunctionProps,
    getEventname,
    getParsedProps,
} from "../customElementLoader";

const APP_NAME = "test-app";
const ELEMENT_NAME = "loader-test-element";
const ELEMENT_ID = "loader-test-id";

interface ITestProps {
    tekst: string;
    liste: string[];
    onSubmit: (value: string) => void;
}

function TestComponent({ tekst, liste, onSubmit }: ITestProps) {
    return (
        <div>
            <span data-testid="tekst">{tekst}</span>
            <span data-testid="liste">{liste.join(",")}</span>
            <button onClick={() => onSubmit("klikket")}>Send</button>
        </div>
    );
}

describe("getEventname", () => {
    it("joins app name and prop name", () => {
        expect(getEventname(APP_NAME, "onSubmit")).toBe("test-app_onSubmit");
    });
});

describe("getParsedProps", () => {
    it("maps function props to event names and stringifies other props", () => {
        expect(getParsedProps({ tekst: "a", tall: 1, liste: ["x"], onSubmit: () => null }, APP_NAME)).toEqual({
            tekst: '"a"',
            tall: "1",
            liste: '["x"]',
            event_onSubmit: "test-app_onSubmit",
        });
    });
});

describe("createEventListener", () => {
    it("calls prop with event detail until removed", () => {
        const onSubmit = vi.fn();
        const { eventName, removeListenerFn } = createEventListener({ onSubmit }, APP_NAME, "onSubmit");
        expect(eventName).toBe("test-app_onSubmit");

        window.dispatchEvent(new CustomEvent(eventName, { detail: { a: 1 } }));
        expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ a: 1 });

        removeListenerFn();
        window.dispatchEvent(new CustomEvent(eventName, { detail: { a: 2 } }));
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("logs error with event name only when prop throws", () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const error = new Error("feil");
        const { eventName, removeListenerFn } = createEventListener(
            {
                onSubmit: () => {
                    throw error;
                },
            },
            APP_NAME,
            "onSubmit"
        );

        expect(() => window.dispatchEvent(new CustomEvent(eventName, { detail: "sensitiv" }))).not.toThrow();
        expect(errorSpy).toHaveBeenCalledExactlyOnceWith("Error when handling event onSubmit", error);
        removeListenerFn();
    });
});

describe("createEventsForFunctionProps", () => {
    it("listens for every function prop and removes all listeners on cleanup", () => {
        const onSubmit = vi.fn();
        const onClose = vi.fn();
        const cleanup = createEventsForFunctionProps({ tekst: "a", onSubmit, onClose }, APP_NAME);

        window.dispatchEvent(new CustomEvent(getEventname(APP_NAME, "onSubmit"), { detail: 1 }));
        window.dispatchEvent(new CustomEvent(getEventname(APP_NAME, "onClose"), { detail: 2 }));
        expect(onSubmit).toHaveBeenCalledExactlyOnceWith(1);
        expect(onClose).toHaveBeenCalledExactlyOnceWith(2);

        cleanup();
        window.dispatchEvent(new CustomEvent(getEventname(APP_NAME, "onSubmit"), { detail: 3 }));
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });
});

describe("createCustomElement", () => {
    const initialProps: ITestProps = { tekst: "hei", liste: ["a", "b"], onSubmit: () => null };
    const parsedProps = getParsedProps(initialProps, ELEMENT_NAME);
    let element: HTMLElement;

    const shadow = () => within(element.shadowRoot.getElementById("bidrag-sak-ui"));

    beforeAll(() => {
        element = document.createElement(ELEMENT_NAME);
        element.setAttribute("id", ELEMENT_ID);
        Object.entries(parsedProps).forEach(([key, value]) => element.setAttribute(key, value as string));
        document.body.appendChild(element);
        createCustomElement(ELEMENT_NAME, parsedProps, TestComponent, ELEMENT_ID);
    });

    it("defines the element only once", () => {
        const definition = customElements.get(ELEMENT_NAME);
        createCustomElement(ELEMENT_NAME, parsedProps, () => <div />, ELEMENT_ID);
        expect(customElements.get(ELEMENT_NAME)).toBe(definition);
    });

    it("renders component with JSON-parsed props inside the shadow root", async () => {
        await waitFor(() => expect(element.shadowRoot?.getElementById("bidrag-sak-ui")).toBeTruthy());
        await waitFor(() => expect(shadow().getByTestId("tekst").textContent).toBe("hei"));
        expect(shadow().getByTestId("liste").textContent).toBe("a,b");
        expect(document.body.querySelector("[data-testid=tekst]")).toBeNull();
    });

    it("dispatches function props as window events", async () => {
        const onSubmit = vi.fn();
        const cleanup = createEventsForFunctionProps({ onSubmit }, ELEMENT_NAME);

        await userEvent.click(await shadow().findByRole("button", { name: "Send" }));

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith("klikket");
        cleanup();
    });

    it("re-renders when an attribute changes", async () => {
        await act(async () => element.setAttribute("tekst", JSON.stringify("oppdatert")));

        await waitFor(() => expect(shadow().getByTestId("tekst").textContent).toBe("oppdatert"));
    });
});
